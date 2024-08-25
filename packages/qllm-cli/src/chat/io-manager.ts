// packages/qllm-cli/src/chat/io-manager.ts
import readline from 'readline';
import kleur from 'kleur';
import { output } from '../utils/output';

interface Spinner {
  start: () => void;
  stop: () => void;
  success: (text: string) => void;
  error: (text: string) => void;
}

export class IOManager {
  private rl: readline.Interface;
  private currentSpinner: Spinner | null = null;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  getUserInput(prompt: string, callback: (input: string) => void): void {
    this.rl.question(kleur.green(prompt), (input) => {
      callback(input);
    });
  }

  displayUserMessage(message: string): void {
    output.info(kleur.green(`You: ${message}`));
  }

  displayAssistantMessage(message: string): void {
    output.info(kleur.blue(`Assistant: ${message}`));
  }

  displaySystemMessage(message: string): void {
    output.info(kleur.yellow(`System: ${message}`));
  }

  displayError(message: string): void {
    output.error(message);
  }

  displaySuccess(message: string): void {
    output.success(message);
  }

  displayWarning(message: string): void {
    output.warn(message);
  }

  clearLine(): void {
    process.stdout.write('\r\x1b[K');
  }

  newLine(): void {
    console.log();
  }

  close(): void {
    this.rl.close();
  }

  createSpinner(message: string): Spinner {
    let spinning = false;
    const spinnerChars = ['|', '/', '-', '\\'];
    let i = 0;
    let intervalId: NodeJS.Timeout;

    const spinner: Spinner = {
      start: () => {
        spinning = true;
        intervalId = setInterval(() => {
          process.stdout.write(`\r${spinnerChars[i]} ${message}`);
          i = (i + 1) % spinnerChars.length;
        }, 100);
      },
      stop: () => {
        spinning = false;
        clearInterval(intervalId);
        this.clearLine();
      },
      success: (text: string) => {
        if (spinning) {
          spinner.stop();
        }
        this.displaySuccess(text);
      },
      error: (text: string) => {
        if (spinning) {
          spinner.stop();
        }
        this.displayError(text);
      },
    };

    this.currentSpinner = spinner;
    return spinner;
  }

  stopSpinner(): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }
}