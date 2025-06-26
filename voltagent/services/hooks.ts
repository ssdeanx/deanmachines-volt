/**
 * Hooks Service for VoltAgent
 * Provides lifecycle hooks for agents with proper logging and context management
 * Enhanced with VoltAgent best practices for observability and error handling
 */
import { createHooks, OnStartHookArgs, OnEndHookArgs, OnToolStartHookArgs, OnToolEndHookArgs, OnHandoffHookArgs } from "@voltagent/core";

/**
 * Hook configuration options for customizing behavior
 */
export interface HookConfig {
  /** Enable verbose logging with detailed context */
  verbose?: boolean;
  /** Enable performance monitoring with timing metrics */
  performance?: boolean;
  /** Enable tool usage analytics */
  analytics?: boolean;
  /** Prefix for log messages */
  logPrefix?: string;
  /** Custom operation ID generator */
  operationIdGenerator?: () => string;
}

/**
 * Tool execution tracking information
 */
export interface ToolExecution {
  name: string;
  startTime: string;
  startTimestamp: number;
  success?: boolean;
  error?: string;
  duration?: number;
  result?: unknown;
}

/**
 * Create comprehensive hooks for agent lifecycle management
 * Includes logging, context tracking, and observability
 */
export const createAgentHooks = (agentName: string, config: HookConfig = {}) => {
  const {
    verbose = false,
    performance = true,
    analytics = true,
    logPrefix = '[VoltAgent]',
    operationIdGenerator = () => `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  } = config;

  return createHooks({
    /**
     * Called before the agent starts processing a request
     */
    onStart: async (args: OnStartHookArgs) => {
      const { agent, context } = args;
      const effectiveName = agentName || agent.name;
      const operationId = operationIdGenerator();
      const startTime = new Date().toISOString();
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`${logPrefix} [onStart] Agent: ${effectiveName}, Operation: ${operationId}, Time: ${startTime}`);
      }
      context.userContext.set("operationId", operationId);
      context.userContext.set("startTime", startTime);
      context.userContext.set("agentName", effectiveName);
      context.userContext.set("performanceMetrics", {
        startTime: Date.now(),
        toolExecutions: [] as ToolExecution[],
        tokenUsage: 0
      });
    },    /**
     * Called after the agent finishes processing a request
     */
    onEnd: async (args: OnEndHookArgs) => {
      const { agent, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      const startTime = context.userContext.get("startTime");
      const performanceMetrics = context.userContext.get("performanceMetrics") || {};
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`${logPrefix} [onEnd] Agent: ${agent.name}, Operation: ${operationId}, Error: ${!!error}`);
      }
      if (error) {
        context.userContext.set("error", {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString(),
          details: verbose ? JSON.stringify(error) : undefined
        });
      } else if (output) {
        const endTime = new Date().toISOString();
        const duration = startTime ? Date.now() - new Date(startTime).getTime() : 0;
        context.userContext.set("endTime", endTime);
        context.userContext.set("success", true);
        context.userContext.set("duration", duration);
        if (performance) {
          (performanceMetrics as Record<string, unknown>).endTime = Date.now();
          (performanceMetrics as Record<string, unknown>).duration = duration;
          context.userContext.set("performanceMetrics", performanceMetrics);
        }
        if ("usage" in output && output.usage) {
          const tokenUsage = output.usage.totalTokens;
          context.userContext.set("tokenUsage", tokenUsage);
          if (analytics) {
            context.userContext.set("tokenBreakdown", {
              prompt: output.usage.promptTokens,
              completion: output.usage.completionTokens,
              total: tokenUsage
            });
          }
        }
        if (analytics) {
          const operationSummary = {
            operationId,
            agentName: agent.name,
            duration,
            tokenUsage: ("usage" in output && output.usage) ? output.usage.totalTokens : 0,
            success: true,
            timestamp: endTime
          };
          context.userContext.set("operationSummary", operationSummary);
        }
      }
    },/**
     * Called just before a tool's execute function is called
     */
    onToolStart: async (args: OnToolStartHookArgs) => {
      const { agent, tool, context } = args;
      const operationId = context.userContext.get("operationId");
      const performanceMetrics = context.userContext.get("performanceMetrics") || { toolExecutions: [] as ToolExecution[] };
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`${logPrefix} [onToolStart] Agent: ${agent.name}, Tool: ${tool.name}, Operation: ${operationId}`);
      }
      const toolExecution: ToolExecution = {
        name: tool.name,
        startTime: new Date().toISOString(),
        startTimestamp: Date.now()
      };
      const toolsInProgress: ToolExecution[] = context.userContext.get("toolsInProgress") || [];
      toolsInProgress.push(toolExecution);
      context.userContext.set("toolsInProgress", toolsInProgress);
      (performanceMetrics.toolExecutions as ToolExecution[]).push(toolExecution);
      context.userContext.set("performanceMetrics", performanceMetrics);
    },

    /**
     * Called after a tool's execute function completes or throws
     */
    onToolEnd: async (args: OnToolEndHookArgs) => {
      const { agent, tool, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      const toolsInProgress: ToolExecution[] = context.userContext.get("toolsInProgress") || [];
      const performanceMetrics = context.userContext.get("performanceMetrics") || { toolExecutions: [] as ToolExecution[] };
      const toolIndex = toolsInProgress.findIndex((t) => t.name === tool.name && !t.success && !t.error);
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`${logPrefix} [onToolEnd] Agent: ${agent.name}, Tool: ${tool.name}, Operation: ${operationId}, Error: ${!!error}`);
      }
      if (toolIndex >= 0) {
        const toolExecution = toolsInProgress[toolIndex];
        const duration = Date.now() - toolExecution.startTimestamp;
        if (error) {
          const toolErrors = context.userContext.get("toolErrors") || [];
          toolErrors.push({
            toolName: tool.name,
            error: error.message,
            duration,
            timestamp: new Date().toISOString(),
            details: verbose ? JSON.stringify(error) : undefined
          });
          context.userContext.set("toolErrors", toolErrors);
          toolExecution.error = error.message;
          toolExecution.duration = duration;
        } else {
          const completedTools = context.userContext.get("completedTools") || [];
          toolExecution.result = verbose ? output : (typeof output === 'string' ? output.slice(0, 100) + '...' : '[Object]');
          completedTools.push({
            name: tool.name,
            result: toolExecution.result,
            duration: duration,
            timestamp: new Date().toISOString()
          });
          context.userContext.set("completedTools", completedTools);
          toolExecution.success = true;
          toolExecution.duration = duration;
        }
        toolsInProgress.splice(toolIndex, 1);
        context.userContext.set("toolsInProgress", toolsInProgress);
        context.userContext.set("performanceMetrics", performanceMetrics);
      }
    },    /**
     * Called when a task is handed off from a source agent to this agent
     */
    onHandoff: async (args: OnHandoffHookArgs) => {
      // Use explicit type for handoff args to access sourceAgent
      const { agent, sourceAgent } = args as { agent: { name?: string; lastContext?: { userContext?: Map<string, unknown> } }, sourceAgent?: { name?: string; lastContext?: { userContext?: Map<string, unknown> } } };
      try {
        const from = sourceAgent?.name || 'unknown-source';
        const to = agent?.name || agentName || 'unknown-target';
        let userContext: Map<string, unknown> | undefined = undefined;
        if (agent && agent.lastContext && agent.lastContext.userContext) {
          userContext = agent.lastContext.userContext;
        } else if (sourceAgent && sourceAgent.lastContext && sourceAgent.lastContext.userContext) {
          userContext = sourceAgent.lastContext.userContext;
        }
        const opId = userContext?.get("operationId") || 'unknown-op';
        if (verbose && typeof globalThis.console !== 'undefined') {
          globalThis.console.log(`${logPrefix} [onHandoff] ${from} → ${to} (operationId: ${opId})`);
        }
        if (userContext) {
          const handoffs = (userContext.get("handoffs") as unknown[] | undefined) || [];
          handoffs.push({ from, to, opId, timestamp: new Date().toISOString() });
          userContext.set("handoffs", handoffs);
        }
      } catch (err) {
        if (typeof globalThis.console !== 'undefined') {
          globalThis.console.error(`${logPrefix} [onHandoff] Error:`, err);
        }
      }
    },
  });
};

/**
 * Specialized hooks for supervisor agents with enhanced delegation tracking
 */
export const createSupervisorHooks = (supervisorName: string, config: HookConfig = {}) => {
  const { analytics = true, logPrefix = '[VoltAgent:Supervisor]' } = config;
  
  return createHooks({
    onStart: async ({ context }: OnStartHookArgs) => {
      // Enhanced supervisor tracking
      const supervisorContext = {
        supervisorOperationId: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        delegationCount: 0,
        subAgentResults: [],
        coordinationStartTime: Date.now()
      };
      Object.entries(supervisorContext).forEach(([key, value]) => {
        context.userContext.set(key, value);
      });
    },

    onEnd: async ({ output, error, context }: OnEndHookArgs) => {
      const delegationCount = context.userContext.get("delegationCount") || 0;
      const coordinationStartTime = context.userContext.get("coordinationStartTime");
      const duration = coordinationStartTime ? Date.now() - coordinationStartTime : 0;
      const subAgentResults = context.userContext.get("subAgentResults") || [];
      if (error) {
        if (analytics) {
          context.userContext.set("supervisorMetrics", {
            success: false,
            delegationCount,
            duration,
            subAgentResults: subAgentResults.length,
            error: error.message
          });
        }
      } else if (output) {
        if (analytics) {
          context.userContext.set("supervisorMetrics", {
            success: true,
            delegationCount,
            duration,
            subAgentResults: subAgentResults.length,
            totalTokens: ("usage" in output && output.usage) ? output.usage.totalTokens : 0
          });
        }
      }
    },    onToolStart: async ({ tool, context }: OnToolStartHookArgs) => {
      // Only increment for the specific delegation tool
      if (tool.name === 'delegate_task') {
        const delegationCount = context.userContext.get("delegationCount") || 0;
        context.userContext.set("delegationCount", delegationCount + 1);
      }
    },

    onHandoff: async (args: OnHandoffHookArgs) => {
      const { agent, sourceAgent } = args as { agent: { name?: string; lastContext?: { userContext?: Map<string, unknown> } }, sourceAgent?: { name?: string; lastContext?: { userContext?: Map<string, unknown> } } };
      try {
        const from = sourceAgent?.name || 'unknown-supervisor';
        const to = agent?.name || supervisorName || 'unknown-target';
        let userContext: Map<string, unknown> | undefined = undefined;
        if (agent && agent.lastContext && agent.lastContext.userContext) {
          userContext = agent.lastContext.userContext;
        } else if (sourceAgent && sourceAgent.lastContext && sourceAgent.lastContext.userContext) {
          userContext = sourceAgent.lastContext.userContext;
        }
        const opId = userContext?.get("operationId") || 'unknown-op';
        if (analytics && typeof globalThis.console !== 'undefined') {
          globalThis.console.log(`${logPrefix} [onHandoff] ${from} → ${to} (operationId: ${opId})`);
        }
        if (userContext) {
          const handoffs = (userContext.get("handoffs") as unknown[] | undefined) || [];
          handoffs.push({ from, to, opId, timestamp: new Date().toISOString() });
          userContext.set("handoffs", handoffs);
        }
      } catch (err) {
        if (typeof globalThis.console !== 'undefined') {
          globalThis.console.error(`${logPrefix} [onHandoff] Error:`, err);
        }
      }
    },
  });
};

/**
 * Specialized hooks for sub-agents with enhanced specialty tracking
 */
export const createSubAgentHooks = (subAgentName: string, specialty: string, config: HookConfig = {}) => {
  const { analytics = true, logPrefix = '[VoltAgent:SubAgent]', verbose = false } = config;
  
  return createHooks({
    onStart: async ({ context }: OnStartHookArgs) => {
      // Enhanced sub-agent context
      context.userContext.set("subAgentSpecialty", specialty);
      context.userContext.set("subAgentStartTime", Date.now());
      context.userContext.set("subAgentName", subAgentName);
    },

    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`${logPrefix} [onEnd] SubAgent: ${agent.name}, Error: ${!!error}`);
      }
      const specialty = context.userContext.get("subAgentSpecialty");
      const startTime = context.userContext.get("subAgentStartTime");
      const duration = startTime ? Date.now() - startTime : 0;
      const delegationCount = context.userContext.get("delegationCount") || 0;
      if (error) {
        if (analytics) {
          // Track sub-agent result for supervisor
          const subAgentResults = context.userContext.get("subAgentResults") || [];
          subAgentResults.push({
            agent: subAgentName,
            specialty,
            success: false,
            duration,
            error: error.message,
            delegationNumber: delegationCount
          });
          context.userContext.set("subAgentResults", subAgentResults);
        }
      } else if (output) {
        if (analytics) {
          // Track sub-agent result for supervisor
          const subAgentResults = context.userContext.get("subAgentResults") || [];
          subAgentResults.push({
            agent: subAgentName,
            specialty,
            success: true,
            duration,
            tokenUsage: ("usage" in output && output.usage) ? output.usage.totalTokens : 0,
            delegationNumber: delegationCount
          });
          context.userContext.set("subAgentResults", subAgentResults);
        }
      }
    },

    onHandoff: async (args: OnHandoffHookArgs) => {
      const { agent, sourceAgent } = args as { agent: { name?: string; lastContext?: { userContext?: Map<string, unknown> } }, sourceAgent?: { name?: string; lastContext?: { userContext?: Map<string, unknown> } } };
      try {
        const from = sourceAgent?.name || 'unknown-supervisor';
        const to = agent?.name || subAgentName || 'unknown-subagent';
        let userContext: Map<string, unknown> | undefined = undefined;
        if (agent && agent.lastContext && agent.lastContext.userContext) {
          userContext = agent.lastContext.userContext;
        } else if (sourceAgent && sourceAgent.lastContext && sourceAgent.lastContext.userContext) {
          userContext = sourceAgent.lastContext.userContext;
        }
        const opId = userContext?.get("operationId") || 'unknown-op';
        if (analytics && typeof globalThis.console !== 'undefined') {
          globalThis.console.log(`${logPrefix} [onHandoff] ${from} → ${to} (operationId: ${opId})`);
        }
        if (userContext) {
          const handoffs = (userContext.get("handoffs") as unknown[] | undefined) || [];
          handoffs.push({ from, to, opId, timestamp: new Date().toISOString() });
          userContext.set("handoffs", handoffs);
        }
      } catch (err) {
        if (typeof globalThis.console !== 'undefined') {
          globalThis.console.error(`${logPrefix} [onHandoff] Error:`, err);
        }
      }
    },
  });
};

/**
 * Create hooks with conversation flow tracking (enhanced for UI integration)
 */
export const createConversationHooks = (agentName: string, config: HookConfig = {}) => {
  const { analytics = true, verbose = false } = config;
  return createHooks({
    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      if (verbose && typeof globalThis.console !== 'undefined') {
        globalThis.console.log(`[VoltAgent:Conversation] [onEnd] Agent: ${agent.name}, Error: ${!!error}`);
      }
      if (!analytics) return;
      // Enhanced conversation tracking following VoltAgent docs pattern
      if (!error && output) {
        const conversationData = {
          operationId: context.operationId,
          agentName: agentName || agent.name,
          usage: ("usage" in output && output.usage) ? output.usage : undefined,
          timestamp: new Date().toISOString(),
          success: true
        };
        // Store for potential UI integration or analytics
        context.userContext.set("conversationSnapshot", conversationData);
      }
    }
  });
};

/**
 * Default hooks for general agents with basic configuration
 */
export const defaultAgentHooks = createAgentHooks("DefaultAgent", { verbose: false, performance: true, analytics: true });
