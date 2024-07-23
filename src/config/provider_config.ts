// src/config/provider_config.ts

import { ProviderName } from './types';
import anthropicConfig from './providers/anthropic';
import ollamaConfig from './providers/ollama';
import { configManager  } from '../utils/configuration_manager';
import openaiConfig from './providers/openai';


export interface ProviderConfig {
  type: ProviderName;
  apiKey?: string;
  model?: string;
}

const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  anthropic: {
    type: 'anthropic',
    model: configManager.getConfig().defaultModelAlias || anthropicConfig.defaultModel || '',
  },
  // Add configurations for other providers here as needed
  openai: {
    type: 'openai',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || openaiConfig.defaultModel,
  },
  ollama: {
    type: 'ollama',
    apiKey: '',
    model: 'mistral',
  },
};

export function getProviderConfig(providerName: ProviderName): ProviderConfig {
  const config = PROVIDER_CONFIGS[providerName];
  if (!config) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return { ...config };
}

// New function to get models for a provider
export function getModelsForProvider(providerName: ProviderName): { alias: string; modelId: string }[] {
  switch (providerName) {
    case 'anthropic':
      return anthropicConfig.models;
    case 'openai':
      return openaiConfig.models; // Assuming you have models for openaiConfig
    case 'ollama':
      return ollamaConfig.models; // Assuming you have models for ollamaConfig
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export function getAllProviders(): ProviderName[] {
  return Object.keys(PROVIDER_CONFIGS) as ProviderName[];
}