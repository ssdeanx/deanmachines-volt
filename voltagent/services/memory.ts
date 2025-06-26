/**
 * Memory Service for VoltAgent
 * Uses LibSQL for persistent storage and conversation management
 */
import { LibSQLStorage } from "@voltagent/core";

// Helper to safely access environment variables in any environment
function getEnvVar(name: string, fallback?: string): string | undefined {
  if (typeof globalThis.process !== "undefined" && globalThis.process.env && globalThis.process.env[name] !== undefined) {
    return globalThis.process.env[name];
  }
  return fallback;
}

// Define a type for conversation messages (customize fields as needed)
export type ConversationMessage = {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  createdAt: string;
  // ...add other relevant fields as needed
};

// Define a type for messages returned by storage
/**
 * @deprecated Use ConversationMessage instead. This type is kept for backward compatibility and documentation purposes.
 */
// type MemoryMessage = {
//   id: string;
//   content: string;
//   createdAt?: string;
//   created_at?: string;
//   conversationId?: string;
//   userId?: string;
//   // ...add other relevant fields as needed
// };

/**
 * LibSQL Memory Storage configured for VoltAgent
 * Supports local SQLite files and Turso cloud database
 */
export const memoryStorage = new LibSQLStorage({
  // Use local SQLite file for development, Turso URL for production
  url: getEnvVar("DATABASE_URL", "file:data/voltagent-memory.db") ?? "file:data/voltagent-memory.db",

  // Auth token for Turso (optional for local SQLite)
  authToken: getEnvVar("DATABASE_AUTH_TOKEN"),

  // Prefix for all memory tables
  tablePrefix: "voltagent_memory",

  // Keep last 100 messages per conversation (official default)
  storageLimit: 100,

  // Enable debug logging in development
  debug: getEnvVar("NODE_ENV") === "development",
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

}

export const memoryService = new MemoryService();
