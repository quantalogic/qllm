// src/commands/embed.ts

import { Command } from 'commander';
import fs from 'fs/promises';
import { cliOptions } from '../options';
import { logger } from '@qllm/lib/common/utils/logger';
import { ErrorHandler } from '@qllm/lib/common/utils/error_handler';
import { QllmError } from '@qllm/lib/common/errors/custom_errors';
import { ProviderFactory } from '@qllm/lib/core/providers/provider_factory';
import { configManager } from '@qllm/lib/config/configuration_manager';
import { ProviderName } from '@qllm/types/src';
import { withSpinner } from '../../helpers/spinner_helper';
import { formatOutput, writeOutput } from '../../helpers/output_helper';
import { resolveModelAlias } from '@qllm/lib/config/model_aliases';

/**
 * Creates and returns the 'embed' command for the CLI application.
 * This command allows users to generate embeddings for text or images using a specified provider and model.
 *
 * @returns {Command} The configured 'embed' command
 */
export function createEmbedCommand(): Command {
  const embedCommand = new Command('embed')
    .description('Embed text or image using the specified provider and model')
    .addOption(cliOptions.fileOption)
    .addOption(cliOptions.outputOption)
    .addOption(cliOptions.formatOption)
    .option('-t, --text <text>', 'Text to embed')
    .option('-i, --image <path>', 'Path to image file to embed')
    .option('-l, --link <url>', 'URL of the image to embed')
    .action(async (options, command) => {
      try {
        // Retrieve configuration and parent options
        const config = configManager.getConfig();
        const parentOptions = command.parent.opts();

        // Set AWS profile and region if provided
        if (parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if (parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        // Resolve provider and model
        const providerName = ((parentOptions.provider as string) ||
          config.defaultProvider) as ProviderName;
        const modelAlias = (parentOptions.model as string) || config.defaultModelAlias;
        const modelId =
          parentOptions.modelId || modelAlias
            ? resolveModelAlias(providerName, modelAlias)
            : config.defaultModelId;

        // Validate model specification
        if (!modelId) {
          throw new QllmError(
            'No model specified. Please provide a model using --model or --modelid option.',
          );
        }

        // Validate input provision
        if (!options.file && !options.text && !options.image && !options.link) {
          throw new QllmError(
            'No input provided. Please use --file, --text, or --image option to provide input to embed.',
          );
        }

        // Get the provider
        const provider = await ProviderFactory.getProvider(providerName);

        // Check if the provider supports embedding generation
        if (!provider.generateEmbedding) {
          throw new QllmError(
            `The ${providerName} provider does not support embedding generation.`,
          );
        }

        // Determine input type and prepare input
        let input: string | Buffer | URL;
        let isImage = false;

        if (options.link) {
          input = new URL(options.link);
          isImage = true;
        } else if (options.image) {
          input = await fs.readFile(options.image);
          isImage = true;
        } else if (options.file) {
          input = await fs.readFile(options.file, 'utf-8');
        } else if (options.text) {
          input = options.text;
        } else {
          throw new QllmError(
            'No input provided. Please use --file, --text, --image, or --link option to provide input to embed.',
          );
        }

        logger.debug(`Generating embedding with provider: ${providerName}, model: ${modelId}`);

        // Generate embedding with spinner
        const embedding = await withSpinner(
          async () => provider.generateEmbedding!(input, modelId, isImage),
          'Generating embedding',
        );

        // Format and write output
        const output = formatOutput({ content: [{ embedding }] }, options.format);
        await writeOutput(output, options.output);
      } catch (error) {
        // Handle errors
        if (error instanceof QllmError) {
          ErrorHandler.handle(error);
        } else {
          ErrorHandler.handle(new QllmError(`Unexpected error in embed command: ${error}`));
        }
        process.exit(1);
      }
    });

  return embedCommand;
}

export default createEmbedCommand;
