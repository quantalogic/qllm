// packages/qllm-cli/src/chat/command-processor.ts
import { ConversationManager, LLMProvider } from "qllm-lib";
import { createSpinner } from "nanospinner";
import { output } from "../utils/output";
import { ChatConfig } from "./chat-config";
import { ConfigManager } from "./config-manager";
import { IOManager } from "./io-manager";

interface CommandContext {
  config: ChatConfig;
  configManager: ConfigManager;
  provider: LLMProvider;
  conversationId: string | null;
  conversationManager: ConversationManager;
  ioManager: IOManager;
}

export class CommandProcessor {
  private commands: Record<string, (args: string[], context: CommandContext) => Promise<void>> = {
    models: this.listModels,
    providers: this.listProviders,
    stop: this.stopChat,
    model: this.setModel,
    provider: this.setProvider,
    image: this.addImage,
    options: this.displayCurrentOptions,
    set: this.setOption,
    help: this.showHelp,
  };

  async processCommand(command: string, args: string[], context: CommandContext): Promise<void> {
    const handler = this.commands[command] || this.showHelp;
    await handler.call(this, args, context);
  }

  private async listModels(args: string[], { provider }: CommandContext): Promise<void> {
    const spinner = createSpinner("Fetching models...").start();
    try {
      const models = await provider.listModels();
      spinner.success({ text: "Models fetched successfully" });
      const modelData = models.map((model) => [model.id, model.description || "N/A"]);
      output.table(["Model ID", "Description"], modelData);
    } catch (error) {
      spinner.error({ text: `Failed to list models: ${(error as Error).message}` });
    }
  }

  private listProviders(args: string[], context: CommandContext): Promise<void> {
    const providers = ["openai", "anthropic", "ollama", "groq"];
    output.table(["Provider"], providers.map((p) => [p]));
    return Promise.resolve();
  }

  private stopChat(args: string[], { ioManager }: CommandContext): Promise<void> {
    output.info("Stopping chat session...");
    ioManager.close();
    process.exit(0);
  }

  private async setModel(args: string[], { configManager }: CommandContext): Promise<void> {
    const modelName = args.join(" ");
    if (!modelName) {
      output.error("Please provide a model name.");
      return;
    }
    if (modelName.includes("/")) {
      const [providerName, model] = modelName.split("/");
      await configManager.setProvider(providerName);
      configManager.setModel(model);
    } else {
      configManager.setModel(modelName);
    }
    output.success(`Model set to: ${configManager.getModel()}`);
  }

  private async setProvider(args: string[], { configManager }: CommandContext): Promise<void> {
    const providerName = args[0];
    if (!providerName) {
      output.error("Please provide a provider name.");
      return;
    }
    await configManager.setProvider(providerName);
    output.success(`Provider set to: ${configManager.getProvider()}`);
  }

  private async addImage(args: string[], { conversationId, conversationManager, configManager }: CommandContext): Promise<void> {
    const imageUrl = args[0];
    if (!imageUrl) {
      output.error("Please provide an image URL or local file path.");
      return;
    }
    if (!conversationId) {
      output.error("No active conversation. Please start a chat first.");
      return;
    }
    const spinner = createSpinner("Processing image...").start();
    try {
      await conversationManager.addMessage(conversationId, {
        role: "user",
        content: [{ type: "image_url", url: imageUrl }],
        providerId: configManager.getProvider(),
      });
      spinner.success({ text: "Image added to the conversation." });
    } catch (error) {
      spinner.error({ text: `Failed to add image: ${(error as Error).message}` });
    }
  }

  private displayCurrentOptions(args: string[], { configManager }: CommandContext): Promise<void> {
    const options = configManager.getAllSettings();
    const optionsTable = Object.entries(options).map(([key, value]) => [key, value?.toString() || "Not set"]);
    output.table(["Option", "Value"], optionsTable);
    return Promise.resolve();
  }

  private async setOption(args: string[], { configManager }: CommandContext): Promise<void> {
    const [option, ...valueArgs] = args;
    const value = valueArgs.join(" ");
    if (!option || !value) {
      output.error("Please provide both option and value.");
      return;
    }
    await configManager.setOption(option, value);
    output.success(`Option ${option} set to: ${value}`);
  }

  private showHelp(): Promise<void> {
    output.info("Available commands:");
    output.list([
      "/models - List available models",
      "/providers - List available providers",
      "/stop - Stop the chat session",
      "/model <name> - Set the model",
      "/provider <name> - Set the provider",
      "/image <url> - Add an image to the conversation",
      "/options - Display current options",
      "/set <option> <value> - Set an option",
      "/help - Show this help message",
    ]);
    return Promise.resolve();
  }
}