// src/config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const pathEnv = path.resolve(__dirname, '../.env');
const res = dotenv.config({ path: pathEnv });

if (res.parsed) {
  process.env.AWS_PROFILE = res.parsed.AWS_PROFILE || process.env.AWS_PROFILE || 'default';
  process.env.AWS_REGION = res.parsed.AWS_REGION || process.env.AWS_REGION || 'us-west-2';
}

export const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
export const AWS_REGION = process.env.AWS_REGION || 'us-west-2';

export const MODEL_ALIASES = {
  'sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
  'sonnet35': 'anthropic.claude-3-sonnet-20240229-v1:0',
  'haiku': 'anthropic.claude-3-haiku-20240307-v1:0',
  'opus': 'anthropic.claude-3-opus-20240229-v1:0'
};

export const DEFAULT_MODEL_ALIAS = 'haiku';

export function resolveModel(modelId: string | undefined, modelAlias: string | undefined): string {
  if (modelId && modelAlias) {
    throw new Error('Cannot specify both --modelid and --model. Please use only one.');
  }
  if (modelId) {
    return modelId;
  }
  if (modelAlias) {
    const resolvedModel = MODEL_ALIASES[modelAlias as keyof typeof MODEL_ALIASES];
    if (resolvedModel) {
      return resolvedModel;
    }
    throw new Error(`Invalid model alias: ${modelAlias}`);
  }
  return getDefaultModel();
}

export function getDefaultModel(): string {
  return process.env.MODEL_ID || MODEL_ALIASES[DEFAULT_MODEL_ALIAS];
}