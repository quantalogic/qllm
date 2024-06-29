import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { getProviderConfig } from '../config/provider_config';
import { logger } from '../utils/logger';
import { maxTokensOption, temperatureOption, topPOption, topKOption, systemOption, fileOption, outputOption, formatOption } from '../options';
import { LLMProviderOptions, Message } from '../providers/types';
import { handleStreamWithSpinner } from '../helpers/stream_helper';
import { displayOptions } from '../utils/option_display';
import { mergeOptions } from '../utils/option_merging';


export function createStreamCommand(): Command {
  const streamCommand = new Command('stream')
    .description('Stream a response from the LLM')
    .option('--provider <provider>', 'LLM provider to use')
    .addOption(maxTokensOption)
    .addOption(temperatureOption)
    .addOption(topPOption)
    .addOption(topKOption)
    .addOption(systemOption)
    .addOption(fileOption)
    .addOption(outputOption)
    .addOption(formatOption)
    .action(async (options, command) => {
      try {
        const globalOptions = command.parent.opts();
        const providerConfig = getProviderConfig(options.provider || globalOptions.provider);
        providerConfig.model = globalOptions.resolvedModel;
        const provider = await ProviderFactory.createProvider(providerConfig);

        let input: string;
        if (options.file) {
          input = await fs.readFile(options.file, 'utf-8');
        } else {
          input = command.args.join(' ');
          if (!input) {
            logger.error('No input provided. Please provide input or use the --file option.');
            return;
          }
        }

        const messages: Message[] = [{ role: 'user', content: input }];


        const defaultOptions: Partial<LLMProviderOptions> = {
            maxTokens: 256,
            temperature: 0.7,
            topP: 1,
            topK: 250,
        };

       const mergedOptions = mergeOptions(defaultOptions, options);

        logger.info(`Using provider: ${providerConfig.type}`);
        logger.info(`Using model: ${providerConfig.model}`);

        const providerOptions: LLMProviderOptions = {
          maxTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
          system: mergedOptions.system,
        };

        displayOptions(providerOptions, 'stream');

        await handleStreamWithSpinner(provider, messages, providerOptions);

        if (options.output) {
          await fs.writeFile(options.output, input);
          logger.info(`Full response written to ${options.output}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`An error occurred: ${error.message}`);
        } else {
          logger.error(`An error occurred: ${error}`);
        }
      }
    });

  return streamCommand;
}
