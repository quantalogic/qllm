import { ProviderConfig } from '../../../types/config';

const jinaConfig: ProviderConfig = {
  name: 'openai',
  models: [
    { alias: 'jina-clip-v1', modelId: 'jina-clip-v1', parameters: {} },
    { alias: 'jina-embeddings-v2-base-de', modelId: 'jina-embeddings-v2-base-de', parameters: {} },
    { alias: 'text-embedding-ada-002', modelId: 'text-embedding-ada-002', parameters: {} },
    { alias: 'jina-embeddings-v2-base-en', modelId: 'jina-embeddings-v2-base-en', parameters: {} },
  ],
  defaultModel: 'jina-clip-v1',
};

export default jinaConfig;
