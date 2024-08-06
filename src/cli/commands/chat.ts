// src/commands/chat.ts

import { Command } from 'commander';
import prompts from 'prompts';
import { cliOptions } from '../options';
import { configManager } from '@/common/utils/configuration_manager';
import { logger } from '@/common/utils/logger';
import { resolveModelAlias } from '@/core/config/model_aliases';
import { ErrorManager } from '@/common/utils/error_manager';
import { DEFAULT_APP_CONFIG } from '@/core/config/default_config';
import { ProviderName } from '@/core/config/types';
import { ProviderFactory } from '@/core/providers/provider_factory';
import { LLMProviderOptions, Message } from '@/core/providers/types';
import { displayOptions } from '@/common/utils/option_display';
import { handleStreamWithSpinner } from '@/helpers/stream_helper';

export function createChatCommand(): Command {
  const chatCommand = new Command('chat')
    .description('Start an interactive chat session with the LLM')
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .action(async (options,command) => {
      try {
 
        const config = configManager.getConfig();
        const parentOptions = command.parent.opts();  

        if(parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if(parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        const modelAlias = parentOptions.model as string || config.defaultModelAlias;
        const providerName = (parentOptions.provider as string || config.defaultProvider || DEFAULT_APP_CONFIG.defaultProvider) as ProviderName;
        // Resolve model alias to model id
        logger.debug(`modelAlias: ${modelAlias}`);
        logger.debug(`providerName: ${providerName}`);
        logger.debug(`defaultProviderName: ${config.defaultProvider}`);
        const modelId = parentOptions.modelId || modelAlias ? resolveModelAlias(providerName,modelAlias) : config.defaultModelId;

        if(!modelId){
          ErrorManager.throwError('ModelError', `Model id ${modelId} not found`);
        }
        
        const maxTokens = options.maxTokens ||config.defaultMaxTokens;

        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        const provider = await ProviderFactory.getProvider(providerName);

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

          const fullResponse = await handleStreamWithSpinner(
            provider,
            messages,
            llmOptions
          );

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

export default createChatCommand;