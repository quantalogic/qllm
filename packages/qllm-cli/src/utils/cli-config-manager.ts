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

  public saveSync(): void {
    try {
      console.log("Saving configuration...", this.config);
      fsSync.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        "utf8"
      );
      //console.log('Configuration saved successfully.');
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
    return JSON.parse(JSON.stringify(this.config)) as Config;
  }
}

export const configManager = CliConfigManager.getInstance();
