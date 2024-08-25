// src/conversation/conversation-manager.ts

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
import { InMemoryStorageProvider } from '../types/conversations-types';
import { ConversationError, ConversationNotFoundError } from '../types';
import { ConversationAction, conversationReducer } from './conversation-reducer';

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

    async createConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
      const action: ConversationAction = { type: 'CREATE_CONVERSATION', payload: options };
      dispatch(action);
      const newConversation = Array.from(state.values()).pop();
      if (!newConversation) throw new ConversationError('Failed to create conversation');
      await storageProvider.save(newConversation);
      return newConversation;
    },

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

    async updateConversation(
      id: ConversationId,
      updates: Partial<Conversation>,
    ): Promise<Conversation> {
      const action: ConversationAction = { type: 'UPDATE_CONVERSATION', payload: { id, updates } };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async deleteConversation(id: ConversationId): Promise<void> {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
      await storageProvider.delete(id);
    },

    async listConversations(): Promise<ConversationMetadata[]> {
      return storageProvider.list();
    },

    async addMessage(
      id: ConversationId,
      message: Omit<ConversationMessage, 'id' | 'timestamp'>,
    ): Promise<Conversation> {
      const action: ConversationAction = { type: 'ADD_MESSAGE', payload: { id, message } };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async getHistory(id: ConversationId): Promise<ConversationMessage[]> {
      const conversation = await this.getConversation(id);
      return conversation.messages;
    },

    async setMetadata(
      id: ConversationId,
      metadata: Partial<ConversationMetadata>,
    ): Promise<Conversation> {
      const action: ConversationAction = { type: 'SET_METADATA', payload: { id, metadata } };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = { type: 'ADD_PROVIDER', payload: { id, providerId } };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
      const action: ConversationAction = { type: 'REMOVE_PROVIDER', payload: { id, providerId } };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async clearHistory(id: ConversationId): Promise<Conversation> {
      const action: ConversationAction = { type: 'CLEAR_HISTORY', payload: id };
      dispatch(action);
      const updatedConversation = state.get(id);
      if (!updatedConversation) throw new ConversationNotFoundError(id);
      await storageProvider.save(updatedConversation);
      return updatedConversation;
    },

    async searchConversations(query: string): Promise<ConversationMetadata[]> {
      const allConversations = await this.listConversations();
      return allConversations.filter(
        (conv) =>
          conv.title?.toLowerCase().includes(query.toLowerCase()) ||
          conv.description?.toLowerCase().includes(query.toLowerCase()),
      );
    },

    async exportConversation(id: ConversationId): Promise<string> {
      const conversation = await this.getConversation(id);
      return JSON.stringify(conversation, null, 2);
    },

    async importConversation(conversationData: string): Promise<Conversation> {
      const action: ConversationAction = { type: 'IMPORT_CONVERSATION', payload: conversationData };
      dispatch(action);
      const importedConversation = Array.from(state.values()).pop();
      if (!importedConversation) throw new ConversationError('Failed to import conversation');
      await storageProvider.save(importedConversation);
      return importedConversation;
    },
  };

  return manager;
};
