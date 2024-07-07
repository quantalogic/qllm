// src/config/provider_config.ts

import { ProviderName } from './types';
import anthropicConfig from './providers/anthropic';
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

export function updateProviderConfig(providerName: ProviderName, updates: Partial<ProviderConfig>): void {
  const config = PROVIDER_CONFIGS[providerName];
  if (!config) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  Object.assign(config, updates);
}

export function getAllProviderConfigs(): Record<ProviderName, ProviderConfig> {
  return { ...PROVIDER_CONFIGS };
}

function initConfig() {
  throw new Error('Function not implemented.');
}
