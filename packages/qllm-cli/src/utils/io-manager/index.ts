// packages/qllm-cli/src/utils/io-manager/io-manager.ts

import kleur from "kleur";
import { getBorderCharacters, table } from "table";
import { createSpinner } from "nanospinner";
import { Table } from "console-table-printer";
import prompts from "prompts";
import { writeToFile } from "../write-file";

const stdout = {
    log: (...args: any[]) => {
        console.log(...args);
    },
    write: (text: string) => {
        process.stdout.write(text);
    },
};

const stderr = {
    log: (...args: any[]) => {
        console.error(...args);
    },
    warn: (...args: any[]) => {
        console.warn(...args);
    },
    error: (...args: any[]) => {
        console.error(...args);
    },
};

type ColorName = keyof typeof kleur;

interface IOManagerConfig {
    defaultColor: ColorName;
    errorColor: ColorName;
    successColor: ColorName;
    warningColor: ColorName;
    infoColor: ColorName;
    highlightColor: ColorName;
    dimColor: ColorName;
    useColors: boolean;
}

interface Spinner {
    start: () => void;
    stop: () => void;
    update: (options: { text: string }) => void;
    success: (options: { text: string }) => void;
    error: (options: { text: string }) => void;
}

class DisplayManager {
    constructor(private config: IOManagerConfig) {}

    colorize(text: string, color: ColorName): string {
        if (!this.config.useColors) return text;
        if (typeof kleur[color] === "function") {
            return (kleur[color] as (...text: string[]) => string)(text);
        }
        return text; // Fallback to uncolored text if the color function doesn't exist
    }

    error(message: string): void {
        stderr.error(this.colorize(`✖ ${message}`, this.config.errorColor));
    }

    success(message: string): void {
        stderr.log(this.colorize(`✔ ${message}`, this.config.successColor));
    }

    warning(message: string): void {
        stderr.warn(this.colorize(`⚠ ${message}`, this.config.warningColor));
    }

    info(message: string): void {
        stderr.log(this.colorize(message, this.config.infoColor));
    }

    table(headers: string[], data: string[][]): void {
        const tableData = [
            headers.map((h) => this.colorize(h, "cyan")),
            ...data,
        ];
        stderr.log(
            table(tableData, {
                border: getBorderCharacters("norc"),
                columnDefault: {
                    paddingLeft: 0,
                    paddingRight: 1,
                },
                drawHorizontalLine: () => false,
            }),
        );
    }

    list(items: string[]): void {
        items.forEach((item) => this.info(`• ${item}`));
    }

    title(text: string): void {
        stderr.log(kleur.bold().underline().yellow(text));
    }

    codeBlock(code: string, language?: string): void {
        const formattedCode = language ? this.colorize(code, "cyan") : code;
        stderr.log(
            this.colorize("```" + (language || ""), this.config.dimColor),
        );
        stderr.log(formattedCode);
        stderr.log(this.colorize("```", this.config.dimColor));
    }

    sectionHeader(header: string): void {
        stderr.log(kleur.bold().underline().yellow(`\n${header}`));
    }

    json(data: unknown): void {
        stdout.log(JSON.stringify(data, null, 2));
    }
}

class InputManager {
    async getUserInput(prompt: string): Promise<string> {
        const response = await prompts({
            type: "text",
            name: "userInput",
            message: prompt,
        });
        return response.userInput;
    }

    async confirm(message: string): Promise<boolean> {
        const response = await prompts({
            type: "confirm",
            name: "confirmed",
            message: message,
            initial: false,
        });
        return response.confirmed;
    }
}

class SpinnerManager {
    private currentSpinner: Spinner | null = null;

    create(message: string): Spinner {
        this.currentSpinner = createSpinner(message);
        return this.currentSpinner;
    }

    stop(): void {
        if (this.currentSpinner) {
            this.currentSpinner.stop();
            this.currentSpinner = null;
        }
    }
}

export class IOManager {
    private display: DisplayManager;
    private input: InputManager;
    private spinner: SpinnerManager;

    constructor(config: Partial<IOManagerConfig> = {}) {
        const fullConfig: IOManagerConfig = {
            defaultColor: "white",
            errorColor: "red",
            successColor: "green",
            warningColor: "yellow",
            infoColor: "blue",
            highlightColor: "magenta",
            dimColor: "gray",
            useColors: true,
            ...config,
        };
        this.display = new DisplayManager(fullConfig);
        this.input = new InputManager();
        this.spinner = new SpinnerManager();
    }

    readonly stdout = stdout;

    displayGroupHeader(header: string): void {
        this.display.sectionHeader(header);
    }

    colorize(text: string, color: ColorName): string {
        return this.display.colorize(text, color);
    }

    // Display methods
    displayError(message: string): void {
        this.display.error(message);
    }

    displaySuccess(message: string): void {
        this.display.success(message);
    }

    displayWarning(message: string): void {
        this.display.warning(message);
    }

    displayInfo(message: string): void {
        this.display.info(message);
    }

    displayTable(headers: string[], data: string[][]): void {
        this.display.table(headers, data);
    }

    displayList(items: string[]): void {
        this.display.list(items);
    }

    displayTitle(title: string): void {
        this.display.title(title);
    }

    displayCodeBlock(code: string, language?: string): void {
        this.display.codeBlock(code, language);
    }

    displaySectionHeader(header: string): void {
        this.display.sectionHeader(header);
    }

    json(data: unknown): void {
        this.display.json(data);
    }

    // Input methods
    async getUserInput(prompt: string): Promise<string> {
        return this.input.getUserInput(this.display.colorize(prompt, "green"));
    }

    async confirmAction(message: string): Promise<boolean> {
        return this.input.confirm(message);
    }

    // Spinner methods
    createSpinner(message: string): Spinner {
        return this.spinner.create(message);
    }

    stopSpinner(): void {
        this.spinner.stop();
    }

    // Utility methods
    clearLine(): void {
        process.stdout.write("\r\x1b[K");
    }

    newLine(): void {
        stderr.log();
    }

    clear(): void {
        console.clear();
    }

    write(text: string): void {
        process.stdout.write(text);
    }

    // Specialized display methods
    displayUserMessage(message: string): void {
        this.displayInfo(this.display.colorize(`You: ${message}`, "green"));
    }

    displayAssistantMessage(message: string): void {
        this.displayInfo(
            this.display.colorize(`Assistant: ${message}`, "blue"),
        );
    }

    displaySystemMessage(message: string): void {
        this.displayInfo(this.display.colorize(`System: ${message}`, "yellow"));
    }

    displayConversationList(
        conversations: { id: string; createdAt: Date }[],
    ): void {
        this.displayInfo("Conversations:");
        conversations.forEach((conv, index) => {
            this.displayInfo(
                `${index + 1}. ID: ${conv.id}, Created: ${conv.createdAt.toLocaleString()}`,
            );
        });
    }

    displayConversationDetails(
        id: string,
        messages: { role: string; content: string }[],
    ): void {
        this.displayInfo(`Conversation ${id}:`);
        messages.forEach((msg, index) => {
            const roleColor = msg.role === "user" ? "green" : "blue";
            this.displayInfo(
                `${index + 1}. ${this.display.colorize(msg.role, roleColor)}: ${msg.content}`,
            );
        });
    }

    displayGroupedInfo(title: string, items: string[]): void {
        this.displayInfo(this.display.colorize(`\n${title}:`, "yellow"));
        items.forEach((item) => this.displayInfo(` ${item}`));
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

    displayConfigOptions(
        options: Array<{ name: string; value: unknown }>,
    ): void {
        this.displaySectionHeader("Current Configuration");
        const longestNameLength = Math.max(
            ...options.map((opt) => opt.name.length),
        );
        options.forEach(({ name, value }) => {
            const paddedName = name.padEnd(longestNameLength);
            const formattedValue =
                value !== undefined ? String(value) : "Not set";
            const coloredValue =
                value !== undefined
                    ? this.display.colorize(formattedValue, "green")
                    : this.display.colorize(formattedValue, "yellow");
            this.displayInfo(
                `${this.display.colorize(paddedName, "cyan")}: ${coloredValue}`,
            );
        });
        this.newLine();
        this.displayInfo(
            this.display.colorize(
                "Use '/set <setting> <value>' to change a setting",
                "dim",
            ),
        );
        this.displayInfo(
            this.display.colorize("Example: set provider openai", "dim"),
        );
    }

    displayProviderList(providers: string[]): void {
        this.displaySectionHeader("Available Providers");
        if (providers.length === 0) {
            this.displayInfo(
                this.display.colorize("No providers available.", "yellow"),
            );
        } else {
            providers.forEach((provider, index) => {
                this.displayInfo(
                    `${this.display.colorize(`${index + 1}.`, "cyan")} ${this.display.colorize(provider, "green")}`,
                );
            });
        }
        this.newLine();
        this.displayInfo(
            this.display.colorize(
                "To set a provider, use: set provider <provider_name>",
                "dim",
            ),
        );
    }

    // Async utility method
    async safeExecute<T>(
        fn: () => Promise<T>,
        errorMessage: string,
    ): Promise<T | undefined> {
        try {
            return await fn();
        } catch (error) {
            this.displayError(
                `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
            );
            return undefined;
        }
    }

    async promptYesNo(message: string): Promise<boolean> {
        const response = await prompts({
            type: "confirm",
            name: "value",
            message: message,
            initial: true, // Default to 'yes'
        });
        return response.value; // Returns true for 'yes', false for 'no'
    }
}

// Create a singleton instance for easy access
export const ioManager = new IOManager();
export { Spinner };
