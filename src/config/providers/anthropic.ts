// src/config/providers/anthropic.ts

import { ProviderConfig } from '../types';

const anthropicConfig: ProviderConfig = {
  name: 'anthropic',
  models: [
    { alias: 'sonnet', modelId: 'anthropic.claude-3-sonnet-20240229-v1:0' },
    { alias: 'sonnet35', modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0' },
    { alias: 'haiku', modelId: 'anthropic.claude-3-haiku-20240307-v1:0' },
    { alias: 'opus', modelId: 'anthropic.claude-3-opus-20240229-v1:0' },
  ],
  defaultModel: 'haiku',
};

export default anthropicConfig;