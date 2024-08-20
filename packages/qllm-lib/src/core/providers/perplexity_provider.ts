import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from './llm_provider';
import { Message } from 'qllm-types';
import { LLMProviderOptions } from 'qllm-types';
import { providerRegistry } from './provider_registry';
import { DEFAULT_MAX_TOKENS } from '../config/default';
import axios from 'axios'; // You'll need to install axios if not already installed

export class PerplexityProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string = 'https://api.perplexity.ai';

  constructor(private options: LLMProviderOptions) {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Perplexity API key not found in environment variables');
    }
  }

  // Implement the generateMessage method
  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.options.model || 'mixtral-8x7b-instruct',
          messages: messageWithSystem,
          max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
          temperature: options.temperature,
          top_p: options.topP,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  // Implement the streamMessage method
  async *streamMessage(
    messages: Message[],
    options: LLMProviderOptions,
  ): AsyncIterableIterator<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.options.model || 'mixtral-8x7b-instruct',
          messages: messageWithSystem,
          max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
          temperature: options.temperature,
          top_p: options.topP,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      for await (const chunk of response.data) {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line: any) => line.trim() !== '');
        for (const line of lines) {
          if (line.includes('[DONE]')) return;
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          }
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Authentication failed with Perplexity', 'Perplexity');
      } else if (error.response?.status === 429) {
        throw new RateLimitError('Rate limit exceeded for Perplexity', 'Perplexity');
      } else {
        throw new InvalidRequestError(`Perplexity request failed: ${error.message}`, 'Perplexity');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'Perplexity');
  }
}

export function register() {
  // Register the Perplexity provider
  providerRegistry.registerProvider('perplexity', (options) => new PerplexityProvider(options));
}
