// packages/qllm-cli/src/chat/chat.ts
import { ConversationManager, LLMProvider, ChatMessage } from "qllm-lib";
import { createConversationManager, getLLMProvider } from "qllm-lib";
import { ChatConfig } from "./chat-config";
import { MessageHandler } from "./message-handler";
import { CommandProcessor } from "./command-processor";
import { IOManager } from "./io-manager";
import { ConfigManager } from "./config-manager";
import { output } from "../utils/output";

export class Chat {
  private conversationManager: ConversationManager;
  private conversationId: string | null = null;
  private config: ChatConfig;
  private messageHandler: MessageHandler;
  private commandProcessor: CommandProcessor;
  private ioManager: IOManager;
  private configManager: ConfigManager;

  constructor(
    private readonly providerName: string,
    private readonly modelName: string
  ) {
    this.conversationManager = createConversationManager();
    this.config = ChatConfig.getInstance();
    this.configManager = new ConfigManager(this.config);
    this.messageHandler = new MessageHandler(
      this.conversationManager,
      this.configManager
    );
    this.commandProcessor = new CommandProcessor();
    this.ioManager = new IOManager();
  }

  async initialize(): Promise<void> {
    try {
      await this.config.initialize();
      this.configManager.setProvider(this.providerName);
      this.configManager.setModel(this.modelName);
      output.success(
        `Chat initialized with ${this.providerName} provider and ${this.modelName} model.`
      );
    } catch (error) {
      output.error(`Failed to initialize chat: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    const conversation = await this.conversationManager.createConversation();
    this.conversationId = conversation.id;
    output.info(
      "Chat session started. Type your messages or use special commands."
    );
    output.info("Type /help for available commands.");
    this.promptUser();
  }

  private promptUser(): void {
    this.ioManager.getUserInput("You: ", async (input) => {
      if (input.startsWith("/")) {
        await this.handleSpecialCommand(input);
      } else {
        await this.sendUserMessage(input);
      }
      this.promptUser();
    });
  }

  private async handleSpecialCommand(input: string): Promise<void> {
    const [command, ...args] = input.slice(1).split(" ");
    await this.commandProcessor.processCommand(command, args, {
      config: this.config,
      configManager: this.configManager,
      conversationId: this.conversationId,
      conversationManager: this.conversationManager,
      ioManager: this.ioManager,
    });
  }

  private async sendUserMessage(message: string): Promise<void> {
    if (!this.conversationId) {
      output.error("No active conversation. Please start a chat first.");
      return;
    }

    const currentProviderName = this.configManager.getProvider();

    const provider = await getLLMProvider(currentProviderName);
    const messages = await this.conversationManager.getHistory(
      this.conversationId
    );

    console.dir(messages, { depth: null });

    await this.messageHandler.generateAndSaveResponse(
      provider,
      message,
      messages,
      this.conversationId
    );
  }
}
