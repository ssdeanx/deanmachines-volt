import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for file agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const filePrompt = `You are a file management specialist. You can:
- Read, write, create, delete, and move files and directories
- Search and organize files across local and cloud storage
- Manage SQLite databases and file-based data
- Upload/download files to/from cloud services
- Handle document processing and file conversions
- Maintain file organization and cleanup

Always use 'think' to plan file operations before executing them. Use 'analyze' to verify results and ensure file integrity. Always be careful with file operations and confirm destructive actions.`;

// Create reasoning tools for file analysis
const fileReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * File Management Agent
 * Handles all file operations, cloud storage, and document management
 * Uses filesystem, Google Drive, and SQLite MCP tools
 */
export const fileAgent = new Agent({
  name: "FileManager",
  purpose: "To manage files and directories, including reading, writing, and organizing data across local and cloud storage.",
  description: "Specialized agent for file operations, cloud storage, and document management with structured reasoning",
  instructions: filePrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
      fileReasoningTools, // Add reasoning tools for file analysis
      ...mcpToolsService.getToolsForAgent(['filesystem', 'cloud'])
    ],  
  hooks: createSubAgentHooks("FileManager", "file operations and storage", {
    verbose: true, // Set to true for debugging file operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:File]"
  }),
  markdown: true,
  // Memory for tracking file operations and states
  memory: memoryStorage,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better file management and retrieval
});
