import { LLMProvider } from './llm_provider';
import { AnthropicProvider } from './anthropic_provider';
import { OpenAIProvider } from './openai_provider';
import { ProviderName } from '../config/types';
import { logger } from '../utils/logger';
import { configManager } from '../utils/configuration_manager';
import { getDefaultModel } from '../config/model_aliases';

export class ProviderFactory {
  private static instances: Map<string, LLMProvider> = new Map();

  static async getProvider(providerName: ProviderName): Promise<LLMProvider> {
    const config = configManager.getConfig();
    const key = `${providerName}-${config.modelId || config.modelAlias || 'default'}`;

    if (!this.instances.has(key)) {
      let provider: LLMProvider;
      const modelId = config.modelId || getDefaultModel(providerName);

      try {
        switch (providerName) {
          case 'anthropic':
            provider = new AnthropicProvider(config.awsProfile, config.awsRegion, modelId);
            break;
          case 'openai':
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
              throw new Error('OpenAI API key not found in environment variables');
            }
            provider = new OpenAIProvider(openaiApiKey, modelId);
            break;
          default:
            throw new Error(`Unsupported provider type: ${providerName}`);
        }
        this.instances.set(key, provider);
        logger.debug(`Created new provider instance: ${providerName}`);
      } catch (error) {
        logger.error(`Failed to create provider: ${error}`);
        throw error;
      }
    } else {
      logger.debug(`Reusing existing provider instance: ${providerName}`);
    }

    return this.instances.get(key)!;
  }

  static clearProviders(): void {
    this.instances.clear();
    logger.debug('Cleared all provider instances');
  }
}