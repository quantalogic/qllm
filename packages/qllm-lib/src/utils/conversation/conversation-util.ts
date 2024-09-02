// src/utils/conversation/conversation-utils.ts

import { v4 as uuidv4 } from 'uuid';
import {
  Conversation,
  ConversationId,
  ConversationMessage,
  ConversationMetadata,
  ProviderId,
  ChatMessage,
} from '../../types';

/**
 * Creates a new conversation with the given metadata and initial message.
 * @param metadata Initial metadata for the conversation
 * @param initialMessage Optional initial message for the conversation
 * @param providerId Optional provider ID for the initial message
 * @returns A new Conversation object
 */
export function createConversation(
  metadata: Partial<ConversationMetadata> = {},
  initialMessage?: string,
  providerId?: ProviderId,
): Conversation {
  const id = uuidv4();
  const now = new Date();
  const conversation: Conversation = {
    id,
    messages: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      title: metadata.title || `Conversation ${id}`,
      description: metadata.description || '',
      ...metadata,
    },
    activeProviders: new Set(providerId ? [providerId] : []),
  };

  if (initialMessage) {
    addMessageToConversation(conversation, initialMessage, 'user', providerId);
  }

  return conversation;
}

/**
 * Adds a new message to the conversation.
 * @param conversation The conversation to update
 * @param content The content of the message
 * @param role The role of the message sender (user or assistant)
 * @param providerId The ID of the provider associated with this message
 * @returns The updated Conversation object
 */
export function addMessageToConversation(
  conversation: Conversation,
  content: string,
  role: 'user' | 'assistant',
  providerId?: ProviderId,
): Conversation {
  const message: ConversationMessage = {
    id: uuidv4(),
    role,
    content: { type: 'text', text: content },
    timestamp: new Date(),
    providerId: providerId || '',
  };

  conversation.messages.push(message);
  conversation.metadata.updatedAt = new Date();

  if (providerId) {
    conversation.activeProviders.add(providerId);
  }

  return { ...conversation };
}

/**
 * Updates the metadata of a conversation.
 * @param conversation The conversation to update
 * @param metadata The new metadata to apply
 * @returns The updated Conversation object
 */
export function updateConversationMetadata(
  conversation: Conversation,
  metadata: Partial<ConversationMetadata>,
): Conversation {
  return {
    ...conversation,
    metadata: {
      ...conversation.metadata,
      ...metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Adds a provider to the conversation's active providers.
 * @param conversation The conversation to update
 * @param providerId The ID of the provider to add
 * @returns The updated Conversation object
 */
export function addProviderToConversation(
  conversation: Conversation,
  providerId: ProviderId,
): Conversation {
  const updatedProviders = new Set(conversation.activeProviders);
  updatedProviders.add(providerId);

  return {
    ...conversation,
    activeProviders: updatedProviders,
    metadata: {
      ...conversation.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Removes a provider from the conversation's active providers.
 * @param conversation The conversation to update
 * @param providerId The ID of the provider to remove
 * @returns The updated Conversation object
 */
export function removeProviderFromConversation(
  conversation: Conversation,
  providerId: ProviderId,
): Conversation {
  const updatedProviders = new Set(conversation.activeProviders);
  updatedProviders.delete(providerId);

  return {
    ...conversation,
    activeProviders: updatedProviders,
    metadata: {
      ...conversation.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Converts a ConversationMessage to a ChatMessage.
 * @param message The ConversationMessage to convert
 * @returns A ChatMessage object
 */
export function conversationMessageToChatMessage(message: ConversationMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content,
  };
}

/**
 * Extracts ChatMessages from a Conversation.
 * @param conversation The conversation to extract messages from
 * @returns An array of ChatMessage objects
 */
export function extractChatMessages(conversation: Conversation): ChatMessage[] {
  return conversation.messages.map(conversationMessageToChatMessage);
}

/**
 * Finds a conversation by its ID in an array of conversations.
 * @param conversations An array of Conversation objects
 * @param id The ID of the conversation to find
 * @returns The found Conversation object or undefined if not found
 */
export function findConversationById(
  conversations: Conversation[],
  id: ConversationId,
): Conversation | undefined {
  return conversations.find((conv) => conv.id === id);
}

/**
 * Sorts conversations by their last update time, most recent first.
 * @param conversations An array of Conversation objects to sort
 * @returns A new sorted array of Conversation objects
 */
export function sortConversationsByLastUpdate(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime(),
  );
}
