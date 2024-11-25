/**
 * @fileoverview Ollama provider implementation for the QLLM library.
 * This module provides integration with Ollama, allowing local execution of open-source language models.
 * 
 * @module providers/ollama
 * @version 1.0.0
 * 
 * @remarks
 * The Ollama provider enables local model execution through the Ollama server.
 * It supports both text generation and embedding capabilities, with additional
 * features like multimodal inputs (text + images) and tool calling.
 */

import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  ChatMessage,
  isTextContent,
  isImageUrlContent,
  MessageContent,
  ImageUrlContent,
  ToolCall,
  LLMProvider,
  EmbeddingProvider,
  EmbeddingRequestParams,
  EmbeddingResponse,
  ChatMessageWithSystem,
  SystemMessage,
} from '../../types';
import ollama, {
  ChatRequest,
  Tool as OllamaTool,
  ToolCall as OllamaToolCall,
  Options as OllamaOptions,
} from 'ollama';
import { imageToBase64 } from '../../utils/images';
import { listModels } from './list-models';

const DEFAULT_MODEL = 'llama3.1';
const BASE_URL = 'http://localhost:11434';

/**
 * Ollama provider implementation that supports both LLM and embedding capabilities.
 * 
 * @implements {LLMProvider}
 * @implements {EmbeddingProvider}
 * 
 * @remarks
 * This provider connects to a local Ollama server to execute language models.
 * It supports features like:
 * - Text generation with chat-style interactions
 * - Streaming responses for real-time output
 * - Multimodal inputs (text + images)
 * - Tool calling for function execution
 * - Text embeddings for vector operations
 */
export class OllamaProvider implements LLMProvider, EmbeddingProvider {
  constructor(private baseUrl: string = BASE_URL) {}

  public readonly version: string = '1.0.0';
  public readonly name = 'Ollama';

  /**
   * Generates embeddings for the given text input using Ollama models.
   * 
   * @param {EmbeddingRequestParams} input - The text to generate embeddings for
   * @returns {Promise<EmbeddingResponse>} The generated embeddings
   * @throws {Error} If multiple text inputs are provided (not supported by Ollama)
   */
  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    if (Array.isArray(input.content)) {
      throw new Error('Ollama embeddings does not support multiple text inputs');
    }
    const result = await ollama.embeddings({
      model: input.model,
      prompt: input.content,
    });

    const embeddingResponse: EmbeddingResponse = {
      embedding: result.embedding,
      embeddings: [result.embedding],
    };

    return embeddingResponse;
  }

  /** Default options for the Ollama provider */
  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
  };

  /**
   * Retrieves a list of available models from the Ollama server.
   * 
   * @returns {Promise<Model[]>} Array of available models
   * @throws {LLMProviderError} If there's an error fetching the models
   */
  async listModels(): Promise<Model[]> {
    try {
      const models = await listModels(this.baseUrl);

      return models.map((model) => ({
        id: model.id,
        createdAt: model.createdAt,
        description: model.description,
      }));
    } catch (error) {
      this.handleError(error);
      return []; // Return an empty array in case of error
    }
  }

  /**
   * Generates a chat completion using the specified model and parameters.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {Promise<ChatCompletionResponse>} The generated completion
   * @throws {LLMProviderError} If there's an error during generation
   * 
   * @remarks
   * This method supports:
   * - System messages for context setting
   * - Multi-turn conversations
   * - Tool/function calling
   * - Image inputs (when supported by the model)
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = formatTools(tools);

      const chatRequest: ChatRequest & { stream: false } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        stream: false,
        tools: formattedTools,
        options: formatOptions(options),
      };

      const response = await ollama.chat(chatRequest);

      // console.dir(response, { depth: null });

      return {
        model: options.model || DEFAULT_MODEL,
        text: response.message.content,
        refusal: null,
        toolCalls: mapOllamaToolCallToToolCall(response.message.tool_calls),
        finishReason: response.done ? 'stop' : null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generates a streaming chat completion for real-time responses.
   * 
   * @param {ChatCompletionParams} params - Parameters for the chat completion
   * @returns {AsyncIterableIterator<ChatStreamCompletionResponse>} Stream of completion chunks
   * @throws {LLMProviderError} If there's an error during generation
   * 
   * @remarks
   * The stream provides real-time updates as the model generates text,
   * allowing for more responsive user interfaces.
   */
  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const messageWithSystem = this.withSystemMessage(options, messages);
      const formattedMessages = await this.formatMessages(messageWithSystem);
      const formattedTools = formatTools(tools);

      const chatRequest: ChatRequest & { stream: true } = {
        model: options.model || DEFAULT_MODEL,
        messages: formattedMessages,
        tools: formattedTools,
        stream: true,
        options: formatOptions(options),
      };

      const stream = await ollama.chat(chatRequest);

      for await (const part of stream) {
        yield {
          text: part.message.content,
          finishReason: part.done ? 'stop' : null,
          model: options.model || DEFAULT_MODEL,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Formats messages for the Ollama API, handling both text and image inputs.
   * 
   * @param {ChatMessageWithSystem[]} messages - Array of messages to format
   * @returns {Promise<Array>} Formatted messages for the Ollama API
   * @protected
   */
  protected async formatMessages(
    messages: ChatMessageWithSystem[],
  ): Promise<{ role: string; content: string; images?: string[] }[]> {
    const formattedMessages: { role: string; content: string; images?: string[] }[] = [];

    for (const message of messages) {
      const messageContentArray: MessageContent[] = Array.isArray(message.content)
        ? message.content
        : [message.content];

      let content = '';
      const images: string[] = [];

      for (const messageContent of messageContentArray) {
        if (isTextContent(messageContent)) {
          content += messageContent.text + '\n';
        } else if (isImageUrlContent(messageContent)) {
          const imageContent = await createOllamaImageContent(messageContent.url);
          images.push(imageContent.url);
        }
      }

      formattedMessages.push({
        role: message.role,
        content: content.trim(),
        ...(images.length > 0 && { images }),
      });
    }
    return formattedMessages;
  }

  /**
   * Handles errors by wrapping them in LLMProviderError.
   * 
   * @param {unknown} error - The error to handle
   * @throws {LLMProviderError} Always throws a wrapped error
   * @protected
   */
  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }

  /**
   * Adds a system message to the conversation if specified in options.
   * 
   * @param {LLMOptions} options - Options containing potential system message
   * @param {ChatMessage[]} messages - Original message array
   * @returns {ChatMessageWithSystem[]} Messages with system message prepended if present
   * @protected
   */
  protected withSystemMessage(
    options: LLMOptions,
    messages: ChatMessage[],
  ): ChatMessageWithSystem[] {
    if (options.systemMessage && options.systemMessage.length > 0) {
      const systemMessage: SystemMessage = {
        role: 'system',
        content: {
          text: options.systemMessage,
          type: 'text',
        },
      };
      return [systemMessage, ...messages];
    }
    return messages;
  }
}

/**
 * Creates an image content object from a source URL or path.
 * 
 * @param {string} source - URL or path to the image
 * @returns {Promise<ImageUrlContent>} Formatted image content for Ollama
 */
export const createOllamaImageContent = async (source: string): Promise<ImageUrlContent> => {
  const content = await imageToBase64(source);
  // Return the raw base64 string without the data URL prefix
  return {
    type: 'image_url',
    url: content.base64,
  };
};

/**
 * Formats tool definitions for the Ollama API.
 * 
 * @param {Tool[] | undefined} tools - Array of tool definitions
 * @returns {OllamaTool[] | undefined} Formatted tools for Ollama
 * @private
 */
function formatTools(tools: Tool[] | undefined): OllamaTool[] | undefined {
  if (!tools) {
    return undefined;
  }
  const ollamaTools: OllamaTool[] = [];
  for (const tool of tools) {
    const ollamaTool: OllamaTool = {
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    };
    ollamaTools.push(ollamaTool);
  }
  return ollamaTools;
}

/**
 * Maps Ollama tool calls to the standard QLLM format.
 * 
 * @param {OllamaToolCall[] | undefined} toolCalls - Tool calls from Ollama
 * @returns {ToolCall[] | undefined} Standardized tool calls
 * @private
 */
function mapOllamaToolCallToToolCall(
  toolCalls: OllamaToolCall[] | undefined,
): ToolCall[] | undefined {
  if (!toolCalls) {
    return undefined;
  }
  return toolCalls.map(
    (toolCall) =>
      ({
        type: 'function',
        id: crypto.randomUUID(), // Generate a unique ID
        function: {
          name: toolCall.function.name,
          arguments: JSON.stringify(toolCall.function.arguments),
        },
      }) as ToolCall,
  );
}

/**
 * Formats LLM options for the Ollama API.
 * 
 * @param {LLMOptions} options - QLLM options
 * @returns {Partial<OllamaOptions>} Formatted options for Ollama
 * @private
 */
function formatOptions(options: LLMOptions): Partial<OllamaOptions> {
  const stops: string[] = [];
  if (Array.isArray(options.stop)) {
    stops.push(...options.stop);
  } else if (options.stop) {
    stops.push(options.stop);
  }

  const formattedOptions: Partial<OllamaOptions> = {
    temperature: options.temperature,
    top_p: options.topProbability,
    seed: options.seed,
    top_k: options.topKTokens,
    stop: stops,
    presence_penalty: options.presencePenalty || undefined,
    frequency_penalty: options.frequencyPenalty || undefined,
  };
  return formattedOptions;
}
