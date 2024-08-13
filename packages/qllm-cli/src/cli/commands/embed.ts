// src/commands/embed.ts
import { Command } from 'commander';
import fs from 'fs/promises';
import { cliOptions } from '../options';
import { logger } from '@qllm-lib/common/utils/logger';
import { ErrorHandler } from '@qllm-lib/common/utils/error_handler';
import { QllmError } from '@qllm-lib/common/errors/custom_errors';
import { ProviderFactory } from '@qllm-lib/core/providers/provider_factory';
import { configManager } from '@qllm-lib/config/configuration_manager';
import { ProviderName } from "@qllm/types/src";
import { withSpinner } from '@/helpers/spinner_helper';
import { formatOutput, writeOutput } from '@/helpers/output_helper';

export function createEmbedCommand(): Command {
  const embedCommand = new Command('embed')
    .description('Embed a file (e.g., image) using the specified provider and model')
    .addOption(cliOptions.fileOption)
    .addOption(cliOptions.outputOption)
    .addOption(cliOptions.formatOption)
    .action(async (options, command) => {
      try {
        const config = configManager.getConfig();
        const parentOptions = command.parent.opts();

        if (parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if (parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        const providerName = (parentOptions.provider as string || config.defaultProvider) as ProviderName;
        const modelId = parentOptions.modelId || config.defaultModelId;

        if (!options.file) {
          throw new QllmError('No file provided. Please use the --file option to specify a file to embed.');
        }

        const provider = await ProviderFactory.getProvider(providerName);

        if (!provider.generateEmbedding) {
          throw new QllmError(`The ${providerName} provider does not support embedding generation.`);
        }

        const fileContent = await fs.readFile(options.file);

        const embedding = await withSpinner(
          () => provider.generateEmbedding!(fileContent, modelId),
          'Generating embedding'
        );

        const output = formatOutput({ content: [{ embedding }] }, options.format);
        await writeOutput(output, options.output);
      } catch (error) {
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