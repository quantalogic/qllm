import { Anthropic } from '@anthropic-ai/sdk';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import {
  BaseLLMProvider,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatStreamCompletionResponse,
  LLMOptions,
  LLMProviderError,
  Model,
  Tool,
  EmbeddingRequestParams,
  EmbeddingResponse,
  ToolCall,
} from '../../types';
import { formatMessages } from './message-util';
import { listModels as listBedrockModels } from '../../utils/cloud/aws/bedrock';
import { region, getAwsCredential } from './aws-credentials';
import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from './constants';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic | AnthropicBedrock;
  public readonly name = 'Anthropic';
  public readonly version = '1.0.0';

  constructor({ apiKey, client }: { apiKey?: string; client?: AnthropicBedrock } = {}) {
    super();
    if (!client) {
      const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new LLMProviderError('Anthropic API key not found', this.name);
      }
      this.client = new Anthropic({ apiKey: key });
    } else {
      this.client = client;
    }
  }

  defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  async listModels(): Promise<Model[]> {
    if (this.client instanceof AnthropicBedrock) {
      const models = await listBedrockModels(await getAwsCredential(), region());
      return models
        .map((model) => ({
          id: model.id,
          description: model.description,
        }))
        .filter((model) => model.id.startsWith('anthropic.'));
    }

    // Anthropic doesn't provide a model listing API, so we'll return a static list
    return [
      {
        id: 'claude-3-opus-20240229',
        created: new Date('2024-02-29'),
        description: 'Claude 3 Opus: Most capable model for highly complex tasks',
      },
      {
        id: 'claude-3-sonnet-20240229',
        created: new Date('2024-02-29'),
        description:
          'Claude 3 Sonnet: Ideal balance of intelligence and speed for enterprise workloads',
      },
      {
        id: 'claude-3-haiku-20240307',
        created: new Date('2024-03-07'),
        description:
          'Claude 3 Haiku: Fastest and most compact model for near-instant responsiveness',
      },
      {
        id: 'claude-3-embedding-20240229',
        created: new Date('2024-02-29'),
        description: 'Claude 3 Embedding: Embedding model for text embedding generation',
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        created: new Date('2024-06-20'),
        description:
          'Claude 3.5 Sonnet: Ideal balance of intelligence and speed for enterprise workloads. Stronger than Claude 3 Opus.',
      },
    ];
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools } = params;
      const formattedMessages = await formatMessages(messages);
      const formattedTools = this.formatTools(tools);
      const request: Anthropic.Messages.MessageCreateParamsNonStreaming = {
        system: options.systemMessage as string | undefined,
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        top_k: options.topKTokens,
        stop_sequences: options.stop
          ? Array.isArray(options.stop)
            ? options.stop
            : [options.stop]
          : undefined,
        tools: formattedTools,
      };
      console.log('AnthropicProvider.generateChatCompletion request:');
      console.dir(request, { depth: null });
      const response = await this.client.messages.create(request);

      const getTextFromContentBlock = (
        contentBlock: Anthropic.Messages.ContentBlock,
      ): string | null => {
        if (contentBlock.type === 'text') {
          return contentBlock.text;
        }
        return null;
      };

      const getToolFromContentBlock = (
        contentBlock: Anthropic.Messages.ContentBlock,
      ): ToolCall | undefined => {
        if (contentBlock.type === 'tool_use') {
          const toolCall: ToolCall = {
            id: contentBlock.id,
            type: 'function',
            function: {
              name: contentBlock.name,
              arguments: JSON.stringify(contentBlock.input),
            },
          };
          return toolCall;
        }
        return undefined;
      };

      const getFirstTextFromContentBlocks = (
        contentBlocks: Anthropic.Messages.ContentBlock[],
      ): string | null => {
        const contentBlock = contentBlocks.find((block) => {
          const text = getTextFromContentBlock(block);
          return text !== null && text !== undefined;
        });
        return contentBlock ? getTextFromContentBlock(contentBlock) : null;
      };

      const getToolsUseFromContentBlocks = (
        contentBlocks: Anthropic.Messages.ContentBlock[],
      ): ToolCall[] | undefined => {
        const toolCalls: ToolCall[] = [];
        for (const block of contentBlocks) {
          const tool = getToolFromContentBlock(block);
          if (tool) {
            toolCalls.push(tool);
          }
        }
        return toolCalls.length > 0 ? toolCalls : undefined;
      };

      const toolCalls = getToolsUseFromContentBlocks(response.content);
      return {
        model: response.model,
        text: getFirstTextFromContentBlocks(response.content),
        finishReason: response.stop_reason,
        toolCalls: toolCalls,
        refusal: null,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
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
      const formattedMessages = await formatMessages(messages);
      const formattedTools = this.formatTools(tools);
      const request: Anthropic.Messages.MessageCreateParamsNonStreaming = {
        system: options.systemMessage as string | undefined,
        model: options.model || this.defaultOptions.model,
        messages: formattedMessages,
        max_tokens: options.maxTokens || this.defaultOptions.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topProbability,
        top_k: options.topKTokens,
        stop_sequences: options.stop
          ? Array.isArray(options.stop)
            ? options.stop
            : [options.stop]
          : undefined,
        tools: formattedTools,
      };
      const stream = await this.client.messages.create({ ...request, stream: true });

      const getTextDelta = (content: Anthropic.Messages.RawMessageStreamEvent): string | null => {
        if (content.type === 'content_block_delta' && content.delta.type == 'text_delta') {
          return content.delta.text;
        }
        if (content.type === 'content_block_delta' && content.delta.type == 'input_json_delta') {
          return content.delta.partial_json;
        }
        return null;
      };

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          yield {
            text: getTextDelta(chunk),
            finishReason: null,
            model: options.model || this.defaultOptions.model,
          };
        } else if (chunk.type === 'message_stop') {
          yield {
            text: null,
            finishReason: 'stop',
            model: options.model || this.defaultOptions.model,
          };
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse> {
    throw new LLMProviderError('Embedding generation is not supported by Anthropic', this.name);
  }

  private formatTools(tools?: Tool[]): Anthropic.Tool[] | undefined {
    if (!tools) return undefined;
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  private formatToolCalls(toolCalls?: any): ToolCall[] | undefined {
    console.log('tool calls:');
    console.dir(toolCalls, { depth: null });
    if (!toolCalls) return undefined;
    return toolCalls.map((toolCall: any) => ({
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.function.name,
        arguments: JSON.stringify(toolCall.function.arguments),
      },
    }));
  }

  protected handleError(error: unknown): never {
    const name = this.client instanceof AnthropicBedrock ? 'Anthropic Bedrock' : 'Anthropic';
    if (error instanceof Anthropic.APIError) {
      throw new LLMProviderError(`Anthropic API error: ${error.message}`, name);
    } else if (error instanceof Error) {
      throw new LLMProviderError(`Unexpected error: ${error.message}`, name);
    } else {
      throw new LLMProviderError(`Unknown error occurred: ${error}`, name);
    }
  }
}
