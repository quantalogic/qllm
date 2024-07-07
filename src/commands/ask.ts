import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { Spinner } from '../utils/spinner';
import { cliOptions } from '../options';
import { formatOutput, writeOutput } from '../helpers/output_helper';
import { LLMProviderOptions, Message } from '../providers/types';
import { displayOptions } from '../utils/option_display';
import { mergeOptions } from '../utils/option_merging';
import { configManager } from '../utils/configuration_manager';
import { withSpinner } from '../helpers/spinner_helper';

export function createAskCommand(): Command {
  const askCommand = new Command('ask')
    .description('Ask a question to the LLM')
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .addOption(cliOptions.fileOption)
    .addOption(cliOptions.outputOption)
    .addOption(cliOptions.formatOption)
    .action(async (options, command) => {
      try {
        const globalOptions = command.parent?.opts();
        const config = configManager.getConfig();
        const providerName = options.provider || globalOptions.provider || config.defaultProvider;
        const model = options.modelId || globalOptions.modelId || config.defaultModelId || "";

        const provider = await ProviderFactory.getProvider(providerName);

        let input: string;
        if (options.file) {
          input = await fs.readFile(options.file, 'utf-8');
        } else {
          input = command.args.join(' ');
          if (!input) {
            logger.error('No question provided. Please provide a question or use the --file option.');
            return;
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

        displayOptions(providerOptions, 'ask');

        const response = await withSpinner(
          () => provider.generateMessage(messages, providerOptions),
          'Generating response'
        );

        const output = formatOutput({ content: [{ text: response }] }, options.format);
        await writeOutput(output, options.output);

      } catch (error) {
        if (error instanceof Error) {
          logger.error(`An error occurred: ${error.message}`);
        } else {
          logger.error(`An error occurred: ${error}`);
        }
      }
    });

  return askCommand;
}