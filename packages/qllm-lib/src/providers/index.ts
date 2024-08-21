import { EmbeddingProvider, LLMProvider } from '../types/index';
import { OpenAIProvider } from './openai';

// Provider factory
export function getLLMProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export function getEmbeddingProvider(provider: string) : EmbeddingProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Provider "${provider}" not found.`);
  }
}

