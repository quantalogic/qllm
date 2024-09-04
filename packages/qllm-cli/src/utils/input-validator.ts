// packages/qllm-cli/src/utils/input-validator.ts

import { z } from "zod";
import { Config } from "../types/config-types";
import { CONFIG_OPTIONS } from "../constants/config-constants";

const ConfigSchema = z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    logLevel: z.enum(["error", "warn", "info", "debug"]).optional(),
    apiKeys: z.record(z.string()).optional(),
    customPromptDirectory: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequence: z.array(z.string()).optional(),
});

export function validateConfig(config: Partial<Config>): Partial<Config> {
    const validConfig: Partial<Config> = {};

    for (const [key, value] of Object.entries(config)) {
        if (CONFIG_OPTIONS.includes(key as keyof Config)) {
            try {
                const schema = ConfigSchema.shape[key as keyof Config];
                validConfig[key as keyof Config] = schema.parse(value) as any;
            } catch (error) {
                if (error instanceof z.ZodError) {
                    throw new Error(
                        `Invalid value for ${key}: ${error.errors[0].message}`,
                    );
                }
                throw error;
            }
        } else {
            throw new Error(`Invalid option: ${key}`);
        }
    }

    return validConfig;
}

export function validateSingleOption(key: string, value: any): any {
    if (!CONFIG_OPTIONS.includes(key as keyof Config)) {
        throw new Error(`Invalid option: ${key}`);
    }

    try {
        const schema = ConfigSchema.shape[key as keyof Config];
        return schema.parse(value);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Invalid value for ${key}: ${error.errors[0].message}`,
            );
        }
        throw error;
    }
}

export function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export function isImageFile(filename: string): boolean {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
}

export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

export function validatePositiveInteger(value: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
        throw new Error("Value must be a positive integer");
    }
    return num;
}

export function validateFloat(value: string, min: number, max: number): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        throw new Error(`Value must be a number between ${min} and ${max}`);
    }
    return num;
}

export function validateEnum<T extends string>(
    value: string,
    validValues: T[],
): T {
    if (!validValues.includes(value as T)) {
        throw new Error(
            `Invalid value. Must be one of: ${validValues.join(", ")}`,
        );
    }
    return value as T;
}

export function validateStringArray(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");
}
