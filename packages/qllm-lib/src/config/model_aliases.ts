// src/config/model_aliases.ts

import { ProviderConfig, ProviderName } from "@qllm/types/src"; 
import anthropicConfig from '../core/config/providers/anthropic'; 
import openaiConfig from '../core/config/providers/openai';
import ollamaConfig from '../core/config/providers/ollama';
import groqConfig from '../core/config/providers/groq';
import perplexityConfig from '../core/config/providers/perplexity';
import mistralConfig from '../core/config/providers/mistral';
import openrouterConfig from '../core/config/providers/openrouter';

// Define a record of provider configurations
const providerConfigs: Record<ProviderName, ProviderConfig> = {
  anthropic: anthropicConfig,
  openai: openaiConfig,
  ollama: ollamaConfig,
  groq: groqConfig,
  perplexity: perplexityConfig,
  mistral: mistralConfig,
  openrouter: openrouterConfig
};

/**
 * Retrieves the configuration for a specific provider.
 * @param provider The name of the provider.
 * @returns The configuration for the specified provider.
 * @throws Error if the provider is invalid.
 */
export function getProviderConfig(provider: ProviderName): ProviderConfig {
  const config = providerConfigs[provider];
  if (!config) {
    throw new Error(`Invalid provider: ${provider}`);
  }
  return config;
}

/**
 * Resolves a model alias to its corresponding model ID for a specific provider.
 * @param provider The name of the provider.
 * @param modelAlias The alias of the model to resolve.
 * @returns The model ID corresponding to the given alias or undefined if not found.
 */
export function resolveModelAlias(provider: ProviderName, modelAlias: string): string | undefined {
  const config = getProviderConfig(provider);
  const model = config.models.find(m => m.alias === modelAlias);
  return model?.modelId;
}

/**
 * Retrieves the default model for a specific provider.
 * @param provider The name of the provider.
 * @returns The model ID of the default model for the specified provider or undefined if not found.
 */
export function getDefaultModel(provider: ProviderName): string | undefined {
  const config = getProviderConfig(provider);
  return resolveModelAlias(provider, config.defaultModel);
}