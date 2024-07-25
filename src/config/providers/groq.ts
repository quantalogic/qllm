import { ProviderConfig } from '../types';

const groqConfig: ProviderConfig = {
  name: 'groq',
  models: [
    { alias: 'mistral', modelId: 'mixtral-8x7b-32768' },
    { alias: 'llama3-8b', modelId: 'llama3-8b-8192' },
    { alias: 'llama3-10b', modelId: 'llama3-70b-8192' },
    { alias: 'llama3-groq-8b', modelId: 'llama3-groq-8b-8192-tool-use-preview' },
    { alias: 'llama3-groq-70b', modelId: 'llama3-groq-70b-8192-tool-use-preview' },
    { alias: 'gemma-7b', modelId: 'gemma-7b-it' },
    { alias: 'gemma2-9b', modelId: 'gemma2-9b-it' },
    { alias: 'whisper-large-v3', modelId: 'whisper-large-v3' },
  ],
  defaultModel: 'mistral',
};

export default groqConfig;