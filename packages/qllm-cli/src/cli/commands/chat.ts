// src/commands/chat.ts

import { Command } from 'commander';
import prompts from 'prompts';
import { cliOptions } from '../options';
import { logger } from '@qllm-lib/common/utils/logger';
import { ErrorManager } from '@qllm-lib/common/utils/error_manager';
import { resolveModelAlias } from '@qllm-lib/config/model_aliases';
import { ProviderFactory } from '@qllm-lib/core/providers/provider_factory';
import { configManager } from '@qllm-lib/config/configuration_manager';
import { DEFAULT_APP_CONFIG } from '@qllm-lib/config/default_config';
import { ProviderName } from '@qllm/types/src';
import { displayOptions } from '@qllm-lib/common/utils/option_display';
import { LLMProviderOptions, Message } from '@qllm/types/src';
import { handleStreamWithSpinner } from '@qllm-lib/common/utils/stream_helper';
import { Spinner } from '../../helpers/spinner';
import { ErrorHandler } from '@qllm-lib/common/utils/error_handler';
import { QllmError } from '@qllm-lib/common/errors/custom_errors';

/**
 * Creates and returns the 'chat' command for the CLI application.
 * This command initiates an interactive chat session with a Language Learning Model (LLM).
 *
 * @returns {Command} The configured 'chat' command
 */
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
        // Retrieve configuration
        const config = configManager.getConfig();
        const parentOptions = command.parent.opts();

        // Set AWS profile and region if provided
        if (parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if (parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        // Resolve model and provider
        const modelAlias = (parentOptions.model as string) || config.defaultModelAlias;
        const providerName = ((parentOptions.provider as string) ||
          config.defaultProvider ||
          DEFAULT_APP_CONFIG.defaultProvider) as ProviderName;

        // Log debug information
        logger.debug(`modelAlias: ${modelAlias}`);
        logger.debug(`providerName: ${providerName}`);
        logger.debug(`defaultProviderName: ${config.defaultProvider}`);

        // Resolve model alias to model id
        const modelId =
          parentOptions.modelId || modelAlias
            ? resolveModelAlias(providerName, modelAlias)
            : config.defaultModelId;

        if (!modelId) {
          ErrorManager.throwError('ModelError', `Model id ${modelId} not found`);
        }

        const maxTokens = options.maxTokens || config.defaultMaxTokens;

        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        // Get the provider
        const provider = await ProviderFactory.getProvider(providerName);

        // Initialize messages array for the chat session
        const messages: Message[] = [];

        logger.info('Starting chat session. Type "exit" to end the session.');

        // Prepare LLM options
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
          // Prompt user for input
          const response = await prompts({
            type: 'text',
            name: 'input',
            message: 'You:',
          });

          // Check if user wants to exit
          if (response.input.toLowerCase() === 'exit') {
            logger.info('Chat session ended.');
            break;
          }

          // Add user message to the conversation
          messages.push({ role: 'user', content: response.input });

          // Generate and display AI response
          const fullResponse = await handleStreamWithSpinner(
            provider,
            messages,
            llmOptions,
            new Spinner('Generating response...'),
          );

          // Display the response on the console
          const formattedResponse = `🤖 : ${fullResponse}`;
          console.log(formattedResponse);

          // Add AI response to the conversation
          messages.push({ role: 'assistant', content: fullResponse });
        }
      } catch (error) {
        // Handle errors
        if (error instanceof QllmError) {
          ErrorHandler.handle(error);
        } else {
          ErrorHandler.handle(new QllmError(`Unexpected error in chat command: ${error}`));
        }
        process.exit(1);
      }
    });

  return chatCommand;
}

export default createChatCommand;
