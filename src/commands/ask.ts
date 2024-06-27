import { Command } from 'commander';
import fs from 'fs/promises';
import { createMessage } from '../helpers/messageHelper';
import { formatOutput, writeOutput } from '../helpers/outputHelper';
import { getCredentials } from '../credentials';
import { createAnthropicClient } from '../anthropic-client';
import { resolveModel } from '../config';
import { logInfo, logError } from '../utils';
import { maxTokensOption, temperatureOption, topPOption, topKOption, systemOption, fileOption, outputOption, formatOption } from '../options';

export function createAskCommand(): Command {
    const askCommand = new Command('ask')
        .description('Ask a question to the LLM')
        .option('--model <model>', 'Model alias to use')
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
                const credentials = await getCredentials();
                const client = createAnthropicClient(credentials);
                let input;
                if (options.file) {
                    input = await fs.readFile(options.file, 'utf-8');
                } else {
                    input = command.args.join(' ');
                    if (!input) {
                        logError('No question provided. Please provide a question or use the --file option.');
                        return;
                    }
                }
                const messages = [{ role: 'user', content: input }];
                const globalOptions = command.optsWithGlobals();
                const resolvedModel = resolveModel(globalOptions.modelid, options.model || globalOptions.model);
                logInfo(`Using model: ${resolvedModel}`);
                const message = await createMessage(client, { ...options, ...globalOptions, model: resolvedModel }, messages);
                const output = formatOutput(message, options.format);
                await writeOutput(output, options.output);
            } catch (error) {
                logError(`An error occurred: ${error}`);
            }
        });
    return askCommand;
}
