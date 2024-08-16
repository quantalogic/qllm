import { ProviderConfig } from '../types';

const ollamaConfig: ProviderConfig = {
  name: 'ollama',
  models: [
    { alias: 'codellama', modelId: 'codellama' },
    { alias: 'mistral', modelId: 'mistral' },
  ],
  defaultModel: 'mistral',
};

export default ollamaConfig;