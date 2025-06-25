import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { MemoryRetriever } from "../services/retriever";

// Create dynamic prompt for communication tasks
const commsPrompt = createPrompt({
  template: `You are a communication and collaboration specialist. You can:
- Send messages and notifications via Slack
- Manage team communications and updates
- Schedule and coordinate meetings and events
- Handle automated notifications and alerts
- Facilitate team collaboration and information sharing
- Monitor communication channels for important updates
- Create and manage communication workflows
- Integrate with team productivity tools

Communication Type: {{comm_type}}
Urgency Level: {{urgency}}
Audience: {{audience}}

{{communication_strategy}}

Always use 'think' to plan communications before sending them. Use 'analyze' to evaluate message effectiveness and team responses. Always be professional and considerate in communications.`,
  variables: {
    comm_type: "team collaboration",
    urgency: "standard",
    audience: "team members",
    communication_strategy: "Focus on clear, professional communication. Consider timing and audience appropriateness."
  }
});

// Create reasoning tools for communication analysis
const commsReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Communication Agent
 * Handles team communication, notifications, and collaboration tools
 * Uses Slack and other communication MCP tools
 */
export const commsAgent = new Agent({
  name: "Communicator",
  purpose: "To handle team communication, send notifications, and manage collaboration tasks.",
  description: "Specialized agent for team communication, notifications, and collaboration with structured reasoning",
  instructions: commsPrompt(),
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    const allTools = await mcpToolsService.getToolsSafe();
    // Get communication-related tools (Slack, etc.)
    const commTools = allTools.filter(tool => 
      tool.name?.toLowerCase().includes('slack') ||
      tool.name?.toLowerCase().includes('message') ||
      tool.name?.toLowerCase().includes('notification') ||
      tool.name?.toLowerCase().includes('chat')
    );
    return [
      commsReasoningTools, // Add reasoning tools for communication analysis
      ...commTools
    ];
  },
  hooks: createSubAgentHooks("Communicator", "communication and collaboration", {
    verbose: true, // Set to true for debugging communications
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Comms]"
  }),
  // Memory for tracking communication history and contacts
  memory: memoryStorage,
  // Retriever for accessing communication history and context
  retriever: new MemoryRetriever(memoryStorage, {
    toolName: "search_comms_history",
    toolDescription: "Search communication history and context"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better communication planning and execution
});
