/**
 * Context Service for VoltAgent
 * Provides user context management and cross-agent data sharing
 */

/**
 * Simple user context implementation for maintaining state across agent interactions
 */
class UserContextMap extends Map<string, any> {
  constructor() {
    super();
  }
}

/**
 * User Context for maintaining state across agent interactions
 * This context flows through the agent lifecycle and between agents
 */
export const userContext = new UserContextMap();

/**
 * Context Service for managing user sessions and cross-agent data
 */
export class ContextService {
  private context = userContext;

  /**
   * Set a value in the user context
   */
  set(key: string, value: any) {
    this.context.set(key, value);
  }

  /**
   * Get a value from the user context
   */
  get(key: string) {
    return this.context.get(key);
  }

  /**
   * Check if a key exists in the context
   */
  has(key: string): boolean {
    return this.context.has(key);
  }

  /**
   * Delete a key from the context
   */
  delete(key: string): boolean {
    return this.context.delete(key);
  }

  /**
   * Clear all context data
   */
  clear() {
    this.context.clear();
  }
  /**
   * Get all context data as an object
   */
  getAll(): Record<string, any> {
    const data: Record<string, any> = {};
    this.context.forEach((value: any, key: string) => {
      data[key] = value;
    });
    return data;
  }

  /**
   * Initialize session context with user data
   */
  initializeSession(userId: string, sessionId: string, metadata?: Record<string, any>) {
    this.set("userId", userId);
    this.set("sessionId", sessionId);
    this.set("sessionStartTime", new Date().toISOString());
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  /**
   * Get session information
   */
  getSessionInfo() {
    return {
      userId: this.get("userId"),
      sessionId: this.get("sessionId"),
      sessionStartTime: this.get("sessionStartTime"),
      currentAgent: this.get("currentAgent"),
      operationId: this.get("operationId")
    };
  }

  /**
   * Set current agent context
   */
  setCurrentAgent(agentName: string, operation?: string) {
    this.set("currentAgent", agentName);
    this.set("lastAgentChange", new Date().toISOString());
    
    if (operation) {
      this.set("currentOperation", operation);
    }
  }

  /**
   * Track agent handoffs and delegation flow
   */
  trackHandoff(fromAgent: string, toAgent: string, reason?: string) {
    const handoffs = this.get("handoffs") || [];
    handoffs.push({
      from: fromAgent,
      to: toAgent,
      reason,
      timestamp: new Date().toISOString()
    });
    this.set("handoffs", handoffs);
  }

  /**
   * Store operation results for cross-agent access
   */
  storeResult(operationId: string, result: any, agentName: string) {
    const results = this.get("operationResults") || {};
    results[operationId] = {
      result,
      agentName,
      timestamp: new Date().toISOString()
    };
    this.set("operationResults", results);
  }

  /**
   * Get result from a previous operation
   */
  getResult(operationId: string) {
    const results = this.get("operationResults") || {};
    return results[operationId];
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences: Record<string, any>) {
    this.set("userPreferences", preferences);
  }

  /**
   * Get user preferences
   */
  getPreferences(): Record<string, any> {
    return this.get("userPreferences") || {};
  }

  /**
   * Update a specific preference
   */
  updatePreference(key: string, value: any) {
    const prefs = this.getPreferences();
    prefs[key] = value;
    this.setPreferences(prefs);
  }
}

/**
 * Global context service instance
 */
export const contextService = new ContextService();

/**
 * Helper functions for common context operations
 */
export const contextHelpers = {
  /**
   * Quick session initialization
   */
  initSession: (userId: string, sessionId?: string) => {
    const sid = sessionId || `session-${Date.now()}`;
    contextService.initializeSession(userId, sid);
    return sid;
  },

  /**
   * Track conversation flow
   */
  trackConversation: (conversationId: string, message: string, role: 'user' | 'assistant') => {
    const conversations = contextService.get("conversations") || {};
    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }
    
    conversations[conversationId].push({
      message,
      role,
      timestamp: new Date().toISOString()
    });
    
    contextService.set("conversations", conversations);
  },

  /**
   * Get conversation history
   */
  getConversation: (conversationId: string) => {
    const conversations = contextService.get("conversations") || {};
    return conversations[conversationId] || [];
  },

  /**
   * Store file or resource references
   */
  storeReference: (type: string, reference: any) => {
    const refs = contextService.get("references") || {};
    if (!refs[type]) {
      refs[type] = [];
    }
    
    refs[type].push({
      ...reference,
      timestamp: new Date().toISOString()
    });
    
    contextService.set("references", refs);
  },

  /**
   * Get references by type
   */
  getReferences: (type: string) => {
    const refs = contextService.get("references") || {};
    return refs[type] || [];
  }
};
