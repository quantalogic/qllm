// packages/qllm-cli/src/chat/chat-config.ts
import fs from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";

const ChatConfigSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequence: z.array(z.string()).optional(),
  currentConversationId: z.string().optional(),
});

type ChatConfigType = z.infer<typeof ChatConfigSchema>;

export class ChatConfig {
  private static instance: ChatConfig;
  private config: ChatConfigType = {};
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), ".qllm-chat-config.json");
  }

  public static getInstance(): ChatConfig {
    if (!ChatConfig.instance) {
      ChatConfig.instance = new ChatConfig();
    }
    return ChatConfig.instance;
  }

  public async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      const parsedConfig = JSON.parse(configData);
      this.config = ChatConfigSchema.parse(parsedConfig);
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

  public get<K extends keyof ChatConfigType>(key: K): ChatConfigType[K] {
    return this.config[key];
  }

  public set<K extends keyof ChatConfigType>(
    key: K,
    value: ChatConfigType[K]
  ): void {
    this.config[key] = value;
  }

  public getProvider(): string | undefined {
    return this.config.provider;
  }

  public setProvider(provider: string): void {
    this.config.provider = provider;
  }

  public getModel(): string | undefined {
    return this.config.model;
  }

  public setModel(model: string): void {
    this.config.model = model;
  }

  public getTemperature(): number | undefined {
    return this.config.temperature;
  }

  public setTemperature(temperature: number): void {
    this.config.temperature = temperature;
  }

  public getMaxTokens(): number | undefined {
    return this.config.maxTokens;
  }

  public setMaxTokens(maxTokens: number): void {
    this.config.maxTokens = maxTokens;
  }

  public getTopP(): number | undefined {
    return this.config.topP;
  }

  public setTopP(topP: number): void {
    this.config.topP = topP;
  }

  public getFrequencyPenalty(): number | undefined {
    return this.config.frequencyPenalty;
  }

  public setFrequencyPenalty(frequencyPenalty: number): void {
    this.config.frequencyPenalty = frequencyPenalty;
  }

  public getPresencePenalty(): number | undefined {
    return this.config.presencePenalty;
  }

  public setPresencePenalty(presencePenalty: number): void {
    this.config.presencePenalty = presencePenalty;
  }

  public getStopSequence(): string[] | undefined {
    return this.config.stopSequence;
  }

  public setStopSequence(stopSequence: string[]): void {
    this.config.stopSequence = stopSequence;
  }

  public getCurrentConversationId(): string | undefined {
    return this.config.currentConversationId;
  }

  public setCurrentConversationId(conversationId: string | undefined): void {
    this.config.currentConversationId = conversationId;
  }

  public async initialize(): Promise<void> {
    await this.load();
  }

  public getAllSettings(): ChatConfigType {
    return { ...this.config };
  }
}

export const chatConfig = ChatConfig.getInstance();
