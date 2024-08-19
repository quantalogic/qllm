// src/config/provider_config.ts

import { ProviderName } from '@qllm/types/src';
import anthropicConfig from '../core/config/providers/anthropic';
import ollamaConfig from '../core/config/providers/ollama';
import openaiConfig from '../core/config/providers/openai';
import groqConfig from '../core/config/providers/groq';
import perplexityConfig from '../core/config/providers/perplexity';
import mistralConfig from '../core/config/providers/mistral';
import openrouterConfig from '../core/config/providers/openrouter';
import jinaConfig from '../core/config/providers/jina';
import { configManager } from './configuration_manager';

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
    type: 'groq',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || groqConfig.defaultModel || '',
  },
  perplexity: {
    type: 'perplexity',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || perplexityConfig.defaultModel || '',
  },
  mistral: {
    type: 'mistral',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || mistralConfig.defaultModel || '',
  },
  openrouter: {
    type: 'openrouter',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || openrouterConfig.defaultModel || '',
  },
  jina: {
    type: 'jina',
    apiKey: '',
    model: configManager.getConfig().defaultModelAlias || jinaConfig.defaultModel || '',
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
export function getModelsForProvider(
  providerName: ProviderName,
): { alias: string; modelId: string; parameters: object }[] {
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
      return perplexityConfig.models; // Assuming you have models for perplexityConfig
    case 'openrouter':
      return openrouterConfig.models; // Assuming you have models for openrouterConfig
    case 'jina':
      return jinaConfig.models; // Assuming you have models for jinaConfig
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export function getAllProviders(): ProviderName[] {
  return Object.keys(PROVIDER_CONFIGS) as ProviderName[];
}
