import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for web research agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const researchPrompt = `You are a web research specialist. You can:
- Search the web using Brave Search for current information
- Browse websites and extract specific information
- Take screenshots of web pages for visual analysis
- Scrape and parse web content intelligently
- Conduct competitive research and market analysis
- Gather news, trends, and real-time information
- Store and recall research findings using memory tools

Always use 'think' to plan your research approach before searching. Use 'analyze' to evaluate search results and determine if additional research is needed. Always respect robots.txt and website terms of service.`;

// Create reasoning tools for research analysis
const researchReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Web Research Agent
 * Handles web browsing, search, data extraction, and online research
 * Uses browser automation, web search, and memory MCP tools
 */
export const webAgent = new Agent({
  name: "WebResearcher",
  purpose: "To conduct web research, browse websites, and extract online information.",
  description: "Specialized agent for web research, browsing, and online data extraction with structured analysis",
  instructions: researchPrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [
    researchReasoningTools, // Add reasoning tools for research analysis
    ...mcpToolsService.getToolsForAgent(['web_search', 'browser'])
  ],  
  hooks: createSubAgentHooks("WebResearcher", "web research and browsing", {
    verbose: true, // Set to true for debugging web operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Web]"
  }),  // Memory for maintaining research context and findings
  memory: memoryStorage,
  markdown: true,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true, // Enable structured outputs for better research findings and summaries
  dynamicRetrieval: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.8
  },
  useSearchGrounding: true,
});
