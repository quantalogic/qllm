import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInput } from '../types';

export class FileManager {
  constructor(private tempDir: string) {}

  async writeFiles(files: FileInput[]): Promise<void> {
    for (const file of files) {
      if (!this.validateFileName(file.name)) {
        throw new Error(`Invalid file name: ${file.name}`);
      }
      const filePath = path.join(this.tempDir, file.name);
      await fs.writeFile(filePath, file.content);
    }
  }

  async readFile(fileName: string): Promise<string> {
    if (!this.validateFileName(fileName)) {
      throw new Error(`Invalid file name: ${fileName}`);
    }
    const filePath = path.join(this.tempDir, fileName);
    return fs.readFile(filePath, 'utf-8');
  }

  validateFileName(fileName: string): boolean {
    const normalizedPath = path.normalize(fileName);
    return !normalizedPath.startsWith('..') && !path.isAbsolute(normalizedPath);
  }

  async listFiles(): Promise<string[]> {
    return fs.readdir(this.tempDir);
  }

  async cleanup(): Promise<void> {
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }
}
