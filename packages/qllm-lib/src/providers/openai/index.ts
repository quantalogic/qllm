import OpenAI from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatMessage,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
} from '../../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import fs from 'fs/promises';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-v1';

/**
 * OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class OpenAIProvider implements LLMProvider, EmbeddingProvider {
  private client: OpenAI;
  public version = '1.0.0';
  public name = 'OpenAI';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const response = await this.client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
      });

      const firstResponse = response.choices[0];
      const usage = response.usage;
      return {
        text: firstResponse?.message?.content || '',
        finishReason: firstResponse?.finish_reason,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<string> {
    try {
      const { messages, options } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const stream = await this.client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
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

  async generateEmbedding(input: EmbeddingRequestParams): Promise<number[]> {
    try {
      const { content, model } = input;

      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      const response = await this.client.embeddings.create({
        model: modelId,
        input: content,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }
      return response.data[0].embedding;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const { data } = await this.client.models.list();
      return data.map(({ id, created, owned_by }) => ({
        id,
        name: id,
        created: new Date(created * 1000),
        description: `${id} - ${owned_by} - created at ${new Date(created * 1000)}`,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  private async formatMessages(messages: ChatMessage[]): Promise<ChatCompletionMessageParam[]> {
    return messages.map((message) => ({
      role: message.role,
      content: message.content.data.text || '',
    }));
  }

  private async getBase64Image(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      throw new InvalidRequestError(
        `Error reading image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OpenAI',
      );
    }
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessage[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [this.createSystemMessage(options.systemMessage), ...messages]
      : messages;
  }

  private createSystemMessage(systemMessageText: string): ChatMessage {
    return {
      role: 'system',
      content: {
        type: 'text',
        data: {
          text: systemMessageText,
        },
      },
    };
  }

  private handleError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenAI', 'OpenAI');
      } else if (error.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenAI', 'OpenAI');
      } else {
        throw new InvalidRequestError(`OpenAI request failed: ${error.message}`, 'OpenAI');
      }
    } else if (error instanceof Error) {
      throw new InvalidRequestError(`Unexpected error: ${error.message}`, 'OpenAI');
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'OpenAI');
    }
  }
}
