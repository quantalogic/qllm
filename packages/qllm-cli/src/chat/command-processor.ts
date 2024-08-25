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
    clear: this.clearConversation,
    new: this.newConversation,
    list: this.listMessages,
    conversations: this.listConversations,
    display: this.displayConversation,
    select: this.selectConversation,
    delete: this.deleteConversation,
    deleteall: this.deleteAllConversations,
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
      spinner.success({ text: "Models fetched successfully" });
      const modelData = models.map((model) => [
        model.id,
        model.description || "N/A",
      ]);
      ioManager.displayTable(["Model ID", "Description"], modelData);
    } catch (error) {
      spinner.error({
        text: `Failed to list models: ${(error as Error).message}`,
      });
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
    } catch (error) {
      // Error handling is done in ImageManager
    }
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

  private async clearConversation(
    args: string[],
    { conversationId, conversationManager, ioManager }: CommandContext
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
    { conversationManager, ioManager }: CommandContext
  ): Promise<void> {
    const newConversation = await conversationManager.createConversation();
    ioManager.displaySuccess(
      `New conversation started. ID: ${newConversation.id}`
    );
  }

  private async listMessages(
    args: string[],
    cmdContext: CommandContext
  ): Promise<void> {
    const { conversationId, ioManager } = cmdContext;
    if (!conversationId) {
      ioManager.displayError("No active conversation.");
      return;
    }
    await this.displayConversation([conversationId], cmdContext);
  }

  private async listConversations(
    args: string[],
    { conversationManager, ioManager }: CommandContext
  ): Promise<void> {
    const conversations = await conversationManager.listConversations();
    ioManager.displayInfo("All conversations:");
    conversations.forEach((conversation, index) => {
      ioManager.displayInfo(
        `${index + 1}. ID: ${
          conversation.id
        }, Created: ${conversation.metadata.createdAt.toLocaleString()}`
      );
    });
  }

  private async displayConversation(
    args: string[],
    { conversationManager, ioManager }: CommandContext
  ): Promise<void> {
    const conversationId = args[0];
    if (!conversationId) {
      ioManager.displayError("Please provide a conversation ID.");
      return;
    }

    try {
      const conversation = await conversationManager.getConversation(
        conversationId
      );
      const messages = conversation.messages;

      // Display conversation header
      ioManager.displayInfo(`Conversation ${conversationId}`);
      ioManager.displayInfo(
        `Title: ${conversation.metadata.title || "Untitled"}`
      );
      ioManager.displayInfo(
        `Created: ${conversation.metadata.createdAt.toLocaleString()}`
      );
      ioManager.displayInfo(
        `Updated: ${conversation.metadata.updatedAt.toLocaleString()}`
      );
      ioManager.displayInfo(`Messages: ${messages.length}`);
      ioManager.newLine();

      // Display messages
      messages.forEach((message, index) => {
        const roleColor = message.role === "user" ? "green" : "blue";
        const formattedContent = this.formatMessageContent(message.content);
        const timestamp = message.timestamp
          ? `[${message.timestamp.toLocaleTimeString()}] `
          : "";

        ioManager.displayInfo(`${index + 1}. ${message.role.toUpperCase()}`);
        ioManager.displayInfo(`   ${timestamp}${formattedContent}`);

        if (message.providerId) {
          ioManager.displayInfo(`   Provider: ${message.providerId}`);
        }

        if (index < messages.length - 1) {
          ioManager.newLine();
        }
      });
    } catch (error) {
      ioManager.displayError(
        `Failed to display conversation: ${(error as Error).message}`
      );
    }
  }

  private formatMessageContent(content: any): string {
    if (typeof content === "string") {
      return content;
    } else if (content.type === "text") {
      return content.text;
    } else if (content.type === "image_url") {
      return `[Image: ${content.url}]`;
    } else if (Array.isArray(content)) {
      return content
        .map((item) => this.formatMessageContent(item))
        .join("\n   ");
    } else {
      return JSON.stringify(content, null, 2);
    }
  }

  private async selectConversation(
    args: string[],
    { conversationManager, ioManager }: CommandContext
  ): Promise<void> {
    const conversationId = args[0];
    if (!conversationId) {
      ioManager.displayError("Please provide a conversation ID.");
      return;
    }
    try {
      await conversationManager.getConversation(conversationId);
      ioManager.displaySuccess(
        `Conversation ${conversationId} selected as current conversation.`
      );
    } catch (error) {
      ioManager.displayError(
        `Failed to select conversation: ${(error as Error).message}`
      );
    }
  }

  private async deleteConversation(
    args: string[],
    { conversationManager, ioManager }: CommandContext
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
    { conversationManager, ioManager }: CommandContext
  ): Promise<void> {
    await conversationManager.deleteAllConversations();
    ioManager.displaySuccess("All conversations deleted.");
  }

  private async showHelp(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    ioManager.displayTitle("Available Commands");

    const helpGroups = [
      {
        title: "Chat Management",
        commands: [
          { command: "/stop", description: "Stop the chat session" },
          { command: "/clear", description: "Clear the current conversation" },
          { command: "/new", description: "Start a new conversation" },
          {
            command: "/list",
            description: "Display all messages in the current conversation",
          },
          {
            command: "/conversations",
            description: "List all past conversations",
          },
          {
            command: "/display <id>",
            description: "Display a past conversation",
          },
          {
            command: "/select <id>",
            description: "Select a past conversation as current",
          },
          {
            command: "/delete <id>",
            description: "Delete a past conversation",
          },
          {
            command: "/deleteall",
            description: "Delete all past conversations",
          },
        ],
      },
      {
        title: "Model and Provider Settings",
        commands: [
          {
            command: "/models [provider]",
            description:
              "List available models (optionally for a specific provider)",
          },
          { command: "/providers", description: "List available providers" },
          { command: "/model <name>", description: "Set the model" },
          { command: "/provider <name>", description: "Set the provider" },
          { command: "/options", description: "Display current options" },
          { command: "/set <option> <value>", description: "Set an option" },
        ],
      },
      {
        title: "Image Handling",
        commands: [
          {
            command: "/image <url>",
            description: "Add an image to the current query",
          },
          {
            command: "/clearimages",
            description: "Clear all images from the buffer",
          },
          {
            command: "/listimages",
            description: "Display the list of images in the buffer",
          },
          {
            command: "/removeimage <url>",
            description: "Remove a specific image from the buffer",
          },
        ],
      },
      {
        title: "Help",
        commands: [{ command: "/help", description: "Show this help message" }],
      },
    ];

    helpGroups.forEach((group) => {
      ioManager.displaySectionHeader(group.title);
      const tableData = group.commands.map((cmd) => [
        cmd.command,
        cmd.description,
      ]);
      ioManager.displayTable(["Command", "Description"], tableData);
      ioManager.newLine();
    });

    ioManager.displayInfo(
      "Tip: You can use '/help <command>' for more detailed information about a specific command."
    );

    return Promise.resolve();
  }
}
