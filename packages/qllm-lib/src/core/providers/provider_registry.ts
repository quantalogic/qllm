import { LLMProvider } from './llm_provider';
import { LLMProviderOptions } from '@qllm/types/src';
import { ProviderName } from '@qllm/types/src';

type ProviderFactory = (options: LLMProviderOptions) => LLMProvider;

class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<ProviderName, ProviderFactory> = new Map();

  private constructor() {}

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public registerProvider(name: ProviderName, factory: ProviderFactory): void {
    this.providers.set(name, factory);
  }

  public getProvider(name: ProviderName, options: LLMProviderOptions): LLMProvider {
    const factory = this.providers.get(name);
    if (!factory) {
      throw new Error(`Provider ${name} not registered`);
    }
    return factory(options);
  }

  public hasProvider(name: ProviderName): boolean {
    return this.providers.has(name);
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
