import { LLMProvider, LLMProviderOptions } from './llm_provider';
import { ProviderName } from '../config/types';
import { logger } from '../utils/logger';
import { configManager } from '../utils/configuration_manager';
import { getDefaultModel } from '../config/model_aliases';
import { providerRegistry } from './provider_registry';

export class ProviderFactory {
  static async getProvider(providerName: ProviderName): Promise<LLMProvider> {
    const config = configManager.getConfig();
    const modelId = config.modelId || getDefaultModel(providerName);

    const options: LLMProviderOptions = {
      model: modelId,
      awsProfile: config.awsProfile,
      awsRegion: config.awsRegion,
    };

    if (!providerRegistry.hasProvider(providerName)) {
      throw new Error(`Unsupported provider type: ${providerName}`);
    }

    try {
      const provider = providerRegistry.getProvider(providerName, options);
      logger.debug(`Created provider instance: ${providerName}`);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider: ${error}`);
      throw error;
    }
  }
}
