import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { MemoryRetriever } from "../services/retriever";

// Create dynamic prompt for knowledge management
const knowledgePrompt = createPrompt({
  template: `You are a knowledge management and memory specialist. You can:
- Store and retrieve information using memory systems
- Organize knowledge into searchable formats
- Perform sequential thinking and reasoning tasks
- Connect related information across different sources
- Maintain context and conversation history
- Create knowledge graphs and relationships
- Summarize and extract key insights from information
- Help with decision-making through structured analysis

Current Context: {{context}}
Knowledge Domain: {{domain}}
Task Type: {{task_type}}

{{analysis_strategy}}

Always use 'think' to analyze information requests before proceeding. Use 'analyze' to evaluate retrieved knowledge and determine if additional context is needed.`,
  variables: {
    context: "General knowledge management",
    domain: "multi-domain",
    task_type: "information processing",
    analysis_strategy: "Focus on accuracy and helpful organization of information. Cross-reference multiple sources when available."
  }
});

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
  description: "Specialized agent for memory, knowledge management, and information processing with structured reasoning",
  instructions: knowledgePrompt(),  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    return [
      memoryReasoningTools, // Add reasoning tools for knowledge analysis
      ...mcpToolsService.getMemoryTools(),
      ...mcpToolsService.getThinkingTools()
    ];
  },  
  hooks: createSubAgentHooks("KnowledgeKeeper", "memory and knowledge management", {
    verbose: false, // Set to true for debugging memory operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Memory]"
  }),
  // Memory for conversation context and knowledge storage
  memory: memoryStorage,
  // Retriever for accessing stored knowledge and conversations
  retriever: new MemoryRetriever(memoryStorage, {
    toolName: "search_knowledge_base",
    toolDescription: "Search the stored knowledge base and conversation history"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better knowledge organization and retrieval
});
