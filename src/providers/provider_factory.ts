import { LLMProvider } from './llm_provider';
import { AnthropicProvider } from './anthropic_provider';
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { get } from 'http';
import { getCredentials } from '../credentials';

export type ProviderType = 'anthropic' | 'openai' | 'google';

interface ProviderConfig {
  type: ProviderType;
  region?: string;
  apiKey?: string;
}

export class ProviderFactory {
  private static instances: Map<string, LLMProvider> = new Map();

  static async createProvider(config: ProviderConfig): Promise<LLMProvider> {
    const key = `${config.type}-${config.region || ''}`;
    
    if (!this.instances.has(key)) {
      let provider: LLMProvider;
      
      switch (config.type) {
        case 'anthropic':
         const credentials = await getCredentials();
          provider = new AnthropicProvider(credentials, config.region || 'us-east-1');
          break;
        // Add cases for other providers here
        default:
          throw new Error(`Unsupported provider type: ${config.type}`);
      }
      
      this.instances.set(key, provider);
    }
    
    return this.instances.get(key)!;
  }
}
