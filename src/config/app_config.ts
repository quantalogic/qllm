import dotenv from 'dotenv';
import path from 'path';
import { ProviderName } from './types';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName;
  modelAlias?: string;
}

const DEFAULT_AWS_PROFILE = 'default';
const DEFAULT_AWS_REGION = 'us-east-1';
const DEFAULT_PROVIDER: ProviderName = 'anthropic';

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default value provided`);
  }
  return value ?? defaultValue!;
}

export function loadConfig(): AppConfig {
  return {
    awsProfile: getEnvVar('AWS_PROFILE', DEFAULT_AWS_PROFILE),
    awsRegion: getEnvVar('AWS_REGION', DEFAULT_AWS_REGION),
    defaultProvider: getEnvVar('DEFAULT_PROVIDER', DEFAULT_PROVIDER) as ProviderName,
    modelAlias: process.env.MODEL_ALIAS,
  };
}

let appConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!appConfig) {
    initConfig();
  }
  return appConfig!;
}

export function initConfig(): void {
  appConfig = loadConfig();
}