import { Mistral } from '@mistralai/mistralai';

import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  LLMOptions,
  Model,
  ChatCompletionResponse,
  ChatCompletionParams,
  EmbeddingProvider,
  EmbeddingRequestParams,
  ChatStreamCompletionResponse,
  EmbeddingResponse,
  ToolCall,
} from '../../types';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const DEFAULT_MODEL = 'mistral-small-latest';
const DEFAULT_EMBEDDING_MODEL = 'mistral-embed';

/**
 * MistralProvider class implements the LLMProvider interface for Mistral AI's language models.
 * It provides methods for generating messages, streaming messages, and generating embeddings.
 */
export class MistralProvider implements LLMProvider, EmbeddingProvider {
  public readonly version = '1.0.0';
  public readonly name = 'Mistral';

  constructor(private key?: string) {
    const apiKey = key ?? process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
  }

  private getKey() {
    const apiKey = this.key || process.env.MISTRAL_API_KEY || 'MISTRAL_API_KEY';

    if (!apiKey) {
      throw new AuthenticationError('Mistral API key MISTRAL_API_KEY is required', 'Mistral');
    }
    return this.key;
  }

  private getClient() {
    return new Mistral({ apiKey: this.getKey() });
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.complete({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      const responseContent = response.choices?.shift();
      const usage = response.usage;
      const messageAssistantContent = responseContent?.message.content || '';
      const toolCalls = responseContent?.message.toolCalls || [];
      const finishReason = responseContent?.finishReason || null;

      const toolCallResults: ToolCall[] = this.extractToolCallsResult(toolCalls);

      return {
        model: model,
        text: messageAssistantContent,
        finishReason: finishReason,
        toolCalls: toolCallResults,
        refusal: null,
        usage: usage,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private prepareMistraTools(
    tools:
      | {
          function: { name: string; description: string; parameters?: any };
          type: 'function';
          strict?: boolean | undefined;
        }[]
      | undefined,
  ) {
    return (
      tools?.map((tool) => ({
        type: tool.type,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          arguments: tool.function.parameters as string,
        },
      })) || undefined
    );
  }

  private extractToolCallsResult(toolCalls: any): ToolCall[] {
    return toolCalls.map((mistralToolCall: any) => {
      const toolCall: ToolCall = {
        id: mistralToolCall.id || mistralToolCall.function.name,
        type: 'function',
        function: {
          name: mistralToolCall.function.name,
          arguments: mistralToolCall.function.arguments as string,
        },
      };
      return toolCall;
    });
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools } = params;

      const mistralsTools = this.prepareMistraTools(tools);

      const model = options.model || DEFAULT_MODEL;
      const response = await this.getClient().chat.stream({
        messages: messages.map((message) => ({
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
            : message.content.type === 'text'
              ? message.content.text
              : '',
        })),
        model: options.model || DEFAULT_MODEL,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        tools: mistralsTools as any,
      });

      for await (const chunk of response) {
        const content = chunk.data.choices[0]?.delta.content;
        const finishReason = chunk.data.choices[0]?.finishReason;

        const result: ChatStreamCompletionResponse = {
          text: content || null,
          finishReason: finishReason || null,
          model: model,
        };

        yield result;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    try {
      const { content, model } = input;
      const modelId = model || DEFAULT_EMBEDDING_MODEL;

      if (typeof content !== 'string') {
        throw new InvalidRequestError(
          'Mistral AI requires a string input for embeddings',
          'Mistral',
        );
      }

      const response = await this.getClient().embeddings.create({
        model: modelId,
        inputs: [content],
        encodingFormat: 'json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding generated');
      }

      const embeddingResult: EmbeddingResponse = {
        embedding: response.data[0]?.embedding || [],
        embeddings: response.data.map((d: any) => d.embedding),
      };

      return embeddingResult;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    const models = await this.getClient().models.list();

    const modelList: Model[] =
      models.data?.map((model) => ({
        id: model.id || model.name || '',
        name: model.name || model.id,
        created: model.created ? new Date(model.created) : new Date(),
        description: model.description || model.name || '',
      })) || [];
    return modelList;
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new AuthenticationError('Authentication failed with Mistral AI', 'Mistral');
      } else if (error.message.includes('429')) {
        throw new RateLimitError('Rate limit exceeded for Mistral AI', 'Mistral');
      } else {
        throw new InvalidRequestError(`Mistral AI request failed: ${error.message}`, 'Mistral');
      }
    } else {
      throw new InvalidRequestError(`Unknown error occurred: ${error}`, 'Mistral');
    }
  }
}
