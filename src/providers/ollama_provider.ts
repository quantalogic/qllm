import ollama from 'ollama';
import { LLMProvider, LLMProviderOptions, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from './types';
import { providerRegistry } from './provider_registry';
import { logger } from '../utils/logger';

export class OllamaProvider implements LLMProvider {
  constructor(private options: LLMProviderOptions) {}

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const response = await ollama.chat({
        model: options.model || this.options.model,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      });
      return response.message.content;
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string> {
    try {
      const stream = await ollama.chat({
        model: options.model || this.options.model,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
      });

      for await (const part of stream) {
        yield part.message.content;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    logger.error(`Ollama error: ${error.message}`);
    if (error.message.includes('authentication')) {
      throw new AuthenticationError('Authentication failed with Ollama', 'Ollama');
    } else if (error.message.includes('rate limit')) {
      throw new RateLimitError('Rate limit exceeded for Ollama', 'Ollama');
    } else {
      throw new InvalidRequestError(`Ollama request failed: ${error.message}`, 'Ollama');
    }
  }
}

export function register() {
  providerRegistry.registerProvider('ollama', (options) => new OllamaProvider(options));
}