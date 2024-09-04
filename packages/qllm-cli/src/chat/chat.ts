// packages/qllm-cli/src/chat/chat.ts
import { ConversationManager, LLMProvider, ChatMessage } from "qllm-lib";
import { createConversationManager, getLLMProvider } from "qllm-lib";
import { ChatConfig } from "./chat-config";
import { MessageHandler } from "./message-handler";
import { CommandProcessor } from "./command-processor";
import { IOManager } from "../utils/io-manager";
import { ConfigManager } from "./config-manager";
import { ioManager } from "../utils/io-manager";
import ImageManager from "./image-manager";

declare var process: NodeJS.Process; //eslint-disable-line

export class Chat {
    private conversationManager: ConversationManager;
    private conversationId: string | null = null;
    private config: ChatConfig;
    private messageHandler: MessageHandler;
    private commandProcessor: CommandProcessor;
    private ioManager: IOManager;
    private configManager: ConfigManager;
    private imageManager: ImageManager;

    constructor(
        private readonly providerName: string,
        private readonly modelName: string,
    ) {
        this.conversationManager = createConversationManager();
        this.config = ChatConfig.getInstance();
        this.imageManager = new ImageManager();
        this.configManager = new ConfigManager(this.config);
        this.messageHandler = new MessageHandler(
            this.conversationManager,
            this.configManager,
        );
        this.commandProcessor = new CommandProcessor();
        this.ioManager = new IOManager();
    }

    async initialize(): Promise<void> {
        try {
            await this.config.initialize();
            this.configManager.setProvider(this.providerName);
            this.configManager.setModel(this.modelName);
            ioManager.displaySuccess(
                `Chat initialized with ${this.providerName} provider and ${this.modelName} model.`,
            );
        } catch (error) {
            ioManager.displayError(
                `Failed to initialize chat: ${(error as Error).message}`,
            );
            process.exit(1);
        }
    }

    async start(): Promise<void> {
        await this.initialize();
        const conversation =
            await this.conversationManager.createConversation();
        this.conversationId = conversation.id;
        ioManager.displayInfo(
            "Chat session started. Type your messages or use special commands.",
        );
        ioManager.displayInfo("Type /help for available commands.");
        this.promptUser();
    }

    private async promptUser(): Promise<void> {
        try {
            const input = await this.ioManager.getUserInput("You: ");

            // Check if input is undefined (e.g., due to Ctrl+C)
            if (input === undefined) {
                process.exit(0);
            }

            if (input.trim() === "") {
                return;
            }

            if (input.startsWith("/")) {
                await this.handleSpecialCommand(input);
            } else {
                await this.sendUserMessage(
                    input,
                    this.imageManager.getImages(),
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                ioManager.displayError(
                    `Error getting user input:  $error.message`,
                );
            } else {
                ioManager.displayError(
                    `Error getting user input:  ${String(error)}`,
                );
            }
        } finally {
            // Continue prompting the user
            this.promptUser();
        }
    }

    private async handleSpecialCommand(input: string): Promise<void> {
        try {
            const [command, ...args] = input.trim().split(/\s+/);
            if (!command) {
                ioManager.displayError("No command provided");
                return;
            }
            const cleanCommand = command.substring(1).toLowerCase();
            const context = {
                config: this.config,
                configManager: this.configManager,
                conversationId: this.conversationId,
                conversationManager: this.conversationManager,
                ioManager: this.ioManager,
                imageManager: this.imageManager,
            };
            await this.commandProcessor.processCommand(
                cleanCommand,
                args,
                context,
            );
        } catch (error) {
            ioManager.displayError(
                "Error processing special command: " +
                    (error instanceof Error ? error.message : String(error)),
            );
        }
    }

    private async sendUserMessage(
        message: string,
        images: string[],
    ): Promise<void> {
        if (!this.conversationId) {
            ioManager.displayError(
                "No active conversation. Please start a chat first.",
            );
            return;
        }
        const currentProviderName = this.configManager.getProvider();
        const provider = await getLLMProvider(currentProviderName);
        const messages = await this.conversationManager.getHistory(
            this.conversationId,
        );
        await this.messageHandler.generateAndSaveResponse(
            provider,
            message,
            images,
            messages,
            this.conversationId,
        );
    }
}
