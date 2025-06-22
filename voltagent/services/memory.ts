/**
 * Memory Service for VoltAgent
 * Uses LibSQL for persistent storage and conversation management
 */
import { LibSQLStorage } from "@voltagent/core";

/**
 * LibSQL Memory Storage configured for VoltAgent
 * Supports local SQLite files and Turso cloud database
 */
export const memoryStorage = new LibSQLStorage({
  // Use local SQLite file for development, Turso URL for production
  url: process.env.DATABASE_URL || "file:data/voltagent-memory.db",
  
  // Auth token for Turso (optional for local SQLite)
  authToken: process.env.DATABASE_AUTH_TOKEN,
  
  // Prefix for all memory tables
  tablePrefix: "voltagent_memory",
  
  // Keep last 100 messages per conversation (official default)
  storageLimit: 100,
  
  // Enable debug logging in development
  debug: process.env.NODE_ENV === "development",
});

/**
 * Memory Service wrapper for easier conversation management
 */
export class MemoryService {
  private storage: LibSQLStorage;

  constructor(storage: LibSQLStorage = memoryStorage) {
    this.storage = storage;
  }

  /**
   * Get conversations for a specific user
   */
  async getUserConversations(userId: string, limit = 50) {
    return this.storage.getConversationsByUserId(userId, {
      limit,
      orderBy: "updated_at",
      orderDirection: "DESC",
    });
  }
  /**
   * Get paginated conversations for a user
   */
  async getPaginatedConversations(userId: string, page = 1, pageSize = 20) {
    return this.storage.getPaginatedUserConversations(userId, page, pageSize);
  }

  /**
   * Get messages for a specific conversation with pagination
   */
  async getConversationMessages(conversationId: string, options?: { limit?: number; offset?: number }) {
    return this.storage.getConversationMessages(conversationId, options);
  }

  /**
   * Process messages in batches for large conversations
   */
  async getConversationMessagesBatched(
    conversationId: string, 
    batchSize = 100,
    processor: (batch: any[]) => Promise<void>
  ) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.storage.getConversationMessages(conversationId, {
        limit: batchSize,
        offset: offset,
      });

      await processor(batch);
      
      hasMore = batch.length === batchSize;
      offset += batchSize;
    }
  }
  /**
   * Create a new conversation
   */
  async createConversation(conversationData: {
    id: string;
    resourceId: string;
    userId: string;
    title: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.storage.createConversation({
      ...conversationData,
      metadata: conversationData.metadata || {},
    });
  }

  /**
   * Query conversations with filters
   */
  async queryConversations(options: {
    userId?: string;
    resourceId?: string;
    limit?: number;
    offset?: number;
    orderBy?: "created_at" | "updated_at" | "title";
    orderDirection?: "ASC" | "DESC";
  }) {
    return this.storage.queryConversations(options);
  }

  /**
   * Update conversation title or metadata
   */
  async updateConversation(conversationId: string, updates: {
    title?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.storage.updateConversation(conversationId, updates);
  }
  /**
   * Get specific conversation with user validation
   */
  async getUserConversation(conversationId: string, userId: string) {
    return this.storage.getUserConversation(conversationId, userId);
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string) {
    return this.storage.deleteConversation(conversationId);
  }

  /**
   * Clear all messages for a conversation or user
   */
  async clearMessages(options: {
    userId: string;
    conversationId?: string | undefined;
  }) {
    return this.storage.clearMessages(options);  }

  /**
   * Get messages with filtering options
   */
  async getMessages(options: {
    userId: string;
    conversationId: string;
    limit?: number;
    offset?: number;
  }) {
    return this.storage.getMessages(options);
  }
}

export const memoryService = new MemoryService();
