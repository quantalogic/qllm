// packages/qllm-cli/src/chat/command-processor.ts
import { ConversationManager } from "qllm-lib";
import { ChatConfig } from "./chat-config";
import { ConfigManager } from "./config-manager";
import { IOManager } from "../utils/io-manager";

import ImageManager from "./image-manager";
import { showHelp } from "./commands/show-help";
import { displayCurrentOptions } from "./commands/display-current-options";
import { displayConversation } from "./commands/display-conversation";
import { listModels } from "./commands/list-models";
import { listProviders } from "./commands/list-providers";

export interface CommandContext {
    config: ChatConfig;
    configManager: ConfigManager;
    conversationId: string | null;
    conversationManager: ConversationManager;
    ioManager: IOManager;
    imageManager: ImageManager;
}

export class CommandProcessor {
    private commands: Record<
        string,
        (args: string[], context: CommandContext) => Promise<void>
    > = {
        models: listModels,
        providers: listProviders,
        stop: this.stopChat,
        model: this.setModel,
        provider: this.setProvider,
        image: this.addImage,
        options: displayCurrentOptions,
        set: this.setOption,
        help: showHelp,
        clearimages: this.clearImages,
        listimages: this.listImages,
        removeimage: this.removeImage,
        clear: this.clearConversation,
        new: this.newConversation,
        list: this.listMessages,
        conversations: this.listConversations,
        display: displayConversation,
        select: this.selectConversation,
        delete: this.deleteConversation,
        deleteall: this.deleteAllConversations,
    };

    async processCommand(
        command: string,
        args: string[],
        context: CommandContext,
    ): Promise<void> {
        const handler = this.commands[command] || showHelp;
        await handler.call(this, args, context);
    }

    private stopChat(
        args: string[],
        { ioManager }: CommandContext,
    ): Promise<void> {
        ioManager.displaySystemMessage("Stopping chat session...");
        process.exit(0);
    }

    private async setModel(
        args: string[],
        { configManager, ioManager }: CommandContext,
    ): Promise<void> {
        const modelName = args.join(" ");
        if (!modelName) {
            ioManager.displayError("Please provide a model name.");
            return;
        }
        if (modelName.includes("@")) {
            const [providerName, model] = modelName.split("@");
            await configManager.setProvider(providerName);
            configManager.setModel(model);
        } else {
            configManager.setModel(modelName);
        }
    }

    private async setProvider(
        args: string[],
        { configManager, ioManager }: CommandContext,
    ): Promise<void> {
        const providerName = args[0];
        if (!providerName) {
            ioManager.displayError("Please provide a provider name.");
            return;
        }
        await configManager.setProvider(providerName);
    }

    private async addImage(
        args: string[],
        { conversationId, ioManager, imageManager }: CommandContext,
    ): Promise<void> {
        const imageUrl = args[0];
        if (!imageUrl) {
            ioManager.displayError(
                "Please provide an image URL or local file path.",
            );
            return;
        }
        if (!conversationId) {
            ioManager.displayError(
                "No active conversation. Please start a chat first.",
            );
            return;
        }
        try {
            imageManager.addImage(imageUrl);
        } catch (error) {
            // Error handling is done in ImageManager
        }
    }

    private async setOption(
        args: string[],
        { configManager, ioManager }: CommandContext,
    ): Promise<void> {
        const [option, ...valueArgs] = args;
        const value = valueArgs.join(" ");
        if (!option || !value) {
            ioManager.displayError("Please provide both option and value.");
            return;
        }
        await configManager.setOption(option, value);
    }

    private clearImages(
        args: string[],
        { imageManager, ioManager }: CommandContext,
    ): Promise<void> {
        imageManager.clearImages();
        ioManager.displaySuccess("All images cleared from the buffer.");
        return Promise.resolve();
    }

    private listImages(
        args: string[],
        { imageManager, ioManager }: CommandContext,
    ): Promise<void> {
        const images = imageManager.getImages();
        if (images.length === 0) {
            ioManager.displayInfo("No images in the buffer.");
        } else {
            ioManager.displayInfo(`Images in the buffer (${images.length}):`);
            images.forEach((image, index) => {
                ioManager.displayInfo(`${index + 1}. ${image}`);
            });
        }
        return Promise.resolve();
    }

    private removeImage(
        args: string[],
        { imageManager, ioManager }: CommandContext,
    ): Promise<void> {
        const imageUrl = args[0];
        if (!imageUrl) {
            ioManager.displayError(
                "Please provide an image URL or local file path to remove.",
            );
            return Promise.resolve();
        }
        const removed = imageManager.removeImage(imageUrl);
        if (removed) {
            ioManager.displaySuccess(`Image removed: ${imageUrl}`);
        } else {
            ioManager.displayWarning(`Image not found: ${imageUrl}`);
        }
        return Promise.resolve();
    }

    private async clearConversation(
        args: string[],
        { conversationId, conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        if (!conversationId) {
            ioManager.displayError("No active conversation.");
            return;
        }
        await conversationManager.clearConversation(conversationId);
        ioManager.displaySuccess("Current conversation cleared.");
    }

    private async newConversation(
        args: string[],
        { conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        const newConversation = await conversationManager.createConversation();
        ioManager.displaySuccess(
            `New conversation started. ID: ${newConversation.id}`,
        );
    }

    private async listMessages(
        args: string[],
        cmdContext: CommandContext,
    ): Promise<void> {
        const { conversationId, ioManager } = cmdContext;
        if (!conversationId) {
            ioManager.displayError("No active conversation.");
            return;
        }
        await displayConversation([conversationId], cmdContext);
    }

    private async listConversations(
        args: string[],
        { conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        const conversations = await conversationManager.listConversations();
        ioManager.displayInfo("All conversations:");
        conversations.forEach((conversation, index) => {
            ioManager.displayInfo(
                `${index + 1}. ID: ${
                    conversation.id
                }, Created: ${conversation.metadata.createdAt.toLocaleString()}`,
            );
        });
    }

    private async selectConversation(
        args: string[],
        { conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        const conversationId = args[0];
        if (!conversationId) {
            ioManager.displayError("Please provide a conversation ID.");
            return;
        }
        try {
            await conversationManager.getConversation(conversationId);
            ioManager.displaySuccess(
                `Conversation ${conversationId} selected as current conversation.`,
            );
        } catch (error) {
            ioManager.displayError(
                `Failed to select conversation: ${(error as Error).message}`,
            );
        }
    }

    private async deleteConversation(
        args: string[],
        { conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        const conversationId = args[0];
        if (!conversationId) {
            ioManager.displayError("Please provide a conversation ID.");
            return;
        }
        await conversationManager.deleteConversation(conversationId);
        ioManager.displaySuccess(`Conversation ${conversationId} deleted.`);
    }

    private async deleteAllConversations(
        args: string[],
        { conversationManager, ioManager }: CommandContext,
    ): Promise<void> {
        await conversationManager.deleteAllConversations();
        ioManager.displaySuccess("All conversations deleted.");
    }
}
