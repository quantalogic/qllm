#!/usr/bin/env node

import { Command } from "commander";
import { listCommand } from "./commands/list-command";
import { CliConfigManager } from "./utils/cli-config-manager";
import { configureCommand } from "./commands/configure-command";
import { runActionCommand } from "./commands/run-command";
import { readFileSync } from "fs";
import { IOManager } from "./utils/io-manager";
import { askCommandAction } from "./commands/ask-command";
import { chatAction } from "./commands/chat-command";

import path from "path";

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
        const configManager = CliConfigManager.getInstance();

        await configManager.ensureConfigFileExists();
        await configManager.load();

        const program = new Command();

        program
            .version(VERSION)
            .description(
                "Multi-Provider LLM Command CLI - qllm. Created with ❤️ by @quantalogic.",
            )
            .option(
                "--log-level <level>",
                "Set log level (error, warn, info, debug)",
            )
            .option("-p, --provider <provider>", "LLM provider to use")
            .option("-m, --model <model>", "Specific model to use")
            .option(
                "--max-tokens <maxTokens>",
                "Maximum number of tokens to generate",
                parseInt,
            )
            .option(
                "--temperature <temperature>",
                "Temperature for response generation",
                parseFloat,
            );

        // Set the run command as the default command
        program
            .argument("[template]", "Template name, file path, or URL")
            .option(
                "-t, --type <type>",
                "Template source type (file, url, inline)",
                "file",
            )
            .option(
                "-v, --variables <variables>",
                "Template variables in JSON format",
            )
            .option("-ns, --no-stream", "Stream the response", true)
            .option("-o, --output <output>", "Output file for the response")
            .option(
                "-e, --extract <variables>",
                "Variables to extract from the response, comma-separated",
            )
            .action(async (template, options, command) => {
                const globalOptions = program.opts();
                const mergedOptions = { ...globalOptions, ...options };

                if (!template) {
                    // If no template is provided, treat it as an "ask" command
                    await askCommandAction("", mergedOptions);
                } else {
                    await runActionCommand(template, mergedOptions);
                }
            });

        // Modify the chat command definition
        program
            .command("chat")
            .description("Start an interactive chat session with an LLM")
            .option(
                "--top-p <number>",
                "Top P value for response generation",
                parseFloat,
            )
            .option(
                "--frequency-penalty <number>",
                "Frequency penalty for response generation",
                parseFloat,
            )
            .option(
                "--presence-penalty <number>",
                "Presence penalty for response generation",
                parseFloat,
            )
            .option(
                "--stop-sequence <sequence>",
                "Stop sequence for response generation",
                (value, previous) => previous.concat([value]),
                [] as string[],
            )
            .action((options) => {
                const globalOptions = program.opts();
                const mergedOptions = { ...globalOptions, ...options };
                chatAction(mergedOptions);
            });

        // Modify the ask command definition
        program
            .command("ask")
            .description("Ask a question to an LLM")
            .argument("[question]", "The question to ask (optional if piped)")
            .option(
                "-c, --context <context>",
                "Additional context for the question",
            )
            .option(
                "-i, --image <path>",
                "Path to image file, or URL (can be used multiple times)",
                (value, previous) => previous.concat([value]),
                [] as string[],
            )
            .option("--use-clipboard", "Use image from clipboard", false)
            .option(
                "--screenshot <display>",
                "Capture screenshot from specified display number",
                (value) => parseInt(value, 10),
            )
            .option("-ns, --no-stream", "Stream the response", true)
            .option("-o, --output <file>", "Output file for the response")
            .option(
                "-s, --system-message <message>",
                "System message to prepend to the conversation",
            )
            .action((question, options) => {
                const globalOptions = program.opts();
                const mergedOptions = {
                    ...globalOptions,
                    ...options,
                };
                askCommandAction(question || "", mergedOptions);
            });

        // Add other commands
        program.addCommand(listCommand);
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

main().catch((error) => {
    ioManager.displayError(`Unhandled error: ${error}`);
    process.exit(1);
});

export default main;
