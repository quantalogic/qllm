/**
 * @fileoverview In-memory storage implementation for conversations.
 * Provides a volatile storage solution that maintains conversations in memory
 * during runtime. This is useful for testing and development purposes.
 * 
 * @module storage/in-memory
 * @author QLLM Team
 * @version 1.0.0
 */

import { Conversation, ConversationId, ConversationMetadata, StorageProvider } from '../types';

/**
 * Implementation of the StorageProvider interface that stores conversations in memory.
 * All data is lost when the application restarts. Uses JavaScript's Map for storage
 * and structuredClone for deep copying of objects to prevent mutation.
 * 
 * @implements {StorageProvider}
 * 
 * @example
 * ```typescript
 * const storage = new InMemoryStorageProvider();
 * await storage.save(conversation);
 * const retrieved = await storage.load(conversation.id);
 * ```
 */
export class InMemoryStorageProvider implements StorageProvider {
  /** Internal Map to store conversations, indexed by their ID */
  private conversations = new Map<ConversationId, Conversation>();

  /**
   * Saves a conversation to memory storage.
   * Creates a deep copy of the conversation to prevent external mutations.
   * 
   * @param {Conversation} conversation - The conversation to save
   * @returns {Promise<void>}
   */
  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, structuredClone(conversation));
  }

  /**
   * Loads a conversation from memory storage by its ID.
   * Returns a deep copy of the stored conversation to prevent mutations.
   * 
   * @param {ConversationId} id - The ID of the conversation to load
   * @returns {Promise<Conversation | null>} The conversation if found, null otherwise
   */
  async load(id: ConversationId): Promise<Conversation | null> {
    const conversation = this.conversations.get(id);
    return conversation ? structuredClone(conversation) : null;
  }

  /**
   * Deletes a conversation from memory storage.
   * 
   * @param {ConversationId} id - The ID of the conversation to delete
   * @returns {Promise<void>}
   */
  async delete(id: ConversationId): Promise<void> {
    this.conversations.delete(id);
  }

  /**
   * Lists metadata for all stored conversations.
   * 
   * @returns {Promise<ConversationMetadata[]>} Array of conversation metadata
   */
  async list(): Promise<ConversationMetadata[]> {
    return Array.from(this.conversations.values()).map((conv) => conv.metadata);
  }

  /**
   * Lists all stored conversations.
   * Returns deep copies of the conversations to prevent mutations.
   * 
   * @returns {Promise<Conversation[]>} Array of all stored conversations
   */
  async listConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).map((conv) => structuredClone(conv));
  }
}
