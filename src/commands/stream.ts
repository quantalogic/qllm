// src/commands/stream.ts

import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { cliOptions } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinnerAndOutput, createStreamOutputHandler } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { configManager } from '../utils/configuration_manager';
import { ErrorManager } from '../utils/error_manager';
import { getModelProvider } from '../utils/get_model_provider';

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

        const maxTokens = configManager.getOption('defaultMaxTokens', options.maxTokens);

        const { providerName, modelId } = getModelProvider();

        logger.debug(`providerName: ${providerName}`);
        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        const provider = await ProviderFactory.getProvider(providerName);

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

