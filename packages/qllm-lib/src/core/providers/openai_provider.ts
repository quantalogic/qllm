import OpenAI from 'openai';
import { LLMProvider, LLMProviderOptions, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from "@qllm/types/src";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { providerRegistry } from './provider_registry';
import { DEFAULT_MAX_TOKENS } from '../config/default';
import fs from 'fs/promises';

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
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem, options);

      const response = await this.client.chat.completions.create({
        model: options.model || this.options.model || 'gpt-4-vision-preview',
        messages: formattedMessages,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        n: 1,
        tools: options.tools
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  private async formatMessages(messages: Message[], options: LLMProviderOptions): Promise<ChatCompletionMessageParam[]> {
    const formattedMessages: ChatCompletionMessageParam[] = [];

    for (const message of messages) {
      if (message.role === 'user' && options.imagePath) {
        const base64Image = await this.getBase64Image(options.imagePath);
        formattedMessages.push({
          role: message.role,
          content: [
            { type: "text", text: message.content },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        });
      } else {
        formattedMessages.push(message as ChatCompletionMessageParam);
      }
    }

    return formattedMessages;
  }

  private async getBase64Image(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
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

  async generateEmbedding(input: string | Buffer | URL, modelId: string, isImage: boolean): Promise<number[]> {
    try {
      if (isImage) {
        // For images, we need to use the vision model to get a description first
        let imageUrl: string;
        if (input instanceof URL) {
          imageUrl = input.toString();
        } else if (Buffer.isBuffer(input)) {
          const base64Image = input.toString('base64');
          imageUrl = `data:image/png;base64,${base64Image}`;
        } else {
          throw new Error('Invalid input type for image embedding');
        }
  
        const description = await this.getImageDescription(imageUrl, modelId);
        return this.generateTextEmbedding(description, 'text-embedding-ada-002');
      } else {
        return this.generateTextEmbedding(input as string, 'text-embedding-ada-002');
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  private async getImageDescription(imageUrl: string, modelId: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail." },
            { type: "image_url", image_url: { url: imageUrl } }
          ],
        },
      ],
      max_tokens: 300,
    });
  
    return response.choices[0]?.message?.content || '';
  }

  private async generateTextEmbedding(text: string, modelId: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: modelId,
      input: text,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    } else {
      throw new Error('No embedding generated');
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