// packages/qllm-cli/src/utils/cli-config-manager.ts

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { z } from "zod";

// Define the schema for the configuration
const CliConfigSchema = z.object({
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  apiKeys: z.record(z.string()).optional(),
  customPromptDirectory: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequence: z.array(z.string()).optional(),
});

type Config = z.infer<typeof CliConfigSchema>;

const CONFIG_FILE_NAME = ".qllmrc";

export class CliConfigManager {
  private static instance: CliConfigManager;
  private config: Config = { logLevel: "info" };
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), CONFIG_FILE_NAME);
  }

  public static getInstance(): CliConfigManager {
    if (!CliConfigManager.instance) {
      CliConfigManager.instance = new CliConfigManager();
    }
    return CliConfigManager.instance;
  }

  public async ensureConfigFileExists(): Promise<void> {
    try {
      await fs.access(this.configPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await this.save();
      }
    }
  }

  public async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      const parsedConfig = JSON.parse(configData);
      this.config = CliConfigSchema.parse(parsedConfig);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
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

  public configCopy(): Config {
    return {
      defaultProvider: this.config.defaultProvider,
      defaultModel: this.config.defaultModel,
      logLevel: this.config.logLevel,
      apiKeys: this.config.apiKeys ? { ...this.config.apiKeys } : undefined,
      customPromptDirectory: this.config.customPromptDirectory,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      topP: this.config.topP,
      frequencyPenalty: this.config.frequencyPenalty,
      presencePenalty: this.config.presencePenalty,
      stopSequence: this.config.stopSequence,
    };
  }

  public getAllSettings(): Config {
    return this.configCopy();
  }


  public async setMultiple(settings: Partial<Config>): Promise<void> {
    Object.entries(settings).forEach(([key, value]) => {
      if (key in this.config) {
        (this.config as any)[key] = value;
      }
    });
    await this.save();
  }

  public getConfigPath(): string {
    return this.configPath;
  }
}

export const configManager = CliConfigManager.getInstance();