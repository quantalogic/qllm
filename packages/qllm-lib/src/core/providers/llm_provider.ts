import { Message } from "@qllm/types/src";
import { LLMProviderOptions } from "@qllm/types/src";

/**
 * Represents an LLM provider.
 */
export interface LLMProvider {
  /**
   * Generates a message using the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns A promise that resolves to the generated message.
   */
  generateMessage: (messages: Message[], options: LLMProviderOptions) => Promise<string>;

  /**
   * Streams a message from the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns An async iterable of message chunks.
   */
  streamMessage: (messages: Message[], options: LLMProviderOptions) => AsyncIterableIterator<string>;

  /**
   * Streams a message from the LLM.
   * @param messages - The input file.
   * @param options - The provider options.
   * @returns An async iterable of embedding files.
   */
  generateEmbedding?: (input: string | Buffer | URL, modelId: string, sImage: boolean) => Promise<number[]>;

  analyzeImage?: (input: string | Buffer | URL, modelId: string) => Promise<string>;
}

export class LLMProviderError extends Error {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AuthenticationError extends LLMProviderError {}
export class RateLimitError extends LLMProviderError {}
export class InvalidRequestError extends LLMProviderError {}

export abstract class BaseLLMProvider implements LLMProvider {
  constructor(protected options: LLMProviderOptions) {}

  abstract generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string>;
  abstract streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string>;

  protected handleError(error: any): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new InvalidRequestError(error.message, this.constructor.name);
    } else {
      throw new InvalidRequestError(`Unknown error: ${error}`, this.constructor.name);
    }
  }

  protected withSystemMessage(options: LLMProviderOptions, messages: Message[]): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;
  }
}