import { EmbeddingProvider, LLMProvider } from '../types/index';
import { AnthropicProvider, createAwsBedrockAnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { GroqProvider } from './qroq';


export const getListProviderNames = (): string[] => {
  return ['openai', 'ollama', 'groq', 'anthropic', 'aws-anthropic'];
}

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
    case "aws-anthropic":
      return await createAwsBedrockAnthropicProvider();

    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

export async function getEmbeddingProvider(providerName: string) : Promise<EmbeddingProvider> {
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

