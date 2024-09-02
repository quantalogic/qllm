#!/usr/bin/env node

import { Command } from "commander";
import { askCommand } from "./commands/ask-command";
import { listCommand } from "./commands/list-command";
import { chatCommand } from "./commands/chat-command";
import { CliConfigManager } from "./utils/cli-config-manager";
import { configureCommand } from "./commands/configure-command";
import { runCommand } from "./commands/run-command";
import { readFileSync } from "fs";
import { join } from "path";

// Read version from package.json
const packageJson = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

const VERSION = packageJson.version;

export async function main() {
    try {
        const program = new Command();

        program
            .version(VERSION)
            .description(
                "Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.",
            )
            .option(
                "--log-level <level>",
                "Set log level (error, warn, info, debug)",
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

        // Add to program commands
        program.addCommand(runCommand);

        // Add other commands here as needed
        // For example:
        // program.addCommand(generateEmbeddingCommand);

        // Set up the exit handler
        // Set up the exit handler
        // Set up the exit handler
        process.on("exit", (code) => {
            process.exit(code);
        });

        await program.parseAsync(process.argv);
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    } finally {
        try {
        } catch (error) {
            console.error(
                "An error occurred while saving the configuration:",
                error,
            );
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
