// packages/qllm-cli/src/utils/io-manager/io-manager.ts

import readline from "readline";
import kleur from "kleur";
import { getBorderCharacters, table  } from "table";
import { createSpinner } from "nanospinner";
import { Table } from "console-table-printer";
import prompts from "prompts";

interface Spinner {
  start: () => void;
  stop: () => void;
  update: (options: { text: string }) => void;
  success: (options: { text: string }) => void;
  error: (options: { text: string }) => void;
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

  async getUserInput(prompt: string): Promise<string> {
    const response = await prompts({
      type: "text",
      name: "userInput",
      message: this.colorize(prompt, "green"),
    });
    return response.userInput;
  }

  async getAsyncUserInput(prompt: string): Promise<string> {
    return this.getUserInput(prompt);
  }

  displayUserMessage(message: string): void {
    this.displayInfo(this.colorize(`You: ${message}`, "green"));
  }

  displayAssistantMessage(message: string): void {
    this.displayInfo(this.colorize(`Assistant: ${message}`, "blue"));
  }

  displaySystemMessage(message: string): void {
    this.displayInfo(this.colorize(`System: ${message}`, "yellow"));
  }

  displayError(message: string): void {
    console.error(this.colorize(`✖ ${message}`, "red"));
  }

  displaySuccess(message: string): void {
    console.log(this.colorize(`✔ ${message}`, "green"));
  }

  displayWarning(message: string): void {
    console.warn(this.colorize(`⚠ ${message}`, "yellow"));
  }

  displayInfo(message: string): void {
    console.log(message);
  }

  displayTable(headers: string[], data: string[][]): void {
    const tableData = [headers.map((h) => this.colorize(h, "cyan")), ...data];
    console.log(
      table(tableData, {
        border: getBorderCharacters("norc"),
        columnDefault: {
          paddingLeft: 0,
          paddingRight: 1,
        },
        drawHorizontalLine: () => false,
      })
    );
  }

  displayList(items: string[]): void {
    items.forEach((item) => this.displayInfo(`• ${item}`));
  }

  clearLine(): void {
    process.stdout.write("\r\x1b[K");
  }

  newLine(): void {
    console.log();
  }

  close(): void {
    this.rl.close();
  }

  createSpinner(message: string): Spinner {
    const spinner = createSpinner(message);
    this.currentSpinner = spinner;
    return spinner;
  }

  stopSpinner(): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }

  write(text: string): void {
    process.stdout.write(text);
  }

  displayConversationList(
    conversations: { id: string; createdAt: Date }[]
  ): void {
    this.displayInfo("Conversations:");
    conversations.forEach((conv, index) => {
      this.displayInfo(
        `${index + 1}. ID: ${conv.id}, Created: ${conv.createdAt.toLocaleString()}`
      );
    });
  }

  displayConversationDetails(
    id: string,
    messages: { role: string; content: string }[]
  ): void {
    this.displayInfo(`Conversation ${id}:`);
    messages.forEach((msg, index) => {
      const roleColor = msg.role === "user" ? "green" : "blue";
      this.displayInfo(
        `${index + 1}. ${this.colorize(msg.role, roleColor)}: ${msg.content}`
      );
    });
  }

  async promptForConversationSelection(): Promise<string> {
    const response = await prompts({
      type: "text",
      name: "selection",
      message: "Enter conversation number to select (or 'c' to cancel): ",
    });
    return response.selection;
  }

  async promptForConversationDeletion(): Promise<string> {
    const response = await prompts({
      type: "text",
      name: "selection",
      message: "Enter conversation number to delete (or 'c' to cancel): ",
    });
    return response.selection;
  }

  async confirmAction(message: string): Promise<boolean> {
    const response = await prompts({
      type: "confirm",
      name: "confirmed",
      message: message,
      initial: false,
    });
    return response.confirmed;
  }

  colorize(
    text: string,
    color: "green" | "blue" | "yellow" | "red" | "cyan" | "magenta" | "dim" | "gray"
  ): string {
    switch (color) {
      case "green":
        return kleur.green(text);
      case "blue":
        return kleur.blue(text);
      case "yellow":
        return kleur.yellow(text);
      case "red":
        return kleur.red(text);
      case "cyan":
        return kleur.cyan(text);
      case "magenta":
        return kleur.magenta(text);
      case "dim":
        return kleur.dim(text);
      case "gray":
        return kleur.grey(text);
      default:
        return text;
    }
  }

  displayGroupedInfo(title: string, items: string[]): void {
    this.displayInfo(this.colorize(`\n${title}:`, "yellow"));
    items.forEach((item) => this.displayInfo(` ${item}`));
  }

  displayTitle(title: string): void {
    console.log(kleur.bold().underline(title));
  }

  displayCodeBlock(code: string, language?: string): void {
    const formattedCode = language ? this.colorize(code, "cyan") : code;
    console.log(this.colorize("```" + (language || ""), "gray"));
    console.log(formattedCode);
    console.log(this.colorize("```", "gray"));
  }

  clear(): void {
    console.clear();
  }

  displaySectionHeader(header: string): void {
    console.log(kleur.bold().yellow(`\n${header}`));
  }

  displayModelTable(models: { id: string; description: string }[]): void {
    const p = new Table({
      columns: [
        { name: "id", alignment: "left", color: "cyan" },
        { name: "description", alignment: "left", color: "white" },
      ],
      sort: (row1, row2) => row1.id.localeCompare(row2.id),
    });
    models.forEach((model) => {
      p.addRow({ id: model.id, description: model.description || "N/A" });
    });
    p.printTable();
  }

  displayConfigOptions(options: Array<{ name: string; value: any }>): void {
    this.displaySectionHeader("Current Configuration");
    const longestNameLength = Math.max(
      ...options.map((opt) => opt.name.length)
    );
    options.forEach(({ name, value }) => {
      const paddedName = name.padEnd(longestNameLength);
      const formattedValue = value !== undefined ? value.toString() : "Not set";
      const coloredValue =
        value !== undefined
          ? this.colorize(formattedValue, "green")
          : this.colorize(formattedValue, "yellow");
      this.displayInfo(`${this.colorize(paddedName, "cyan")}: ${coloredValue}`);
    });
    this.newLine();
    this.displayInfo(this.colorize("Use 'set ' to change a setting", "dim"));
    this.displayInfo(this.colorize("Example: set provider openai", "dim"));
  }

  displayProviderList(providers: string[]): void {
    this.displaySectionHeader("Available Providers");
    if (providers.length === 0) {
      this.displayInfo(this.colorize("No providers available.", "yellow"));
    } else {
      providers.forEach((provider, index) => {
        this.displayInfo(
          `${this.colorize(`${index + 1}.`, "cyan")} ${this.colorize(provider, "green")}`
        );
      });
    }
    this.newLine();
    this.displayInfo(
      this.colorize(
        "To set a provider, use: set provider <provider_name>",
        "dim"
      )
    );
  }

  displayGroupHeader(header: string): void {
    this.displayInfo(this.colorize(`\n${header}:`, "magenta"));
  }

  json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Create a singleton instance for easy access
export const ioManager = new IOManager();
