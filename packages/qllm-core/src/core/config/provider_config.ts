// src/config/provider_config.ts

import { ProviderName } from './types';
import anthropicConfig from './providers/anthropic';
import ollamaConfig from './providers/ollama';
import openaiConfig from './providers/openai';
import groqConfig from './providers/groq';
import perplexityConfig from './providers/perplexity';
import mistralConfig from './providers/mistral';
import { configManager } from '../../common/utils/configuration_manager';



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
  groq: {
    type: "groq",
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || groqConfig.defaultModel || '',
  },
  perplexity: {
    type: "perplexity",
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || perplexityConfig.defaultModel || '',
  },
  mistral: {
    type: "mistral",
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || mistralConfig.defaultModel || '',
  }
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
    case 'groq':
      return groqConfig.models; // Assuming you have models for groqConfig
    case 'perplexity':
      return perplexityConfig.models; // Assuming you have models for groqConfig
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export function getAllProviders(): ProviderName[] {
  return Object.keys(PROVIDER_CONFIGS) as ProviderName[];
}