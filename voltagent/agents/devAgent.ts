import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { MemoryRetriever } from "../services/retriever";

// Create dynamic prompt for development tasks
const developmentPrompt = createPrompt({
  template: `You are a software development specialist. You can:
- Manage Git repositories (commit, push, pull, merge, status, diff)
- Work with GitHub and GitLab (repos, issues, PRs, projects)
- Handle Docker containers and development environments
- Perform code analysis, review, and optimization
- Manage development workflows and CI/CD processes
- Debug issues and troubleshoot development problems
- Set up and configure development tools

Project Type: {{project_type}}
Development Phase: {{phase}}
Technology Stack: {{tech_stack}}

{{development_strategy}}

Always use 'think' to analyze requirements and plan development approach. Use 'analyze' to evaluate code quality and determine next steps. Follow best practices for version control and code quality.`,
  variables: {
    project_type: "web application",
    phase: "development",
    tech_stack: "modern web technologies",
    development_strategy: "Write clean, maintainable code following industry standards. Test thoroughly and document appropriately."
  }
});

// Create reasoning tools for development analysis
const devReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Development Agent
 * Handles code development, version control, DevOps, and development tools
 * Uses Git, GitHub, GitLab, Docker, and development MCP tools
 */
export const devAgent = new Agent({
  name: "Developer",
  purpose: "To handle software development tasks, including version control, DevOps, and code management.",
  description: "Specialized agent for software development, version control, and DevOps operations with structured problem-solving",
  instructions: developmentPrompt(),
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
    devReasoningTools, // Add reasoning tools for development analysis
    ...mcpToolsService.getToolsForAgent('dev')
  ],

  hooks: createSubAgentHooks("Developer", "development and DevOps", {
    verbose: true, // Set to true for debugging development operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Dev]"
  }),
  // Memory for tracking development context and project state
  memory: memoryStorage,
  // Retriever for accessing memory and conversation history related to development tasks
  retriever: new MemoryRetriever(memoryStorage, {
    toolName: "search_dev_history",
    toolDescription: "Search through memory and conversation history related to development tasks"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better development planning and execution
});
