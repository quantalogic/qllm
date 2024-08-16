import path from "path";
import os from "os"; // Add this line to import the 'os' module
import { AppConfig } from "@qllm/types/src"

export const DEFAULT_APP_CONFIG: AppConfig = {
    awsProfile: '381491861296_bedrockfullaccess',
    awsRegion: 'us-west-2',
    defaultProvider: 'anthropic',
    defaultModelAlias: 'haiku',
    logLevel: 'info',
    defaultMaxTokens: 2048,
    promptDirectory:   path.join(os.homedir(), '.config', 'qllm', 'prompts'),
};