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
import { resolveModelAlias } from '../config/model_aliases';
import { DEFAULT_CONFIG } from '../config/default_config';
import { ProviderName } from '../config/types';

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
        const modelAlias = parentOptions.model as string || config.defaultModelAlias;
        const providerName = (parentOptions.provider as string || config.defaultProvider || DEFAULT_CONFIG.defaultProvider) as ProviderName;
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