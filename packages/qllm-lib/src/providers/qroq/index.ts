// packages/qllm-lib/src/providers/groq/index.ts

import Groq from 'groq-sdk';
import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  EmbeddingProvider,
  EmbeddingRequestParams,
  EmbeddingResponse,
  isTextContent,
  isImageUrlContent,
  ChatMessageWithSystem,
} from '../../types';

const DEFAULT_MODEL = 'mixtral-8x7b-32768';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-ada-002';
const DEFAULT_MAX_TOKENS = 1024 * 32;

export class GroqProvider extends BaseLLMProvider implements EmbeddingProvider {
  private client: Groq;
  public readonly name = 'Groq';
  public readonly version = '1.0.0';

  constructor(apiKey?: string) {
    super();
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) {
      throw new LLMProviderError('Groq API key not found', this.name);
    }
    this.client = new Groq({ apiKey: key });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async listModels(): Promise<Model[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map((model) => ({
        id: model.id,
        name: model.id,
        created: new Date(model.created * 1000),
        description: `${model.id} - owned by ${model.owned_by}`,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = this.formatTools(tools);

      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        tools: formattedTools,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens,
        temperature: options.temperature,
        top_p: options.topProbability,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
      });

      const firstChoice = response.choices[0];
      return {
        model: response.model,
        text: firstChoice?.message?.content || '',
        finishReason: firstChoice?.finish_reason || null,
        toolCalls: firstChoice?.message?.tool_calls,
        refusal: null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const stream = await this.client.chat.completions.create({
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens,
        temperature: options.temperature,
        top_p: options.topProbability,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            text: content,
            finishReason: chunk.choices[0]?.finish_reason || null,
            model: chunk.model,
          };
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;

      if (Array.isArray(content)) {
        throw new LLMProviderError('Groq does not support batch embeddings', this.name);
      }

      if (typeof content !== 'string') {
        throw new LLMProviderError('Groq only supports text embeddings', this.name);
      }

      const response = await this.client.embeddings.create({
        model: model || DEFAULT_EMBEDDING_MODEL,
        input: content,
      });

      return {
        embedding: response.data as unknown as number[],
        embeddings: undefined,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private async formatMessages(messages: ChatMessageWithSystem[]): Promise<any[]> {
    return messages.map((message) => ({
      role: message.role,
      content: Array.isArray(message.content)
        ? message.content
            .map((c) =>
              isTextContent(c) ? c.text : isImageUrlContent(c) ? `[Image: ${c.url}]` : '',
            )
            .join('\n')
        : isTextContent(message.content)
          ? message.content.text
          : isImageUrlContent(message.content)
            ? `[Image: ${message.content.url}]`
            : '',
    }));
  }

  private formatTools(tools?: Tool[]): any[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }
}
