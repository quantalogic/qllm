import { Conversation, ConversationId, ConversationMetadata, StorageProvider } from "../types";

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

     // Implement the new listConversations method
  async listConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).map(conv => structuredClone(conv));
  }
  }
  