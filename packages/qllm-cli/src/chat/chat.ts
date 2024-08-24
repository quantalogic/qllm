// src/chat/chat.ts

import { ConversationManager, LLMProvider, ChatMessage, ChatCompletionResponse, ChatStreamCompletionResponse } from 'qllm-lib';
import { createConversationManager, getLLMProvider } from 'qllm-lib';
import readline from 'readline';
import kleur from 'kleur';
import { table } from 'table';
import { createSpinner } from 'nanospinner';
import { imageToBase64 } from 'qllm-lib';

export class Chat {
  private conversationManager: ConversationManager;
  private provider!: LLMProvider; 
  private currentModel: string;
  private rl: readline.Interface;
  private conversationId: string | null = null;

  constructor(private providerName: string, private modelName: string) {
    this.conversationManager = createConversationManager() as ConversationManager;
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
    } catch (error) {
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
    this.conversationId = conversation.id;

    console.log(kleur.cyan('Chat session started. Type your messages or use special commands.'));
    console.log(kleur.yellow('Type /help for available commands.'));

    this.promptUser();
  }

  private promptUser(): void {
    this.rl.question(kleur.green('You: '), async (input) => {
      if (input.startsWith('/')) {
        await this.handleSpecialCommand(input);
      } else {
        await this.sendMessage(input);
      }
      this.promptUser();
    });
  }

  private async handleSpecialCommand(input: string): Promise<void> {
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
        await this.addImage(args[0]);
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  private async listModels(): Promise<void> {
    const spinner = createSpinner('Fetching models...').start();
    try {
      const models = await this.provider.listModels();
      spinner.success({ text: 'Models fetched successfully' });
      const modelData = models.map(model => [model.id, model.description || 'N/A']);
      console.log(kleur.cyan('Available models:'));
      console.log(table([['Model ID', 'Description'], ...modelData]));
    } catch (error) {
      spinner.error({ text: `Failed to list models: ${(error as Error).message}` });
    }
  }

  private listProviders(): void {
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

  private async addImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      console.log(kleur.red('Please provide an image URL or local file path.'));
      return;
    }
    if (!this.conversationId) {
      console.log(kleur.red('No active conversation. Please start a chat first.'));
      return;
    }
    const spinner = createSpinner('Processing image...').start();
    try {
      const base64Image = await imageToBase64(imageUrl);
      await this.conversationManager.addMessage(this.conversationId, {
        role: 'user',
        content: [{ type: 'image_url', url: `data:${base64Image.mimeType};base64,${base64Image.base64}` }],
        providerId: this.providerName,
      });
      spinner.success({ text: 'Image added to the conversation.' });
    } catch (error) {
      spinner.error({ text: `Failed to add image: ${(error as Error).message}` });
    }
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

  private async sendMessage(message: string): Promise<void> {
    if (!this.conversationId) {
      console.log(kleur.red('No active conversation. Please start a chat first.'));
      return;
    }

    await this.conversationManager.addMessage(this.conversationId, {
      role: 'user',
      content: { type: 'text', text: message },
      providerId: this.providerName,
    });

    const history = await this.conversationManager.getHistory(this.conversationId);
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const spinner = createSpinner('Generating response...').start();
    try {
      console.log(kleur.blue('\nAssistant: '));
      let fullResponse = '';
      spinner.stop();
      for await (const chunk of this.provider.streamChatCompletion({
        messages,
        options: { model: this.currentModel },
      })) {
        if (chunk.text) {
          process.stdout.write(chunk.text);
          fullResponse += chunk.text;
        }
      }
      console.log('\n');
      await this.saveResponse(fullResponse);
      spinner.success({ text: 'Response generated successfully' });
    } catch (error) {
      spinner.error({ text: `Error generating response: ${(error as Error).message}` });
    }
  }

  private async saveResponse(response: string): Promise<void> {
    if (!this.conversationId) return;
    await this.conversationManager.addMessage(this.conversationId, {
      role: 'assistant',
      content: { type: 'text', text: response },
      providerId: this.providerName,
    });
  }
}