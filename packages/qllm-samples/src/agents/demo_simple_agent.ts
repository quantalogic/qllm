import { Agent, AgentBuilder, AgentLoader, createLLMProvider } from "qllm-lib";
import readline from 'readline';

// Console colors using ANSI escape codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

// Initialize debuggers 

// Enhanced performance monitoring utility
function formatExecutionTime(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  return seconds.toFixed(3) + 's';
}

class PerformanceTracker {
  private measurements: Map<string, number[]> = new Map();

  addMeasurement(label: string, duration: number) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
  }

  getStats(label: string) {
    const times = this.measurements.get(label);
    if (!times || times.length === 0) return null;

    return {
      avg: formatExecutionTime(times.reduce((a, b) => a + b, 0) / times.length),
      min: formatExecutionTime(Math.min(...times)),
      max: formatExecutionTime(Math.max(...times)),
      count: times.length
    };
  }

  printStats() {
    console.log(`${colors.magenta}\n=== Performance Statistics ===${colors.reset}`);
    this.measurements.forEach((_, label) => {
      const stats = this.getStats(label);
      if (stats) {
        console.log(`${label}:
          Average: ${stats.avg}
          Min: ${stats.min}
          Max: ${stats.max}
          Count: ${stats.count}`);
      }
    });
  }
}

interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  executionTime?: number;
}

class ConversationManager {
  private history: ChatHistory[] = [];

  addEntry(role: 'user' | 'assistant', content: string, executionTime?: number) {
    this.history.push({
      role,
      content,
      timestamp: new Date(),
      executionTime
    });
    console.log(`Added ${role} message to history. Total messages: ${this.history.length}`);
  }

  printHistory() {
    console.log(`${colors.magenta}\n=== Conversation History ===${colors.reset}`);
    this.history.forEach((entry) => {
      const timestamp = entry.timestamp.toLocaleTimeString();
      const roleColor = entry.role === 'user' ? colors.green : colors.blue;
      let message = `[${timestamp}] ${roleColor}[${entry.role}]${colors.reset} ${entry.content}`;
      if (entry.executionTime) {
        message += ` ${colors.cyan}(took ${formatExecutionTime(entry.executionTime)})${colors.reset}`;
      }
      console.log(message);
    });
  }
}

class ChatInterface {
  private rl: readline.Interface;
  private performanceTracker: PerformanceTracker;
  private conversationManager: ConversationManager;
  private agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
    this.performanceTracker = new PerformanceTracker();
    this.conversationManager = new ConversationManager();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private async askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}${query}${colors.reset}`, resolve);
    });
  }

  async start() {
    console.log(`${colors.bright}${colors.green}🤖 AI Chat Interface Starting...${colors.reset}`);
    this.printHelp();

    while (true) {
      const input = await this.askQuestion('\nYou: ');
      
      if (this.handleCommand(input)) continue;
      
      const startTime = Date.now();
      this.conversationManager.addEntry('user', input);
      
      console.log(`${colors.cyan}AI: ${colors.reset}`);
      
      try {
        let fullResponse = '';
        for await (const chunk of this.agent.streamChat(input)) {
          process.stdout.write(chunk);
          fullResponse += chunk;
        }
        console.log('\n');
        
        const duration = Date.now() - startTime;
        this.performanceTracker.addMeasurement('Response Time', duration);
        this.conversationManager.addEntry('assistant', fullResponse, duration);
        
      } catch (error) {
        console.error(`${colors.red}Error: ${error}${colors.reset}`);
      }
    }
  }

  private handleCommand(input: string): boolean {
    switch(input.toLowerCase()) {
      case 'exit':
        console.log(`${colors.yellow}Goodbye!${colors.reset}`);
        this.performanceTracker.printStats();
        this.rl.close();
        process.exit(0);
      case 'stats':
        this.performanceTracker.printStats();
        return true;
      case 'history':
        this.conversationManager.printHistory();
        return true;
      case 'help':
        this.printHelp();
        return true;
      case 'clear':
        console.clear();
        return true;
      default:
        return false;
    }
  }

  private printHelp() {
    console.log(`\nAvailable commands:
    - 'exit': End the conversation
    - 'history': Show conversation history
    - 'stats': Show performance statistics
    - 'clear': Clear the console
    - 'help': Show this help message\n`);
  }
}

async function main() {
  try {
    const provider = createLLMProvider({ name: 'openai' });
    
    const agent = AgentBuilder.create({
      role: "AI Assistant",
      goal: "Help users with their queries",
      backstory: "An intelligent AI assistant"
    })
      .withProvider(provider)
      .withLLMOptions({
        model: "gpt-4",
        maxTokens: 1000,
        temperature: 0.7
      })
      .withMemory(true)
      .withSystemPrompt("You are a helpful AI assistant...")
      .build();

    const chat = new ChatInterface(agent);
    await chat.start();

  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  }
}

if (process.env.DEBUG) {
  console.log('app:*');
}

process.on('SIGINT', () => {
  console.log(`${colors.yellow}\nGracefully shutting down...${colors.reset}`);
  process.exit(0);
});

main().catch(console.error);