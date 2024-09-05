// packages/qllm-cli/src/commands/chat-command.ts

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

declare var process: NodeJS.Process; //eslint-disable-line

export const chatAction = async (options: ChatCommandOptions) => {
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
            CliConfigManager.getInstance().get("provider") ||
            DEFAULT_PROVIDER;
            
        const modelName =
            validOptions.model ||
            CliConfigManager.getInstance().get("model") ||
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

        if (validOptions.maxTokens)
            chatConfig.set("maxTokens", validOptions.maxTokens);
        if (validOptions.temperature)
            chatConfig.set("temperature", validOptions.temperature);
        if (validOptions.topP) chatConfig.set("topP", validOptions.topP);
        if (validOptions.frequencyPenalty)
            chatConfig.set("frequencyPenalty", validOptions.frequencyPenalty);
        if (validOptions.presencePenalty)
            chatConfig.set("presencePenalty", validOptions.presencePenalty);
        if (validOptions.stopSequence)
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
        if (error instanceof Error) {
            ioManager.displayError(error.message);
        } else {
            ioManager.displayError("An unknown error occurred");
        }
    }
};

// Remove the chatCommand export, as it's now defined in the main file
