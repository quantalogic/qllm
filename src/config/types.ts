// src/config/types.ts

export interface ModelAlias {
    alias: string;
    modelId: string;
  }
  
  export interface ProviderConfig {
    name: string;
    models: ModelAlias[];
    defaultModel: string;
  }
  
  //export type ProviderName = 'anthropic' | 'openai' | 'google'; // Add other providers as needed

export type ProviderName = 'anthropic' 