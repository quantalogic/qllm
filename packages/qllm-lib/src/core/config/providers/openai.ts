
import { ProviderConfig } from '@qllm/types/src';

const openaiConfig: ProviderConfig = {
  name: 'openai',
  models: [
    { alias: 'gpt3', modelId: 'gpt-3.5-turbo', parameters:{} },
    { alias: 'gpt4', modelId: 'gpt-4', parameters:{} },
    { alias: 'gpt-4-vision-preview', modelId: 'gpt-4-vision-preview', parameters:{} },
    { alias: 'gpt-4o-mini', modelId: 'gpt-4o-mini', parameters:{} },
    { alias: 'gpt-4o', modelId: 'gpt-4o', parameters:{} },
    { alias: 'dall-e-3', modelId: 'dall-e-3', parameters:{} },
    { alias: 'dall-e-2', modelId: 'dall-e-2', parameters:{} },
    { alias: 'text-embedding-3-small', modelId: 'text-embedding-3-small', parameters:{} },
    { alias: 'text-embedding-ada-002', modelId: 'text-embedding-ada-002', parameters:{} },
  ],
  defaultModel: 'gpt3',
};

export default openaiConfig;