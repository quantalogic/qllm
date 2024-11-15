// src/types/file-handler.ts
export interface FileHandler {
    read(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;
    getType(path: string): Promise<string>;
}

