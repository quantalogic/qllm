/**
 * @fileoverview Provider management module for the QLLM library.
 * This module serves as the central hub for managing different LLM and embedding providers.
 * It provides factory functions to instantiate providers and utilities to list available providers.
 * 
 * @module providers
 * @version 1.0.0
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

/**
 * Returns a sorted list of all available provider names supported by the library.
 * 
 * @returns {string[]} Array of provider names in alphabetical order
 * @example
 * const providers = getListProviderNames();
 * // Returns: ['anthropic', 'aws-anthropic', 'groq', 'mistral', 'ollama', 'openai', 'openrouter', 'perplexity']
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
    'openrouter',
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
 * @example
 * // Create an OpenAI provider
 * const openai = await getLLMProvider('openai');
 * 
 * @example
 * // Create an Anthropic provider
 * const anthropic = await getLLMProvider('anthropic');
 */
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

/**
 * Factory function that creates and returns an embedding provider instance based on the provided name.
 * Currently supports OpenAI for text embeddings.
 * 
 * @param {string} providerName - The name of the provider to instantiate
 * @returns {Promise<EmbeddingProvider>} A promise that resolves to an instance of the requested embedding provider
 * @throws {Error} If the specified provider name is not supported for embeddings
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
