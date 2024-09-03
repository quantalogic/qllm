#!/usr/bin/env node

import { Command } from "commander";
import { askCommand } from "./commands/ask-command";
import { listCommand } from "./commands/list-command";
import { chatCommand } from "./commands/chat-command";
import { CliConfigManager } from "./utils/cli-config-manager";
import { configureCommand } from "./commands/configure-command";
import { runCommand, runAction } from "./commands/run-command";
import { readFileSync } from "fs";
import { IOManager } from "./utils/io-manager";
import path from 'path';

declare var __dirname: string; //eslint-disable-line
declare var process: NodeJS.Process; //eslint-disable-line


// Read version from package.json
const packageJson = JSON.parse(
    readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"),
);


const VERSION = packageJson.version;

const ioManager = new IOManager();

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

        // Add the run command as a named command
        program.addCommand(runCommand);
        
        // Set the run command as the default command
        program
            .argument("[template]", "Template name, file path, or URL")
            .option("-t, --type <type>", "Template source type (file, url, inline)", "file")
            .option("-v, --variables <variables>", "Template variables in JSON format")
            .option("-p, --provider <provider>", "LLM provider to use")
            .option("-m, --model <model>", "Specific model to use")
            .option("--max-tokens <maxTokens>", "Maximum number of tokens to generate", parseInt)
            .option("--temperature <temperature>", "Temperature for response generation", parseFloat)
            .option("-s, --stream", "Stream the response")
            .option("-o, --output <output>", "Output file for the response")
            .option("-e, --extract <variables>", "Variables to extract from the response, comma-separated")
            .action(async (template, options, command) => {
                if (!template) {
                    command.help();
                } else {
                    await runAction(template, options);
                }
            });

        // Add other commands
        program.addCommand(askCommand);
        program.addCommand(listCommand);
        program.addCommand(chatCommand);
        program.addCommand(configureCommand);

        // Set up the exit handler
        process.on("exit", (code) => {
            process.exit(code);
        });

        await program.parseAsync(process.argv);
    } catch (error) {
        ioManager.displayError(
            `An error occurred: ${(error as Error).message}`,
        );
        process.exit(1);
    } finally {
        try {
            // Any cleanup code if needed
        } catch (error) {
            ioManager.displayError(
                `An error occurred while saving the configuration: ${(error as Error).message}`,
            );
        }
    }
}

main()
.catch((error) => {
    ioManager.displayError(`Unhandled error: ${error}`);
    process.exit(1);
}); 


export default main;
