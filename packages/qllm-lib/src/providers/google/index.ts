/**
 * @fileoverview Google AI provider implementation for the QLLM library.
 * This module provides integration with Google's Gemini models for text generation.
 * 
 * @module providers/google
 * @version 1.0.0
 * 
 * @remarks
 * The Google provider enables access to Google's Gemini language models through their API.
 * It supports text generation with features like streaming responses and tool/function calling.
 */

import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  ChatStreamCompletionResponse,
  ToolCall,
} from '../../types';

import { ALL_GOOGLE_MODELS, DEFAULT_GOOGLE_MODEL, GoogleModelKey } from './models';

/** Default maximum tokens for model responses */
const DEFAULT_MAX_TOKENS = 1024 * 4;

/**
 * GoogleProvider implements LLM capabilities using Google's Gemini models.
 * 
 * @implements {LLMProvider}
 * 
 * @remarks
 * This provider connects to Google's Generative Language API to provide:
 * - Text generation with chat-style interactions
 * - Streaming responses for real-time output
 * - Tool/function calling capabilities
 */
export class GoogleProvider implements LLMProvider {
  public readonly version = '1.0.0';
  public readonly name = 'Google';
  private baseURL: string;
  private modelConfig: typeof ALL_GOOGLE_MODELS[GoogleModelKey];
  private modelKey: GoogleModelKey;

  /**
   * Creates an instance of GoogleProvider.
   * 
   * @param {string} [key] - Optional API key. If not provided, falls back to GOOGLE_API_KEY environment variable
   * @throws {AuthenticationError} When no API key is found
   */
  constructor(private key?: string) {
    const apiKey = key ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new AuthenticationError('Google API key GOOGLE_API_KEY is required', 'Google');
    }
    this.modelKey = DEFAULT_GOOGLE_MODEL;
    this.modelConfig = ALL_GOOGLE_MODELS[this.modelKey];
    this.baseURL = this.modelConfig.endpoint;
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_GOOGLE_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  /**
   * Retrieves the API key from constructor or environment.
   * 
   * @returns {string} The Google API key
   * @throws {AuthenticationError} When no API key is found
   * @private
   */
  private getKey(): string {
    const apiKey = this.key ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new AuthenticationError('Google API key GOOGLE_API_KEY is required', 'Google');
    }
    return apiKey;
  }

  /**
   * Generates a chat completion using Google's Gemini models.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {Promise<ChatCompletionResponse>} The generated completion
   * @throws {LLMProviderError} If there's an error during generation
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { options, messages, tools } = params;
      const model = options?.model || this.defaultOptions.model;
      
      if (!(model in ALL_GOOGLE_MODELS)) {
        throw new InvalidRequestError(`Model ${model} not supported by Google`, 'Google');
      }

      const apiKey = this.getKey();
      const endpoint = ALL_GOOGLE_MODELS[model as GoogleModelKey].endpoint;
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map(msg => {
            const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
            return {
              parts: [{ text: content.type === 'text' ? content.text : content.url }],
              role: msg.role === 'assistant' ? 'model' : msg.role,
            };
          }),
          tools: this.prepareGoogleTools(tools),
          generationConfig: {
            maxOutputTokens: options?.maxTokens || this.defaultOptions.maxTokens,
            temperature: options?.temperature,
            topP: options?.topProbability,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Unknown error');
      }

      const result = await response.json();
      const candidates = result.candidates || [];
      const firstCandidate = candidates[0];

      if (!firstCandidate) {
        throw new Error('No completion generated');
      }

      return {
        model,
        text: firstCandidate.content?.parts?.[0]?.text || null,
        refusal: null,
        finishReason: firstCandidate.finishReason || null,
        toolCalls: this.extractToolCallsResult(firstCandidate.content?.parts?.[0]?.functionCall),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Streams a chat completion for real-time responses.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {LLMProviderError} If there's an error during generation
   */
  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { options, messages, tools } = params;
      const model = options?.model || this.defaultOptions.model;
      
      if (!(model in ALL_GOOGLE_MODELS)) {
        throw new InvalidRequestError(`Model ${model} not supported by Google`, 'Google');
      }

      const apiKey = this.getKey();
      const endpoint = ALL_GOOGLE_MODELS[model as GoogleModelKey].endpoint;
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map(msg => {
            const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
            return {
              parts: [{ text: content.type === 'text' ? content.text : content.url }],
              role: msg.role === 'assistant' ? 'model' : msg.role,
            };
          }),
          tools: this.prepareGoogleTools(tools),
          generationConfig: {
            maxOutputTokens: options?.maxTokens || this.defaultOptions.maxTokens,
            temperature: options?.temperature,
            topP: options?.topProbability,
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Unknown error');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const candidate = data.candidates?.[0];
            if (candidate) {
              yield {
                model,
                text: candidate.content?.parts?.[0]?.text || null,
                finishReason: candidate.finishReason || null,
              };
            }
          }
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Lists available Google models.
   * 
   * @returns {Promise<Model[]>} Array of available models
   */
  async listModels(): Promise<Model[]> {
    return Object.entries(ALL_GOOGLE_MODELS).map(([id, config]) => ({
      id,
      name: config.name,
      provider: this.name,
      supported_features: {
        chat_completion: true,
        streaming: true,
        function_calling: true,
      },
    }));
  }

  /**
   * Prepares tools for the Google API format.
   * 
   * @param {Object[]} [tools] - Array of tool definitions
   * @returns {Object[] | undefined} Formatted tools for Google API
   * @private
   */
  private prepareGoogleTools(
    tools?:
      | {
          function: { name: string; description: string; parameters?: any };
          type: 'function';
          strict?: boolean;
        }[]
      | undefined,
  ) {
    if (!tools?.length) return undefined;

    return tools.map(tool => ({
      functionDeclarations: [{
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      }],
    }));
  }

  /**
   * Extracts and formats tool call results from Google's response.
   * 
   * @param {any} functionCall - Raw function call from Google API
   * @returns {ToolCall[]} Formatted tool calls
   * @private
   */
  private extractToolCallsResult(functionCall: any): ToolCall[] {
    if (!functionCall) return [];

    return [{
      id: crypto.randomUUID(),
      type: 'function',
      function: {
        name: functionCall.name,
        arguments: JSON.stringify(functionCall.args),
      },
    }];
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
      if (error.message.includes('API key')) {
        throw new AuthenticationError(error.message, this.name);
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new RateLimitError(error.message, this.name);
      }
      if (error.message.includes('not supported') || error.message.includes('invalid')) {
        throw new InvalidRequestError(error.message, this.name);
      }
    }
    throw new Error(`${this.name} provider error: ${error}`);
  }
}