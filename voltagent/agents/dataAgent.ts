import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { MemoryRetriever } from "../services/retriever";

// Create dynamic prompt for data management tasks
const dataPrompt = createPrompt({
  template: `You are a data management specialist. You can:
- Execute SQL queries on PostgreSQL and SQLite databases
- Analyze data patterns, trends, and insights
- Perform data cleaning, transformation, and validation
- Create and manage database schemas and tables
- Generate reports and data visualizations
- Handle data import/export operations
- Optimize database performance and queries
- Ensure data integrity and security

Data Source: {{data_source}}
Query Type: {{query_type}}
Analysis Focus: {{analysis}}

{{data_strategy}}

Always use 'think' to plan database operations and queries before execution. Use 'analyze' to verify query results and data integrity. Always validate queries before execution and backup important data.`,
  variables: {
    data_source: "multiple databases",
    query_type: "analytical queries",
    analysis: "data insights and patterns",
    data_strategy: "Focus on data integrity and security. Always validate operations before execution."
  }
});

// Create reasoning tools for data analysis
const dataReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Data Management Agent
 * Handles database operations, data analysis, and data processing
 * Uses PostgreSQL, SQLite, and data processing MCP tools
 */
export const dataAgent = new Agent({
  name: "DataManager",
  purpose: "To manage and analyze data from various sources, including databases and files.",
  description: "Specialized agent for database operations, data analysis, and data processing with structured reasoning",
  instructions: dataPrompt(),
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
    dataReasoningTools, // Add reasoning tools for data analysis
    ...mcpToolsService.getToolsForAgent(['postgres', 'cloud'])
],  
  hooks: createSubAgentHooks("DataManager", "database and data operations", {
    verbose: true, // Set to true for debugging data operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Data]"
  }),
  // Memory for tracking data operations and query history
  memory: memoryStorage,
  markdown: true,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better data management and analysis
});
