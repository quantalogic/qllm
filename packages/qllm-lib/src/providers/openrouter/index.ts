import axios from 'axios';
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
  ChatStreamCompletionResponse,
  BaseLLMProvider,
} from '../../types';
import { OpenAIProvider } from '../openai';

const DEFAULT_MAX_TOKENS = 1024 * 4;
const BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'qwen/qwen-2-7b-instruct:free';

export class OpenRouterProvider extends BaseLLMProvider implements LLMProvider {
  private openAIProvider: OpenAIProvider;
  private apiKey: string;
  public readonly version = '1.0.0';
  public readonly name = 'OpenRouter';
  private baseURL = BASE_URL;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
    this.openAIProvider = new OpenAIProvider(this.apiKey, this.baseURL);
  }

  public defaultOptions: LLMOptions = {
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
  };

  private async makeRequest(endpoint: string, method: 'GET' | 'POST', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(): Promise<Model[]> {

    const response = await this.makeRequest('/models', 'GET');
  
    // Check if the response has a 'data' property that contains the array of models
    const models = response.data || response;
  
    if (!Array.isArray(models)) {
      throw new Error('Unexpected response format from OpenRouter API');
    }
  
    return models.map((model: any) => ({
      id: model.id,
      name: model.name,
      description: `${model.name} - Context: ${model.context_length}, Price: ${model.pricing.prompt} per prompt token`,
      created: new Date(),
    }));
  }


  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const response = await this.openAIProvider.generateChatCompletion({
        messages: messages,
        options: {
          ...filteredOptions,
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      });

      return {
        ...response,
        model,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChatCompletion(
    params: ChatCompletionParams,
  ): AsyncIterableIterator<ChatStreamCompletionResponse> {
    try {
      const { messages, options, tools, toolChoice, parallelToolCalls, responseFormat } = params;
      const model = options.model || DEFAULT_MODEL;
      const filteredOptions = this.getOptions(options);

      const stream = this.openAIProvider.streamChatCompletion({
        messages: messages,
        options: {
          ...filteredOptions,
          model,
        },
        tools,
        toolChoice,
        parallelToolCalls,
        responseFormat,
      });

      for await (const chunk of stream) {
        yield {
          ...chunk,
          model,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }


  private getOptions(options: LLMOptions): LLMOptions {
    const optionsToInclude = {
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topProbability,
      top_k: options.topKTokens,
      presence_penalty: options.presencePenalty,
      frequency_penalty: options.frequencyPenalty,
    };

    return Object.fromEntries(
      Object.entries(optionsToInclude).filter(([_, v]) => v != null)
    ) as unknown as LLMOptions;
  }

  protected handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Authentication failed with OpenRouter', 'OpenRouter');
      } else if (error.response?.status === 429) {
        throw new RateLimitError('Rate limit exceeded for OpenRouter', 'OpenRouter');
      } else if (error.response?.status === 400) {
        throw new InvalidRequestError(`OpenRouter request failed: ${error.response.data.error}`, 'OpenRouter');
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error}`, 'OpenRouter');
  }
}