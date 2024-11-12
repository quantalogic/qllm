// src/utils/file-handlers/local-handler.ts
import fs from 'fs/promises';
import mime from 'mime-types';
import path from 'path';
import { FileHandler } from '../../types';

export class LocalFileHandler implements FileHandler {
    async read(filePath: string): Promise<string> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Failed to read local file: ${error as Error}`);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async getType(filePath: string): Promise<string> {
        return mime.lookup(filePath) || 'text/plain';
    }
}