import { ProviderConfig } from "../../../types/config";


const groqConfig: ProviderConfig = {
  name: 'groq',
  models: [
    { alias: 'mistral', modelId: 'mixtral-8x7b-32768', parameters: {} },
    { alias: 'llama3-8b', modelId: 'llama3-8b-8192', parameters: {} },
    { alias: 'llama3-10b', modelId: 'llama3-70b-8192', parameters: {} },
    { alias: 'llama3-groq-8b', modelId: 'llama3-groq-8b-8192-tool-use-preview', parameters: {} },
    { alias: 'llama3-groq-70b', modelId: 'llama3-groq-70b-8192-tool-use-preview', parameters: {} },
    { alias: 'gemma-7b', modelId: 'gemma-7b-it', parameters: {} },
    { alias: 'gemma2-9b', modelId: 'gemma2-9b-it', parameters: {} },
    { alias: 'whisper-large-v3', modelId: 'whisper-large-v3', parameters: {} },
  ],
  defaultModel: 'mistral',
};

export default groqConfig;
