/**
 * @fileoverview Storage provider factory module for the QLLM library.
 * This module provides a factory function to create different types of storage providers
 * for managing conversation persistence.
 * 
 * @module storage
 * @author QLLM Team
 * @version 1.0.0
 */

import { StorageProvider } from '../types';
import { InMemoryStorageProvider } from './in-memory-storage-provider';
//import { SQLiteConversationStorageProvider } from './sqlite-conversation-storage-provider';

/**
 * Available storage provider types supported by the factory.
 * - 'in-memory': Volatile storage that persists data only during runtime
 * - 'sqlite': Persistent storage using SQLite database (currently disabled)
 */
export type StorageProviderName = 'in-memory' | 'sqlite';

/**
 * Creates a storage provider instance based on the specified type and configuration.
 * 
 * @param {StorageProviderName} name - The type of storage provider to create
 * @param {Object} options - Configuration options for the storage provider
 * @param {string} [options.dbPath] - Database file path (required for SQLite provider)
 * @returns {StorageProvider | undefined} The created storage provider instance or undefined if type is not supported
 * @throws {Error} When required configuration options are missing
 * 
 * @example
 * ```typescript
 * // Create an in-memory storage provider
 * const memoryStorage = createStorageProvider('in-memory', {});
 * 
 * // Create a SQLite storage provider (when implemented)
 * const sqliteStorage = createStorageProvider('sqlite', { dbPath: './conversations.db' });
 * ```
 */
export function createStorageProvider(
  name: StorageProviderName,
  {
    dbPath,
  }: {
    dbPath?: string;
  },
): StorageProvider | undefined {
  // Updated return type to include undefined
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

export default createStorageProvider;