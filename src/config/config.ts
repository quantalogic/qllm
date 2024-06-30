// src/config/config.ts

import dotenv from 'dotenv';
import path from 'path';
import { ProviderName } from './types';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Type for the configuration
interface Config {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName;
  modelAlias?: string;
}

// Default values
const DEFAULT_PROFILE = 'default';
const DEFAULT_REGION = 'us-east-1';
const DEFAULT_PROVIDER: ProviderName = 'anthropic';

// Pure function to get a typed environment variable
const getEnv = (key: string, defaultValue: string): string =>
  process.env[key] || defaultValue;

// Pure function to create the configuration
const createConfig = (): Config => ({
  awsProfile: getEnv('AWS_PROFILE', DEFAULT_PROFILE),
  awsRegion: getEnv('AWS_REGION', DEFAULT_REGION),
  defaultProvider: getEnv('DEFAULT_PROVIDER', DEFAULT_PROVIDER) as ProviderName,
  modelAlias: process.env.MODEL_ALIAS,
});

// Create an immutable configuration object
const config: Readonly<Config> = createConfig();

// Typed getter functions
export const getAwsProfile = (): string => config.awsProfile;
export const getAwsRegion = (): string => config.awsRegion;
export const getDefaultProvider = (): ProviderName => config.defaultProvider;
export const getModelAlias = (): string | undefined => config.modelAlias;

// Function to get the full configuration (for debugging)
export const getFullConfig = (): Readonly<Config> => config;