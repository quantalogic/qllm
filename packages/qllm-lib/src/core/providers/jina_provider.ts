import fetch from 'node-fetch';
import { LLMProvider, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from "@qllm/types/src";
import { LLMProviderOptions } from "@qllm/types/src";
import { providerRegistry } from './provider_registry';

export class JinaProvider implements LLMProvider {
  private apiKey: string;

  constructor(options: LLMProviderOptions) {
    console.log("options : ", options)
    this.apiKey = process.env.JINA_API_KEY || "";
  }

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    console.log("options : ", options)
    console.log("messages : ", messages)
    throw new Error('Text generation is not supported by Jina AI provider');
  }

  async *streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string> {
    console.log("options : ", options)
    console.log("messages : ", messages)
    throw new Error('Streaming is not supported by Jina AI provider');
  }

  async generateEmbedding(input: string | Buffer | URL, modelId: string, isImage: boolean): Promise<number[]> {
    try {
      const url = 'https://api.jina.ai/v1/embeddings';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      let jinaInput;
      if (isImage) {
        if (!Buffer.isBuffer(input)) {
          throw new Error('Invalid input type for image embedding');
        }
        const base64Image = input.toString('base64');
        jinaInput = { image: base64Image };
      } else {
        jinaInput = { text: input as string };
      }

      const data = {
        model: modelId || "jina-clip-v1",
        normalized: true,
        embedding_type: "float",
        input: [jinaInput]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Jina AI API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.data && result.data.length > 0 && result.data[0].embedding) {
        return result.data[0].embedding;
      } else {
        throw new Error('No embedding generated');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        throw new AuthenticationError('Authentication failed with Jina AI', 'Jina AI');
      } else if (error.message.includes('Rate limit exceeded')) {
        throw new RateLimitError('Rate limit exceeded for Jina AI', 'Jina AI');
      } else {
        throw new InvalidRequestError(`Jina AI request failed: ${error.message}`, 'Jina AI');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error}`, 'Jina AI');
  }
}

export function register() {
  providerRegistry.registerProvider('jina', (options) => new JinaProvider(options));
}