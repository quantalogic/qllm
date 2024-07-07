// src/commands/chat.ts

import { Command } from 'commander';
import prompts from 'prompts';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { cliOptions } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinner } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { configManager } from '../utils/configuration_manager';
import { ErrorManager } from '../utils/error_manager';
import { getModelProvider } from '../utils/get_model_provider';

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

        const maxTokens = configManager.getOption('defaultMaxTokens', options.maxTokens);

        const { providerName, modelId } = getModelProvider();

        const provider = await ProviderFactory.getProvider(providerName);

        logger.debug(`providerName: ${providerName}`);
        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        const messages: Message[] = [];

        logger.info('Starting chat session. Type "exit" to end the session.');

        // Prepare default options
        const llmOptions: LLMProviderOptions = {
          maxTokens: maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          model: modelId,
        };

        logger.debug(`providerName: ${providerName}`);

        displayOptions(llmOptions, 'chat');

        // Main chat loop
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

          const fullResponse = await handleStreamWithSpinner(provider, messages, llmOptions);

          // Display the response on the console
          const formattedResponse = `🤖 : ${fullResponse}`;
          console.log(formattedResponse);

          messages.push({ role: 'assistant', content: fullResponse });
        }
      } catch (error) {
        ErrorManager.handleError('ChatCommandError', error instanceof Error ? error.message : String(error));
      }
    });

  return chatCommand;
}

