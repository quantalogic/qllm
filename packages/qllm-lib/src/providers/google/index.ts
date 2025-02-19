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
      
      console.log('Preparing request...');
      const requestBody = {
        contents: messages.map(msg => {
          const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
          const text = content.type === 'text' ? content.text : '';
          if (!text.trim() && msg.role === 'assistant') {
            return { role: msg.role };
          }
          return { role: msg.role, parts: [{ text }] };
        }),
        tools: this.prepareGoogleTools(tools),
      };

      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      const toolCalls = data?.candidates?.[0]?.content?.tool_calls?.map(this.extractToolCallsResult) || [];

      return {
        model,
        text,
        refusal: null,
        toolCalls: toolCalls.flat(),
        finishReason: data?.candidates?.[0]?.finishReason || null,
        usage: undefined,
        outputVariables: text ? this.extractOutputVariables(text) : undefined,
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
      
      const requestBody = {
        contents: messages.map(msg => {
          const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
          const text = content.type === 'text' ? content.text : '';
          if (!text.trim() && msg.role === 'assistant') {
            return { role: msg.role };
          }
          return { role: msg.role, parts: [{ text }] };
        }),
        tools: this.prepareGoogleTools(tools),
      };

      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      const toolCalls = data?.candidates?.[0]?.content?.tool_calls?.map(this.extractToolCallsResult) || [];

      // For now, Google's API doesn't support true streaming, so we simulate it
      yield {
        model,
        text,
        finishReason: data?.candidates?.[0]?.finishReason || null,
        toolCalls: toolCalls.flat(),
        outputVariables: text ? this.extractOutputVariables(text) : undefined,
      };
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

    return tools.map(tool => {
      const rawParameters = tool.function.parameters || { type: 'object', properties: {} };
      
      // Transform the schema to ensure it has the required structure
      const googleParameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
        description?: string;
      } = {
        type: 'object',
        properties: {},
        required: [],
      };

      // Handle description if present
      if ('description' in rawParameters) {
        googleParameters.description = rawParameters.description;
      }

      // Copy properties and required fields directly
      if (rawParameters.type === 'object') {
        googleParameters.properties = rawParameters.properties || {};
        googleParameters.required = rawParameters.required || [];
      }

      // Ensure we have at least one property
      if (Object.keys(googleParameters.properties).length === 0) {
        // Add a fallback property if none exist
        googleParameters.properties.input = {
          type: 'string',
          description: 'Input parameter',
        };
        googleParameters.required = ['input'];
      }

      return {
        functionDeclarations: [{
          name: tool.function.name,
          description: tool.function.description,
          parameters: googleParameters,
        }],
      };
    });
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
   * Extracts output variables from a response text.
   * 
   * @param {string} text - Response text
   * @returns {Record<string, string>} Extracted output variables
   * @private
   */
  private extractOutputVariables(text: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;
    
    while ((match = tagPattern.exec(text)) !== null) {
      const [_, name, value] = match;
      variables[name] = value.trim();
    }

    // Also include the full response as qllm_response
    if (text.trim()) {
      variables.qllm_response = text.trim();
    }
    
    return variables;
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
