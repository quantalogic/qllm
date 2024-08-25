// packages/qllm-cli/src/chat/utils.ts
import fs from 'fs/promises';
import path from 'path';
import { createSpinner } from 'nanospinner';
import { output } from '../utils/output';

export const utils = {
  async readLocalFile(filePath: string): Promise<string> {
    try {
      const fullPath = path.resolve(filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${(error as Error).message}`);
    }
  },

  async writeLocalFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
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

  async withSpinner<T>(message: string, action: () => Promise<T>): Promise<T> {
    const spinner = createSpinner(message).start();
    try {
      const result = await action();
      spinner.success({ text: 'Operation completed successfully' });
      return result;
    } catch (error) {
      spinner.error({ text: `Operation failed: ${(error as Error).message}` });
      throw error;
    }
  },

  truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        output.warn(`Operation failed, retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
    throw new Error('Max retries reached');
  },

  sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  },

  getFileExtension(filename: string): string {
    return path.extname(filename).slice(1).toLowerCase();
  },

  isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(this.getFileExtension(filename));
  }
};