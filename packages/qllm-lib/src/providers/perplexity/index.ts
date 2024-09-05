import { OpenAIProvider } from '../openai';
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
  ChatMessageWithSystem,
} from '../../types';
import { ALL_PERPLEXITY_MODELS, DEFAULT_PERPLEXITY_MODEL } from './models';

const DEFAULT_MAX_TOKENS = 1024 * 32;
const DEFAULT_MODEL = 'mixtral-8x7b-instruct';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * PerplexityProvider class implements the LLMProvider interface for Perplexity's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class PerplexityProvider implements LLMProvider, EmbeddingProvider {
  private openAIProvider: OpenAIProvider;
  public readonly version = '1.0.0';
  public readonly name = 'Perplexity';
  private baseURL = 'https://api.perplexity.ai';

  constructor(private key?: string) {
    const apiKey = key ?? process.env.PERPLEXITY_API;
    if (!apiKey) {
      throw new Error('Perplexity API key or PERPLEXITY_API not found in environment variables');
    }
    this.openAIProvider = new OpenAIProvider(apiKey, this.baseURL);
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_PERPLEXITY_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private getOptions(options: LLMOptions): LLMOptions {
    // Remove undefined and null values
    const optionsToInclude: Partial<LLMOptions> = {
      temperature: options.temperature,
      model: options.model,
      maxTokens: options.maxTokens,
      // Explicitly unset logprobs and topLogprobs
      logprobs: undefined,
      topLogprobs: undefined,
    };

    const filteredOptions = Object.fromEntries(
      Object.entries(optionsToInclude)
        .filter(([_, v]) => v != null)
        .filter(([_, v]) => v !== undefined),
    ) as unknown as LLMOptions;

    // console.log('filteredOptions 🔥 🍵: ', filteredOptions);

    return filteredOptions;
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const chatRequest: ChatCompletionParams = {
        messages: messages,
        options: {
          ...filteredOptions, // Include filtered options
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      };

      // console.log('chatRequest 🔥: ', chatRequest);
      // console.dir(chatRequest, { depth: null });

      const response = await this.openAIProvider.generateChatCompletion(chatRequest);

      return {
        ...response,
        model,
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
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const chatRequest: ChatCompletionParams = {
        messages: messages,
        options: {
          ...filteredOptions, // Include filtered options
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      };

      // console.log('chatRequest 🔥 🍵: ', chatRequest);
      // console.dir(chatRequest, { depth: null });

      const stream = this.openAIProvider.streamChatCompletion(chatRequest);

      for await (const chunk of stream) {
        yield {
          ...chunk,
          model,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;
      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      return await this.openAIProvider.generateEmbedding({
        content,
        model: modelId,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    return Object.values(ALL_PERPLEXITY_MODELS).map((model) => ({
      id: model.id,
      name: model.name,
      description: `${model.name} - ${model.parameterCount} parameters, ${model.contextLength} context length`,
      created: new Date(), // You might want to add actual creation dates if available
    }));
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [
          {
            role: 'system',
            content: { type: 'text', text: options.systemMessage },
          },
          ...messages,
        ]
      : messages;
  }

  private handleError(error: unknown): never {
    if (error instanceof AuthenticationError) {
      throw new AuthenticationError('Authentication failed with Perplexity', 'Perplexity');
    } else if (error instanceof RateLimitError) {
      throw new RateLimitError('Rate limit exceeded for Perplexity', 'Perplexity');
    } else if (error instanceof InvalidRequestError) {
      throw new InvalidRequestError(`Perplexity request failed: ${error.message}`, 'Perplexity');
    } else if (error instanceof Error) {
      throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'Perplexity');
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'Perplexity');
    }
  }
}
