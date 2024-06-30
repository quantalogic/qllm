// src/config/model_aliases.ts

import { ProviderConfig, ProviderName } from './types';
import anthropicConfig from './providers/anthropic';
import openaiConfig from './providers/openai';
// Import other provider configs here

export const providerConfigs: Record<ProviderName, ProviderConfig> = {
  anthropic: anthropicConfig,
  openai: openaiConfig
  // Add other provider configs here
};

export function getProviderConfig(provider: ProviderName): ProviderConfig {
  const config = providerConfigs[provider];
  if (!config) {
    throw new Error(`Invalid provider: ${provider}`);
  }
  return config;
}

export function resolveModelAlias(provider: ProviderName, modelAlias: string): string {
  const config = getProviderConfig(provider);
  const model = config.models.find(m => m.alias === modelAlias);
  if (!model) {
    throw new Error(`Invalid model alias for provider ${provider}: ${modelAlias}`);
  }
  return model.modelId;
}

export function getDefaultModel(provider: ProviderName): string {
  const config = getProviderConfig(provider);
  return resolveModelAlias(provider, config.defaultModel);
}