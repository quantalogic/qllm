/**
 * @fileoverview Mistral AI provider implementation for the QLLM library.
 * This module provides integration with Mistral's language models for text generation and embeddings.
 * 
 * @module providers/mistral
 * @version 1.0.0
 * 
 * @remarks
 * The Mistral provider enables access to Mistral AI's language models through their API.
 * It supports both text generation and embedding capabilities, with features like
 * streaming responses and tool/function calling.
 */

import { Mistral } from '@mistralai/mistralai';

import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  ToolCall,
} from '../../types';

/** Default maximum tokens for model responses */
const DEFAULT_MAX_TOKENS = 1024 * 4;

/** Default model for text generation */
const DEFAULT_MODEL = 'mistral-small-latest';

/** Default model for embedding generation */
const DEFAULT_EMBEDDING_MODEL = 'mistral-embed';

/**
 * MistralProvider implements both LLM and embedding capabilities using Mistral AI's models.
 * 
 * @implements {LLMProvider}
 * @implements {EmbeddingProvider}
 * 
 * @remarks
 * This provider connects to Mistral AI's API to provide:
 * - Text generation with chat-style interactions
 * - Streaming responses for real-time output
 * - Tool/function calling capabilities
 * - Text embeddings for vector operations
 */
export class MistralProvider implements LLMProvider, EmbeddingProvider {
  public readonly version = '1.0.0';
  public readonly name = 'Mistral';

  /**
   * Creates an instance of MistralProvider.
   * 
   * @param {string} [key] - Optional API key. If not provided, falls back to MISTRAL_API_KEY environment variable
   * @throws {AuthenticationError} When no API key is found
   */
  constructor(private key?: string) {
    const apiKey = key ?? process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
  }

  /**
   * Retrieves the API key from constructor or environment.
   * 
   * @returns {string} The Mistral API key
   * @throws {AuthenticationError} When no API key is found
   * @private
   */
  private getKey() {
    const apiKey = this.key || process.env.MISTRAL_API_KEY || 'MISTRAL_API_KEY';

    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
    return this.key;
  }

  /**
   * Creates a new Mistral API client instance.
   * 
   * @returns {Mistral} Configured Mistral client
   * @private
   */
  private getClient() {
    return new Mistral({ apiKey: this.getKey() });
  }

  /** Default options for the Mistral provider */
  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Generates a chat completion using Mistral's models.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {Promise<ChatCompletionResponse>} The generated completion
   * @throws {LLMProviderError} If there's an error during generation
   * 
   * @remarks
   * This method supports:
   * - Multi-turn conversations
   * - Tool/function calling
   * - Custom model parameters
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.complete({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      const responseContent = response.choices?.shift();
      const usage = response.usage;
      const messageAssistantContent = responseContent?.message.content || '';
      const toolCalls = responseContent?.message.toolCalls || [];
      const finishReason = responseContent?.finishReason || null;

      const toolCallResults: ToolCall[] = this.extractToolCallsResult(toolCalls);

      return {
        model: model,
        text: messageAssistantContent,
        finishReason: finishReason,
        toolCalls: toolCallResults,
        refusal: null,
        usage: usage,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepares tools for the Mistral API format.
   * 
   * @param {Object[]} [tools] - Array of tool definitions
   * @returns {Object[] | undefined} Formatted tools for Mistral API
   * @private
   */
  private prepareMistraTools(
    tools:
      | {
          function: { name: string; description: string; parameters?: any };
          type: 'function';
          strict?: boolean | undefined;
        }[]
      | undefined,
  ) {
    return (
      tools?.map((tool) => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          arguments: tool.function.parameters as string,
        },
      })) || undefined
    );
  }

  /**
   * Extracts and formats tool call results from Mistral's response.
   * 
   * @param {any} toolCalls - Raw tool calls from Mistral API
   * @returns {ToolCall[]} Formatted tool calls
   * @private
   */
  private extractToolCallsResult(toolCalls: any): ToolCall[] {
    return toolCalls.map((mistralToolCall: any) => {
      const toolCall: ToolCall = {
        id: mistralToolCall.id || mistralToolCall.function.name,
        type: 'function',
        function: {
          name: mistralToolCall.function.name,
          arguments: mistralToolCall.function.arguments as string,
        },
      };
      return toolCall;
    });
  }

  /**
   * Streams a chat completion for real-time responses.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {LLMProviderError} If there's an error during generation
   * 
   * @remarks
   * The stream provides real-time updates as the model generates text,
   * enabling more responsive applications.
   */
  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.stream({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      for await (const chunk of response) {
        const content = chunk.data.choices[0]?.delta.content;
        const finishReason = chunk.data.choices[0]?.finishReason;

        const result: ChatStreamCompletionResponse = {
          text: content || null,
          finishReason: finishReason || null,
          model: model,
        };

        yield result;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generates embeddings for the given text input.
   * 
   * @param {EmbeddingRequestParams} input - Parameters for embedding generation
   * @returns {Promise<EmbeddingResponse>} The generated embeddings
   * @throws {InvalidRequestError} If input is not a string
   * @throws {LLMProviderError} If there's an error during generation
   */
  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;
      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      if (typeof content !== 'string') {
        throw new InvalidRequestError(
          'Mistral AI requires a string input for embeddings',
          'Mistral',
        );
      }

      const response = await this.getClient().embeddings.create({
        model: modelId,
        inputs: [content],
        encodingFormat: 'json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }

      const embeddingResult: EmbeddingResponse = {
        embedding: response.data[0]?.embedding || [],
        embeddings: response.data.map((d: any) => d.embedding),
      };

      return embeddingResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Lists available Mistral models.
   * 
   * @returns {Promise<Model[]>} Array of available models
   * @throws {LLMProviderError} If there's an error fetching models
   */
  async listModels(): Promise<Model[]> {
    const models = await this.getClient().models.list();

    const modelList: Model[] =
      models.data?.map((model) => ({
        id: model.id || model.name || '',
        name: model.name || model.id,
        created: model.created ? new Date(model.created) : new Date(),
        description: model.description || model.name || '',
      })) || [];
    return modelList;
  }

  /**
   * Handles errors by wrapping them in appropriate error types.
   * 
   * @param {unknown} error - Error to handle
   * @throws {LLMProviderError} Always throws a wrapped error
   * @private
   */
  private handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new AuthenticationError('Authentication failed with Mistral AI', 'Mistral');
      } else if (error.message.includes('429')) {
        throw new RateLimitError('Rate limit exceeded for Mistral AI', 'Mistral');
      } else {
        throw new InvalidRequestError(`Mistral AI request failed: ${error.message}`, 'Mistral');
      }
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'Mistral');
    }
  }
}
