import { Command } from 'commander';
import fs from 'fs/promises';
import { getCredentials } from '../credentials';
import { createAnthropicClient } from '../anthropic-client';
import { resolveModel } from '../config';
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
import { formatOutput, writeOutput } from '../helpers/outputHelper';

export function createStreamCommand(): Command {
    const streamCommand = new Command('stream')
        .description('Stream a response from the LLM')
        .option('--model <model>', 'Model alias to use')
        .addOption(maxTokensOption)
        .addOption(temperatureOption)
        .addOption(topPOption)
        .addOption(topKOption)
        .addOption(systemOption)
        .addOption(fileOption)
        .addOption(outputOption)
        .addOption(formatOption)
        .allowExcessArguments(true)
        .action(async (options, command) => {
            try {
                const credentials = await getCredentials();
                const client = createAnthropicClient(credentials);

                const input = await getInput(options, command);
                if (!input) {
                    logError('No question provided. Please provide a question or use the --file option.');
                    return;
                }

                const messages = [{ role: 'user', content: input }];
                const globalOptions = command.optsWithGlobals();
                const resolvedModel = resolveModel(globalOptions.modelid, options.model || globalOptions.model);

                logInfo(`Using model: ${resolvedModel}`);

                const stream = client.messages.stream({
                    model: resolvedModel,
                    max_tokens: options.maxTokens,
                    temperature: options.temperature,
                    top_p: options.topP,
                    top_k: options.topK,
                    system: options.system,
                    messages: messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
                });

                logInfo('🤖:');
                let fullResponse = '';

                stream.on('text', (text) => {
                    process.stdout.write(text);
                    fullResponse += text;
                });

                await stream.finalMessage();
                console.log();

                if (options.output) {
                    const output = formatOutput({ content: [{ text: fullResponse }] }, options.format);
                    await writeOutput(output, options.output);
                }
            } catch (error) {
                if (error instanceof Error) {
                    logError(`An error occurred: ${error.message}`);
                }
                else {
                    logError(`An error occurred: ${error}`);
                }
            }
        });

    return streamCommand;
}

async function getInput(options: any, command: Command): Promise<string | null> {
    if (options.file) {
        try {
            return await fs.readFile(options.file, 'utf-8');
        } catch (error) {
            if (error instanceof Error) {
                logError(`Failed to read file: ${error.message}`);
            } else {
                logError(`Failed to read file: ${error}`);
            }
            return null;
        }
    } else {
        const input = command.args.join(' ');
        return input || null;
    }
}