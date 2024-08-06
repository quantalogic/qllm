// src/commands/ask.ts

import { Command } from 'commander';
import fs from 'fs/promises';
import { cliOptions } from '../options';
import { logger } from '@/common/utils/logger';
import { ErrorManager } from '@/common/utils/error_manager';
import { resolveModelAlias } from '@/core/config/model_aliases';
import { ProviderFactory } from '@/core/providers/provider_factory';
import { configManager } from '@/common/utils/configuration_manager';
import { DEFAULT_APP_CONFIG } from '@/core/config/default_config';
import { ProviderName } from '@/core/config/types';
import { displayOptions } from '@/common/utils/option_display';
import { withSpinner } from '@/helpers/spinner_helper';
import { formatOutput, writeOutput } from '@/helpers/output_helper';
import { LLMProviderOptions, Message } from '@/core/providers/types';

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