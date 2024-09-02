import { StorageProvider } from '../types';
import { InMemoryStorageProvider } from './in-memory-storage-provider';
//import { SQLiteConversationStorageProvider } from './sqlite-conversation-storage-provider';

export type StorageProviderName = 'in-memory' | 'sqlite';

export default function createStorageProvider(
  name: StorageProviderName,
  {
    dbPath,
  }: {
    dbPath?: string;
  },
): StorageProvider | undefined { // Updated return type to include undefined
  switch (name.toLowerCase()) {
    case 'in-memory':
      return new InMemoryStorageProvider();
    case 'local':
      if (!dbPath) {
        throw new Error('dbPath must be provided for SQLite storage provider');
      }
      // ... handle SQLite storage provider ...
      return; // Added return statement for 'local' case
  }
  return undefined; // Added return statement for cases not handled
}
