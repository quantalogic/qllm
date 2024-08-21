// packages/qllm-lib/src/providers/__tests__/index.spec.ts

import { ChatMessage } from '../../../types';
import { getProvider } from '../../index';
import { OpenAIProvider } from '..';

jest.mock('..');

describe('getProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an instance of OpenAIProvider for valid provider name', () => {
    const provider = getProvider('openai');
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should throw an error for an invalid provider name', () => {
    expect(() => getProvider('invalid')).toThrow('Provider "invalid" not found.');
  });

  it('it should give me a list of models', async () => {
    const provider = getProvider('openai');
    const models = await provider.listModels();
    console.log(models);
    expect(OpenAIProvider.prototype.listModels).toHaveBeenCalledTimes(1);
  });

  it('It should generate a chat completion', async () => {
    const provider = getProvider('openai');
    const userMessage: ChatMessage = {
      role: 'user',
      content: {
        type: 'text',
        data: {
          text: 'What is the capital of France?',
        },
      },
    };
    const messages: ChatMessage[] = [userMessage];

    const options = {
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    };
    await provider.generateChatCompletion({ messages, options });
    expect(OpenAIProvider.prototype.generateChatCompletion).toHaveBeenCalledTimes(1);
  });

  // Additional tests for error handling can be added here
});
