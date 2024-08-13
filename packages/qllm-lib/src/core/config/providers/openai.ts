
import { ProviderConfig } from '@qllm/types/src';

const openaiConfig: ProviderConfig = {
  name: 'openai',
  models: [
    { alias: 'gpt3', modelId: 'gpt-3.5-turbo', parameters:{} },
    { alias: 'gpt4', modelId: 'gpt-4', parameters:{} },
    { alias: 'gpt4-v', modelId: 'gpt-4', parameters:{} },
    { alias: 'gpt-4o-mini', modelId: 'gpt-4o-mini', parameters:{} },
    { alias: 'text-embedding-3-small', modelId: 'text-embedding-3-small', parameters:{} },
  ],
  defaultModel: 'gpt3',
};

export default openaiConfig;