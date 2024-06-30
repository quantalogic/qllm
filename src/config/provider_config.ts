// src/config/provider_config.ts

import { ProviderName } from './types';
import { getAwsRegion, getModelAlias } from './config';
import anthropicConfig from './providers/anthropic';

export interface ProviderConfig {
  type: ProviderName;
  region?: string;
  apiKey?: string;
  model?: string;
}

const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  anthropic: {
    type: 'anthropic',
    region: getAwsRegion(),
    model: getModelAlias() || anthropicConfig.defaultModel,
  },
  // Add configurations for other providers here as needed
};

export const DEFAULT_PROVIDER: ProviderName = 'anthropic';

export function getProviderConfig(providerName: ProviderName = DEFAULT_PROVIDER): ProviderConfig {
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