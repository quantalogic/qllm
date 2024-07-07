import path from "path";
import os from "os"; // Add this line to import the 'os' module
import { AppConfig } from "./types"

export const DEFAULT_CONFIG: AppConfig = {
    awsProfile: 'default',
    awsRegion: 'us-east-1',
    defaultProvider: 'anthropic',
    defaultModel: 'haiku',
    logLevel: 'info',
    defaultMaxTokens: 2048,
    promptDirectory:   path.join(os.homedir(), '.config', 'qllm', 'prompts'),
};