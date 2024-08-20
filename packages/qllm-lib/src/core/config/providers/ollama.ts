import { ProviderConfig } from '../../../types/config';

const ollamaConfig: ProviderConfig = {
  name: 'ollama',
  models: [
    { alias: 'codellama', modelId: 'codellama', parameters: {} },
    { alias: 'mistral', modelId: 'mistral', parameters: {} },
  ],
  defaultModel: 'mistral',
};

export default ollamaConfig;
