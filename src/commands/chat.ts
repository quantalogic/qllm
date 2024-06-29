import { Command } from 'commander';
import prompts from 'prompts';
import { ProviderFactory } from '../providers/provider_factory';
import { getProviderConfig } from '../config/provider_config';
import { logInfo, logError } from '../utils';
import { 
  maxTokensOption, 
  temperatureOption, 
  topPOption, 
  topKOption, 
  systemOption 
} from '../options';
import { createStreamOutputHandler } from '../helpers/output_helper';
import { LLMProviderOptions, Message } from '../providers/types';

export function createChatCommand(): Command {
  const chatCommand = new Command('chat')
    .description('Start an interactive chat session with the LLM')
    .option('--provider <name>', 'LLM provider to use')
    .addOption(maxTokensOption)
    .addOption(temperatureOption)
    .addOption(topPOption)
    .addOption(topKOption)
    .addOption(systemOption)
    .action(async (options) => {
      try {
        const providerConfig = getProviderConfig(options.provider);
        const provider = await ProviderFactory.createProvider(providerConfig);

        const messages: Message[] = [];
        if (options.system) {
          messages.push({ role: 'system', content: options.system });
        }

        logInfo('Starting chat session. Type "exit" to end the session.');

        while (true) {
          const response = await prompts({
            type: 'text',
            name: 'input',
            message: 'You:',
          });

          if (response.input.toLowerCase() === 'exit') {
            logInfo('Chat session ended.');
            break;
          }

          messages.push({ role: 'user', content: response.input });

          const providerOptions: LLMProviderOptions = {
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            topP: options.topP,
            topK: options.topK,
          };

          logInfo(`Using provider: ${providerConfig.type}`);
          logInfo('🤖:');

          const outputHandler = await createStreamOutputHandler();

          try {
            for await (const chunk of provider.streamMessage(messages, providerOptions)) {
              await outputHandler.handleChunk(chunk);
            }
          } catch (error) {
            logError(`Error during streaming: ${error}`);
            continue;
          }

          await outputHandler.finalize();
          console.log(); // Add a newline after the response

          const fullResponse = outputHandler.getFullResponse();
          messages.push({ role: 'assistant', content: fullResponse });
        }
      } catch (error) {
        if (error instanceof Error) {
          logError(`An error occurred: ${error.message}`);
        } else {
          logError(`An error occurred: ${error}`);
        }
      }
    });

  return chatCommand;
}
