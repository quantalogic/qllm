import { EmbeddingProvider, LLMProvider } from '../types/index';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';

// Provider factory
export function getLLMProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export function getEmbeddingProvider(provider: string) : EmbeddingProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    default:
      return new OllamaProvider();
  }
}

