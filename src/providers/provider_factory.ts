import { LLMProvider } from './llm_provider';
import { AnthropicProvider } from './anthropic_provider';
import { OpenAIProvider } from './openai_provider';
import { getCredentials, refreshCredentialsIfNeeded } from '../credentials';
import { getConfig } from '../config/app_config';
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
      const appConfig = getConfig();

      try {
        switch (config.type) {
          case 'anthropic':
            let credentials = await getCredentials();
            credentials = await refreshCredentialsIfNeeded(credentials);
            provider = new AnthropicProvider(credentials, config.model || appConfig.modelAlias);
            break;
          // Add cases for other providers here
          case 'openai':
          const openaiApiKey = process.env.OPENAI_API_KEY;
          if (!openaiApiKey) {
            throw new Error('OpenAI API key not found in environment variables');
          }
          provider = new OpenAIProvider(openaiApiKey, config.model || appConfig.modelAlias);
      break; 
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