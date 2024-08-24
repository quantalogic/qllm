// src/conversation/conversation-reducer.ts

import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationMessage, ConversationMetadata, ProviderId } from '../types';

// Action types
export enum ConversationActionType {
  ADD_MESSAGE = 'ADD_MESSAGE',
  SET_METADATA = 'SET_METADATA',
  ADD_PROVIDER = 'ADD_PROVIDER',
  REMOVE_PROVIDER = 'REMOVE_PROVIDER',
  CLEAR_MESSAGES = 'CLEAR_MESSAGES',
}

// Action interfaces
interface AddMessageAction {
  type: ConversationActionType.ADD_MESSAGE;
  payload: {
    message: Omit<ConversationMessage, 'id' | 'timestamp'>;
    providerId: ProviderId;
  };
}

interface SetMetadataAction {
  type: ConversationActionType.SET_METADATA;
  payload: Partial<ConversationMetadata>;
}

interface AddProviderAction {
  type: ConversationActionType.ADD_PROVIDER;
  payload: ProviderId;
}

interface RemoveProviderAction {
  type: ConversationActionType.REMOVE_PROVIDER;
  payload: ProviderId;
}

interface ClearMessagesAction {
  type: ConversationActionType.CLEAR_MESSAGES;
}

export type ConversationAction =
  | AddMessageAction
  | SetMetadataAction
  | AddProviderAction
  | RemoveProviderAction
  | ClearMessagesAction;

// Helper functions
const updateMetadata = (metadata: ConversationMetadata): ConversationMetadata => ({
  ...metadata,
  updatedAt: new Date(),
});

// Reducer function
export function conversationReducer(state: Conversation, action: ConversationAction): Conversation {
  switch (action.type) {
    case ConversationActionType.ADD_MESSAGE:
      const newMessage: ConversationMessage = {
        ...action.payload.message,
        id: uuidv4(),
        timestamp: new Date(),
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
        activeProviders: new Set([...state.activeProviders, action.payload.providerId]),
        metadata: updateMetadata(state.metadata),
      };

    case ConversationActionType.SET_METADATA:
      return {
        ...state,
        metadata: updateMetadata({
          ...state.metadata,
          ...action.payload,
        }),
      };

    case ConversationActionType.ADD_PROVIDER:
      return {
        ...state,
        activeProviders: new Set([...state.activeProviders, action.payload]),
        metadata: updateMetadata(state.metadata),
      };

    case ConversationActionType.REMOVE_PROVIDER:
      const updatedProviders = new Set(state.activeProviders);
      updatedProviders.delete(action.payload);
      return {
        ...state,
        activeProviders: updatedProviders,
        metadata: updateMetadata(state.metadata),
      };

    case ConversationActionType.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
        metadata: updateMetadata(state.metadata),
      };

    default:
      return state;
  }
}

// Action creators
export const addMessage = (
  message: Omit<ConversationMessage, 'id' | 'timestamp'>,
  providerId: ProviderId,
): AddMessageAction => ({
  type: ConversationActionType.ADD_MESSAGE,
  payload: { message, providerId },
});

export const setMetadata = (metadata: Partial<ConversationMetadata>): SetMetadataAction => ({
  type: ConversationActionType.SET_METADATA,
  payload: metadata,
});

export const addProvider = (providerId: ProviderId): AddProviderAction => ({
  type: ConversationActionType.ADD_PROVIDER,
  payload: providerId,
});

export const removeProvider = (providerId: ProviderId): RemoveProviderAction => ({
  type: ConversationActionType.REMOVE_PROVIDER,
  payload: providerId,
});

export const clearMessages = (): ClearMessagesAction => ({
  type: ConversationActionType.CLEAR_MESSAGES,
});
