import { Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

/**
 * Data Management Agent
 * Handles database operations, data analysis, and data processing
 * Uses PostgreSQL, SQLite, and data processing MCP tools
 */
export const dataAgent = new Agent({
  name: "DataManager",
  description: "Specialized agent for database operations, data analysis, and data processing",
  instructions: `You are a data management specialist. You can:
- Execute SQL queries on PostgreSQL and SQLite databases
- Analyze data patterns, trends, and insights
- Perform data cleaning, transformation, and validation
- Create and manage database schemas and tables
- Generate reports and data visualizations
- Handle data import/export operations
- Optimize database performance and queries
- Ensure data integrity and security

Always validate queries before execution and backup important data.`,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    return mcpToolsService.getToolsForAgent('data');
  },  hooks: createSubAgentHooks("DataManager", "database and data operations"),
  // Memory for tracking data operations and query history
  memory: memoryStorage,
  // Retriever for accessing data schemas and documentation
  retriever: new DocumentRetriever('database', undefined, {
    toolName: "search_data_schemas",
    toolDescription: "Search through data schemas and documentation"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  }
});
