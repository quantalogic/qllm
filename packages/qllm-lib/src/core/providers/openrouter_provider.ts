import { OpenAI } from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from './llm_provider';
import { Message } from '@qllm/types/src';
import { LLMProviderOptions } from '@qllm/types/src';
import { providerRegistry } from './provider_registry';
import { DEFAULT_MAX_TOKENS } from '../config/default';

/**
 * OpenRouterProvider class implements the LLMProvider interface for OpenRouter's language models.
 * It provides methods for generating messages and streaming messages.
 */
export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;

  /**
   * Constructor for OpenRouterProvider.
   * @param options - Configuration options for the provider.
   * @throws Error if OpenRouter API key is not found in environment variables.
   */
  constructor(private options: LLMProviderOptions) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not found in environment variables');
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_API_KEY || '', // Optional
        'X-Title': process.env.OPENROUTER_TITLE || '', // Optional
      },
    });
  }

  /**
   * Generates a message using OpenRouter's chat completion API.
   * @param messages - Array of messages to be used as context.
   * @param options - Options for the message generation.
   * @returns Promise resolving to the generated message string.
   * @throws Error if the API request fails.
   */
  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const completion = await this.client.chat.completions.create({
        messages: messageWithSystem,
        model: options.model || this.options.model || 'openai/gpt-3.5-turbo',
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Streams a message generation using OpenRouter's chat completion API.
   * @param messages - Array of messages to be used as context.
   * @param options - Options for the message generation.
   * @yields Chunks of the generated message.
   * @throws Error if the API request fails.
   */
  async *streamMessage(
    messages: Message[],
    options: LLMProviderOptions,
  ): AsyncIterableIterator<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const stream = await this.client.chat.completions.create({
        messages: messageWithSystem,
        model: options.model || this.options.model || 'openai/gpt-3.5-turbo',
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Adds a system message to the array of messages if provided in the options.
   * @param options - Options that may contain a system message.
   * @param messages - Array of existing messages.
   * @returns Array of messages with system message prepended if provided.
   */
  private withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }

  /**
   * Handles errors from the OpenRouter API and throws appropriate custom errors.
   * @param error - The error object from the OpenRouter API.
   * @throws AuthenticationError, RateLimitError, or InvalidRequestError based on the API error.
   */
  private handleError(error: any): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenRouter', 'OpenRouter');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenRouter', 'OpenRouter');
      } else {
        throw new InvalidRequestError(`OpenRouter request failed: ${error.message}`, 'OpenRouter');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'OpenRouter');
  }
}

/**
 * Registers the OpenRouter provider with the provider registry.
 */
export function register() {
  providerRegistry.registerProvider('openrouter', (options) => new OpenRouterProvider(options));
}
