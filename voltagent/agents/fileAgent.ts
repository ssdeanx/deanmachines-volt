import { Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

/**
 * File Management Agent
 * Handles all file operations, cloud storage, and document management
 * Uses filesystem, Google Drive, and SQLite MCP tools
 */
export const fileAgent = new Agent({
  name: "FileManager",
  description: "Specialized agent for file operations, cloud storage, and document management",
  instructions: `You are a file management specialist. You can:
- Read, write, create, delete, and move files and directories
- Search and organize files across local and cloud storage
- Manage SQLite databases and file-based data
- Upload/download files to/from cloud services
- Handle document processing and file conversions
- Maintain file organization and cleanup

Always be careful with file operations and confirm destructive actions.`,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    const tools = await mcpToolsService.getToolsSafe();
    return mcpToolsService.getToolsForAgent('file');
  },  hooks: createSubAgentHooks("FileManager", "file operations and storage"),
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
  }
});
