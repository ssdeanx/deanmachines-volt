/**
 * Context Service for VoltAgent
 * Manages userContext flow and data sharing across agents, tools, and retrievers
 */

/**
 * Create initial userContext with common tracking data
 */
export function createInitialContext(options: {
  userId?: string;
  sessionId?: string;
  language?: string;
  metadata?: Record<string, unknown>;
} = {}): Map<string, unknown> {
  const context = new Map<string, unknown>();
  
  // Set default values
  context.set("userId", options.userId || "default");
  context.set("sessionId", options.sessionId || `session-${Date.now()}`);
  context.set("language", options.language || "English");
  context.set("createdAt", new Date().toISOString());
  
  // Add any additional metadata
  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      context.set(key, value);
    }
  }
  
  console.log(`📝 Created initial context for user ${context.get("userId")}`);
  return context;
}

/**
 * Context helper for tracking references from retrievers
 */
export function addReferences(
  userContext: Map<string, unknown>,
  references: Array<{
    id: string;
    title: string;
    source: string;
    url?: string;
    tags?: string[];
  }>
): void {
  const existingRefs = (userContext.get("references") as typeof references) || [];
  const updatedRefs = [...existingRefs, ...references];
  
  userContext.set("references", updatedRefs);
  userContext.set("lastReferenceUpdate", new Date().toISOString());
  
  console.log(`📚 Added ${references.length} references to context (total: ${updatedRefs.length})`);
}

/**
 * Context helper for tracking tool usage
 */
export function trackToolUsage(
  userContext: Map<string, unknown>,
  toolName: string,
  result: unknown,
  success: boolean = true
): void {
  const toolHistory = (userContext.get("toolHistory") as Array<{
    name: string;
    timestamp: string;
    success: boolean;
    result?: unknown;
  }>) || [];
  
  toolHistory.push({
    name: toolName,
    timestamp: new Date().toISOString(),
    success,
    result: success ? result : undefined
  });
  
  userContext.set("toolHistory", toolHistory);
  userContext.set("totalToolCalls", toolHistory.length);
  userContext.set("successfulToolCalls", toolHistory.filter(t => t.success).length);
  
  console.log(`🔧 Tracked tool usage: ${toolName} (${success ? "success" : "failure"})`);
}

/**
 * Context helper for tracking agent delegation
 */
export function trackDelegation(
  userContext: Map<string, unknown>,
  fromAgent: string,
  toAgent: string,
  task: string
): void {
  const delegations = (userContext.get("delegations") as Array<{
    from: string;
    to: string;
    task: string;
    timestamp: string;
  }>) || [];
  
  delegations.push({
    from: fromAgent,
    to: toAgent,
    task,
    timestamp: new Date().toISOString()
  });
  
  userContext.set("delegations", delegations);
  userContext.set("delegationCount", delegations.length);
  
  console.log(`👥 Tracked delegation: ${fromAgent} → ${toAgent}`);
}

/**
 * Context helper for conversation flow tracking
 */
export function trackConversationTurn(
  userContext: Map<string, unknown>,
  userInput: string,
  assistantResponse: string,
  metadata?: {
    tokenUsage?: number;
    toolsUsed?: string[];
    responseTime?: number;
  }
): void {
  const conversation = (userContext.get("conversationHistory") as Array<{
    turn: number;
    userInput: string;
    assistantResponse: string;
    timestamp: string;
    metadata?: typeof metadata;
  }>) || [];
  
  conversation.push({
    turn: conversation.length + 1,
    userInput,
    assistantResponse,
    timestamp: new Date().toISOString(),
    metadata
  });
  
  userContext.set("conversationHistory", conversation);
  userContext.set("conversationTurns", conversation.length);
  
  console.log(`💬 Tracked conversation turn ${conversation.length}`);
}

/**
 * Context helper for error tracking
 */
export function trackError(
  userContext: Map<string, unknown>,
  error: {
    type: string;
    message: string;
    component: "agent" | "tool" | "retriever" | "memory";
    componentName?: string;
  }
): void {
  const errors = (userContext.get("errors") as Array<typeof error & { timestamp: string }>) || [];
  
  errors.push({
    ...error,
    timestamp: new Date().toISOString()
  });
  
  userContext.set("errors", errors);
  userContext.set("errorCount", errors.length);
  userContext.set("lastError", error);
  
  console.error(`❌ Tracked error in ${error.component}:${error.componentName}: ${error.message}`);
}

/**
 * Context helper for memory operations
 */
export function trackMemoryOperation(
  userContext: Map<string, unknown>,
  operation: "store" | "retrieve" | "search",
  details: {
    collection?: string;
    query?: string;
    resultCount?: number;
    success: boolean;
  }
): void {
  const memoryOps = (userContext.get("memoryOperations") as Array<{
    operation: typeof operation;
    timestamp: string;
    details: typeof details;
  }>) || [];
  
  memoryOps.push({
    operation,
    timestamp: new Date().toISOString(),
    details
  });
  
  userContext.set("memoryOperations", memoryOps);
  userContext.set("memoryOperationCount", memoryOps.length);
  
  console.log(`🧠 Tracked memory operation: ${operation} (${details.success ? "success" : "failure"})`);
}

/**
 * Get comprehensive context summary for debugging
 */
export function getContextSummary(userContext: Map<string, unknown>): {
  basic: Record<string, unknown>;
  metrics: Record<string, number>;
  recent: Record<string, unknown>;
} {
  return {
    basic: {
      userId: userContext.get("userId"),
      sessionId: userContext.get("sessionId"),
      language: userContext.get("language"),
      createdAt: userContext.get("createdAt")
    },
    metrics: {
      conversationTurns: (userContext.get("conversationTurns") as number) || 0,
      totalToolCalls: (userContext.get("totalToolCalls") as number) || 0,
      successfulToolCalls: (userContext.get("successfulToolCalls") as number) || 0,
      delegationCount: (userContext.get("delegationCount") as number) || 0,
      errorCount: (userContext.get("errorCount") as number) || 0,
      memoryOperationCount: (userContext.get("memoryOperationCount") as number) || 0,
      referencesCount: ((userContext.get("references") as unknown[]) || []).length
    },
    recent: {
      lastError: userContext.get("lastError"),
      lastReferenceUpdate: userContext.get("lastReferenceUpdate"),
      recentTools: ((userContext.get("toolHistory") as unknown[]) || []).slice(-3),
      recentDelegations: ((userContext.get("delegations") as unknown[]) || []).slice(-2)
    }
  };
}

/**
 * Context Service for managing context across operations
 */
export class ContextService {
  private activeContexts = new Map<string, Map<string, unknown>>();

  /**
   * Create and store a new context
   */
  createContext(sessionId: string, options?: {
    userId?: string;
    language?: string;
    metadata?: Record<string, unknown>;
  }): Map<string, unknown> {
    const context = createInitialContext({
      sessionId,
      ...options
    });
    
    this.activeContexts.set(sessionId, context);
    return context;
  }

  /**
   * Get an existing context
   */
  getContext(sessionId: string): Map<string, unknown> | undefined {
    return this.activeContexts.get(sessionId);
  }

  /**
   * Update context data
   */
  updateContext(sessionId: string, updates: Record<string, unknown>): boolean {
    const context = this.activeContexts.get(sessionId);
    if (!context) return false;

    for (const [key, value] of Object.entries(updates)) {
      context.set(key, value);
    }

    return true;
  }

  /**
   * Clean up old contexts
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number { // 24 hours default
    let cleaned = 0;
    const cutoff = Date.now() - maxAge;

    for (const [sessionId, context] of this.activeContexts.entries()) {
      const createdAt = context.get("createdAt") as string;
      if (createdAt && new Date(createdAt).getTime() < cutoff) {
        this.activeContexts.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old contexts`);
    }

    return cleaned;
  }

  /**
   * Get summary of all active contexts
   */
  getSummary(): {
    totalContexts: number;
    contexts: Array<{
      sessionId: string;
      userId: string;
      createdAt: string;
      metrics: Record<string, number>;
    }>;
  } {
    const contexts = Array.from(this.activeContexts.entries()).map(([sessionId, context]) => {
      const summary = getContextSummary(context);
      return {
        sessionId,
        userId: summary.basic.userId as string,
        createdAt: summary.basic.createdAt as string,
        metrics: summary.metrics
      };
    });

    return {
      totalContexts: contexts.length,
      contexts
    };
  }
}

// Export singleton instance
export const contextService = new ContextService();
