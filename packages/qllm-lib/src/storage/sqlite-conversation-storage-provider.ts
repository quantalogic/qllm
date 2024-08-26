/*import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { 
  Conversation, 
  ConversationId, 
  ConversationMetadata, 
  StorageProvider,
  ConversationMessage,
} from "../types";

export class SQLiteConversationStorageProvider implements StorageProvider {
  private db: Database | null = null;

  constructor(private dbPath: string) {}

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      await this.initializeTables();
    }
    return this.db;
  }

  private async initializeTables(): Promise<void> {
    const db = await this.getDb();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        metadata TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        provider_id TEXT NOT NULL,
        options TEXT,
        metadata TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
      CREATE TABLE IF NOT EXISTS active_providers (
        conversation_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        PRIMARY KEY (conversation_id, provider_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
    `);
  }

  async save(conversation: Conversation): Promise<void> {
    const db = await this.getDb();
    await db.run('BEGIN TRANSACTION');
    try {
      // Save conversation metadata
      await db.run(
        'INSERT OR REPLACE INTO conversations (id, metadata) VALUES (?, ?)',
        conversation.id,
        JSON.stringify(conversation.metadata)
      );

      // Delete existing messages and active providers
      await db.run('DELETE FROM messages WHERE conversation_id = ?', conversation.id);
      await db.run('DELETE FROM active_providers WHERE conversation_id = ?', conversation.id);

      // Save messages
      for (const message of conversation.messages) {
        await db.run(
          'INSERT INTO messages (id, conversation_id, role, content, timestamp, provider_id, options, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          message.id,
          conversation.id,
          message.role,
          JSON.stringify(message.content),
          message.timestamp.toISOString(),
          message.providerId,
          JSON.stringify(message.options),
          JSON.stringify(message.metadata)
        );
      }

      // Save active providers
      for (const providerId of conversation.activeProviders) {
        await db.run(
          'INSERT INTO active_providers (conversation_id, provider_id) VALUES (?, ?)',
          conversation.id,
          providerId
        );
      }

      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  async load(id: ConversationId): Promise<Conversation | null> {
    const db = await this.getDb();
    const conversationRow = await db.get('SELECT * FROM conversations WHERE id = ?', id);
    if (!conversationRow) return null;

    const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', id);
    const activeProviders = await db.all('SELECT provider_id FROM active_providers WHERE conversation_id = ?', id);

    return {
      id: conversationRow.id,
      metadata: JSON.parse(conversationRow.metadata),
      messages: messages.map(m => ({
        id: m.id,
        role: m.role as ConversationMessage['role'],
        content: JSON.parse(m.content),
        timestamp: new Date(m.timestamp),
        providerId: m.provider_id,
        options: m.options ? JSON.parse(m.options) : undefined,
        metadata: m.metadata ? JSON.parse(m.metadata) : undefined
      })),
      activeProviders: new Set(activeProviders.map(ap => ap.provider_id))
    };
  }

  async delete(id: ConversationId): Promise<void> {
    const db = await this.getDb();
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM messages WHERE conversation_id = ?', id);
      await db.run('DELETE FROM active_providers WHERE conversation_id = ?', id);
      await db.run('DELETE FROM conversations WHERE id = ?', id);
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  async list(): Promise<ConversationMetadata[]> {
    const db = await this.getDb();
    const rows = await db.all('SELECT id, metadata FROM conversations');
    return rows.map(row => ({
      id: row.id,
      ...JSON.parse(row.metadata)
    }));
  }

  async listConversations(): Promise<Conversation[]> {
    const db = await this.getDb();
    const conversations = await db.all('SELECT * FROM conversations');
    return Promise.all(conversations.map(async (conv) => {
      const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', conv.id);
      const activeProviders = await db.all('SELECT provider_id FROM active_providers WHERE conversation_id = ?', conv.id);
      return {
        id: conv.id,
        metadata: JSON.parse(conv.metadata),
        messages: messages.map(m => ({
          id: m.id,
          role: m.role as ConversationMessage['role'],
          content: JSON.parse(m.content),
          timestamp: new Date(m.timestamp),
          providerId: m.provider_id,
          options: m.options ? JSON.parse(m.options) : undefined,
          metadata: m.metadata ? JSON.parse(m.metadata) : undefined
        })),
        activeProviders: new Set(activeProviders.map(ap => ap.provider_id))
      };
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}*/