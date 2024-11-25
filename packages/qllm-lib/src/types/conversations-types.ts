/**
 * @fileoverview Type definitions for conversation management in the QLLM library.
 * This file defines the core types and interfaces for handling conversations,
 * including message history, metadata, and storage operations.
 * 
 * @version 1.0.0
 * @license MIT
 */

import { ChatMessage, LLMOptions } from './llm-types';

/** Unique identifier for a conversation */
export type ConversationId = string;

/** Unique identifier for a provider */
export type ProviderId = string;

/**
 * Metadata associated with a conversation
 * Includes creation and update timestamps, title, description, and custom fields
 */
export interface ConversationMetadata {
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Extended chat message type that includes conversation-specific fields
 * such as message ID, timestamp, and provider information
 */
export interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  providerId: ProviderId;
  options?: Partial<LLMOptions>;
  metadata?: Record<string, any>;
}

/**
 * Core conversation type that represents a complete conversation
 * including messages, metadata, and active providers
 */
export interface Conversation {
  id: ConversationId;
  messages: ConversationMessage[];
  metadata: ConversationMetadata;
  activeProviders: Set<ProviderId>;
}

/**
 * Interface for conversation storage providers
 * Defines methods for persisting and retrieving conversations
 */
export interface StorageProvider {
  /**
   * Saves a conversation to storage
   * @param conversation - The conversation to save
   */
  save(conversation: Conversation): Promise<void>;
  
  /**
   * Loads a conversation from storage by ID
   * @param id - The conversation ID to load
   * @returns The conversation if found, null otherwise
   */
  load(id: ConversationId): Promise<Conversation | null>;
  
  /**
   * Deletes a conversation from storage
   * @param id - The conversation ID to delete
   */
  delete(id: ConversationId): Promise<void>;
  
  /**
   * Lists all conversation metadata
   * @returns Array of conversation metadata
   */
  list(): Promise<ConversationMetadata[]>;
  
  /**
   * Lists all complete conversations
   * @returns Array of complete conversations
   */
  listConversations(): Promise<Conversation[]>;
}

/**
 * Interface for conversation management operations
 * Provides comprehensive methods for handling conversations
 */
export interface ConversationManager {
  /**
   * Creates a new conversation
   * @param options - Optional configuration for the new conversation
   * @returns The created conversation
   */
  createConversation(options?: CreateConversationOptions): Promise<Conversation>;
  
  /**
   * Retrieves a conversation by ID
   * @param id - The conversation ID to retrieve
   * @returns The requested conversation
   */
  getConversation(id: ConversationId): Promise<Conversation>;
  
  /**
   * Updates an existing conversation
   * @param id - The conversation ID to update
   * @param updates - Partial conversation updates to apply
   * @returns The updated conversation
   */
  updateConversation(id: ConversationId, updates: Partial<Conversation>): Promise<Conversation>;
  
  /**
   * Deletes a conversation
   * @param id - The conversation ID to delete
   */
  deleteConversation(id: ConversationId): Promise<void>;
  
  /**
   * Lists all conversations
   * @returns Array of all conversations
   */
  listConversations(): Promise<Conversation[]>;
  
  /**
   * Adds a message to a conversation
   * @param id - The conversation ID
   * @param message - The message to add
   * @returns The updated conversation
   */
  addMessage(
    id: ConversationId,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>,
  ): Promise<Conversation>;
  
  /**
   * Retrieves conversation history
   * @param id - The conversation ID
   * @returns Array of conversation messages
   */
  getHistory(id: ConversationId): Promise<ConversationMessage[]>;
  
  /**
   * Updates conversation metadata
   * @param id - The conversation ID
   * @param metadata - Metadata updates to apply
   * @returns The updated conversation
   */
  setMetadata(id: ConversationId, metadata: Partial<ConversationMetadata>): Promise<Conversation>;
  
  /**
   * Adds a provider to a conversation
   * @param id - The conversation ID
   * @param providerId - The provider ID to add
   * @returns The updated conversation
   */
  addProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  
  /**
   * Removes a provider from a conversation
   * @param id - The conversation ID
   * @param providerId - The provider ID to remove
   * @returns The updated conversation
   */
  removeProvider(id: ConversationId, providerId: ProviderId): Promise<Conversation>;
  
  /**
   * Clears conversation history
   * @param id - The conversation ID
   * @returns The updated conversation
   */
  clearHistory(id: ConversationId): Promise<Conversation>;
  
  /**
   * Searches conversations by query
   * @param query - Search query string
   * @returns Array of matching conversation metadata
   */
  searchConversations(query: string): Promise<ConversationMetadata[]>;
  
  /**
   * Exports a conversation to string format
   * @param id - The conversation ID to export
   * @returns Exported conversation string
   */
  exportConversation(id: ConversationId): Promise<string>;
  
  /**
   * Imports a conversation from string format
   * @param conversationData - The conversation data to import
   * @returns The imported conversation
   */
  importConversation(conversationData: string): Promise<Conversation>;
  
  /**
   * Clears a conversation's content
   * @param id - The conversation ID to clear
   * @returns The cleared conversation
   */
  clearConversation(id: ConversationId): Promise<Conversation>;
  
  /**
   * Starts a new conversation
   * @param options - Configuration options for the new conversation
   * @returns The new conversation
   */
  startNewConversation(options: CreateConversationOptions): Promise<Conversation>;
  
  /**
   * Lists all available conversations
   * @returns Array of all conversations
   */
  listAllConversations(): Promise<Conversation[]>;
  
  /**
   * Displays a conversation's content
   * @param id - The conversation ID to display
   * @returns Array of conversation messages
   */
  displayConversation(id: ConversationId): Promise<ConversationMessage[]>;
  
  /**
   * Selects a conversation for active use
   * @param id - The conversation ID to select
   * @returns The selected conversation
   */
  selectConversation(id: ConversationId): Promise<Conversation>;
  
  /**
   * Deletes all conversations
   */
  deleteAllConversations(): Promise<void>;
  
  /** Storage provider instance */
  storageProvider: StorageProvider;
}

/**
 * Options for creating a new conversation
 */
export interface CreateConversationOptions {
  initialMessage?: string;
  metadata?: Partial<ConversationMetadata>;
  providerIds?: ProviderId[];
}

/**
 * Base error class for conversation-related errors
 */
export class ConversationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationError';
  }
}

/**
 * Error thrown when a conversation is not found
 */
export class ConversationNotFoundError extends ConversationError {
  constructor(id: ConversationId) {
    super(`Conversation with id ${id} not found`);
    this.name = 'ConversationNotFoundError';
  }
}

/**
 * Error thrown for invalid conversation operations
 */
export class InvalidConversationOperationError extends ConversationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConversationOperationError';
  }
}
