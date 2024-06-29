import { Command } from 'commander';
import prompts from 'prompts';
import { ProviderFactory } from '../providers/provider_factory';
import { getProviderConfig } from '../config/provider_config';
import { logger } from '../utils/logger';
import { maxTokensOption, temperatureOption, topPOption, topKOption, systemOption } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinner } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';

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
        const providerConfig = getProviderConfig(options.provider || globalOptions.provider);
        providerConfig.model = globalOptions.resolvedModel;
        const provider = await ProviderFactory.createProvider(providerConfig);

        const messages: Message[] = [];
        if (options.system) {
          messages.push({ role: 'system', content: options.system });
        }

        logger.info('Starting chat session. Type "exit" to end the session.');

        displayOptions(options, 'chat');

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

          const providerOptions: LLMProviderOptions = {
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            topP: options.topP,
            topK: options.topK,
            system: options.system,
          };

          logger.info(`Using provider: ${providerConfig.type}`);
          logger.info(`Using model: ${providerConfig.model}`);
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
