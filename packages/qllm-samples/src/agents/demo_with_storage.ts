import { Agent, AgentBuilder, createStorageProvider, createConversationManager } from "qllm-lib";
import { createLLMProvider } from "qllm-lib";
import readline from 'readline';
import path from 'path';

class ChatBot {
  private rl: readline.Interface;
  private conversationId: string = '';

  constructor(
    private agent: Agent,
    private conversationManager: any
  ) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private async askQuestion(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async initialize() {
    const conversation = await this.conversationManager.createConversation({
      metadata: {
        title: 'New Chat Session',
        description: 'Interactive chat session'
      }
    });
    this.conversationId = conversation.id;
  }

  async start() {
    await this.initialize();
    console.log('🤖 Chat started - Type "exit" to quit, "history" to see chat history\n');

    while (true) {
      const input = await this.askQuestion('You: ');

      if (input.toLowerCase() === 'exit') {
        await this.showHistory();
        this.rl.close();
        break;
      }

      if (input.toLowerCase() === 'history') {
        await this.showHistory();
        continue;
      }

      try {
        // Save user message
        await this.conversationManager.addMessage(this.conversationId, {
          role: 'user',
          content: { type: 'text', text: input },
          timestamp: new Date(),
          providerId: 'openai',
          options: {}
        });

        // Get AI response
        process.stdout.write('AI: ');
        let fullResponse = '';
        for await (const chunk of this.agent.streamChat(input)) {
          process.stdout.write(chunk);
          fullResponse += chunk;
        }
        console.log('\n');

        // Save AI response
        await this.conversationManager.addMessage(this.conversationId, {
          role: 'assistant',
          content: { type: 'text', text: fullResponse },
          timestamp: new Date(),
          providerId: 'openai',
          options: {}
        });

      } catch (error) {
        console.error('Error:', error);
      }
    }
  }

  private async showHistory() {
    console.log('\n=== Chat History ===');
    const history = await this.conversationManager.getHistory(this.conversationId);
    history.forEach((message:any) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const role = message.role.padEnd(9, ' ');
      console.log(`[${timestamp}] ${role}: ${message.content.text}`);
    });
    console.log('==================\n');
  }
}

async function main() {
  try {
    const provider = createLLMProvider({ name: 'openai' });
    const storage = createStorageProvider('sqlite', {
      dbPath: path.resolve(__dirname, './conversations.db')
    });

    const agent = AgentBuilder.create({
      role: "AI Assistant",
      goal: "Help users with their queries",
      backstory: "An intelligent AI assistant"
    })
      .withProvider(provider)
      .withLLMOptions({
        model: "gpt-4o-mini",
        maxTokens: 1000,
        temperature: 0.7
      })
      .withMemory(true)
      .withSystemPrompt("You are a helpful AI assistant...")
      .build();

    const conversationManager = createConversationManager(storage);
    const chatBot = new ChatBot(agent, conversationManager);
    await chatBot.start();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  process.exit(0);
});

main().catch(console.error);