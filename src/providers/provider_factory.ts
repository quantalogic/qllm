import { LLMProvider } from './llm_provider';
import { AnthropicProvider } from './anthropic_provider';
import { OpenAIProvider } from './openai_provider';
import { ProviderName } from '../config/types';
import { logger } from '../utils/logger';
import { configManager } from '../utils/configuration_manager';

export interface ProviderConfig {
  type: ProviderName;
  model?: string;
}

export class ProviderFactory {
  private static instances: Map<string, LLMProvider> = new Map();

  static async createProvider(config: ProviderConfig): Promise<LLMProvider> {
    const key = `${config.type}`;

    const appConfig = configManager.getConfig();

    if (!this.instances.has(key)) {
      let provider: LLMProvider;


      if (config.model === undefined) {
        throw new Error('Model not found in configuration');
      }

      const model = config.model;

      try {
        switch (config.type) {
          case 'anthropic':
            const awsProfile = appConfig.awsProfile;
            const awsRegion = appConfig.awsRegion;
            provider = new AnthropicProvider(awsProfile, awsRegion, model);
            break;
          // Add cases for other providers here
          case 'openai':
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
              throw new Error('OpenAI API key not found in environment variables');
            }
            provider = new OpenAIProvider(openaiApiKey, model);
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