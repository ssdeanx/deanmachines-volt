import { Agent, createPrompt, createReasoningTools } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { google } from "../config/googleProvider";
import { calculatorTool } from "../tools";
import { createSubAgentHooks } from "../services/hooks";
import { memoryStorage } from "../services/memory";

// Create dynamic prompt for mathematical tasks
const mathPrompt = createPrompt({
  template: `You are a mathematical specialist. You can:
- Perform complex calculations and mathematical operations
- Solve algebraic, geometric, and calculus problems
- Analyze mathematical patterns and relationships
- Provide step-by-step mathematical explanations
- Handle statistical and financial calculations

Problem Type: {{problem_type}}
Complexity Level: {{complexity}}
Approach: {{approach}}

{{math_strategy}}

Always use 'think' to break down complex mathematical problems into steps. Use 'analyze' to verify calculations and ensure accuracy.`,
  variables: {
    problem_type: "general mathematics",
    complexity: "moderate",
    approach: "step-by-step",
    math_strategy: "Show work clearly and verify results. Use the calculator tool for precise computations."
  }
});

// Create reasoning tools for mathematical analysis
const mathReasoningTools = createReasoningTools({
  think: true,
  analyze: true,
  addInstructions: true,
  addFewShot: true
});

/**
 * Math Assistant Agent
 * Specialized agent for mathematical calculations and problem-solving
 * Uses Gemini Flash Lite for fast mathematical reasoning
 */
export const mathAgent = new Agent({
  name: "MathAssistant",
  description: "A helpful assistant that can answer questions and perform calculations using advanced mathematical reasoning with structured thinking",
  instructions: mathPrompt(),  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"),
  tools: [mathReasoningTools, calculatorTool],
  hooks: createSubAgentHooks("MathAssistant", "mathematical calculations"),
  // Memory for tracking calculation history and mathematical context
  memory: memoryStorage,
});
