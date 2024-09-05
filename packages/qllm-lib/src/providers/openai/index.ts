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
  ChatMessageWithSystem,
} from '../../types';
import {
  ChatCompletionMessageParam as ChatCompletionMessageParamOpenAI,
  ChatCompletionContentPart as ChatCompletionContentPartOpenAI,
  ChatCompletionTool as ChatCompletionToolOpenAI,
  ChatCompletionCreateParamsStreaming as ChatCompletionCreateParamsStreamingOpenAI,
  ChatCompletionCreateParamsNonStreaming as ChatCompletionCreateParamsNonStreamingOpenAI,
} from 'openai/resources/chat/completions';
import { createBase64Url, imageToBase64 } from '../../utils/images/image-to-base64';

const DEFAULT_MAX_TOKENS = 1024 * 8;
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

  constructor(key?: string, baseUrl?: string) {
    const apiKey = key ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey, baseURL: baseUrl });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private getFilteredOptions(options: LLMOptions): LLMOptions {
    const optionsToInclude = {
      temperature: options.temperature,
      top_p: options.topProbability,
      seed: options.seed,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      // Remove logprobs from here
      // logprobs: options.logitBias,
      // top_logprobs: options.topLogprobs,
    };

    const filteredOptions = Object.fromEntries(
      Object.entries(optionsToInclude)
        .filter(([_, value]) => value !== undefined)
        .filter(([_, value]) => value !== null),
    ) as unknown as LLMOptions;

    return filteredOptions;
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = tools ? this.formatTools(tools) : undefined;

      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getFilteredOptions(options);

      const chatRequest: ChatCompletionCreateParamsNonStreamingOpenAI = {
        messages: formattedMessages,
        tools: formattedTools,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        tool_choice: toolChoice,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        ...filteredOptions,
        // Ensure logprobs is a boolean
        logprobs: typeof options.logprobs === 'boolean' ? options.logprobs : undefined,
        model: model,
      };

      const response = await this.client.chat.completions.create(chatRequest);

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
      const filteredOptions = this.getFilteredOptions(options);

      const chatRequest: ChatCompletionCreateParamsStreamingOpenAI = {
        messages: formattedMessages,
        tools: formattedTools,
        parallel_tool_calls: parallelToolCalls,
        response_format: responseFormat,
        tool_choice: toolChoice,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        ...filteredOptions,
        // Ensure logprobs is a boolean
        logprobs: typeof options.logprobs === 'boolean' ? options.logprobs : undefined,
        model: model,
        stream: true,
      };
      const stream = await this.client.chat.completions.create(chatRequest);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        const _usage = chunk.usage;
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

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [{ role: 'system', content: { type: 'text', text: options.systemMessage } }, ...messages]
      : messages;
  }

  private async formatMessages(
    messages: ChatMessageWithSystem[],
  ): Promise<ChatCompletionMessageParamOpenAI[]> {
    const formattedMessages: ChatCompletionMessageParamOpenAI[] = [];

    for (const message of messages) {
      const formattedMessage: ChatCompletionMessageParamOpenAI = {
        role: message.role,
        content: '', // Initialize with an empty string
      };

      if (Array.isArray(message.content)) {
        const contentParts: ChatCompletionContentPartOpenAI[] = [];
        for (const content of message.content) {
          if (content.type === 'text') {
            contentParts.push({ type: 'text', text: content.text });
          } else if (content.type === 'image_url') {
            // Check if the URL is a local file or a remote URL
            if (content.url.startsWith('http://') || content.url.startsWith('https://')) {
              // Handle remote URL (if needed, you can implement fetching here)
              contentParts.push({
                type: 'image_url',
                image_url: { url: content.url }, // Keep the URL as is for remote
              } as ChatCompletionContentPartOpenAI); // Type assertion
            } else {
              // Convert local image file to base64
              const contentImage = await imageToBase64(content.url);
              const urlBase64Image = createBase64Url(contentImage.mimeType, contentImage.base64);
              contentParts.push({
                type: 'image_url',
                image_url: { url: urlBase64Image }, // Use the base64 image
              } as ChatCompletionContentPartOpenAI); // Type assertion
            }
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

  private formatTools(tools?: Tool[]): ChatCompletionToolOpenAI[] | undefined {
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
