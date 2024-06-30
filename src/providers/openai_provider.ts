import OpenAI from 'openai';
import { LLMProvider, LLMProviderOptions, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from './types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { providerRegistry } from './provider_registry';

export const DEFAULT_MAX_TOKENS = 1024;

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(private options: LLMProviderOptions) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages) as ChatCompletionMessageParam[];
      const response = await this.client.chat.completions.create({
        model: options.model || this.options.model || 'gpt-3.5-turbo',
        messages: messageWithSystem,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        n: 1,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages) as ChatCompletionMessageParam[];
      const stream = await this.client.chat.completions.create({
        model: options.model || this.options.model,
        messages: messageWithSystem,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        n: 1,
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
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenAI', 'OpenAI');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenAI', 'OpenAI');
      } else {
        throw new InvalidRequestError(`OpenAI request failed: ${error.message}`, 'OpenAI');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'OpenAI');
  }
}

export function register() {
  // Register the OpenAI provider
  providerRegistry.registerProvider('openai', (options) => new OpenAIProvider(options));
}