/**
 * Hooks Service for VoltAgent
 * Provides lifecycle hooks for agents with proper logging and context management
 */
import { createHooks, type OnStartHookArgs, type OnEndHookArgs, type OnToolStartHookArgs, type OnToolEndHookArgs, type OnHandoffHookArgs } from "@voltagent/core";

/**
 * Create comprehensive hooks for agent lifecycle management
 * Includes logging, context tracking, and observability
 */
export const createAgentHooks = (agentName: string) => {
  return createHooks({
    /**
     * Called before the agent starts processing a request
     */
    onStart: async (args: OnStartHookArgs) => {
      const { agent, context } = args;
      
      // Use the agentName parameter
      const effectiveName = agentName || agent.name;
      
      // Initialize tracking data in userContext
      context.userContext.set("operationId", `op-${Date.now()}`);
      context.userContext.set("startTime", new Date().toISOString());
      context.userContext.set("agentName", effectiveName);
      
      console.log(`🚀 [${effectiveName}] Starting operation at ${new Date().toISOString()}`);
      console.log(`   Operation ID: ${context.userContext.get("operationId")}`);
    },    /**
     * Called after the agent finishes processing a request
     */
    onEnd: async (args: OnEndHookArgs) => {
      const { agent, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      const startTime = context.userContext.get("startTime");
      
      if (error) {
        console.error(`❌ [${agent.name}] Operation ${operationId} failed:`, error.message);
        context.userContext.set("error", {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        });      } else if (output) {
        console.log(`✅ [${agent.name}] Operation ${operationId} completed successfully`);
        const endTime = new Date().toISOString();
        context.userContext.set("endTime", endTime);
        context.userContext.set("success", true);
        
        if ("usage" in output && output.usage) {
          console.log(`   Token Usage: ${output.usage.totalTokens} tokens`);
          context.userContext.set("tokenUsage", output.usage.totalTokens);
        }
        
        if (startTime) {
          const duration = Date.now() - new Date(startTime).getTime();
          console.log(`   Duration: ${duration}ms`);
          context.userContext.set("duration", duration);
        }
      }
    },

    /**
     * Called just before a tool's execute function is called
     */
    onToolStart: async (args: OnToolStartHookArgs) => {
      const { agent, tool, context } = args;
      const operationId = context.userContext.get("operationId");
      
      console.log(`🔧 [${agent.name}] Starting tool: ${tool.name} (${operationId})`);
      
      // Track tool usage in userContext
      const toolsUsed = context.userContext.get("toolsInProgress") || [];
      toolsUsed.push({
        name: tool.name,
        startTime: new Date().toISOString()
      });
      context.userContext.set("toolsInProgress", toolsUsed);
    },

    /**
     * Called after a tool's execute function completes or throws
     */
    onToolEnd: async (args: OnToolEndHookArgs) => {
      const { agent, tool, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      
      if (error) {
        console.error(`💥 [${agent.name}] Tool ${tool.name} failed: ${error.message} (${operationId})`);
        
        // Track tool errors
        const toolErrors = context.userContext.get("toolErrors") || [];
        toolErrors.push({
          toolName: tool.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        context.userContext.set("toolErrors", toolErrors);
      } else {
        console.log(`⚡ [${agent.name}] Tool ${tool.name} completed successfully (${operationId})`);
        
        // Track successful tool completions
        const completedTools = context.userContext.get("completedTools") || [];
        completedTools.push({
          name: tool.name,
          result: output,
          timestamp: new Date().toISOString()
        });
        context.userContext.set("completedTools", completedTools);
      }
    },    /**
     * Called when a task is handed off from a source agent to this agent
     */
    onHandoff: async (args: OnHandoffHookArgs) => {
      const { agent } = args;
      
      console.log(`🔄 Task handed off to ${agent.name}`);
      
      // This hook helps track multi-agent workflows
      // The userContext automatically flows from supervisor to sub-agent
    },
  });
};

/**
 * Specialized hooks for supervisor agents
 */
export const createSupervisorHooks = (supervisorName: string) => {
  return createHooks({    onStart: async ({ agent, context }: OnStartHookArgs) => {
      // Use both supervisorName parameter and agent.name
      console.log(`👑 [Supervisor:${supervisorName}/${agent.name}] Starting coordination operation`);
      context.userContext.set("supervisorOperationId", `sup-${Date.now()}`);
      context.userContext.set("delegationCount", 0);
    },

    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      const delegationCount = context.userContext.get("delegationCount") || 0;
      
      if (error) {
        console.error(`👑❌ [Supervisor:${supervisorName}/${agent.name}] Coordination failed after ${delegationCount} delegations:`, error.message);
      } else if (output) {
        console.log(`👑✅ [Supervisor:${supervisorName}/${agent.name}] Coordination completed with ${delegationCount} delegations`);
      }
    },onHandoff: async ({ agent }: OnHandoffHookArgs) => {
      console.log(`👑🔄 [Supervisor:${supervisorName}] Delegating to ${agent.name}`);
    },
  });
};

/**
 * Specialized hooks for sub-agents
 */
export const createSubAgentHooks = (subAgentName: string, specialty: string) => {
  return createHooks({    onStart: async ({ agent, context }: OnStartHookArgs) => {
      const parentOp = context.userContext.get("supervisorOperationId");
      context.userContext.set("subAgentSpecialty", specialty);
      
      console.log(`🤖 [SubAgent:${subAgentName}/${agent.name}] Handling ${specialty} task (parent: ${parentOp})`);
    },

    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      const specialty = context.userContext.get("subAgentSpecialty");
      
      if (error) {
        console.error(`🤖❌ [SubAgent:${subAgentName}/${agent.name}] Failed ${specialty} task: ${error.message}`);
      } else if (output) {
        console.log(`🤖✅ [SubAgent:${subAgentName}/${agent.name}] Completed ${specialty} task successfully`);
      }
    },
  });
};

/**
 * Default hooks for general agents
 */
export const defaultAgentHooks = createAgentHooks("DefaultAgent");
