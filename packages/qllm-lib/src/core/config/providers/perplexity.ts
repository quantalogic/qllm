
import { ProviderConfig } from "../../../types/config";

const perplexityConfig: ProviderConfig = {
  name: 'groq',
  models: [
    { alias: 'mistral', modelId: 'mixtral-8x7b-instruct', parameters: {} },
    { alias: 'llama-3-sonar-sm', modelId: 'llama-3-sonar-small-32k-chat', parameters: {} },
    { alias: 'llama-3-sonar-sm-online', modelId: 'llama-3-sonar-small-32k-online', parameters: {} },
    { alias: 'llama-3-sonar-l', modelId: 'llama-3-sonar-large-32k-chat', parameters: {} },
    { alias: 'llama-3-sonar-l-online', modelId: 'llama-3-sonar-large-32k-online', parameters: {} },
    { alias: 'llama-3-8b', modelId: 'llama-3-8b-instruct', parameters: {} },
    { alias: 'llama-3-70b', modelId: 'llama-3-70b-instruct', parameters: {} },
  ],
  defaultModel: 'mistral',
};

export default perplexityConfig;
