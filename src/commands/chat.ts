import { Command } from 'commander';
import prompts from 'prompts';
import { getCredentials } from '../credentials';
import { createAnthropicClient } from '../anthropic-client';
import { resolveModel } from '../config';
import { logInfo, logError } from '../utils';
import { 
    maxTokensOption, 
    temperatureOption, 
    topPOption, 
    topKOption, 
    systemOption 
} from '../options';

export function createChatCommand(): Command {
    const chatCommand = new Command('chat')
        .description('Start an interactive chat session with the LLM')
        .addOption(maxTokensOption)
        .addOption(temperatureOption)
        .addOption(topPOption)
        .addOption(topKOption)
        .addOption(systemOption)
        .action(async (options, command) => {
            try {
                const credentials = await getCredentials();
                const client = createAnthropicClient(credentials);
                const messages: { role: string, content: string }[] = [];

                logInfo('Starting chat session. Type "exit" to end the session.');

                while (true) {
                    const response = await prompts({ type: 'text', name: 'input', message: 'You:' });

                    if (response.input.toLowerCase() === 'exit') {
                        logInfo('Chat session ended.');
                        break;
                    }

                    messages.push({ role: 'user', content: response.input });

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

                    messages.push({ role: 'assistant', content: fullResponse });
                }
            } catch (error) {
                logError(`An error occurred: ${error}`);
            }
        });

    return chatCommand;
}