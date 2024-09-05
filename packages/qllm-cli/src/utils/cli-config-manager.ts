// packages/qllm-cli/src/utils/cli-config-manager.ts

import fs from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";
import { IOManager } from "./io-manager";

declare var process: NodeJS.Process; // eslint-disable-line

// Define the schema for the configuration
const CliConfigSchema = z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequence: z.array(z.string()).optional(),
});

type Config = z.infer<typeof CliConfigSchema>;

type ConfigKey = keyof Config;

type PartialConfig = Partial<Config>;

const CONFIG_FILE_NAME = ".qllmrc";

export class CliConfigManager {
    private static instance: CliConfigManager;
    private config: Config = { logLevel: "info" };
    private configPath: string;
    private ioManager: IOManager = new IOManager();

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
                this.ioManager.displayError(`Error loading config: ${error}`);
            }
            // If file doesn't exist or is invalid, we'll use default config
        }
    }

    public async save(): Promise<void> {
        try {
            await fs.writeFile(
                this.configPath,
                JSON.stringify(this.config, null, 2),
            );
        } catch (error) {
            this.ioManager.displayError(`Error saving config: ${error}`);
        }
    }

    public get<K extends keyof Config>(key: K): Config[K] {
        return this.config[key];
    }

    public getValue(key: string): Config[keyof Config] | undefined {
        return this.config[key as keyof Config];
    }

    public set<K extends keyof Config>(key: K, value: Config[K]): void {
        this.config[key] = value;
    }

    public setValue(key: string, value: string | undefined): void {
        switch (key) {
            case "provider":
                this.config.provider = value as Config["provider"];
                break;
            case "model":
                this.config.model = value as Config["model"];
                break;
            case "logLevel":
                this.config.logLevel = value as Config["logLevel"];
                break;
            case "temperature":
                this.config.temperature = value ? parseFloat(value) : undefined;
                break;
            case "maxTokens":
                this.config.maxTokens = value ? parseInt(value) : undefined;
                break;
            case "topP":
                this.config.topP = value ? parseFloat(value) : undefined;
                break;
            case "frequencyPenalty":
                this.config.frequencyPenalty = value
                    ? parseFloat(value)
                    : undefined;
                break;
            case "presencePenalty":
                this.config.presencePenalty = value
                    ? parseFloat(value)
                    : undefined;
                break;
            case "stopSequence":
                this.config.stopSequence = value
                    ? value.split(",").map((s) => s.trim())
                    : undefined;
                break;
            default:
                this.ioManager.displayError(`Invalid key: ${key}`);
        }
    }

    public configCopy(): Config {
        return { ...this.config }; // Return a shallow copy of the config
    }

    public async initialize(): Promise<void> {
        await this.load();
        // You can add any initialization logic here
    }

    public getAllSettings(): Config {
        return { ...this.config }; // Simplified copy logic
    }

    public async setMultiple(settings: PartialConfig): Promise<void> {
        Object.assign(this.config, settings);
        await this.save();
    }

    public getConfigPath(): string {
        return this.configPath;
    }
}

export const configManager = CliConfigManager.getInstance();
