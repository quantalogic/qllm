import { Command } from 'commander';
import prompts from 'prompts';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { cliOptions } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinner } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { mergeOptions } from '../utils/option_merging';
import { configManager } from '../utils/configuration_manager';

export function createChatCommand(): Command {
  const chatCommand = new Command('chat')
    .description('Start an interactive chat session with the LLM')
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .action(async (options, command) => {
      try {
        const globalOptions = command.parent?.opts();
        const config = configManager.getConfig();
        const providerName = options.provider || globalOptions.provider || config.defaultProvider;
        const model = options.modelId || globalOptions.modelId || config.modelId || "";


        const provider = await ProviderFactory.getProvider(providerName);

        const messages: Message[] = [];
        logger.info('Starting chat session. Type "exit" to end the session.');

        const defaultOptions: Partial<LLMProviderOptions> = {
          maxTokens: 256,
          temperature: 0.7,
          topP: 1,
          topK: 250,
          model: model,
        };

        const mergedOptions = mergeOptions(defaultOptions, options);

        logger.debug(`providerName:  ${providerName}`);

        const providerOptions: LLMProviderOptions = {
          maxTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
          system: mergedOptions.system,
          model: model,
        };

        displayOptions(providerOptions, 'chat');

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
          const fullResponse = await handleStreamWithSpinner(provider, messages, providerOptions);
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