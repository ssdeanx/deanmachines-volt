import { Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

/**
 * Communication Agent
 * Handles team communication, notifications, and collaboration tools
 * Uses Slack and other communication MCP tools
 */
export const commsAgent = new Agent({
  name: "Communicator",
  description: "Specialized agent for team communication, notifications, and collaboration",
  instructions: `You are a communication and collaboration specialist. You can:
- Send messages and notifications via Slack
- Manage team communications and updates
- Schedule and coordinate meetings and events
- Handle automated notifications and alerts
- Facilitate team collaboration and information sharing
- Monitor communication channels for important updates
- Create and manage communication workflows
- Integrate with team productivity tools

Always be professional and considerate in communications.`,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    const allTools = await mcpToolsService.getToolsSafe();
    // Get communication-related tools (Slack, etc.)
    return allTools.filter(tool => 
      tool.name?.toLowerCase().includes('slack') ||      tool.name?.toLowerCase().includes('message') ||
      tool.name?.toLowerCase().includes('notification') ||
      tool.name?.toLowerCase().includes('chat')
    );
  },
  hooks: createSubAgentHooks("Communicator", "communication and collaboration"),
  // Memory for tracking communication history and contacts
  memory: memoryStorage,
  // Retriever for accessing communication templates and contact information
  retriever: new DocumentRetriever('database', undefined, {
    toolName: "search_comms_templates",
    toolDescription: "Search communication templates and contact information"
  }),
});
