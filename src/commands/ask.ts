import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { getProviderConfig } from '../config/provider_config';
import { logInfo, logError } from '../utils';
import { maxTokensOption, temperatureOption, topPOption, topKOption, systemOption, fileOption, outputOption, formatOption } from '../options';
import { formatOutput, writeOutput } from '../helpers/output_helper';
import { Message } from '../providers/types';

export function createAskCommand(): Command {
  const askCommand = new Command('ask')
    .description('Ask a question to the LLM')
    .option('--provider <name>', 'LLM provider to use')
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
        const providerConfig = getProviderConfig(options.provider);
        const provider = await ProviderFactory.createProvider(providerConfig);

        let input: string;
        if (options.file) {
          input = await fs.readFile(options.file, 'utf-8');
        } else {
          input = command.args.join(' ');
        }

        if (!input) {
          logError('No question provided. Please provide a question or use the --file option.');
          return;
        }

        const messages: Message[] = [{ role: 'user', content: input }];
        
        logInfo(`🤖 Using provider: ${providerConfig.type}`);
        logInfo(`🤖 Using model ${options.model}`);


        const response = await provider.generateMessage(messages, {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          system: options.system,
        });

        const output = formatOutput({ content: [{ text: response }] }, options.format);
        await writeOutput(output, options.output);
      } catch (error) {
        logError(`An error occurred: ${error}`);
      }
    });

  return askCommand;
}
