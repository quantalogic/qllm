// Core types
export * from './types';

// Providers
export * from './providers';

// Utilities
export * from './utils';

// Conversation management
export * from './conversation';

// Template management
export * from './templates';

// Main classes and interfaces
import { LLMProvider, EmbeddingProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import { GroqProvider } from './providers/qroq';
import { TemplateManager } from './templates/template-manager';

// Factory function for creating providers
export function createLLMProvider({
  name,
  apiKey,
  url,
}: {
  name: string;
  apiKey?: string;
  url?: string;
}): LLMProvider {
  switch (name.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider({ apiKey });
    case 'ollama':
      return new OllamaProvider(url);
    case 'groq':
      return new GroqProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${name}`);
  }
}

export function createEmbeddingProvider({
  name,
  apiKey,
  url,
}: {
  name: string;
  apiKey?: string;
  url?: string;
}): EmbeddingProvider {
  switch (name.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider({ apiKey });
    case 'ollama':
      return new OllamaProvider(url);
    case 'groq':
      return new GroqProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${name}`);
  }
}

// Export main classes
export {
  LLMProvider,
  EmbeddingProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  GroqProvider,
  TemplateManager,

};

// Default export (if needed)
export default {
  createLLMProvider,
  createEmbeddingProvider,
  TemplateManager,
};
