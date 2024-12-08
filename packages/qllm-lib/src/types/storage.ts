

import { StorageProvider } from '../types'; 

  
export interface MemoryOptions {
shortTermSize: number;
longTermEnabled: boolean;
storageProvider: StorageProvider;
vectorSearchConfig?: {
    similarity: number;
    maxResults: number;
};
}