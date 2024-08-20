import OpenAI from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from './llm_provider';
import { Message } from 'qllm-types';
import { LLMProviderOptions } from 'qllm-types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { providerRegistry } from './provider_registry';
import { DEFAULT_MAX_TOKENS } from '../config/default';
import fs from 'fs/promises';

/**
 * OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  /**
   * Constructor for OpenAIProvider.
   * @param options - Configuration options for the provider.
   * @throws Error if OpenAI API key is not found in environment variables.
   */
  constructor(private options: LLMProviderOptions) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generates a message using OpenAI's chat completion API.
   * @param messages - Array of messages to be used as context.
   * @param options - Options for the message generation.
   * @returns Promise resolving to the generated message string.
   * @throws Error if the API request fails.
   */
  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem, options);

      const response = await this.client.chat.completions.create({
        model: options.model || this.options.model || 'gpt-4o-mini',
        messages: formattedMessages,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        n: 1,
        tools: options.tools,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Formats messages for the OpenAI API, including handling of image inputs.
   * @param messages - Array of messages to format.
   * @param options - Options containing potential image path.
   * @returns Promise resolving to an array of formatted messages.
   */
  private async formatMessages(
    messages: Message[],
    options: LLMProviderOptions,
  ): Promise<ChatCompletionMessageParam[]> {
    const formattedMessages: ChatCompletionMessageParam[] = [];

    for (const message of messages) {
      if (message.role === 'user' && options.imagePath) {
        const base64Image = await this.getBase64Image(options.imagePath);
        formattedMessages.push({
          role: message.role,
          content: [
            { type: 'text', text: message.content },
            {
              type: 'image_url',
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

  /**
   * Converts an image file to a base64 string.
   * @param imagePath - Path to the image file.
   * @returns Promise resolving to the base64 encoded string of the image.
   */
  private async getBase64Image(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Streams a message generation using OpenAI's chat completion API.
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
      const messageWithSystem = this.withSystemMessage(
        options,
        messages,
      ) as ChatCompletionMessageParam[];
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

  /**
   * Generates an embedding for the given input.
   * @param input - The input to generate an embedding for (string, Buffer, or URL).
   * @param modelId - The ID of the model to use for embedding generation.
   * @param isImage - Boolean indicating if the input is an image.
   * @returns Promise resolving to an array of numbers representing the embedding.
   * @throws Error if the input type is invalid or if the API request fails.
   */
  async generateEmbedding(
    input: string | Buffer | URL,
    modelId: string,
    isImage: boolean,
  ): Promise<number[]> {
    try {
      if (isImage) {
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
        return this.generateTextEmbedding(description, modelId); // model for embedding ?
      } else {
        return this.generateTextEmbedding(input as string, modelId); // model for embedding ?
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets a description of an image using OpenAI's vision model.
   * @param imageUrl - URL or data URI of the image.
   * @param modelId - The ID of the model to use for image description.
   * @returns Promise resolving to the description of the image.
   */
  private async getImageDescription(imageUrl: string, modelId: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' }, // option ?
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      // max_tokens: 300, option
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Generates a text embedding using OpenAI's embedding API.
   * @param text - The text to generate an embedding for.
   * @param modelId - The ID of the model to use for embedding generation.
   * @returns Promise resolving to an array of numbers representing the embedding.
   * @throws Error if no embedding is generated.
   */
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
   * Handles errors from the OpenAI API and throws appropriate custom errors.
   * @param error - The error object from the OpenAI API.
   * @throws AuthenticationError, RateLimitError, or InvalidRequestError based on the API error.
   */
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

/**
 * Registers the OpenAI provider with the provider registry.
 */
export function register() {
  providerRegistry.registerProvider('openai', (options) => new OpenAIProvider(options));
}
