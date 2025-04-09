/**
 * @fileoverview Provider management module for the QLLM library.
 * This module serves as the central hub for managing different LLM and embedding providers.
 * It provides factory functions to instantiate providers and utilities to list available providers.
 * 
 * @module providers
 * @version 1.0.0
 * 
 * @remarks
 * The provider system is designed to be extensible, allowing easy integration of new LLM providers.
 * Each provider implements standard interfaces (LLMProvider/EmbeddingProvider) to ensure consistent
 * behavior across different implementations.
 * 
 * Supported Providers:
 * - OpenAI: GPT models and embeddings
 * - Anthropic: Claude models
 * - AWS Bedrock: Anthropic models via AWS
 * - Ollama: Local open-source models
 * - Groq: High-performance inference
 * - Perplexity: Advanced language models
 * - Mistral: Efficient language models
 * - OpenRouter: Multi-model gateway
 * - OVH: OVH provider
 */

import { EmbeddingProvider, LLMProvider } from '../types/index';
import { AnthropicProvider } from './anthropic';
import { createAwsBedrockAnthropicProvider } from './anthropic/aws-credentials';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { GroqProvider } from './qroq';
import { PerplexityProvider } from './perplexity';
import { MistralProvider } from './mistral';
import { OpenRouterProvider } from './openrouter';
import { OVHProvider } from './ovh';
import { GoogleProvider  } from './google/index';

/**
 * Returns a sorted list of all available provider names supported by the library.
 * 
 * @returns {string[]} Array of provider names in alphabetical order
 * @example
 * const providers = getListProviderNames();
 * // Returns: ['anthropic', 'aws-anthropic', 'groq', 'mistral', 'ollama', 'openai', 'openrouter', 'ovh', 'perplexity']
 */
export const getListProviderNames = (): string[] => {
  const listProviders = [
    'openai',
    'ollama',
    'groq',
    'anthropic',
    'aws-anthropic',
    'perplexity',
    'mistral',
    'ovh',
    'openrouter',
    'google'
  ].sort();
  return listProviders;
};

/**
 * Factory function that creates and returns an LLM provider instance based on the provided name.
 * 
 * @param {string} providerName - The name of the provider to instantiate
 * @returns {Promise<LLMProvider>} A promise that resolves to an instance of the requested provider
 * @throws {Error} If the specified provider name is not supported
 * 
 * @remarks
 * This function serves as the main entry point for creating LLM provider instances.
 * Each provider is initialized with default settings which can be customized after creation.
 * 
 * @example
 * // Create an OpenAI provider
 * const openai = await getLLMProvider('openai');
 * 
 * @example
 * // Create an Anthropic provider
 * const anthropic = await getLLMProvider('anthropic');
 */
export async function getLLMProvider(providerName: string, options?: any): Promise<LLMProvider> {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(options?.apiKey, options?.baseUrl);
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
    case 'ovh':
      return new OVHProvider({
        apiKey: options?.apiKey,
        config: { model: options?.model || 'DeepSeek-R1-Distill-Llama-70B' }
      });
    case 'openrouter':
      return new OpenRouterProvider();
    case 'google':
      return new GoogleProvider();
    default:
      throw new Error(`Provider "${providerName}" not found.`);
  }
}

/**
 * Factory function that creates and returns an embedding provider instance based on the provided name.
 * Currently supports OpenAI, Ollama, Groq, and Perplexity for text embeddings.
 * 
 * @param {string} providerName - The name of the provider to instantiate
 * @returns {Promise<EmbeddingProvider>} A promise that resolves to an instance of the requested embedding provider
 * @throws {Error} If the specified provider name is not supported for embeddings
 * 
 * @remarks
 * Not all LLM providers support embeddings. This function only instantiates providers
 * that implement the EmbeddingProvider interface.
 * 
 * @example
 * // Create an OpenAI embedding provider
 * const embedder = await getEmbeddingProvider('openai');
 */
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
