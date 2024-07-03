import ollama from 'ollama';
import { LLMProvider, LLMProviderOptions, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from './types';
import { providerRegistry } from './provider_registry';
import { logger } from '../utils/logger';

export class OllamaProvider implements LLMProvider {
  constructor(private options: LLMProviderOptions) {}

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const ollamaMessages = this.prepareMessages(messages, options);
      const response = await ollama.chat({
        model: options.model || this.options.model,
        messages: ollamaMessages,
        options: {
          num_predict: options.maxTokens,
          temperature: options.temperature,
          top_k: options.topK,
          top_p: options.topP,
        },
      });

      return response.message.content;
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string> {
    try {
      const ollamaMessages = this.prepareMessages(messages, options);
      const stream = await ollama.chat({
        model: options.model || this.options.model,
        messages: ollamaMessages,
        stream: true,
        options: {
          num_predict: options.maxTokens,
          temperature: options.temperature,
          top_k: options.topK,
          top_p: options.topP,
        },
      });

      for await (const part of stream) {
        yield part.message.content;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private prepareMessages(messages: Message[], options: LLMProviderOptions): Message[] {
    const ollamaMessages = [...messages];
    if (options.system) {
      ollamaMessages.unshift({ role: 'system', content: options.system });
    }
    return ollamaMessages;
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