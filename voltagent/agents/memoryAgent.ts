import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for memory agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const knowledgePrompt = `You are a knowledge management and memory specialist. You can:
- Store and retrieve information using memory systems
- Organize knowledge into searchable formats
- Perform sequential thinking and reasoning tasks
- Connect related information across different sources
- Maintain context and conversation history
- Create knowledge graphs and relationships
- Summarize and extract key insights from information
- Help with decision-making through structured analysis

Always use 'think' to analyze information requests before proceeding. Use 'analyze' to evaluate retrieved knowledge and determine if additional context is needed.`;

// Create reasoning tools for knowledge analysis
const memoryReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Memory and Knowledge Agent
 * Handles information storage, retrieval, and knowledge management
 * Uses memory, sequential thinking, and knowledge management MCP tools
 */
export const memoryAgent = new Agent({
  name: "KnowledgeKeeper",
  purpose: "To store, retrieve, and manage information and knowledge.",
  description: "Specialized agent for memory, knowledge management, and information processing with structured reasoning",
  instructions: knowledgePrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
      memoryReasoningTools, // Add reasoning tools for knowledge analysis
      ...mcpToolsService.getToolsForAgent(['memory'])
    ],  
  markdown: true,
  hooks: createSubAgentHooks("KnowledgeKeeper", "memory and knowledge management", {
    verbose: true, // Set to true for debugging memory operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Memory]"
  }),
  // Memory for conversation context and knowledge storage
  memory: memoryStorage,
  // Retriever for accessing stored knowledge and conversations
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better knowledge organization and retrieval
});
