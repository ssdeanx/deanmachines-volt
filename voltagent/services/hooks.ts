/**
 * Hooks Service for VoltAgent
 * Provides lifecycle hooks for agents with proper logging and context management
 * Enhanced with VoltAgent best practices for observability and error handling
 */
import { 
  createHooks, 
  type OnStartHookArgs, 
  type OnEndHookArgs, 
  type OnToolStartHookArgs, 
  type OnToolEndHookArgs, 
  type OnHandoffHookArgs,
  type VoltAgentError
} from "@voltagent/core";

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
 * Create comprehensive hooks for agent lifecycle management
 * Includes logging, context tracking, and observability
 */
export const createAgentHooks = (agentName: string, config: HookConfig = {}) => {
  const {
    verbose = false,
    performance = true,
    analytics = true,
    logPrefix = "[VoltAgent]",
    operationIdGenerator = () => `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  } = config;

  return createHooks({
    /**
     * Called before the agent starts processing a request
     */
    onStart: async (args: OnStartHookArgs) => {
      const { agent, context } = args;
      
      // Use the agentName parameter
      const effectiveName = agentName || agent.name;
      
      // Generate unique operation ID
      const operationId = operationIdGenerator();
      const startTime = new Date().toISOString();
      
      // Initialize tracking data in userContext
      context.userContext.set("operationId", operationId);
      context.userContext.set("startTime", startTime);
      context.userContext.set("agentName", effectiveName);
      context.userContext.set("performanceMetrics", {
        startTime: Date.now(),
        toolExecutions: [],
        tokenUsage: 0
      });
      
      console.log(`🚀 ${logPrefix} [${effectiveName}] Starting operation at ${startTime}`);
      console.log(`   Operation ID: ${operationId}`);
      
      if (verbose) {
        console.log(`   Agent ID: ${agent.id || 'N/A'}`);
        console.log(`   Context: ${JSON.stringify({ operationId: context.operationId }, null, 2)}`);
      }
    },    /**
     * Called after the agent finishes processing a request
     */
    onEnd: async (args: OnEndHookArgs) => {
      const { agent, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      const startTime = context.userContext.get("startTime");
      const performanceMetrics = context.userContext.get("performanceMetrics") || {};
      
      if (error) {
        console.error(`❌ ${logPrefix} [${agent.name}] Operation ${operationId} failed:`, error.message);
        
        // Enhanced error tracking with userContext
        context.userContext.set("error", {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString(),
          details: verbose ? JSON.stringify(error) : undefined
        });
        
        // Log conversation context on error if available
        if (verbose) {
          console.error(`   Error Details:`, JSON.stringify(error, null, 2));
        }
      } else if (output) {
        const endTime = new Date().toISOString();
        const duration = startTime ? Date.now() - new Date(startTime).getTime() : 0;
        
        console.log(`✅ ${logPrefix} [${agent.name}] Operation ${operationId} completed successfully`);
        
        // Enhanced success tracking
        context.userContext.set("endTime", endTime);
        context.userContext.set("success", true);
        context.userContext.set("duration", duration);
        
        // Performance logging
        if (performance) {
          console.log(`   Duration: ${duration}ms`);
        }
        
        // Token usage tracking (enhanced)
        if ("usage" in output && output.usage) {
          const tokenUsage = output.usage.totalTokens;
          console.log(`   Token Usage: ${tokenUsage} tokens`);
          context.userContext.set("tokenUsage", tokenUsage);
          
          if (analytics) {
            context.userContext.set("tokenBreakdown", {
              prompt: output.usage.promptTokens,
              completion: output.usage.completionTokens,
              total: tokenUsage
            });
          }
        }
        
        // Output type analysis
        if (verbose) {
          if ("text" in output && output.text) {
            console.log(`   Output type: text (${output.text.length} chars)`);
          } else if ("object" in output && output.object) {
            console.log(`   Output type: object (keys: ${Object.keys(output.object).join(", ")})`);
          }
        }
        
        // Enhanced operation tracking
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
          
          if (verbose) {
            console.log(`   Operation summary:`, JSON.stringify(operationSummary, null, 2));
          }
        }
        
        // Performance metrics summary
        if (performance && performanceMetrics.toolExecutions) {
          const toolCount = performanceMetrics.toolExecutions.length;
          if (toolCount > 0) {
            console.log(`   Tools executed: ${toolCount}`);
          }
        }
      }
    },/**
     * Called just before a tool's execute function is called
     */
    onToolStart: async (args: OnToolStartHookArgs) => {
      const { agent, tool, context } = args;
      const operationId = context.userContext.get("operationId");
      const performanceMetrics = context.userContext.get("performanceMetrics") || { toolExecutions: [] };
      
      console.log(`🔧 ${logPrefix} [${agent.name}] Starting tool: ${tool.name} (${operationId})`);
      
      // Enhanced tool tracking
      const toolExecution = {
        name: tool.name,
        startTime: new Date().toISOString(),
        startTimestamp: Date.now()
      };
      
      // Track tool usage in userContext
      const toolsInProgress = context.userContext.get("toolsInProgress") || [];
      toolsInProgress.push(toolExecution);
      context.userContext.set("toolsInProgress", toolsInProgress);
      
      // Update performance metrics
      performanceMetrics.toolExecutions.push(toolExecution);
      context.userContext.set("performanceMetrics", performanceMetrics);
      
      if (verbose) {
        console.log(`   Tool description: ${tool.description || 'N/A'}`);
      }
    },

    /**
     * Called after a tool's execute function completes or throws
     */
    onToolEnd: async (args: OnToolEndHookArgs) => {
      const { agent, tool, output, error, context } = args;
      const operationId = context.userContext.get("operationId");
      const toolsInProgress = context.userContext.get("toolsInProgress") || [];
      const performanceMetrics = context.userContext.get("performanceMetrics") || { toolExecutions: [] };
      
      // Find and update the tool execution record
      const toolIndex = toolsInProgress.findIndex((t: any) => t.name === tool.name);
      if (toolIndex >= 0) {
        const toolExecution = toolsInProgress[toolIndex];
        const duration = Date.now() - toolExecution.startTimestamp;
        
        if (error) {
          console.error(`💥 ${logPrefix} [${agent.name}] Tool ${tool.name} failed: ${error.message} (${operationId})`);
          console.error(`   Duration: ${duration}ms`);
            // Enhanced tool error tracking
          const toolErrors = context.userContext.get("toolErrors") || [];
          toolErrors.push({
            toolName: tool.name,
            error: error.message,
            duration,
            timestamp: new Date().toISOString(),
            details: verbose ? JSON.stringify(error) : undefined
          });
          context.userContext.set("toolErrors", toolErrors);
          
          // Update tool execution record
          toolExecution.error = error.message;
          toolExecution.duration = duration;
          
        } else {
          console.log(`⚡ ${logPrefix} [${agent.name}] Tool ${tool.name} completed successfully (${operationId})`);
          
          if (performance) {
            console.log(`   Duration: ${duration}ms`);
          }
          
          // Enhanced tool success tracking
          const completedTools = context.userContext.get("completedTools") || [];
          completedTools.push({
            name: tool.name,
            result: verbose ? output : (typeof output === 'string' ? output.slice(0, 100) + '...' : '[Object]'),
            duration,
            timestamp: new Date().toISOString()
          });
          context.userContext.set("completedTools", completedTools);
          
          // Update tool execution record
          toolExecution.success = true;
          toolExecution.duration = duration;
          
          if (verbose && output) {
            console.log(`   Result preview:`, typeof output === 'string' ? output.slice(0, 200) + '...' : JSON.stringify(output).slice(0, 200) + '...');
          }
        }
        
        // Remove from in-progress and update performance metrics
        toolsInProgress.splice(toolIndex, 1);
        context.userContext.set("toolsInProgress", toolsInProgress);
        context.userContext.set("performanceMetrics", performanceMetrics);
      }
    },    /**
     * Called when a task is handed off from a source agent to this agent
     */
    onHandoff: async (args: OnHandoffHookArgs) => {
      const { agent } = args;
      
      console.log(`🔄 ${logPrefix} Task handed off to ${agent.name}`);
      
      if (verbose) {
        console.log(`   Handoff context: Task delegated to '${agent.name}'`);
      }
    },
  });
};

/**
 * Specialized hooks for supervisor agents with enhanced delegation tracking
 */
export const createSupervisorHooks = (supervisorName: string, config: HookConfig = {}) => {
  const { logPrefix = "[VoltAgent:Supervisor]", verbose = false, analytics = true } = config;
  
  return createHooks({
    onStart: async ({ agent, context }: OnStartHookArgs) => {
      console.log(`👑 ${logPrefix} [${supervisorName}/${agent.name}] Starting coordination operation`);
      
      // Enhanced supervisor tracking
      const supervisorContext = {
        supervisorOperationId: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        delegationCount: 0,
        subAgentResults: [],
        coordinationStartTime: Date.now()
      };
      
      Object.entries(supervisorContext).forEach(([key, value]) => {
        context.userContext.set(key, value);
      });
      
      if (verbose) {
        console.log(`   Supervisor Context: ${JSON.stringify(supervisorContext, null, 2)}`);
      }
    },

    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      const delegationCount = context.userContext.get("delegationCount") || 0;
      const coordinationStartTime = context.userContext.get("coordinationStartTime");
      const duration = coordinationStartTime ? Date.now() - coordinationStartTime : 0;
      const subAgentResults = context.userContext.get("subAgentResults") || [];
      
      if (error) {
        console.error(`👑❌ ${logPrefix} [${supervisorName}/${agent.name}] Coordination failed after ${delegationCount} delegations:`, error.message);
        console.error(`   Duration: ${duration}ms`);
        
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
        console.log(`👑✅ ${logPrefix} [${supervisorName}/${agent.name}] Coordination completed with ${delegationCount} delegations`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   SubAgent results: ${subAgentResults.length}`);
        
        if (analytics) {
          context.userContext.set("supervisorMetrics", {
            success: true,
            delegationCount,
            duration,
            subAgentResults: subAgentResults.length,
            totalTokens: ("usage" in output && output.usage) ? output.usage.totalTokens : 0
          });
        }
        
        if (verbose && subAgentResults.length > 0) {
          console.log(`   SubAgent breakdown:`, subAgentResults.map((r: any) => `${r.agent}: ${r.success ? '✅' : '❌'}`).join(', '));
        }
      }
    },    onHandoff: async (args: OnHandoffHookArgs) => {
      const { agent } = args;
      console.log(`👑🔄 ${logPrefix} [${supervisorName}] Delegating to ${agent.name}`);
      
      if (verbose) {
        console.log(`   Delegation: ${supervisorName} → ${agent.name}`);
      }
    },
  });
};

/**
 * Specialized hooks for sub-agents with enhanced specialty tracking
 */
export const createSubAgentHooks = (subAgentName: string, specialty: string, config: HookConfig = {}) => {
  const { logPrefix = "[VoltAgent:SubAgent]", verbose = false, analytics = true } = config;
  
  return createHooks({
    onStart: async ({ agent, context }: OnStartHookArgs) => {
      const parentOp = context.userContext.get("supervisorOperationId");
      const delegationCount = context.userContext.get("delegationCount") || 0;
      
      // Enhanced sub-agent context
      context.userContext.set("subAgentSpecialty", specialty);
      context.userContext.set("subAgentStartTime", Date.now());
      context.userContext.set("subAgentName", subAgentName);
      
      console.log(`🤖 ${logPrefix} [${subAgentName}/${agent.name}] Handling ${specialty} task (delegation #${delegationCount}, parent: ${parentOp})`);
      
      if (verbose) {
        console.log(`   Specialty: ${specialty}`);
        console.log(`   Parent operation: ${parentOp}`);
      }
    },

    onEnd: async ({ agent, output, error, context }: OnEndHookArgs) => {
      const specialty = context.userContext.get("subAgentSpecialty");
      const startTime = context.userContext.get("subAgentStartTime");
      const duration = startTime ? Date.now() - startTime : 0;
      const delegationCount = context.userContext.get("delegationCount") || 0;
      
      if (error) {
        console.error(`🤖❌ ${logPrefix} [${subAgentName}/${agent.name}] Failed ${specialty} task: ${error.message}`);
        console.error(`   Duration: ${duration}ms`);
        
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
        console.log(`🤖✅ ${logPrefix} [${subAgentName}/${agent.name}] Completed ${specialty} task successfully`);
        console.log(`   Duration: ${duration}ms`);
        
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
        
        if (verbose && "usage" in output && output.usage) {
          console.log(`   Token usage: ${output.usage.totalTokens}`);
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
        
        if (verbose) {
          console.log(`📊 Conversation tracked for agent: ${agentName || agent.name}`);
        }
      }
    }
  });
};

/**
 * Default hooks for general agents with basic configuration
 */
export const defaultAgentHooks = createAgentHooks("DefaultAgent", { verbose: false, performance: true, analytics: true });
