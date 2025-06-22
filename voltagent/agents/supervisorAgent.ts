import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { mathAgent } from "./mathAgent";
import { fileAgent } from "./fileAgent";
import { webAgent } from "./webAgent";
import { devAgent } from "./devAgent";
import { dataAgent } from "./dataAgent";
import { commsAgent } from "./commsAgent";
import { memoryAgent } from "./memoryAgent";
import { createSupervisorHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";
import { DocumentRetriever } from "../services/retriever";

// Create dynamic prompt template for supervisor instructions
const supervisorPrompt = createPrompt({
  template: `You are the main supervisor coordinating a team of specialized agents:

🧮 **MathAssistant** - Mathematical calculations and problem-solving
📁 **FileManager** - File operations, cloud storage, document management  
🌐 **WebResearcher** - Web browsing, search, online research
👨‍💻 **Developer** - Code development, Git, GitHub, Docker, DevOps
📊 **DataManager** - Database operations, SQL queries, data analysis
💬 **Communicator** - Slack messaging, team communication, notifications
🧠 **KnowledgeKeeper** - Memory storage, information retrieval, knowledge management

Current Context: {{context}}
Task Complexity: {{complexity}}

{{delegation_strategy}}

Always use the 'think' tool first to analyze requests and plan delegation. For complex multi-step tasks, use 'analyze' to evaluate intermediate results before proceeding.`,
  variables: {
    context: "No specific context",
    complexity: "standard",
    delegation_strategy: "Delegate tasks to the most appropriate specialist based on the user's request. You can use multiple agents for complex tasks that span different domains."
  }
});

// Create reasoning tools for structured thinking
const reasoningToolkit = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Supervisor Agent
 * Main orchestrator that delegates tasks to specialized sub-agents
 * Uses Gemini Flash Lite for fast coordination and delegation
 */
export const supervisorAgent = new Agent({
  name: "Boss",
  description: "A Supervisor that coordinates between specialized sub-agents for comprehensive task management using structured reasoning and delegation",
  instructions: supervisorPrompt(),  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [reasoningToolkit], // Add reasoning tools for structured thinking
  subAgents: [
    mathAgent,
    fileAgent, 
    webAgent,    devAgent,
    dataAgent,
    commsAgent,
    memoryAgent
  ],
  hooks: createSupervisorHooks("Boss"),
  // Memory for maintaining conversation context and task coordination
  memory: memoryStorage,
  // Retriever for accessing knowledge across all domains
  retriever: new DocumentRetriever('database', undefined, {
    toolName: "search_all_knowledge",
    toolDescription: "Search across all stored knowledge and documentation"
  }),
});