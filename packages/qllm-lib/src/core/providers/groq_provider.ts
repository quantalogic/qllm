import Groq from 'groq-sdk';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from './llm_provider';
import { LLMProviderOptions, Message } from '../../types/providers';
import { providerRegistry } from './provider_registry';
import { DEFAULT_MAX_TOKENS } from '../config/default';

export class GROQProvider implements LLMProvider {
  private client: Groq;

  constructor(private options: LLMProviderOptions) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ API key not found in environment variables');
    }
    this.client = new Groq({ apiKey });
  }

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const completion = await this.client.chat.completions.create({
        messages: messageWithSystem,
        model: options.model || this.options.model || 'mixtral-8x7b-32768',
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(
    messages: Message[],
    options: LLMProviderOptions,
  ): AsyncIterableIterator<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const stream = await this.client.chat.completions.create({
        messages: messageWithSystem,
        model: options.model || this.options.model || 'mixtral-8x7b-32768',
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

  private withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }

  private handleError(error: any): never {
    if (error instanceof Groq.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with GROQ', 'GROQ');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for GROQ', 'GROQ');
      } else {
        throw new InvalidRequestError(`GROQ request failed: ${error.message}`, 'GROQ');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'GROQ');
  }
}

export function register() {
  // Register the GROQ provider
  providerRegistry.registerProvider('groq', (options) => new GROQProvider(options));
}
