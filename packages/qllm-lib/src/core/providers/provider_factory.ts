import { LLMProvider } from './llm_provider';
import { LLMProviderOptions } from 'qllm-types';
import { ProviderName } from 'qllm-types';
import { providerRegistry } from './provider_registry';
import { logger } from '../../common/utils/logger';
import { ErrorManager } from '../../common/utils/error_manager';
import { PluginManager } from '../../core/plugin_manager';

//import { ErrorHandler } from '../../common/utils/error_handler';
//import { ProviderError } from '../../common/errors/custom_errors';

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
      //ErrorHandler.throw(ProviderError, `Failed to create provider: ${error}`);
      throw error;
    }
  }

  static registerProviderPlugin(name: string, initFunction: () => void): void {
    this.pluginManager.registerPlugin(name, initFunction);
  }
}
