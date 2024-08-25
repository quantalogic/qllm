// packages/qllm-cli/src/commands/configure-command.ts

import { Command } from "commander";
import { CliConfigManager } from "../utils/cli-config-manager";
import { IOManager } from "../chat/io-manager";
import { validateSingleOption } from "../utils/input-validator";
import { Config } from "../types/config-types";

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
      ioManager.displayError(`An error occurred: ${(error as Error).message}`);
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
          ioManager.displayInfo(`  ${provider}: ${maskApiKey(apiKey)}`);
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
    configManager.set(key as keyof Config, value);
    await configManager.save();
    ioManager.displaySuccess(`Configuration updated: ${key} = ${value}`);
  } catch (error) {
    ioManager.displayError(
      `Failed to set configuration: ${(error as Error).message}`
    );
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
      const value = config[key as keyof Config];
      const currentValue =
        value !== undefined
          ? ioManager.colorize(JSON.stringify(value), "yellow")
          : ioManager.colorize("Not set", "dim");

      const newValue = await ioManager.getUserInput(
        `${ioManager.colorize(key, "cyan")} (current: ${currentValue}): `
      );

      if (newValue.trim() !== "") {
        try {
          const validatedValue = validateSingleOption(
            key as keyof Config,
            newValue
          );
          configManager.set(key as keyof Config, validatedValue);
          ioManager.displaySuccess(`${key} updated successfully`);
        } catch (error) {
          ioManager.displayError(`Invalid input: ${(error as Error).message}`);
        }
      }
    }
    ioManager.newLine(); // Add a newline after each group
  }

  try {
    await configManager.save();
    ioManager.displaySuccess("Configuration updated and saved successfully");
  } catch (error) {
    ioManager.displayError(
      `Failed to save configuration: ${(error as Error).message}`
    );
  }

  ioManager.newLine();
  ioManager.displayInfo(
    ioManager.colorize("Press Enter to return to the main menu...", "dim")
  );
  await ioManager.getUserInput("");
}
