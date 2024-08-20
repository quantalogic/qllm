import { ProviderConfig } from 'qllm-types';

const mistralConfig: ProviderConfig = {
  name: 'openai',
  models: [{ alias: 'mistral', modelId: 'mistral-small-latest', parameters: {} }],
  defaultModel: 'mistral',
};

export default mistralConfig;
