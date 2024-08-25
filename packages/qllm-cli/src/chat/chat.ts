// packages/qllm-cli/src/chat/chat.ts

import {
  ConversationManager,
  LLMProvider,
  ChatMessage,
} from "qllm-lib";
import { createConversationManager, getLLMProvider } from "qllm-lib";
import readline from "readline";
import kleur from "kleur";
import { createSpinner } from "nanospinner";
import { imageToBase64 } from "qllm-lib";
import { ChatConfig } from "./chat-config";
import { output } from "../utils/output";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "../constants";

export class Chat {
  private conversationManager: ConversationManager;
  private provider!: LLMProvider;
  private rl: readline.Interface;
  private conversationId: string | null = null;
  private config: ChatConfig;
  private validOptions = [
    "temperature",
    "max_tokens",
    "top_p",
    "frequency_penalty",
    "presence_penalty",
    "stop_sequence",
  ];

  constructor(private providerName: string, private modelName: string) {
    this.conversationManager =
      createConversationManager() as ConversationManager;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.config = ChatConfig.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      await this.config.initialize();
      this.provider = await getLLMProvider(this.providerName);
      this.config.setProvider(this.providerName);
      this.config.setModel(this.modelName);
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
    const conversation = await this.conversationManager.createConversation({
      metadata: { title: "CLI Chat Session" },
      providerIds: [this.providerName],
    });
    this.conversationId = conversation.id;
    output.info(
      "Chat session started. Type your messages or use special commands."
    );
    output.info("Type /help for available commands.");
    this.promptUser();
  }

  private promptUser(): void {
    this.rl.question(kleur.green("You: "), async (input) => {
      if (input.startsWith("/")) {
        await this.handleSpecialCommand(input);
      } else {
        await this.sendMessage(input);
      }
      this.promptUser();
    });
  }

  private async handleSpecialCommand(input: string): Promise<void> {
    const [command, ...args] = input.slice(1).split(" ");
    switch (command) {
      case "models":
        await this.listModels();
        break;
      case "providers":
        this.listProviders();
        break;
      case "stop":
        this.stopChat();
        break;
      case "model":
        await this.setModel(args.join(" "));
        break;
      case "provider":
        await this.setProvider(args[0]);
        break;
      case "image":
        await this.addImage(args[0]);
        break;
      case "options":
        this.displayCurrentOptions();
        break;
      case "set":
        await this.setOption(args[0], args.slice(1).join(" "));
        break;
      case "help":
      default:
        this.showHelp();
        break;
    }
  }

  private async listModels(): Promise<void> {
    const spinner = createSpinner("Fetching models...").start();
    try {
      const models = await this.provider.listModels();
      spinner.success({ text: "Models fetched successfully" });
      const modelData = models.map((model) => [
        model.id,
        model.description || "N/A",
      ]);
      output.table(["Model ID", "Description"], modelData);
    } catch (error) {
      spinner.error({
        text: `Failed to list models: ${(error as Error).message}`,
      });
    }
  }

  private listProviders(): void {
    const providers = ["openai", "anthropic", "ollama", "groq"];
    output.table(
      ["Provider"],
      providers.map((p) => [p])
    );
  }

  private stopChat(): void {
    output.info("Stopping chat session...");
    this.rl.close();
    process.exit(0);
  }

  private async setModel(modelName: string): Promise<void> {
    if (!modelName) {
      output.error("Please provide a model name.");
      return;
    }
    if (modelName.includes("/")) {
      const [providerName, model] = modelName.split("/");
      await this.setProvider(providerName);
      modelName = model;
    }
    this.config.setModel(modelName);
    output.success(`Model set to: ${this.config.getModel()}`);
  }

  private async setProvider(providerName: string): Promise<void> {
    if (!providerName) {
      output.error("Please provide a provider name.");
      return;
    }
    this.config.setProvider(providerName);
    this.provider = await getLLMProvider(providerName);
    output.success(`Provider set to: ${this.config.getProvider()}`);
  }

  private async addImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      output.error("Please provide an image URL or local file path.");
      return;
    }
    if (!this.conversationId) {
      output.error("No active conversation. Please start a chat first.");
      return;
    }
    const spinner = createSpinner("Processing image...").start();
    try {
      const base64Image = await imageToBase64(imageUrl);
      await this.conversationManager.addMessage(this.conversationId, {
        role: "user",
        content: [
          {
            type: "image_url",
            url: `data:${base64Image.mimeType};base64,${base64Image.base64}`,
          },
        ],
        providerId: this.config.getProvider() || DEFAULT_PROVIDER,
      });
      spinner.success({ text: "Image added to the conversation." });
    } catch (error) {
      spinner.error({
        text: `Failed to add image: ${(error as Error).message}`,
      });
    }
  }

  private displayCurrentOptions(): void {
    const options = [
      ["provider", "Provider", this.config.getProvider() || "Not set"],
      ["model", "Model", this.config.getModel() || "Not set"],
      ["temperature", "Temperature", this.config.getTemperature()?.toString() || "Not set"],
      ["max_tokens", "Max Tokens", this.config.getMaxTokens()?.toString() || "Not set"],
      ["top_p", "Top P", this.config.getTopP()?.toString() || "Not set"],
      ["frequency_penalty", "Frequency Penalty", this.config.getFrequencyPenalty()?.toString() || "Not set"],
      ["presence_penalty", "Presence Penalty", this.config.getPresencePenalty()?.toString() || "Not set"],
      ["stop_sequence", "Stop Sequence", this.config.getStopSequence()?.join(", ") || "Not set"],
    ];
    output.table(["ID", "Option", "Value"], options);
  }

  private async setOption(option: string, value: string): Promise<void> {
    const evalOption = option?.trim().toLowerCase();

    if (!this.validOptions.includes(evalOption)) {
      output.error(`Unknown option: ${option}`);
      output.info("Valid options are:");
      this.validOptions.forEach((opt) => output.info(`- ${opt}`));
      return;
    }

    switch (evalOption) {
      case "temperature":
        this.config.setTemperature(parseFloat(value));
        break;
      case "max_tokens":
        this.config.setMaxTokens(parseInt(value, 10));
        break;
      case "top_p":
        this.config.setTopP(parseFloat(value));
        break;
      case "frequency_penalty":
        this.config.setFrequencyPenalty(parseFloat(value));
        break;
      case "presence_penalty":
        this.config.setPresencePenalty(parseFloat(value));
        break;
      case "stop_sequence":
        this.config.setStopSequence(value.split(","));
        break;
    }

    output.success(`Option ${evalOption} set to: ${value}`);
  }

  private showHelp(): void {
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
  }

  private async sendMessage(message: string): Promise<void> {
    if (!this.conversationId) {
      output.error("No active conversation. Please start a chat first.");
      return;
    }
    await this.conversationManager.addMessage(this.conversationId, {
      role: "user",
      content: { type: "text", text: message },
      providerId: this.config.getProvider() || DEFAULT_PROVIDER,
    });
    const history = await this.conversationManager.getHistory(
      this.conversationId
    );
    const messages: ChatMessage[] = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const spinner = createSpinner("Generating response...").start();
    let chunkNumber = 0;
    try {
      let fullResponse = "";
      for await (const chunk of this.provider.streamChatCompletion({
        messages,
        options: {
          model: this.config.getModel() || DEFAULT_MODEL,
          temperature: this.config.getTemperature(),
          maxTokens: this.config.getMaxTokens(),
          topProbability: this.config.getTopP(),
          frequencyPenalty: this.config.getFrequencyPenalty(),
          presencePenalty: this.config.getPresencePenalty(),
          stop: this.config.getStopSequence(),
        },
      })) {
        if(chunkNumber === 0) {
          spinner.stop();
          process.stdout.write('\r\x1b[K'); // Clear the entire line
          spinner.clear();
          output.info("\nAssistant: ");
        }
        if (chunk.text) {
          process.stdout.write(chunk.text);
          fullResponse += chunk.text;
        }
        chunkNumber++;
      }
      console.log("\n");
      await this.saveResponse(fullResponse);
    } catch (error) {
      spinner.error({
        text: `Error generating response: ${(error as Error).message}`,
      });
    }
  }

  private async saveResponse(response: string): Promise<void> {
    if (!this.conversationId) return;
    await this.conversationManager.addMessage(this.conversationId, {
      role: "assistant",
      content: { type: "text", text: response },
      providerId: this.config.getProvider() || DEFAULT_PROVIDER,
    });
  }

  setMaxTokens(maxTokens: number): void {
    this.config.setMaxTokens(maxTokens);
  }

  setTemperature(temperature: number): void {
    this.config.setTemperature(temperature);
  }

  setTopP(topP: number): void {
    this.config.setTopP(topP);
  }

  setFrequencyPenalty(frequencyPenalty: number): void {
    this.config.setFrequencyPenalty(frequencyPenalty);
  }

  setPresencePenalty(presencePenalty: number): void {
    this.config.setPresencePenalty(presencePenalty);
  }

  setStopSequence(stopSequence: string[]): void {
    this.config.setStopSequence(stopSequence);
  }
}
