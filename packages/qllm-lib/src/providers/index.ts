import { EmbeddingProvider, LLMProvider } from '../types/index';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { GroqProvider } from './qroq';

// Provider factory
export function getLLMProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export function getEmbeddingProvider(providerName: string) : EmbeddingProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'groq':
      return new GroqProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

