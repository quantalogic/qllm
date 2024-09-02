// packages/qllm-cli/src/commands/chat-command.ts

import { Command } from "commander";
import { getListProviderNames, getLLMProvider } from "qllm-lib";
import { Chat } from "../chat/chat";
import { chatConfig } from "../chat/chat-config";
import { ioManager } from "../utils/io-manager";
import { CliConfigManager } from "../utils/cli-config-manager";
import {
    ChatCommandOptions,
    ChatCommandOptionsSchema,
} from "../types/chat-command-options";
import { IOManager } from "../utils/io-manager";
import { validateOptions } from "../utils/validate-options";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "../constants";

const chatAction = async (options: ChatCommandOptions) => {
    try {
        await chatConfig.initialize();

        let validOptions = options;

        try {
            // validate use zod schema
            validOptions = await validateOptions(
                ChatCommandOptionsSchema,
                options,
                new IOManager(),
            );
        } catch (error) {
            if (error instanceof Error) {
                ioManager.displayError(
                    `An error occurred while validating the options: ${error.message}`,
                );
                process.exit(1);
            }
        }

        const providerName =
            validOptions.provider ||
            CliConfigManager.getInstance().get("defaultProvider") ||
            DEFAULT_MODEL;
        const modelName =
            validOptions.model ||
            CliConfigManager.getInstance().get("defaultModel") ||
            DEFAULT_PROVIDER;

        const availableProviders = getListProviderNames();
        if (!availableProviders.includes(providerName)) {
            ioManager.displayWarning(
                `Invalid provider "${providerName}". Available providers: ${availableProviders.join(
                    ", ",
                )}`,
            );
            ioManager.displayInfo(
                "Use the 'configure' command to set a valid provider.",
            );
            ioManager.displayInfo(
                "Use the '/providers' command to see available providers.",
            );
        }

        chatConfig.set("maxTokens", validOptions.maxTokens);
        chatConfig.set("temperature", validOptions.temperature);
        chatConfig.set("topP", validOptions.topP);
        chatConfig.set("frequencyPenalty", validOptions.frequencyPenalty);
        chatConfig.set("presencePenalty", validOptions.presencePenalty);
        chatConfig.set("stopSequence", validOptions.stopSequence);

        const provider = await getLLMProvider(providerName);
        const models = await provider.listModels();

        if (!models.some((m) => m.id === modelName)) {
            ioManager.displayWarning(
                `Invalid model "${modelName}" for provider "${providerName}".`,
            );
            ioManager.displayInfo("Available models:");
            models.forEach((m) => ioManager.displayInfo(`- ${m.id}`));
            ioManager.displayInfo(
                "Use the 'configure' command to set a valid model.",
            );
            ioManager.displayInfo(
                "Use the '/models' command to see available models.",
            );
        }

        const chat = new Chat(providerName, modelName);

        await chat.start();
    } catch (error) {
        ioManager.displayError("An error occurred while starting the chat:");
        console.error(error);
    }
};

export const chatCommand = new Command("chat")
    .description("Start an interactive chat session with an LLM")
    .option("-p, --provider <provider>", "LLM provider to use")
    .option("-m, --model <model>", "Model to use")
    .option(
        "--max-tokens <number>",
        "Maximum number of tokens to generate",
        parseInt,
    )
    .option(
        "--temperature <number>",
        "Temperature for response generation",
        parseFloat,
    )
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
    .action(chatAction);
