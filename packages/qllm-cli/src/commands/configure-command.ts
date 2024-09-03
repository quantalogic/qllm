// packages/qllm-cli/src/commands/configure-command.ts

import { Command } from "commander";
import { CliConfigManager } from "../utils/cli-config-manager";
import { IOManager } from "../utils/io-manager";
import { Config } from "../types/config-types";
import { ConfigSchema } from "../types/config-types"; // {{ edit_1 }}
import { z } from "zod";
import { CONFIG_OPTIONS } from "../types/config-types";
import { utils } from "../chat/utils";

const configManager = CliConfigManager.getInstance();
const ioManager = new IOManager();

export const configureCommand = new Command("configure")
    .description("Configure QLLM CLI settings")
    .option("-l, --list", "List all configuration settings")
    .option("-s, --set <key> <value>", "Set a configuration value")
    .option("-g, --get <key>", "Get a configuration value")
    .action(async (options) => {
        try {
            if (options.list) {
                listConfig();
            } else if (options.set) {
                await setConfig(options.set, options.args[0]);
            } else if (options.get) {
                getConfig(options.get);
            } else {
                await interactiveConfig();
            }
        } catch (error) {
            ioManager.displayError(
                `An error occurred: ${(error as Error).message}`,
            );
        } finally {
            // Ensure the program exits after completing the operation
            process.exit(0);
        }
    });

function listConfig(): void {
    const config = configManager.getAllSettings();
    ioManager.displaySectionHeader("Current Configuration");
    Object.entries(config).forEach(([key, value]) => {
        if (key === "apiKeys") {
            ioManager.displayInfo(`${key}:`);
            if (value) {
                Object.entries(value).forEach(([provider, apiKey]) => {
                    ioManager.displayInfo(
                        `  ${provider}: ${maskApiKey(apiKey)}`,
                    );
                });
            } else {
                ioManager.displayInfo("  No API keys set");
            }
        } else {
            ioManager.displayInfo(`${key}: ${JSON.stringify(value)}`);
        }
    });
}

function maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
        return "*".repeat(apiKey.length);
    }
    return (
        apiKey.substring(0, 4) +
        "*".repeat(apiKey.length - 8) +
        apiKey.substring(apiKey.length - 4)
    );
}

async function setConfig(key: string, value: string): Promise<void> {
    try {
        const configOption = CONFIG_OPTIONS.find(option => option.name === key);
        if (!configOption) {
            throw new Error(`Invalid configuration key: ${key}`);
        }

        const schema = ConfigSchema.shape[key as keyof Config];
        const validatedValue = schema.parse(value);

        configManager.set(key as keyof Config, validatedValue);
        await configManager.save();
        ioManager.displaySuccess(`Configuration updated: ${key} = ${value}`);
    } catch (error) {
        if (error instanceof z.ZodError) {
            ioManager.displayError(`Validation error: ${error.errors[0].message}`);
        } else {
            ioManager.displayError(`Failed to set configuration: ${(error as Error).message}`);
        }
    }
}

function getConfig(key: string): void {
    const value = configManager.get(key as keyof Config);
    if (value !== undefined) {
        ioManager.displayInfo(`${key}: ${JSON.stringify(value)}`);
    } else {
        ioManager.displayError(`Configuration key not found: ${key}`);
    }
}

async function interactiveConfig(): Promise<void> {
    const config = configManager.configCopy();
    const configGroups = [
        {
            name: "Provider Settings",
            options: ["defaultProvider", "defaultModel"],
        },
        {
            name: "Model Parameters",
            options: [
                "temperature",
                "maxTokens",
                "topP",
                "frequencyPenalty",
                "presencePenalty",
            ],
        },
        {
            name: "Other Settings",
            options: ["logLevel", "customPromptDirectory", "stopSequence"],
        },
    ];

    ioManager.clear();
    ioManager.displayTitle("QLLM Interactive Configuration");
    ioManager.newLine();

    for (const group of configGroups) {
        ioManager.displayGroupHeader(group.name);

        for (const key of group.options) {
            const configOption = CONFIG_OPTIONS.find(option => option.name === key);
            if (!configOption) continue;

            const value = config[key as keyof Config];
            const currentValue = value !== undefined
                ? ioManager.colorize(JSON.stringify(value), "yellow")
                : ioManager.colorize("Not set", "dim");

            const newValue = await ioManager.getUserInput(
                `${ioManager.colorize(key, "cyan")} (${configOption.description}) (current: ${currentValue}): `
            );

            if (newValue.trim() !== "") {
                await utils.retryOperation(async () => {
                    try {
                        const schema = ConfigSchema.shape[key as keyof Config];
                        const validatedValue = schema.parse(
                            configOption.type === "number" ? parseFloat(newValue) : newValue
                        );
                        configManager.set(key as keyof Config, validatedValue);
                        ioManager.displaySuccess(`${key} updated successfully`);
                    } catch (error) {
                        if (error instanceof z.ZodError) {
                            throw new Error(`Invalid input: ${error.errors[0].message}`);
                        }
                        throw error;
                    }
                }, 3, 0);
            }
        }
        ioManager.newLine(); // Add a newline after each group
    }

    try {
        await configManager.save();
        ioManager.displaySuccess(
            "Configuration updated and saved successfully",
        );
    } catch (error) {
        ioManager.displayError(
            `Failed to save configuration: ${(error as Error).message}`,
        );
    }

    ioManager.newLine();
    ioManager.displayInfo(
        ioManager.colorize("Press Enter to return to the main menu...", "dim"),
    );
    await ioManager.getUserInput("");
}
