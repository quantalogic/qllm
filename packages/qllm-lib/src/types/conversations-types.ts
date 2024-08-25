// src/types/conversation-types.ts

import { ChatMessage, LLMOptions } from './llm-types';

export type ConversationId = string;
export type ProviderId = string;

export interface ConversationMetadata {
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  providerId: ProviderId;
  options?: Partial<LLMOptions>;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: ConversationId;
  messages: ConversationMessage[];
  metadata: ConversationMetadata;
  activeProviders: Set<ProviderId>;
}

export interface StorageProvider {
  save(conversation: Conversation): Promise<void>;
  load(id: ConversationId): Promise<Conversation | null>;
  delete(id: ConversationId): Promise<void>;
  list(): Promise<ConversationMetadata[]>;
}

export class InMemoryStorageProvider implements StorageProvider {
  private conversations = new Map<ConversationId, Conversation>();

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.id, structuredClone(conversation));
  }

  async load(id: ConversationId): Promise<Conversation | null> {
    const conversation = this.conversations.get(id);
    return conversation ? structuredClone(conversation) : null;
  }

  async delete(id: ConversationId): Promise<void> {
    this.conversations.delete(id);
  }

  async list(): Promise<ConversationMetadata[]> {
    return Array.from(this.conversations.values()).map((conv) => conv.metadata);
  }
}

export interface ConversationManager {
  createConversation(options?: CreateConversationOptions): Promise<Conversation>;
  getConversation(id: ConversationId): Promise<Conversation>;
  updateConversation(id: ConversationId, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: ConversationId): Promise<void>;
  listConversations(): Promise<ConversationMetadata[]>;
  addMessage(
    id: ConversationId,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>,
  ): Promise<Conversation>;
  getHistory(id: ConversationId): Promise<ConversationMessage[]>;
  setMetadata(id: ConversationId, metadata: Partial<ConversationMetadata>): Promise<Conversation>;
  addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  clearHistory(id: ConversationId): Promise<Conversation>;
  searchConversations(query: string): Promise<ConversationMetadata[]>;
  exportConversation(id: ConversationId): Promise<string>;
  importConversation(conversationData: string): Promise<Conversation>;
  storageProvider: StorageProvider;
}

export interface CreateConversationOptions {
  initialMessage?: string;
  metadata?: Partial<ConversationMetadata>;
  providerIds?: ProviderId[];
}

export class ConversationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationError';
  }
}

export class ConversationNotFoundError extends ConversationError {
  constructor(id: ConversationId) {
    super(`Conversation with id ${id} not found`);
    this.name = 'ConversationNotFoundError';
  }
}

export class InvalidConversationOperationError extends ConversationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConversationOperationError';
  }
}
