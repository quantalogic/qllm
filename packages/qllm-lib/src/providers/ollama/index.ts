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
import { createTextMessageContent, imageToBase64 } from '../../utils/images';
import { listModels } from './list-models';

const DEFAULT_MODEL = 'llama3.1';
const BASE_URL = 'http://localhost:11434';

export class OllamaProvider implements LLMProvider, EmbeddingProvider {
  constructor(private baseUrl: string = BASE_URL) {}

  public readonly version: string = '1.0.0';
  public readonly name = 'Ollama';

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

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
  };

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
  protected handleError(error: unknown): never {
    if (error instanceof LLMProviderError) {
      throw error;
    } else if (error instanceof Error) {
      throw new LLMProviderError(error.message, this.name);
    } else {
      throw new LLMProviderError(`Unknown error: ${error}`, this.name);
    }
  }

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

export const createOllamaImageContent = async (source: string): Promise<ImageUrlContent> => {
    const content = await imageToBase64(source);
    // Return the raw base64 string without the data URL prefix
    return {
      type: 'image_url',
      url: content.base64,
    };
};

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
