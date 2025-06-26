import { Agent, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { calculatorTool } from "../tools";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

/**
 * Static system prompt for math agent to avoid runtime modifications.
 * This prompt is defined statically to ensure system messages are set only at the beginning of the conversation.
 */
const mathPrompt = `You are a mathematical specialist. You can:
- Perform complex calculations and mathematical operations
- Solve algebraic, geometric, and calculus problems
- Analyze mathematical patterns and relationships
- Provide step-by-step mathematical explanations
- Handle statistical and financial calculations

Always use 'think' to break down complex mathematical problems into steps.`;

// Create reasoning tools for mathematical analysis
const mathReasoningTools = createReasoningTools({
  think: true,
  analyze: false,
  addInstructions: false,
  addFewShot: false
});

/**
 * Math Assistant Agent
 * Specialized agent for mathematical calculations and problem-solving
 * Uses Gemini Flash Lite for fast mathematical reasoning
 */
export const mathAgent = new Agent({
  name: "MathAssistant",
  purpose: "To perform mathematical calculations and solve complex math problems.",
  description: "Specialized agent for mathematical calculations and problem-solving with structured reasoning.",
  instructions: mathPrompt,
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [mathReasoningTools, calculatorTool],
  hooks: createSubAgentHooks("MathAssistant", "mathematical calculations", {
    verbose: true, // Set to true for debugging math operations
    performance: true,
    analytics: true,
    logPrefix: "[VoltAgent:Math]"
  }),
  markdown: true,
  // Memory for tracking calculation history and mathematical context
  memory: memoryStorage,
  thinkingConfig: {
    thinkingBudget: 0,
    includeThoughts: false
  },
  structuredOutputs: true // Enable structured outputs for better mathematical reasoning and results
});
