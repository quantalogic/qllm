import { Command } from "commander";
import { CliConfigManager } from "../utils/cli-config-manager";
import { IOManager } from "../utils/io-manager";
import { z } from "zod";
import { CONFIG_OPTIONS } from "../types/configure-command-options";
import { utils } from "../chat/utils";
import { getListProviderNames, getLLMProvider } from "qllm-lib";

declare var process: NodeJS.Process; //eslint-disable-line

const configManager = CliConfigManager.getInstance();
const ioManager = new IOManager();

export const configureCommand = new Command("configure")
    .description("Configure QLLM CLI settings")
    .option("-l, --list", "List all configuration settings")
    .option("-s, --set <key=value>", "Set a configuration value")
    .option("-g, --get <key>", "Get a configuration value")
    .action(async (options) => {
        try {
            if (options.list) {
                listConfig();
            } else if (options.set) {
                const [key, value] = options.set.split("="); // Split the input on '='
                await setConfig(key, value);
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
    const pathConfig = configManager.getConfigPath();

    ioManager.displaySectionHeader("Path Configuration");
    ioManager.displayInfo(`Path: ${pathConfig}`);

    ioManager.displaySectionHeader("Current Configuration");
    Object.entries(config).forEach(([key, value]) => {
        if (key === "apiKeys") {
            ioManager.displayInfo(`${key}:`);
            if (value) {
                Object.entries(value).forEach(([provider, apiKey]) => {
                    ioManager.displayInfo(
                        ` ${provider}: ${maskApiKey(apiKey)}`,
                    );
                });
            } else {
                ioManager.displayInfo(" No API keys set");
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
    // Ensure this is a fresh copy
    const config = configManager.configCopy();

    if (key === "model") {
        // Ensure the provider is set before setting the model
        if (!config.provider) {
            throw new Error("Provider must be set before setting the model.");
        }

        const provider = await getLLMProvider(config.provider);
        const models = await provider.listModels();
        const modelIds = models.map((model) => model.id);

        if (!modelIds.includes(value)) {
            throw new Error(
                `Invalid model: ${value}. Available models for provider ${config.provider}: ${modelIds.join(", ")}`,
            );
        }

        // Update the configuration using the config manager
        configManager.set("model", value);
    } else {
        // Update the configuration using the config manager
        configManager.setValue(key, value);
    }

    // Save the updated configuration
    try {
        ioManager.displayInfo(`Setting ${key} to ${value}`);
        await configManager.save();
        ioManager.displaySuccess(
            `Configuration updated and saved successfully`,
        );
        getConfig(key); // Display the updated config
    } catch (error) {
        throw new Error(
            `Failed to save configuration: ${(error as Error).message}`,
        );
    }
}

function getConfig(key: string): void {
    const configValue = configManager.getValue(key);
    if (configValue) {
        ioManager.displayInfo(`Configuration for ${key}: ${configValue}`);
    } else {
        ioManager.displayError(`Configuration key not found: ${key}`); // Handle missing keys
    }
}

async function interactiveConfig(): Promise<void> {
    const validProviders = getListProviderNames(); // Fetch valid providers
    const configGroups = [
        {
            name: "Provider Settings",
            options: ["provider", "model"],
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
            const configOption = CONFIG_OPTIONS.find(
                (option) => option.name === key,
            );
            if (!configOption) continue;

            const value = configManager.getValue(key);
            const currentValue =
                value !== undefined
                    ? ioManager.colorize(JSON.stringify(value), "yellow")
                    : ioManager.colorize("Not set", "dim");

            let newValue: string | undefined;

            if (key === "provider") {
                newValue = await ioManager.getUserInput(
                    `${ioManager.colorize(key, "cyan")} (${configOption.description}) (current: ${currentValue}).\nAvailable providers:\n${validProviders.map((provider) => ` - ${provider}`).join("\n")}\nPlease select a provider: `,
                );

                // Validate the input against the list of valid providers
                if (!validProviders.includes(newValue.trim())) {
                    ioManager.displayError(
                        `Invalid provider. Please choose from: ${validProviders.join(", ")}`,
                    );
                    continue; // Skip to the next option
                }

                // Fetch models for the selected provider
                const provider = await getLLMProvider(newValue.trim());
                const models = await provider.listModels();
                const modelIds = models.map(
                    (model: { id: string }) => model.id,
                );

                // Update the current value using the config manager
                configManager.set("provider", newValue.trim());

                // Prompt for the default model with improved display
                const modelInput = await ioManager.getUserInput(
                    `${ioManager.colorize("model", "cyan")} (Available models):\n${modelIds.map((modelId) => ` - ${modelId}`).join("\n")}\nPlease select a model: `,
                );

                // Validate the input against the list of models
                if (!modelIds.includes(modelInput.trim())) {
                    ioManager.displayError(
                        `Invalid model. Please choose from: ${modelIds.join(", ")}`,
                    );
                    continue; // Skip to the next option
                }

                // Set the validated model using the config manager
                configManager.set("model", modelInput.trim());
            } else {
                newValue = await ioManager.getUserInput(
                    `${ioManager.colorize(key, "cyan")} (${configOption.description}) (current: ${currentValue}): `,
                );

                if (newValue && newValue.trim() !== "") {
                    await utils.retryOperation(
                        async () => {
                            try {
                                configManager.setValue(key, newValue);
                                ioManager.displaySuccess(
                                    `${key} updated successfully`,
                                );
                            } catch (error) {
                                if (error instanceof z.ZodError) {
                                    throw new Error(
                                        `Invalid input: ${error.errors[0].message}`,
                                    );
                                }
                                throw error;
                            }
                        },
                        3,
                        0,
                    );
                }
            }
        }
        ioManager.newLine(); // Add a newline after each group
    }

    try {
        await configManager.save(); // Ensure the save method is called
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
