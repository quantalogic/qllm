import { EmbeddingProvider, LLMProvider } from '../types/index';
import { AnthropicProvider } from './anthropic';
import { createAwsBedrockAnthropicProvider } from './anthropic/aws-credentials';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { GroqProvider } from './qroq';
import { PerplexityProvider } from './perplexity';
import { MistralProvider } from './mistral';
import { OpenRouterProvider } from './openrouter';

export const getListProviderNames = (): string[] => {
  const listProviders = [
    'openai',
    'ollama',
    'groq',
    'anthropic',
    'aws-anthropic',
    'perplexity',
    'mistral',
    'openrouter',
  ].sort();
  return listProviders;
};

// Provider factory
export async function getLLMProvider(providerName: string): Promise<LLMProvider> {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'aws-anthropic':
      return await createAwsBedrockAnthropicProvider();
    case 'perplexity':
      return new PerplexityProvider();
    case 'mistral':
      return new MistralProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export async function getEmbeddingProvider(providerName: string): Promise<EmbeddingProvider> {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    case 'perplexity':
      return new PerplexityProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}
