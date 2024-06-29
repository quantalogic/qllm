import dotenv from 'dotenv';
import path from 'path';
import { ProviderType } from '../providers/provider_factory';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface ProviderConfig {
  type: ProviderType;
  region?: string;
  apiKey?: string;
  model?: string;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    type: 'anthropic',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  // Add configurations for other providers here
};

export const DEFAULT_PROVIDER = 'anthropic';

export function getProviderConfig(providerName: string = DEFAULT_PROVIDER): ProviderConfig {
  const config = PROVIDER_CONFIGS[providerName];
  if (!config) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return config;
}
