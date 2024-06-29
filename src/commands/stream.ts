import { Command } from 'commander';
import fs from 'fs/promises';
import { ProviderFactory } from '../providers/provider_factory';
import { getProviderConfig } from '../config/provider_config';
import { logInfo, logError } from '../utils';
import { 
  maxTokensOption, 
  temperatureOption, 
  topPOption, 
  topKOption, 
  systemOption, 
  fileOption, 
  outputOption, 
  formatOption 
} from '../options';
import { createStreamOutputHandler } from '../helpers/output_helper';
import { LLMProviderOptions, Message } from '../providers/types';
import { log } from 'console';

export function createStreamCommand(): Command {
  const streamCommand = new Command('stream')
    .description('Stream a response from the LLM')
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
          logError('No input provided. Please provide input or use the --file option.');
          return;
        }

        const messages: Message[] = [{ role: 'user', content: input }];
        
        logInfo(`Using provider: ${providerConfig.type}`);

        const providerOptions: LLMProviderOptions = {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          system: options.system,
        };

        const outputHandler = await createStreamOutputHandler(options.output);

        logInfo('🤖 Streaming response ...');
        for await (const chunk of provider.streamMessage(messages, providerOptions)) {
          await outputHandler.handleChunk(chunk);
        }

        await outputHandler.finalize();
        
        const fullResponse = outputHandler.getFullResponse();
        logInfo('\n🤖 Stream completed.');

        if (options.output) {
          logInfo(`Full response written to ${options.output}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logError(`An error occurred: ${error.message}`);
        } else {
          logError(`An error occurred: ${error}`);
        }
      }
    });

  return streamCommand;
}
