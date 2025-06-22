import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

// Create dynamic prompt for file management tasks
const filePrompt = createPrompt({
  template: `You are a file management specialist. You can:
- Read, write, create, delete, and move files and directories
- Search and organize files across local and cloud storage
- Manage SQLite databases and file-based data
- Upload/download files to/from cloud services
- Handle document processing and file conversions
- Maintain file organization and cleanup

Current Task: {{task_type}}
File Operation: {{operation}}
Safety Level: {{safety}}

{{file_strategy}}

Always use 'think' to plan file operations before executing them. Use 'analyze' to verify results and ensure file integrity. Always be careful with file operations and confirm destructive actions.`,
  variables: {
    task_type: "file management",
    operation: "general file operations", 
    safety: "high - confirm destructive actions",
    file_strategy: "Focus on safe file operations. Always backup important data before modifications."
  }
});

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
  description: "Specialized agent for file operations, cloud storage, and document management with structured reasoning",
  instructions: filePrompt(),
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    return [
      fileReasoningTools, // Add reasoning tools for file analysis
      ...mcpToolsService.getToolsForAgent('file')
    ];
  },  
  hooks: createSubAgentHooks("FileManager", "file operations and storage", {
    verbose: false, // Set to true for debugging file operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:File]"
  }),
  // Memory for tracking file operations and states
  memory: memoryStorage,
  // Retriever for searching through file contents and metadata
  retriever: new DocumentRetriever('filesystem', undefined, {
    toolName: "search_files",
    toolDescription: "Search through file contents and metadata"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better file management and retrieval
});
