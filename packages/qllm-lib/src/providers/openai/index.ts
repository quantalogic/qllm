/**
 * @fileoverview OpenAI provider implementation for the QLLM library.
 * This module implements both LLMProvider and EmbeddingProvider interfaces for OpenAI's language models.
 * 
 * @module providers/openai
 * @version 1.0.0
 */

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

/** Default maximum number of tokens for completion requests */
const DEFAULT_MAX_TOKENS = 1024 * 8;
/** Default model for chat completions */
const DEFAULT_MODEL = 'gpt-4o-mini';
/** Default model for embeddings */
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * OpenAI provider implementation that supports both chat completions and embeddings.
 * This class handles authentication, request formatting, and error handling for OpenAI's API.
 * 
 * @implements {LLMProvider}
 * @implements {EmbeddingProvider}
 * 
 * @example
 * ```typescript
 * const provider = new OpenAIProvider(); // Uses OPENAI_API_KEY from environment
 * const response = await provider.generateChatCompletion({
 *   messages: [{ role: 'user', content: { type: 'text', text: 'Hello!' } }],
 *   options: { model: 'gpt-4' }
 * });
 * ```
 */
export class OpenAIProvider implements LLMProvider, EmbeddingProvider {
  private client: OpenAI;
  public readonly version = '1.0.0';
  public readonly name = 'OpenAI';

  /**
   * Creates a new OpenAI provider instance.
   * 
   * @param {string} [key] - Optional API key. If not provided, uses OPENAI_API_KEY environment variable
   * @param {string} [baseUrl] - Optional base URL for API requests
   * @throws {Error} If no API key is found in environment variables when not provided
   */
  constructor(key?: string, baseUrl?: string) {
    const apiKey = key ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey, baseURL: baseUrl });
  }

  /** Default options for LLM requests */
  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Filters and formats LLM options for OpenAI API requests.
   * Removes undefined and null values, and handles special cases.
   * 
   * @private
   * @param {LLMOptions} options - Raw options to filter
   * @returns {LLMOptions} Filtered options object
   */
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

  /**
   * Generates a chat completion using OpenAI's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {Promise<ChatCompletionResponse>} Response containing generated text and metadata
   * @throws {AuthenticationError | RateLimitError | InvalidRequestError} On API errors
   */
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

  /**
   * Generates a streaming chat completion using OpenAI's API.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {AuthenticationError | RateLimitError | InvalidRequestError} On API errors
   */
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

  /**
   * Generates embeddings for given text content using OpenAI's API.
   * 
   * @param {EmbeddingRequestParams} input - Parameters for embedding generation
   * @returns {Promise<EmbeddingResponse>} Generated embeddings
   * @throws {AuthenticationError | RateLimitError | InvalidRequestError} On API errors
   */
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

  /**
   * Lists available models from OpenAI's API.
   * 
   * @returns {Promise<Model[]>} List of available models with metadata
   * @throws {AuthenticationError | RateLimitError | InvalidRequestError} On API errors
   */
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

  /**
   * Adds system message to the chat messages if provided in options.
   * 
   * @private
   * @param {LLMOptions} options - Options containing potential system message
   * @param {ChatMessage[]} messages - Original chat messages
   * @returns {ChatMessageWithSystem[]} Messages with system message prepended if provided
   */
  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessageWithSystem[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [{ role: 'system', content: { type: 'text', text: options.systemMessage } }, ...messages]
      : messages;
  }

  /**
   * Formats messages for OpenAI's API, handling both text and image content.
   * 
   * @private
   * @param {ChatMessageWithSystem[]} messages - Messages to format
   * @returns {Promise<ChatCompletionMessageParamOpenAI[]>} Formatted messages for API
   */
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

  /**
   * Formats tools for OpenAI's API.
   * 
   * @private
   * @param {Tool[]} [tools] - Tools to format
   * @returns {ChatCompletionToolOpenAI[] | undefined} Formatted tools for API
   */
  private formatTools(tools?: Tool[]): ChatCompletionToolOpenAI[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      ...tool,
    }));
  }

  /**
   * Handles errors from OpenAI's API, converting them to appropriate error types.
   * 
   * @private
   * @param {unknown} error - Error from API call
   * @throws {AuthenticationError} On authentication failures
   * @throws {RateLimitError} On rate limit exceeded
   * @throws {InvalidRequestError} On other API errors
   */
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
