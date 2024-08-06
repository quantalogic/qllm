// src/commands/stream.ts

import { Command } from 'commander';
import fs from 'fs/promises';
import { cliOptions } from '../options';
import { configManager } from '@/common/utils/configuration_manager';
import { resolveModelAlias } from '@/core/config/model_aliases';
import { logger } from '@/common/utils/logger';
import { DEFAULT_APP_CONFIG } from '@/core/config/default_config';
import { ErrorManager } from '@/common/utils/error_manager';
import { ProviderFactory } from '@/core/providers/provider_factory';
import { LLMProviderOptions, Message } from '@/core/providers/types';
import { displayOptions } from '@/common/utils/option_display';
import { createStreamOutputHandler, handleStreamWithSpinnerAndOutput } from '@/helpers/stream_helper';
import { ProviderName } from '@/core/config/types';

export function createStreamCommand(): Command {
  const streamCommand = new Command('stream')
    .description('Stream a response from the LLM')
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .addOption(cliOptions.fileOption)
    .addOption(cliOptions.outputOption)
    .action(async (options, command) => {
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

        // Handle input from file or command line
        let input: string;
        if (options.file) {
          input = await fs.readFile(options.file, 'utf-8');
        } else {
          input = command.args.join(' ');
          if (!input) {
            ErrorManager.throwError('InputError', 'No input provided. Please provide input or use the --file option.');
          }
        }

        const messages: Message[] = [{ role: 'user', content: input }];

        logger.debug(`providerName: ${providerName}`);

        // Prepare provider options
        const llmOptions: LLMProviderOptions = {
          maxTokens: maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          model: modelId,
        };

        displayOptions(llmOptions, 'stream');

        const outputHandler = await createStreamOutputHandler(options.output);

        try {
          const fullResponse = await handleStreamWithSpinnerAndOutput(
            provider,
            messages,
            llmOptions,
            outputHandler
          );

          console.log(fullResponse);

          if (options.output) {
            logger.info(`Full response written to ${options.output}`);
          }
        } catch (error) {
          ErrorManager.handleError('StreamingError', error instanceof Error ? error.message : String(error));
        } finally {
          await outputHandler.finalize();
        }
      } catch (error) {
        ErrorManager.handleError('CommandError', error instanceof Error ? error.message : String(error));
      }
    });

  return streamCommand;
}

export default createStreamCommand;