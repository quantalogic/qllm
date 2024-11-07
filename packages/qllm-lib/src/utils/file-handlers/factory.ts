// src/utils/file-handlers/factory.ts
import { FileHandler } from '../../types/file-handler';
import { LocalFileHandler } from './local-handler';
import { S3FileHandler } from './s3-handler';

export function createFileHandler(path: string): FileHandler {
    if (path.startsWith('s3://')) {
        return new S3FileHandler();
    }
    return new LocalFileHandler();
}