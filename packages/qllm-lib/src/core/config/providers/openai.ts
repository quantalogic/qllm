
import { ProviderConfig } from '@qllm/types/src';

const openaiConfig: ProviderConfig = {
  name: 'openai',
  models: [
    { alias: 'gpt3', modelId: 'gpt-3.5-turbo' },
    { alias: 'gpt4', modelId: 'gpt-4' },
    { alias: 'gpt4-turbo', modelId: 'gpt-4-1106-preview' },
  ],
  defaultModel: 'gpt3',
};

export default openaiConfig;