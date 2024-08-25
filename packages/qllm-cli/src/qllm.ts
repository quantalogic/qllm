#!/usr/bin/env node

import { Command } from "commander";
import { askCommand } from "./commands/ask-command";
import { listCommand } from "./commands/list-command";
import { chatCommand } from "./commands/chat-command";
import { CliConfigManager } from "./utils/cli-config-manager";
import { configureCommand } from "./commands/configure-command";
import { IOManager } from "./chat/io-manager";

const VERSION = "1.8.0";

export async function main() {
  try {
    const program = new Command();

    program
      .version(VERSION)
      .description(
        "Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic."
      )
      .option(
        "--log-level <level>",
        "Set log level (error, warn, info, debug)"
      );

    const configManager = CliConfigManager.getInstance();

    await configManager.ensureConfigFileExists();
    await configManager.load();

    // Add the ask command
    program.addCommand(askCommand);

    // Add the list command
    program.addCommand(listCommand);

    // Add chat command
    program.addCommand(chatCommand);

    // Add the configure command
    program.addCommand(configureCommand);

    // Add other commands here as needed
    // For example:
    // program.addCommand(generateEmbeddingCommand);

    // Set up the exit handler
    // Set up the exit handler
    // Set up the exit handler
    process.on("exit", (code) => {
      console.log();
      if (code !== 0) {
        console.log(`👋 Bye bye. Exit code: ${code}`);
      } else {
        console.log("👋 Bye bye.");
      }
    });

    await program.parseAsync(process.argv);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  } finally {
    try {
    } catch (error) {
      console.error("An error occurred while saving the configuration:", error);
    }
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export default main;
