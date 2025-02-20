/**
 * @fileoverview OVH provider implementation for the QLLM library.
 * Implements LLMProvider for OVH's DeepSeek-R1-Distill-Llama-70B model.
 */

import { OpenAIProvider } from '../openai';
import {
  LLMProvider,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ChatCompletionResponse,
  ChatCompletionParams,
  ChatStreamCompletionResponse,
  LLMOptions,
  Model,
  ProviderOptions,
} from '../../types';
import { ALL_OVH_MODELS, DEFAULT_OVH_MODEL, OVHModelConfig, OVHModelKey } from './models';

const DEFAULT_MAX_COMPLETION_TOKENS = 64*1024;

export class OVHProvider implements LLMProvider {
  private openAIProvider: OpenAIProvider;
  public readonly version = '1.0.0';
  public readonly name = 'OVH';
  private baseURL: string;
  private modelConfig: OVHModelConfig;
  private modelKey: OVHModelKey;

  constructor(private options: ProviderOptions<{ model: OVHModelKey }>) {
    this.modelKey = this.options.config?.model || 'DeepSeek-R1-Distill-Llama-70B';
    this.modelConfig = ALL_OVH_MODELS[this.modelKey];
    if (!this.modelConfig) {
      throw new Error(`Model key '${this.modelKey}' not found. Available keys: ${Object.keys(ALL_OVH_MODELS).join(', ')}`);
    }
    this.baseURL = this.modelConfig.endpoint;
    const apiKey = this.options.apiKey ?? process.env.OVH_API_KEY;
    if (!apiKey) {
      throw new Error('OVH API key not found');
    }
    this.openAIProvider = new OpenAIProvider(apiKey, this.baseURL);
  }

  defaultOptions: LLMOptions = {
    model: 'DeepSeek-R1-Distill-Llama-70B',
    max_completion_tokens: DEFAULT_MAX_COMPLETION_TOKENS,
  };

  private getOptions(options: LLMOptions): LLMOptions {
    const filteredOptions: LLMOptions = {
      model: this.modelConfig.id,
      max_completion_tokens: options.max_completion_tokens || DEFAULT_MAX_COMPLETION_TOKENS,
      temperature: options.temperature,
    };

    return Object.fromEntries(
      Object.entries(filteredOptions).filter(([_, v]) => v != null)
    ) as LLMOptions;
  }

  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { options, ...restParams } = params;
      const filteredOptions = this.getOptions(options || {});
      const model = filteredOptions.model;

      if (!(model in ALL_OVH_MODELS)) {
        throw new InvalidRequestError(`Model ${model} not supported by OVH`, 'OVH');
      }

      const response = await this.openAIProvider.generateChatCompletion({
        ...restParams,
        options: filteredOptions,
      });

      return { ...response, model };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { options, ...restParams } = params;
      const filteredOptions = this.getOptions(options || {});
      const model = filteredOptions.model;

      if (!(model in ALL_OVH_MODELS)) {
        throw new InvalidRequestError(`Model ${model} not supported by OVH`, 'OVH');
      }

      const stream = this.openAIProvider.streamChatCompletion({
        ...restParams,
        options: filteredOptions,
      });

      for await (const chunk of stream) {
        yield { ...chunk, model };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {
    return Object.values(ALL_OVH_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      description: `${model.parameterCount} parameters, ${model.contextLength} context window`,
      created: new Date(2024, 0, 1), // Update with actual release date
    }));
  }

  private handleError(error: unknown): never {
    if (error instanceof AuthenticationError) {
      throw new AuthenticationError('OVH authentication failed', 'OVH');
    } else if (error instanceof RateLimitError) {
      throw new RateLimitError('OVH rate limit exceeded', 'OVH');
    } else if (error instanceof InvalidRequestError) {
      throw new InvalidRequestError(`OVH request failed: ${error.message}`, 'OVH');
    }
    throw new InvalidRequestError(`Unexpected OVH error: ${error instanceof Error ? error.message : String(error)}`, 'OVH');
  }
}