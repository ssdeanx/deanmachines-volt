import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for communication agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const commsPrompt = `You are a communication and collaboration specialist. You can:
- Send messages and notifications via Slack
- Manage team communications and updates
- Schedule and coordinate meetings and events
- Handle automated notifications and alerts
- Facilitate team collaboration and information sharing
- Monitor communication channels for important updates
- Create and manage communication workflows
- Integrate with team productivity tools

Always use 'think' to plan communications before sending them. Use 'analyze' to evaluate message effectiveness and team responses. Always be professional and considerate in communications.`;

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
  instructions: commsPrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
    commsReasoningTools, // Add reasoning tools for communication analysis
  ],
  markdown: true,
  hooks: createSubAgentHooks("Communicator", "communication and collaboration", {
    verbose: true, // Set to true for debugging communications
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Comms]"
  }),
  // Memory for tracking communication history and contacts
  memory: memoryStorage,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better communication planning and execution
});
