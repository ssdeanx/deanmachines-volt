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
import { MemoryRetriever } from "../services/retriever";

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
// Create reasoning tools for structured thinking
const reasoningToolkit = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: false,
  addFewShot: false
});

/**
 * Supervisor Agent
 * Main orchestrator that delegates tasks to specialized sub-agents
 * Uses Gemini Flash Lite for fast coordination and delegation
 */
export const supervisorAgent = new Agent({
  name: "Supervisor",
  purpose: "To coordinate and delegate tasks to specialized sub-agents based on user requests, ensuring efficient and accurate completion of complex workflows.",
  description: "Master orchestrator for complex multi-agent workflows with structured reasoning",
  instructions: supervisorPrompt(),
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [reasoningToolkit, /* delegate_task is automatically added when subAgents are defined */],
  subAgents: [
    mathAgent,
    fileAgent,
    webAgent,
    devAgent,
    dataAgent,
    commsAgent,
    memoryAgent
  ],
  hooks: createSupervisorHooks("Supervisor", {
    verbose: true, // Set to true for debugging delegation
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Supervisor]"
  }),
  memory: memoryStorage,
  retriever: new MemoryRetriever(memoryStorage, {
    toolName: "search_conversation_history",
    toolDescription: "Search across conversation history and stored knowledge"
  }),
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better task delegation and coordination
});
