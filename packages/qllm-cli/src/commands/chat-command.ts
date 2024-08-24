// src/cli/commands/chat-command.ts

import { Command } from 'commander';
import { getListProviderNames, getLLMProvider } from 'qllm-lib';
import kleur from 'kleur';
import { Chat } from '../chat/chat';

export const chatCommand = new Command('chat')
  .description('Start an interactive chat session with an LLM')
  .option('-p, --provider <provider>', 'LLM provider to use')
  .option('-m, --model <model>', 'Model to use')
  .option('--max-tokens <number>', 'Maximum number of tokens to generate', parseInt)
  .action(async (options) => {
    try {
      const providerName = "openai";
      const modelName = "gpt-4o-mini";
      const maxTokens = 1024*16;

      if (!providerName) {
        console.error(kleur.red('Error: No provider specified. Use --provider or set a default in the configuration.'));
        return;
      }

      const availableProviders = getListProviderNames();
      if (!availableProviders.includes(providerName)) {
        console.error(kleur.red(`Error: Invalid provider "${providerName}". Available providers: ${availableProviders.join(', ')}`));
        return;
      }

      const provider = await getLLMProvider(providerName);
      const models = await provider.listModels();

      if (!modelName) {
        console.error(kleur.red('Error: No model specified. Use --model or set a default in the configuration.'));
        return;
      }

      if (!models.some(m => m.id === modelName)) {
        console.error(kleur.red(`Error: Invalid model "${modelName}" for provider "${providerName}".`));
        console.log(kleur.yellow('Available models:'));
        models.forEach(m => console.log(`- ${m.id}`));
        return;
      }

      const chat = new Chat(providerName, modelName);
      await chat.start();

    } catch (error) {
      console.error(kleur.red('An error occurred while starting the chat:'), error);
    }
  });
