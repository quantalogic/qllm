// packages/qllm-cli/src/types/config-types.ts

import { z } from "zod";

export const ConfigSchema = z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
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

export type Config = z.infer<typeof ConfigSchema>;

export interface ConfigOption {
    name: string;
    type: "string" | "number" | "boolean" | "array";
    description: string;
    validator?: (value: any) => boolean;
}

export const CONFIG_OPTIONS: ConfigOption[] = [
    {
        name: "provider",
        type: "string",
        description: "Default LLM provider",
    },
    {
        name: "model",
        type: "string",
        description: "Default model for the selected provider",
    },
    {
        name: "logLevel",
        type: "string",
        description: "Log level (error, warn, info, debug)",
        validator: (value: string) =>
            ["error", "warn", "info", "debug"].includes(value),
    },
    {
        name: "customPromptDirectory",
        type: "string",
        description: "Custom directory for prompt templates",
    },
    {
        name: "temperature",
        type: "number",
        description: "Sampling temperature (0.0 to 1.0)",
        validator: (value: number) => value >= 0 && value <= 1,
    },
    {
        name: "maxTokens",
        type: "number",
        description: "Maximum number of tokens to generate",
        validator: (value: number) => value > 0,
    },
    {
        name: "topP",
        type: "number",
        description: "Top P sampling (0.0 to 1.0)",
        validator: (value: number) => value >= 0 && value <= 1,
    },
    {
        name: "frequencyPenalty",
        type: "number",
        description: "Frequency penalty (-2.0 to 2.0)",
        validator: (value: number) => value >= -2 && value <= 2,
    },
    {
        name: "presencePenalty",
        type: "number",
        description: "Presence penalty (-2.0 to 2.0)",
        validator: (value: number) => value >= -2 && value <= 2,
    },
    {
        name: "stopSequence",
        type: "array",
        description: "Stop sequences (comma-separated)",
    },
];
