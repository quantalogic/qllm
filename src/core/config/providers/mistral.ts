import { ProviderConfig } from '../types';

const mistralConfig: ProviderConfig = {
  name: 'openai',
  models: [
    { alias: 'mistral', modelId: 'mistral-small-latest' }
  ],
  defaultModel: 'mistral',
};

export default mistralConfig;