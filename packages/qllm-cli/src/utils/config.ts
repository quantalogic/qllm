import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// Define the schema for the configuration
const ConfigSchema = z.object({
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  apiKeys: z.record(z.string()).optional(),
  customPromptDirectory: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

const CONFIG_FILE_NAME = '.qllmrc';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config = { logLevel: 'info' };
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), CONFIG_FILE_NAME);
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(configData);
      this.config = ConfigSchema.parse(parsedConfig);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Error loading config: ${error}`);
      }
      // If file doesn't exist or is invalid, we'll use default config
    }
  }

  public async save(): Promise<void> {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error(`Error saving config: ${error}`);
    }
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value;
  }

  public getApiKey(provider: string): string | undefined {
    return this.config.apiKeys?.[provider];
  }

  public setApiKey(provider: string, apiKey: string): void {
    if (!this.config.apiKeys) {
      this.config.apiKeys = {};
    }
    this.config.apiKeys[provider] = apiKey;
  }

  public async initialize(): Promise<void> {
    await this.load();
    // You can add any initialization logic here
  }
}

export const configManager = ConfigManager.getInstance();