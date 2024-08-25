// packages/qllm-cli/src/chat/command-processor.ts

import {
  ConversationManager,
  getLLMProvider,
  getListProviderNames,
} from "qllm-lib";
import { ChatConfig } from "./chat-config";
import { ConfigManager } from "./config-manager";
import { IOManager } from "./io-manager";
import { DEFAULT_PROVIDER } from "../constants";
import ImageManager from "./image-manager";

interface CommandContext {
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
    models: this.listModels,
    providers: this.listProviders,
    stop: this.stopChat,
    model: this.setModel,
    provider: this.setProvider,
    image: this.addImage,
    options: this.displayCurrentOptions,
    set: this.setOption,
    help: this.showHelp,
    clearimages: this.clearImages,
    listimages: this.listImages,
    removeimage: this.removeImage,
  };

  async processCommand(
    command: string,
    args: string[],
    context: CommandContext
  ): Promise<void> {
    const handler = this.commands[command] || this.showHelp;
    await handler.call(this, args, context);
  }

  private async listModels(
    args: string[],
    { ioManager, configManager }: CommandContext
  ): Promise<void> {
    const argProviderName = args.length > 0 ? args[0] : null;
    const spinner = ioManager.createSpinner("Fetching models...");
    spinner.start();

    try {
      const config = configManager.getConfig();
      const providerName =
        argProviderName || config.getProvider() || DEFAULT_PROVIDER;
      const provider = await getLLMProvider(providerName);
      const models = await provider.listModels();
      spinner.success("Models fetched successfully");

      const modelData = models.map((model) => [
        model.id,
        model.description || "N/A",
      ]);
      ioManager.displayTable(["Model ID", "Description"], modelData);
    } catch (error) {
      spinner.error(`Failed to list models: ${(error as Error).message}`);
    }
  }

  private listProviders(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    const providers = getListProviderNames();
    ioManager.displayTable(
      ["Provider"],
      providers.map((p) => [p])
    );
    return Promise.resolve();
  }

  private stopChat(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    ioManager.displaySystemMessage("Stopping chat session...");
    ioManager.close();
    process.exit(0);
  }

  private async setModel(
    args: string[],
    { configManager, ioManager }: CommandContext
  ): Promise<void> {
    const modelName = args.join(" ");
    if (!modelName) {
      ioManager.displayError("Please provide a model name.");
      return;
    }

    if (modelName.includes("/")) {
      const [providerName, model] = modelName.split("/");
      await configManager.setProvider(providerName);
      configManager.setModel(model);
    } else {
      configManager.setModel(modelName);
    }
  }

  private async setProvider(
    args: string[],
    { configManager, ioManager }: CommandContext
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
    { conversationId, ioManager, imageManager }: CommandContext
  ): Promise<void> {
    const imageUrl = args[0];
    if (!imageUrl) {
      ioManager.displayError("Please provide an image URL or local file path.");
      return;
    }

    if (!conversationId) {
      ioManager.displayError(
        "No active conversation. Please start a chat first."
      );
      return;
    }

    try {
      imageManager.addImage(imageUrl);
    } catch (error) {}
  }

  private displayCurrentOptions(
    args: string[],
    { configManager, ioManager }: CommandContext
  ): Promise<void> {
    const config = configManager.getConfig();
    const options = [
      ["provider", "Provider", configManager.getProvider() || "Not set"],
      ["model", "Model", configManager.getModel() || "Not set"],
      [
        "temperature",
        "Temperature",
        config.getTemperature()?.toString() || "Not set",
      ],
      [
        "max_tokens",
        "Max Tokens",
        config.getMaxTokens()?.toString() || "Not set",
      ],
      ["top_p", "Top P", config.getTopP()?.toString() || "Not set"],
      [
        "frequency_penalty",
        "Frequency Penalty",
        config.getFrequencyPenalty()?.toString() || "Not set",
      ],
      [
        "presence_penalty",
        "Presence Penalty",
        config.getPresencePenalty()?.toString() || "Not set",
      ],
      [
        "stop_sequence",
        "Stop Sequence",
        config.getStopSequence()?.join(", ") || "Not set",
      ],
    ];

    ioManager.displayTable(["ID", "Option", "Value"], options);
    return Promise.resolve();
  }

  private async setOption(
    args: string[],
    { configManager, ioManager }: CommandContext
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
    { imageManager, ioManager }: CommandContext
  ): Promise<void> {
    imageManager.clearImages();
    ioManager.displaySuccess("All images cleared from the buffer.");
    return Promise.resolve();
  }

  private listImages(
    args: string[],
    { imageManager, ioManager }: CommandContext
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
    { imageManager, ioManager }: CommandContext
  ): Promise<void> {
    const imageUrl = args[0];
    if (!imageUrl) {
      ioManager.displayError(
        "Please provide an image URL or local file path to remove."
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

  private showHelp(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    ioManager.displaySystemMessage("Available commands:");
    ioManager.displayList([
      "/models - List available models",
      "/providers - List available providers",
      "/stop - Stop the chat session",
      "/model <name> - Set the model",
      "/provider <name> - Set the provider",
      "/image <url> - Add an image to the current query",
      "/options - Display current options",
      "/set <option> <value> - Set an option",
      "/clearimages - Clear all images from the buffer",
      "/listimages - Display the list of images in the buffer",
      "/removeimage <url> - Remove a specific image from the buffer",
      "/help - Show this help message",
    ]);
    return Promise.resolve();
  }
}
