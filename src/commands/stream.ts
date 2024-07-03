import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { cliOptions } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinnerAndOutput, createStreamOutputHandler } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { mergeOptions } from '../utils/option_merging';
import { configManager } from '../utils/configuration_manager';
import { ErrorManager } from '../utils/error_manager';

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
        const globalOptions = command.parent?.opts();
        const config = configManager.getConfig();
        const providerName = options.provider || globalOptions.provider || config.defaultProvider;
        const model = options.modelId || globalOptions.modelId || config.modelId || "";

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

        const defaultOptions: Partial<LLMProviderOptions> = {
          maxTokens: 256,
          temperature: 0.7,
          topP: 1,
          topK: 250,
          model: model,
        };

        const mergedOptions = mergeOptions(defaultOptions, options);
        const providerOptions: LLMProviderOptions = {
          maxTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
          system: mergedOptions.system,
          model: model,
        };

        displayOptions(providerOptions, 'stream');

        const outputHandler = await createStreamOutputHandler(options.output);

        try {
          const fullResponse = await handleStreamWithSpinnerAndOutput(
            provider,
            messages,
            providerOptions,
            outputHandler
          );

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