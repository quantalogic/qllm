// src/providers/provider_factory.ts

import { LLMProvider } from './llm_provider';
import { AnthropicProvider } from './anthropic_provider';
import { getCredentials, refreshCredentialsIfNeeded } from '../credentials';
import { getAwsRegion, getModelAlias } from '../config/config';
import { ProviderName } from '../config/types';
import { logger } from '../utils/logger';

export interface ProviderConfig {
  type: ProviderName;
  model?: string;
}

export class ProviderFactory {
  private static instances: Map<string, LLMProvider> = new Map();

  static async createProvider(config: ProviderConfig): Promise<LLMProvider> {
    const key = `${config.type}-${config.model || ''}`;

    if (!this.instances.has(key)) {
      let provider: LLMProvider;
      const modelAlias = getModelAlias();

      try {
      
        switch (config.type) {
          case 'anthropic':
            const region = getAwsRegion();
            let credentials = await getCredentials();
            credentials = await refreshCredentialsIfNeeded(credentials);
    
            provider = new AnthropicProvider(credentials, region, config.model || modelAlias);
            break;
          // Add cases for other providers here
          default:
            throw new Error(`Unsupported provider type: ${config.type}`);
        }

        this.instances.set(key, provider);
        logger.debug(`Created new provider instance: ${config.type}`);
      } catch (error) {
        logger.error(`Failed to create provider: ${error}`);
        throw error;
      }
    } else {
      logger.debug(`Reusing existing provider instance: ${config.type}`);
    }

    return this.instances.get(key)!;
  }

  static async getProvider(providerName: ProviderName, model?: string): Promise<LLMProvider> {
    const config: ProviderConfig = {
      type: providerName,
      model: model,
    };
    return this.createProvider(config);
  }

  static clearProviders(): void {
    this.instances.clear();
    logger.debug('Cleared all provider instances');
  }
}