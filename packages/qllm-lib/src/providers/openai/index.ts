import OpenAI from 'openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatMessage,
  LLMOptions,
  InputType,
  ChatMessageRole,
} from '../../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import fs from 'fs/promises';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  public supportsEmbedding = true; // Indicates if the provider supports embeddings
  public supportsImageAnalysis = true; // Indicates if the provider supports image analysis
  public version = '1.0.0'; // Version of the provider
  public name = 'OpenAI'; // Name of the provider

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

  async generateChatCompletion(messages: ChatMessage[], options: LLMOptions): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);

      const response = await this.client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options: LLMOptions,
  ): AsyncIterableIterator<string> {
    try {
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

  async generateEmbedding(input: InputType): Promise<number[]> {
    try {
      const modelId = input.model || 'text-embedding-v1';
      let textInput: string;

      if (input.type === 'image') {
        const base64Image = await this.getBase64Image(input.content as string);
        textInput = `data:image/png;base64,${base64Image}`;
      } else {
        textInput = input.content as string;
      }

      const response = await this.client.embeddings.create({
        model: modelId,
        input: textInput,
      });

      if (response.data && response.data.length > 0) {
        return response.data[0].embedding;
      } else {
        throw new Error('No embedding generated');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<{ id: string; description?: string }[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map((model) => ({
        id: model.id,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  private async formatMessages(messages: ChatMessage[]): Promise<ChatCompletionMessageParam[]> {
    const formattedMessages: ChatCompletionMessageParam[] = [];
    for (const message of messages) {
      formattedMessages.push({
        role: message.role,
        content: message.content.data.text || '',
      });
    }
    return formattedMessages;
  }

  private async getBase64Image(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  private withSystemMessage(options: LLMOptions, messages: ChatMessage[]): ChatMessage[] {
    return options.systemMessage && options.systemMessage.length > 0
      ? [this.createSystemMessage(options.systemMessage), ...messages]
      : messages;
  }

  private createSystemMessage(systemMessageText: string): ChatMessage {
    return {
      role: ChatMessageRole.SYSTEM, // Ensure this is correctly imported or defined
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
    } else {
      throw new InvalidRequestError(`Unexpected error: ${error}`, 'OpenAI');
    }
  }
}
