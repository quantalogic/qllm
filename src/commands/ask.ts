// src/commands/ask.ts

import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { logger } from '../utils/logger';
import { cliOptions } from '../options';
import { formatOutput, writeOutput } from '../helpers/output_helper';
import { LLMProviderOptions, Message } from '../providers/types';
import { displayOptions } from '../utils/option_display';
import { configManager } from '../utils/configuration_manager';
import { withSpinner } from '../helpers/spinner_helper';
import { ErrorManager } from '../utils/error_manager';
import { getModelProvider } from '../utils/get_model_provider';

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
        const commandOptions = configManager.getCommandOptions('ask');
        const maxTokens = configManager.getOption('defaultMaxTokens', commandOptions.maxTokens);
        const { providerName, modelId } = getModelProvider();

        logger.debug(`providerName: ${providerName}`);
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
            ErrorManager.throwError('InputError', 'No question provided. Please provide a question or use the --file option.');
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

        displayOptions(llmOptions, 'ask');

        // Generate response with spinner
        const response = await withSpinner(
          () => provider.generateMessage(messages, llmOptions),
          'Generating response'
        );

        // Format and write output
        const output = formatOutput({ content: [{ text: response }] }, options.format);
        await writeOutput(output, options.output);
      } catch (error) {
        ErrorManager.handleError('AskCommandError', error instanceof Error ? error.message : String(error));
      }
    });

  return askCommand;
}

export default createAskCommand;