/**
 * @fileoverview Manages conversation state and persistence in the QLLM library.
 * This module provides a robust conversation management system with support for
 * creating, updating, and managing conversation states with different storage providers.
 * 
 * @module conversation-manager
 * @author QLLM Team
 * @version 1.0.0
 */

import {
  Conversation,
  ConversationId,
  ConversationManager,
  ConversationMessage,
  ConversationMetadata,
  CreateConversationOptions,
  ProviderId,
  StorageProvider,
} from '../types';
import { InMemoryStorageProvider } from '../storage/in-memory-storage-provider';
import { ConversationError, ConversationNotFoundError } from '../types';
import { ConversationAction, conversationReducer } from './conversation-reducer';

/**
 * Creates and returns a new ConversationManager instance.
 * 
 * @param {StorageProvider} [initialStorageProvider] - Optional storage provider for persistence.
 *                                                    Defaults to InMemoryStorageProvider if not provided.
 * @returns {ConversationManager} A new conversation manager instance with the specified storage provider.
 * 
 * @example
 * ```typescript
 * const manager = createConversationManager();
 * // Or with a custom storage provider
 * const manager = createConversationManager(new CustomStorageProvider());
 * ```
 */
export const createConversationManager = (
  initialStorageProvider?: StorageProvider,
): ConversationManager => {
  let state = new Map<ConversationId, Conversation>();
  const storageProvider = initialStorageProvider || new InMemoryStorageProvider();

  const dispatch = (action: ConversationAction): void => {
    state = conversationReducer(state, action);
  };

  const manager: ConversationManager = {
    storageProvider,

    /**
     * Creates a new conversation with optional initial settings.
     * 
     * @param {CreateConversationOptions} [options={}] - Configuration options for the new conversation
     * @returns {Promise<Conversation>} Newly created conversation instance
     * @throws {ConversationError} If conversation creation fails
     * 
     * @example
     * ```typescript
     * const conversation = await manager.createConversation({
     *   metadata: { title: 'New Chat' },
     *   providerIds: ['openai']
     * });
     * ```
     */
    async createConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'CREATE_CONVERSATION',
        payload: options,
      };
      dispatch(action);
      const newConversation = Array.from(state.values()).pop();
      if (!newConversation) throw new ConversationError('Failed to create conversation');
      await storageProvider.save(newConversation);
      return newConversation;
    },

    /**
     * Retrieves a conversation by its ID.
     * 
     * @param {ConversationId} id - The unique identifier of the conversation
     * @returns {Promise<Conversation>} The requested conversation
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async getConversation(id: ConversationId): Promise<Conversation> {
      const conversation = state.get(id);
      if (!conversation) {
        const loadedConversation = await storageProvider.load(id);
        if (!loadedConversation) throw new ConversationNotFoundError(id);
        state.set(id, loadedConversation);
        return loadedConversation;
      }
      return conversation;
    },

    /**
     * Updates an existing conversation with new data.
     * 
     * @param {ConversationId} id - The ID of the conversation to update
     * @param {Partial<Conversation>} updates - Partial conversation data to apply
     * @returns {Promise<Conversation>} The updated conversation
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async updateConversation(
      id: ConversationId,
      updates: Partial<Conversation>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'UPDATE_CONVERSATION',
        payload: { id, updates },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Deletes a conversation by its ID.
     * 
     * @param {ConversationId} id - The ID of the conversation to delete
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async deleteConversation(id: ConversationId): Promise<void> {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
      await storageProvider.delete(id);
    },

    /**
     * Retrieves all conversations from the storage provider.
     * 
     * @returns {Promise<Conversation[]>} Array of all stored conversations
     */
    async listConversations(): Promise<Conversation[]> {
      return storageProvider.listConversations();
    },

    /**
     * Adds a new message to an existing conversation.
     * 
     * @param {ConversationId} id - The ID of the target conversation
     * @param {Omit<ConversationMessage, 'id'>} message - The message to add (ID will be generated)
     * @returns {Promise<Conversation>} The updated conversation with the new message
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async addMessage(
      id: ConversationId,
      message: Omit<ConversationMessage, 'id'>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'ADD_MESSAGE',
        payload: { id, message },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Retrieves the message history for a specific conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @returns {Promise<ConversationMessage[]>} Array of conversation messages in chronological order
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async getHistory(id: ConversationId): Promise<ConversationMessage[]> {
      const conversation = await this.getConversation(id);
      return conversation.messages;
    },

    /**
     * Updates the metadata for a specific conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @param {Partial<ConversationMetadata>} metadata - New metadata to apply
     * @returns {Promise<Conversation>} The updated conversation
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async setMetadata(
      id: ConversationId,
      metadata: Partial<ConversationMetadata>,
    ): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'SET_METADATA',
        payload: { id, metadata },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Adds a new provider to an existing conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @param {ProviderId} providerId - The ID of the provider to add
     * @returns {Promise<Conversation>} The updated conversation with the new provider
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'ADD_PROVIDER',
        payload: { id, providerId },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Removes a provider from an existing conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @param {ProviderId} providerId - The ID of the provider to remove
     * @returns {Promise<Conversation>} The updated conversation with the provider removed
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'REMOVE_PROVIDER',
        payload: { id, providerId },
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Clears the message history for a specific conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @returns {Promise<Conversation>} The updated conversation with the history cleared
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async clearHistory(id: ConversationId): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'CLEAR_HISTORY',
        payload: id,
      };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    /**
     * Searches for conversations based on a query string.
     * 
     * @param {string} query - The search query
     * @returns {Promise<ConversationMetadata[]>} Array of conversation metadata matching the query
     */
    async searchConversations(query: string): Promise<ConversationMetadata[]> {
      const allConversations = await this.listConversations();
      return allConversations
        .filter(
          (conv) =>
            conv.metadata.title?.toLowerCase().includes(query.toLowerCase()) ||
            conv.metadata.description?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((conv) => conv.metadata);
    },

    /**
     * Exports a conversation to a JSON string.
     * 
     * @param {ConversationId} id - The ID of the conversation to export
     * @returns {Promise<string>} The conversation data as a JSON string
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async exportConversation(id: ConversationId): Promise<string> {
      const conversation = await this.getConversation(id);
      return JSON.stringify(conversation, null, 2);
    },

    /**
     * Imports a conversation from a JSON string.
     * 
     * @param {string} conversationData - The conversation data as a JSON string
     * @returns {Promise<Conversation>} The imported conversation
     * @throws {ConversationError} If conversation import fails
     */
    async importConversation(conversationData: string): Promise<Conversation> {
      const action: ConversationAction = {
        type: 'IMPORT_CONVERSATION',
        payload: conversationData,
      };
      dispatch(action);
      const importedConversation = Array.from(state.values()).pop();
      if (!importedConversation) throw new ConversationError('Failed to import conversation');
      await storageProvider.save(importedConversation);
      return importedConversation;
    },

    /**
     * Clears a conversation, removing all messages and providers.
     * 
     * @param {ConversationId} id - The ID of the conversation to clear
     * @returns {Promise<Conversation>} The updated conversation
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async clearConversation(id: ConversationId): Promise<Conversation> {
      return this.clearHistory(id);
    },

    /**
     * Starts a new conversation with optional initial settings.
     * 
     * @param {CreateConversationOptions} [options={}] - Configuration options for the new conversation
     * @returns {Promise<Conversation>} The newly created conversation
     * @throws {ConversationError} If conversation creation fails
     */
    async startNewConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
      return this.createConversation(options);
    },

    /**
     * Lists all conversations.
     * 
     * @returns {Promise<Conversation[]>} Array of all conversations
     */
    async listAllConversations(): Promise<Conversation[]> {
      return this.listConversations();
    },

    /**
     * Displays the message history for a specific conversation.
     * 
     * @param {ConversationId} id - The ID of the conversation
     * @returns {Promise<ConversationMessage[]>} Array of conversation messages in chronological order
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async displayConversation(id: ConversationId): Promise<ConversationMessage[]> {
      return this.getHistory(id);
    },

    /**
     * Selects a conversation by its ID.
     * 
     * @param {ConversationId} id - The ID of the conversation to select
     * @returns {Promise<Conversation>} The selected conversation
     * @throws {ConversationNotFoundError} If the conversation doesn't exist
     */
    async selectConversation(id: ConversationId): Promise<Conversation> {
      return this.getConversation(id);
    },

    /**
     * Deletes all conversations.
     * 
     * @throws {ConversationNotFoundError} If any conversation doesn't exist
     */
    async deleteAllConversations(): Promise<void> {
      const allConversations = await this.listConversations();
      for (const conversation of allConversations) {
        await this.deleteConversation(conversation.id);
      }
    },
  };

  return manager;
};
