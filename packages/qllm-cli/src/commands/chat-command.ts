// packages/qllm-cli/src/commands/chat-command.ts

import { Command } from 'commander';
import { getListProviderNames, getLLMProvider } from 'qllm-lib';
import kleur from 'kleur';
import { Chat } from '../chat/chat';
import { chatConfig } from '../chat/chat-config';
import { output } from '../utils/output';
import {DEFAULT_MODEL,DEFAULT_MAX_TOKENS,DEFAULT_PROVIDER, DEFAULT_TEMPERATURE } from '../constants'

export const chatCommand = new Command('chat')
  .description('Start an interactive chat session with an LLM')
  .option('-p, --provider <provider>', 'LLM provider to use')
  .option('-m, --model <model>', 'Model to use')
  .option('--max-tokens <number>', 'Maximum number of tokens to generate', parseInt)
  .option('--temperature <number>', 'Temperature for response generation', parseFloat)
  .option('--top-p <number>', 'Top P value for response generation', parseFloat)
  .option('--frequency-penalty <number>', 'Frequency penalty for response generation', parseFloat)
  .option('--presence-penalty <number>', 'Presence penalty for response generation', parseFloat)
  .option('--stop-sequence <sequence>', 'Stop sequence for response generation', (value, previous) => previous.concat([value]), [] as string[])
  .action(async (options) => {
    try {
      await chatConfig.initialize();

      const providerName = options.provider || chatConfig.getProvider() || 'openai';
      const modelName = options.model || chatConfig.getModel() || 'gpt-4o-mini';

      const availableProviders = getListProviderNames();
      if (!availableProviders.includes(providerName)) {
        output.error(`Invalid provider "${providerName}". Available providers: ${availableProviders.join(', ')}`);
        return;
      }

      const provider = await getLLMProvider(providerName);
      const models = await provider.listModels();

      if (!models.some(m => m.id === modelName)) {
        output.error(`Invalid model "${modelName}" for provider "${providerName}".`);
        output.info('Available models:');
        models.forEach(m => output.info(`- ${m.id}`));
        return;
      }

      const chat = new Chat(providerName, modelName);
      //await chat.initialize();

      // Set options from command line or config
      chat.setMaxTokens(options.maxTokens || chatConfig.getMaxTokens() || DEFAULT_MAX_TOKENS);
      chat.setTemperature(options.temperature || chatConfig.getTemperature() || DEFAULT_TEMPERATURE);

      await chat.start();
    } catch (error) {
      output.error('An error occurred while starting the chat:');
      console.error(error);
    }
  });