import { LLMProvider } from '../types/index';
import { OpenAIProvider } from './openai';

// Provider factory
export function getProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}
