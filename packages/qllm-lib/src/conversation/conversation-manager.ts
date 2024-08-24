// src/conversation/conversation-manager.ts

import { v4 as uuidv4 } from 'uuid';
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
import {
  ConversationError,
  ConversationNotFoundError,
  InvalidConversationOperationError,
} from '../types';

export const createConversationManager = (): ConversationManager => {
  return new ConversationManagerImpl();
}

export class ConversationManagerImpl implements ConversationManager {
  private storageProvider: StorageProvider;

  constructor(storageProvider?: StorageProvider) {
    this.storageProvider = storageProvider || new InMemoryStorageProvider();
  }

  async createConversation(options: CreateConversationOptions = {}): Promise<Conversation> {
    const id = uuidv4();
    const now = new Date();
    const conversation: Conversation = {
      id,
      messages: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        title: options.metadata?.title || `Conversation ${id}`,
        description: options.metadata?.description || '',
        ...options.metadata,
      },
      activeProviders: new Set(options.providerIds || []),
    };

    if (options.initialMessage) {
      conversation.messages.push({
        id: uuidv4(),
        role: 'user',
        content: { type: 'text', text: options.initialMessage },
        timestamp: now,
        providerId: options.providerIds?.[0] || '',
      });
    }

    await this.storageProvider.save(conversation);
    return conversation;
  }

  async getConversation(id: ConversationId): Promise<Conversation> {
    const conversation = await this.storageProvider.load(id);
    if (!conversation) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }

  async updateConversation(id: ConversationId, updates: Partial<Conversation>): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    const updatedConversation: Conversation = {
      ...conversation,
      ...updates,
      metadata: {
        ...conversation.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };
    await this.storageProvider.save(updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: ConversationId): Promise<void> {
    await this.storageProvider.delete(id);
  }

  async listConversations(): Promise<ConversationMetadata[]> {
    return this.storageProvider.list();
  }

  async addMessage(id: ConversationId, message: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    const newMessage: ConversationMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };
    conversation.messages.push(newMessage);
    conversation.activeProviders.add(message.providerId);
    conversation.metadata.updatedAt = new Date();
    await this.storageProvider.save(conversation);
    return conversation;
  }

  async getHistory(id: ConversationId): Promise<ConversationMessage[]> {
    const conversation = await this.getConversation(id);
    return conversation.messages;
  }

  async setMetadata(id: ConversationId, metadata: Partial<ConversationMetadata>): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    conversation.metadata = {
      ...conversation.metadata,
      ...metadata,
      updatedAt: new Date(),
    };
    await this.storageProvider.save(conversation);
    return conversation;
  }

  async addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    conversation.activeProviders.add(providerId);
    conversation.metadata.updatedAt = new Date();
    await this.storageProvider.save(conversation);
    return conversation;
  }

  async removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    if (!conversation.activeProviders.has(providerId)) {
      throw new InvalidConversationOperationError(`Provider ${providerId} is not active in conversation ${id}`);
    }
    conversation.activeProviders.delete(providerId);
    conversation.metadata.updatedAt = new Date();
    await this.storageProvider.save(conversation);
    return conversation;
  }

  async clearHistory(id: ConversationId): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    conversation.messages = [];
    conversation.metadata.updatedAt = new Date();
    await this.storageProvider.save(conversation);
    return conversation;
  }

  async searchConversations(query: string): Promise<ConversationMetadata[]> {
    const allConversations = await this.listConversations();
    return allConversations.filter(
      (conv) =>
        conv.title?.toLowerCase().includes(query.toLowerCase()) ||
        conv.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async exportConversation(id: ConversationId): Promise<string> {
    const conversation = await this.getConversation(id);
    return JSON.stringify(conversation, null, 2);
  }

  async importConversation(conversationData: string): Promise<Conversation> {
    try {
      const parsedData = JSON.parse(conversationData) as Conversation;
      if (!this.isValidConversation(parsedData)) {
        throw new Error('Invalid conversation data structure');
      }
      await this.storageProvider.save(parsedData);
      return parsedData;
    } catch (error) {
      throw new ConversationError(`Failed to import conversation: ${(error as Error).message}`);
    }
  }

  private isValidConversation(data: any): data is Conversation {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      Array.isArray(data.messages) &&
      typeof data.metadata === 'object' &&
      data.activeProviders instanceof Set
    );
  }
}