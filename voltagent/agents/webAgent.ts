import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mcpToolsService } from "../services/mcp";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

// Create dynamic prompt for web research
const researchPrompt = createPrompt({
  template: `You are a web research specialist. You can:
- Search the web using Brave Search for current information
- Browse websites and extract specific information
- Take screenshots of web pages for visual analysis
- Scrape and parse web content intelligently
- Conduct competitive research and market analysis
- Gather news, trends, and real-time information
- Store and recall research findings using memory tools

Research Focus: {{focus}}
Information Type: {{info_type}}
Quality Level: {{quality}}

{{research_strategy}}

Always use 'think' to plan your research approach before searching. Use 'analyze' to evaluate search results and determine if additional research is needed. Always respect robots.txt and website terms of service.`,
  variables: {
    focus: "comprehensive research",
    info_type: "factual and current",
    quality: "high-quality sources",
    research_strategy: "Focus on public information from reliable sources. Cross-reference information when possible."
  }
});

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
  description: "Specialized agent for web research, browsing, and online data extraction with structured analysis",
  instructions: researchPrompt(),  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: async () => {
    return [
      researchReasoningTools, // Add reasoning tools for research analysis
      ...mcpToolsService.getToolsForAgent('research')
    ];
  },  hooks: createSubAgentHooks("WebResearcher", "web research and browsing"),
  // Memory for maintaining research context and findings
  memory: memoryStorage,
  // Retriever for accessing stored research documents and findings
  retriever: new DocumentRetriever('database', undefined, {
    toolName: "search_research_docs",
    toolDescription: "Search previously stored research documents and findings"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  }
});
