import { Command } from 'commander';
import prompts from 'prompts';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { maxTokensOption, temperatureOption, topPOption, topKOption, systemOption } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinner } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { mergeOptions } from '../utils/option_merging';
import { providerConfigDisplay } from '../utils/provider_config_display';
import { configManager } from '../utils/configuration_manager';

export function createChatCommand(): Command {
  const chatCommand = new Command('chat')
    .description('Start an interactive chat session with the LLM')
    .option('--provider <provider>', 'LLM provider to use')
    .addOption(maxTokensOption)
    .addOption(temperatureOption)
    .addOption(topPOption)
    .addOption(topKOption)
    .addOption(systemOption)
    .action(async (options, command) => {
      try {
        const globalOptions = command.parent.opts();
        const config = configManager.getConfig();
        const providerName = options.provider || globalOptions.provider || config.defaultProvider;
        const model = globalOptions.resolvedModel || config.modelAlias || "";

        const provider = await ProviderFactory.getProvider(providerName, model);

        const messages: Message[] = [];

        logger.info('Starting chat session. Type "exit" to end the session.');

        const defaultOptions: Partial<LLMProviderOptions> = {
          maxTokens: 256,
          temperature: 0.7,
          topP: 1,
          topK: 250,
        };

        const mergedOptions = mergeOptions(defaultOptions, options);

        providerConfigDisplay({ type: providerName, model });
        displayOptions(mergedOptions, 'chat');

        while (true) {
          const response = await prompts({
            type: 'text',
            name: 'input',
            message: 'You:',
          });

          if (response.input.toLowerCase() === 'exit') {
            logger.info('Chat session ended.');
            break;
          }

          messages.push({ role: 'user', content: response.input });

          logger.info('🤖:');
          const fullResponse = await handleStreamWithSpinner(provider, messages, mergedOptions);
          messages.push({ role: 'assistant', content: fullResponse });
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`An error occurred: ${error.message}`);
        } else {
          logger.error(`An error occurred: ${error}`);
        }
      }
    });

  return chatCommand;
}