import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for development agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const developmentPrompt = `You are a software development specialist. You can:
- Manage Git repositories (commit, push, pull, merge, status, diff)
- Work with GitHub and GitLab (repos, issues, PRs, projects)
- Handle Docker containers and development environments
- Perform code analysis, review, and optimization
- Manage development workflows and CI/CD processes
- Debug issues and troubleshoot development problems
- Set up and configure development tools

Always use 'think' to analyze requirements and plan development approach. Use 'analyze' to evaluate code quality and determine next steps. Follow best practices for version control and code quality.`;

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
  instructions: developmentPrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
    devReasoningTools, // Add reasoning tools for development analysis
    ...mcpToolsService.getToolsForAgent(['git', 'github', 'docker'])
  ],

  hooks: createSubAgentHooks("Developer", "development and DevOps", {
    verbose: true, // Set to true for debugging development operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Dev]"
  }),
  // Memory for tracking development context and project state
  memory: memoryStorage,
  markdown: true,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true, // Enable structured outputs for better development planning and execution
  functionCalls: true, // Enable function calls for better development planning and execution
  dynamicRetrieval: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.8
  },
  useSearchGrounding: true,
});
