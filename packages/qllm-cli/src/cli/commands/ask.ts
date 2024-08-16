// src/commands/ask.ts

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { cliOptions } from '../options';
import { logger } from '@qllm-lib/common/utils/logger';
import { ErrorManager } from '@qllm-lib/common/utils/error_manager';
import { resolveModelAlias } from '@qllm-lib/config/model_aliases';
import { ProviderFactory } from '@qllm-lib/core/providers/provider_factory';
import { configManager } from '@qllm-lib/config/configuration_manager';
import { DEFAULT_APP_CONFIG } from '@qllm-lib/config/default_config';
import { ProviderName } from "@qllm/types/src";
import { displayOptions } from '@qllm-lib/common/utils/option_display';
import { withSpinner } from '@/helpers/spinner_helper';
import { formatOutput, writeOutput } from '@/helpers/output_helper';
import { LLMProviderOptions, Message } from '@qllm/types/src';
import { z } from 'zod';
import { ErrorHandler } from '@qllm-lib/common/utils/error_handler';
import { QllmError } from '@qllm-lib/common/errors/custom_errors';
import {ToolsArraySchema} from "@qllm/types/src"

/**
 * Creates and returns the 'ask' command for the CLI application.
 * This command allows users to ask questions to a Language Learning Model (LLM).
 * 
 * @returns {Command} The configured 'ask' command
 */
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
    .addOption(cliOptions.toolsOption)
    .addOption(cliOptions.imageOption)
    .addOption(cliOptions.imageLinkOption)
    .action(async (options, command) => {
      try {
        // Retrieve configuration
        const config = configManager.getConfig();
        const parentOptions = command.parent.opts();  
        
        // Set AWS profile and region if provided
        if(parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if(parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        // Resolve model and provider
        const modelAlias = parentOptions.model as string || config.defaultModelAlias;
        const providerName = (parentOptions.provider as string || config.defaultProvider || DEFAULT_APP_CONFIG.defaultProvider) as ProviderName;
        
        // Log debug information
        logger.debug(`modelAlias: ${modelAlias}`);
        logger.debug(`providerName: ${providerName}`);
        logger.debug(`defaultProviderName: ${config.defaultProvider}`);
        
        // Resolve model alias to model id
        const modelId = parentOptions.modelId || modelAlias ? resolveModelAlias(providerName,modelAlias) : config.defaultModelId;

        if(!modelId){
          ErrorManager.throwError('ModelError', `Model id ${modelId} not found`);
        }
        
        const maxTokens = options.maxTokens ||config.defaultMaxTokens;

        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        // Get the provider
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

        // Prepare messages
        const messages: Message[] = [{ role: 'user', content: input }];

        logger.debug(`providerName: ${providerName}`);

        // Parse tools if provided
        let tools: z.infer<typeof ToolsArraySchema> | undefined;
        if (options.tools) {
          try {
            tools = ToolsArraySchema.parse(JSON.parse(options.tools));
          } catch (error) {
            ErrorManager.throwError('ToolsError', 'Invalid tools format. Please provide a valid JSON array of tools.');
          }
        }

        // Prepare provider options
        const llmOptions: LLMProviderOptions = {
          maxTokens: maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          model: modelId,
          tools: tools
        };

        displayOptions(llmOptions, 'ask');

        // Handle image option
        if (options.image) {
          const imagePath = path.resolve(options.image);
          llmOptions.imagePath = imagePath;
        }
        
        // Generate response with spinner
        const response = await withSpinner(
          () => provider.generateMessage(messages, llmOptions),
          'Generating response'
        );

        // Format and write output
        const output = formatOutput({ content: [{ text: response }] }, options.format);
        await writeOutput(output, options.output);
      } catch (error) {
        // Handle errors
        if (error instanceof QllmError) {
          ErrorHandler.handle(error);
        } else {
          ErrorHandler.handle(new QllmError(`Unexpected error in ask command: ${error}`));
        }
        process.exit(1);
      }
    });

  return askCommand;
}

export default createAskCommand;