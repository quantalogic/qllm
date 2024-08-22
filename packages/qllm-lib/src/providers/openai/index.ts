import OpenAI from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatMessage,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  Tool,
} from '../../types';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class OpenAIProvider implements LLMProvider, EmbeddingProvider {
  private client: OpenAI;
  public readonly version = '1.0.0';
  public readonly name = 'OpenAI';

  constructor(key?: string) {
    const apiKey = key ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = tools ? this.formatTools(tools) : undefined;

      const model = options.model || DEFAULT_MODEL;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: formattedMessages,
        tools: formattedTools,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        tool_choice: toolChoice,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        seed: options.seed,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        logprobs: options.logprobs,
        logit_bias: options.logitBias,
        top_logprobs: options.topLogprobs,
      });

      const firstResponse = response.choices[0];
      const usage = response.usage;
      return {
        model: model,
        text: firstResponse?.message?.content || '',
        finishReason: firstResponse?.finish_reason,
        toolCalls: firstResponse?.message?.tool_calls,
        refusal: firstResponse?.message?.refusal,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = tools ? this.formatTools(tools) : undefined;

      const model = options.model || DEFAULT_MODEL;

      const stream = await this.client.chat.completions.create({
        model: model,
        messages: formattedMessages,
        tools: formattedTools,
        tool_choice: toolChoice,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        seed: options.seed,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        logprobs: options.logprobs,
        logit_bias: options.logitBias,
        top_logprobs: options.topLogprobs,
        n: 1,
        stream_options: {
          include_usage: true,
        },
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        const usage = chunk.usage;
        const finishReason = chunk.choices[0]?.finish_reason;
        const result: ChatStreamCompletionResponse = {
          text: content || null,
          finishReason: finishReason,
          model: model,
        };
        yield result;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;

      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      const response = await this.client.embeddings.create({
        model: modelId,
        input: content,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }

      const embeddingResult: EmbeddingResponse = {
        embedding: response.data[0]?.embedding || [],
        embeddings: response.data.map((item) => item.embedding),
      };

      return embeddingResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const { data } = await this.client.models.list();
      return data.map(({ id, created, owned_by }) => ({
        id,
        name: id,
        created: new Date(created * 1000),
        description: `${id} - ${owned_by} - created at ${new Date(created * 1000)}`,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessage[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [this.createSystemMessage(options.systemMessage), ...messages]
      : messages;
  }

  private createSystemMessage(systemMessageText: string): ChatMessage {
    return {
      role: 'system',
      content: {
        type: 'text',
        text: systemMessageText,
      },
    };
  }

  private async formatMessages(messages: ChatMessage[]): Promise<ChatCompletionMessageParam[]> {
    const formattedMessages: ChatCompletionMessageParam[] = [];

    for (const message of messages) {
      const formattedMessage: ChatCompletionMessageParam = {
        role: message.role,
        content: '', // Initialize with an empty string
      };

      if (Array.isArray(message.content)) {
        const contentParts: ChatCompletionContentPart[] = [];
        for (const content of message.content) {
          if (content.type === 'text') {
            contentParts.push({ type: 'text', text: content.text });
          } else if (content.type === 'image_url') {
            contentParts.push({
              type: 'image_url',
              image_url: { url: content.imageUrl.url },
            } as ChatCompletionContentPart); // Type assertion
          }
        }
        formattedMessage.content = contentParts;
      } else {
        if (message.content.type === 'text') {
          formattedMessage.content = message.content.text;
        }
      }

      formattedMessages.push(formattedMessage);
    }

    return formattedMessages;
  }

  private formatTools(tools?: Tool[]): ChatCompletionTool[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      ...tool,
    }));
  }

  private handleError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenAI', 'OpenAI');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenAI', 'OpenAI');
      } else {
        throw new InvalidRequestError(`OpenAI request failed: ${error.message}`, 'OpenAI');
      }
    } else if (error instanceof Error) {
      throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'OpenAI');
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'OpenAI');
    }
  }
}
