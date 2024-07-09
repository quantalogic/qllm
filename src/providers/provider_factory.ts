import { LLMProvider, LLMProviderOptions } from './llm_provider';
import { ProviderName } from '../config/types';
import { logger } from '../utils/logger';
import { getDefaultModel } from '../config/model_aliases';
import { providerRegistry } from './provider_registry';
import { PluginManager } from '../utils/plugin_manager';
import { ErrorManager } from '../utils/error_manager';

export class ProviderFactory {
  private static pluginManager = new PluginManager();

  static async getProvider(providerName: ProviderName): Promise<LLMProvider> {


    const options: LLMProviderOptions = {
      model: '',
      awsProfile: process.env.AWS_PROFILE,
      awsRegion: process.env.AWS_REGION,
    };

    if (!providerRegistry.hasProvider(providerName)) {
      await this.pluginManager.loadPlugin(providerName);
    }

    try {
      const provider = providerRegistry.getProvider(providerName, options);
      logger.debug(`Created provider instance: ${providerName}`);
      return provider;
    } catch (error) {
      ErrorManager.handleError('ProviderCreationError', `Failed to create provider: ${error}`);
      throw error;
    }
  }

  static registerProviderPlugin(name: string, initFunction: () => void): void {
    this.pluginManager.registerPlugin(name, initFunction);
  }
}