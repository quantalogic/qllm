import { Agent, AgentBuilder } from "qllm-lib";
import { AgentLoader } from "qllm-lib";
import { createLLMProvider } from "qllm-lib";
import readline from 'readline';
import debug from 'debug';


// Console colors
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

// Performance and Debug Utilities
const debugAgent = debug('app:agent');
const debugPerf = debug('app:performance');
const debugChat = debug('app:chat');

class PerformanceTracker {
  private measurements: Map<string, number[]> = new Map();

  addMeasurement(label: string, duration: number) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
  }

  printStats() {
    console.log(`${colors.magenta}\n=== Performance Statistics ===${colors.reset}`);
    this.measurements.forEach((times, label) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`${label}:
        Average: ${(avg / 1000).toFixed(3)}s
        Count: ${times.length}`);
    });
  }
}

// Chat Interface
class ChatInterface {
  private rl: readline.Interface;
  private performanceTracker: PerformanceTracker;
  private agent: Agent;
  private history: { role: string; content: string; timestamp: Date; }[] = [];

  constructor(agent: Agent) {
    this.agent = agent;
    this.performanceTracker = new PerformanceTracker();
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
    
    while (true) {
      const input = await this.askQuestion('\nYou: ');
      
      if (this.handleCommand(input)) continue;
      
      const startTime = Date.now();
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
        
        this.history.push({
          role: 'user',
          content: input,
          timestamp: new Date()
        });
        
        this.history.push({
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        });
        
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
        this.printHistory();
        return true;
      default:
        return false;
    }
  }

  private printHistory() {
    console.log(`${colors.magenta}\n=== Chat History ===${colors.reset}`);
    this.history.forEach(entry => {
      const roleColor = entry.role === 'user' ? colors.green : colors.blue;
      console.log(`[${entry.timestamp.toLocaleTimeString()}] ${roleColor}${entry.role}:${colors.reset} ${entry.content}`);
    });
  }
}

// Main Application
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
  debug.enable('app:*');
}

process.on('SIGINT', () => {
  console.log(`${colors.yellow}\nGracefully shutting down...${colors.reset}`);
  process.exit(0);
});

main().catch(console.error);