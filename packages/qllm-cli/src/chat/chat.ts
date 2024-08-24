// src/chat/chat.ts

import { ConversationManager, LLMProvider, ChatMessage, ChatCompletionResponse } from 'qllm-lib';
import { createConversationManager, getLLMProvider } from 'qllm-lib';
import readline from 'readline';
import kleur from 'kleur';
import { table } from 'table';

export class Chat {
  private conversationManager: ConversationManager;
  private provider!: LLMProvider;
  private currentModel: string;
  private rl: readline.Interface;

  constructor(private providerName: string, private modelName: string) {
    this.conversationManager   = createConversationManager() as ConversationManager;
    this.currentModel = modelName;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async initialize(): Promise<void> {
    try {
      this.provider = await getLLMProvider(this.providerName);
      console.log(kleur.green(`Chat initialized with ${this.providerName} provider and ${this.currentModel} model.`));
    } catch (error: unknown) {
      console.error(kleur.red(`Failed to initialize chat: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    const conversation = await this.conversationManager.createConversation({
      metadata: { title: 'CLI Chat Session' },
      providerIds: [this.providerName],
    });

    console.log(kleur.cyan('Chat session started. Type your messages or use special commands.'));
    console.log(kleur.yellow('Type /help for available commands.'));

    this.promptUser(conversation.id);
  }

  private promptUser(conversationId: string): void {
    this.rl.question(kleur.green('You: '), async (input) => {
      if (input.startsWith('/')) {
        await this.handleSpecialCommand(input, conversationId);
      } else {
        await this.sendMessage(input, conversationId);
      }
      this.promptUser(conversationId);
    });
  }

  private async handleSpecialCommand(input: string, conversationId: string): Promise<void> {
    const [command, ...args] = input.slice(1).split(' ');
    switch (command) {
      case 'models':
        await this.listModels();
        break;
      case 'providers':
        this.listProviders();
        break;
      case 'stop':
        this.stopChat();
        break;
      case 'model':
        await this.setModel(args[0]);
        break;
      case 'image':
        await this.addImage(args[0], conversationId);
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  private async listModels(): Promise<void> {
    try {
      const models = await this.provider.listModels();
      const modelData = models.map(model => [model.id, model.description || 'N/A']);
      console.log(kleur.cyan('Available models:'));
      console.log(table([['Model ID', 'Description'], ...modelData]));
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
      console.error(kleur.red(`Failed to list models: ${errorMessage}`));
    }
  }

  private listProviders(): void {
    // This is a placeholder. In a real implementation, you'd fetch this from qllm-lib.
    const providers = ['openai', 'anthropic', 'ollama', 'groq'];
    console.log(kleur.cyan('Available providers:'));
    console.log(table([['Provider'], ...providers.map(p => [p])]));
  }

  private stopChat(): void {
    console.log(kleur.yellow('Stopping chat session...'));
    this.rl.close();
    process.exit(0);
  }

  private async setModel(modelName: string): Promise<void> {
    if (!modelName) {
      console.log(kleur.red('Please provide a model name.'));
      return;
    }
    this.currentModel = modelName;
    console.log(kleur.green(`Model set to: ${this.currentModel}`));
  }

  private async addImage(imageUrl: string, conversationId: string): Promise<void> {
    if (!imageUrl) {
      console.log(kleur.red('Please provide an image URL or local file path.'));
      return;
    }
    await this.conversationManager.addMessage(conversationId, {
      role: 'user',
      content: [{ type: 'image_url', url: imageUrl }],
      providerId: this.providerName,
    });
    console.log(kleur.green('Image added to the conversation.'));
  }

  private showHelp(): void {
    console.log(kleur.cyan('Available commands:'));
    console.log(kleur.yellow('/models') + ' - List available models');
    console.log(kleur.yellow('/providers') + ' - List available providers');
    console.log(kleur.yellow('/stop') + ' - Stop the chat session');
    console.log(kleur.yellow('/model <name>') + ' - Set the model');
    console.log(kleur.yellow('/image <url>') + ' - Add an image to the conversation');
    console.log(kleur.yellow('/help') + ' - Show this help message');
  }

  private async sendMessage(message: string, conversationId: string): Promise<void> {
    await this.conversationManager.addMessage(conversationId, {
      role: 'user',
      content: { type: 'text', text: message },
      providerId: this.providerName,
    });

    const history = await this.conversationManager.getHistory(conversationId);
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await this.provider.generateChatCompletion({
        messages,
        options: { model: this.currentModel },
      });
      await this.displayResponse(response, conversationId);
    } catch (error) {
      console.error(kleur.red(`Error generating response: ${(error as Error).message}`));
    }
  }

  private async displayResponse(response: ChatCompletionResponse, conversationId: string): Promise<void> {
    console.log(kleur.blue('Assistant: ') + response.text);
    await this.conversationManager.addMessage(conversationId, {
      role: 'assistant',
      content: { type: 'text', text: response.text ?? '' },
      providerId: this.providerName,
    });
  }
}