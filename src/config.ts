// src/config.ts

import dotenv from 'dotenv';
import path from 'path';
import { ProviderName } from './config/types';
import { resolveModelAlias, getDefaultModel } from './config/model_aliases';

// Load environment variables from .env file
const pathEnv = path.resolve(__dirname, '../.env');
const res = dotenv.config({ path: pathEnv });

const DEFAULT_PROFILE = 'default';
const DEFAULT_REGION = 'us-east-1';

// Very important Set default AWS profile and region
if (res.parsed) {
    process.env.AWS_PROFILE = res.parsed.AWS_PROFILE || process.env.AWS_PROFILE || DEFAULT_PROFILE;
    process.env.AWS_REGION = res.parsed.AWS_REGION || process.env.AWS_REGION || DEFAULT_REGION;
}

// Export environment variables with fallbacks
export const AWS_PROFILE = process.env.AWS_PROFILE || DEFAULT_PROFILE;
export const AWS_REGION = process.env.AWS_REGION || DEFAULT_REGION;

/**
 * Resolves the model based on provided modelId or modelAlias.
 * @param provider The provider name
 * @param modelId Specific model ID
 * @param modelAlias Model alias
 * @returns Resolved model ID
 */
export function resolveModel(provider: ProviderName, modelId: string | undefined, modelAlias: string | undefined): string {
  if (modelId && modelAlias) {
    throw new Error('Cannot specify both --modelid and --model. Please use only one.');
  }

  if (modelId) {
    return modelId;
  }

  if (modelAlias) {
    return resolveModelAlias(provider, modelAlias);
  }

  return getDefaultModel(provider);
}

/**
 * Gets the default model for a provider.
 * @param provider The provider name
 * @returns Default model ID for the provider
 */
export function getProviderDefaultModel(provider: ProviderName): string {
  return getDefaultModel(provider);
}

// You can add more configuration exports here if needed