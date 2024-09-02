// packages/qllm-cli/src/chat/utils.ts
import fs from "fs/promises";
import path from "path";
import { createSpinner } from "nanospinner";
import { ioManager } from "../utils/io-manager";

export const utils = {
    async readLocalFile(filePath: string): Promise<string> {
        try {
            const fullPath = path.resolve(filePath);
            const content = await fs.readFile(fullPath, "utf-8");
            return content;
        } catch (error) {
            throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
    },

    async writeLocalFile(filePath: string, content: string): Promise<void> {
        try {
            const fullPath = path.resolve(filePath);
            await fs.writeFile(fullPath, content, "utf-8");
        } catch (error) {
            throw new Error(
                `Failed to write file: ${(error as Error).message}`,
            );
        }
    },

    isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    async withSpinner<T>(
        message: string,
        action: () => Promise<T>,
    ): Promise<T> {
        const spinner = createSpinner(message).start();
        try {
            const result = await action();
            spinner.success({ text: "Operation completed successfully" });
            return result;
        } catch (error) {
            spinner.error({
                text: `Operation failed: ${(error as Error).message}`,
            });
            throw error;
        }
    },

    truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + "...";
    },

    formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delayMs: number = 1000,
    ): Promise<T> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                ioManager.displayWarning(
                    `Operation failed, retrying in ${delayMs}ms...`,
                );
                await this.delay(delayMs);
            }
        }
        throw new Error("Max retries reached");
    },

    sanitizeFilename(filename: string): string {
        return filename.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    },

    getFileExtension(filename: string): string {
        return path.extname(filename).slice(1).toLowerCase();
    },

    isImageFile(filename: string): boolean {
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
        return imageExtensions.includes(this.getFileExtension(filename));
    },

    // New utility functions for conversation management

    formatConversationSummary(conversation: {
        id: string;
        createdAt: Date;
        messages: any[];
    }): string {
        const { id, createdAt, messages } = conversation;
        const messageCount = messages.length;
        const firstMessage = messages[0]?.content?.text || "No messages";
        return `ID: ${id} | Created: ${createdAt.toLocaleString()} | Messages: ${messageCount} | First message: ${this.truncateString(
            firstMessage,
            50,
        )}`;
    },

    formatMessageContent(content: any): string {
        if (typeof content === "string") {
            return content;
        } else if (content.type === "text") {
            return content.text;
        } else if (content.type === "image_url") {
            return `[Image: ${content.url}]`;
        } else {
            return JSON.stringify(content);
        }
    },

    formatConversationMessage(message: {
        role: string;
        content: any;
        timestamp?: Date;
    }): string {
        const { role, content, timestamp } = message;
        const formattedContent = this.formatMessageContent(content);
        const timeString = timestamp
            ? `[${timestamp.toLocaleTimeString()}] `
            : "";
        return `${timeString}${
            role.charAt(0).toUpperCase() + role.slice(1)
        }: ${formattedContent}`;
    },

    async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
                throw error;
            }
        }
    },

    generateUniqueId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
};
