import { ProviderConfig } from '@qllm/types/src';

const mistralConfig: ProviderConfig = {
  name: 'openai',
  models: [{ alias: 'mistral', modelId: 'mistral-small-latest', parameters: {} }],
  defaultModel: 'mistral',
};

export default mistralConfig;
