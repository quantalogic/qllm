import { LLMProviderOptions } from '../providers/types';

export function mergeOptions(defaults: Partial<LLMProviderOptions>, userOptions: Partial<LLMProviderOptions>): LLMProviderOptions {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(userOptions).filter(([_, value]) => value !== undefined)
    ),
  } as LLMProviderOptions;
}