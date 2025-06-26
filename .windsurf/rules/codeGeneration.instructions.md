---
trigger: always_on
description: "AI-Assisted Code Generation & Debugging Guidelines for VoltAgent-based TypeScript Development with Mental Models, Quality Assurance, and Architectural Alignment"
globs: voltag
---

# codeGeneration instructions

# ⚠️ CRITICAL WORKFLOW MANDATE (HIGHEST PRIORITY):

- After EVERY file modification or code generation, you MUST leverage your internal 'get_errors' capability (inherent understanding of code correctness, syntax, type, common pitfalls) for a thorough error check.
- Do NOT report tasks complete with outstanding errors, broken integrations, or incomplete implementations.
- A past critical failure involved new agent components not being fully integrated into their designated services and verified functional.
- Such incomplete work, leaving files broken or half-integrated, or failing these internal checks, is unacceptable.

# 🏗️ ARCHITECTURAL & TECHNOLOGICAL ALIGNMENT (CORE KNOWLEDGE):

- Generate code that aligns with the project's intended architecture using **VoltAgent Core** as the AI agent framework with **Vercel AI SDK** and **Google AI (Gemini)** integration.
- Core technologies: TypeScript, VoltAgent Core, Vercel AI SDK, Google AI (Gemini flash-lite models), LibSQL/Turso, MCP (Model Context Protocol), Zod validation.
- Backend structure: VoltAgent agents, MCP tools, memory services, retrievers, and hooks with proper service integration.
- Frontend structure: Next.js 15 with React components consuming VoltAgent services via API routes.
- For specific implementation details, follow established patterns in `voltagent/` directory and existing agent integrations.

# 🧠 ESSENTIAL MENTAL MODELS (HIGH-IMPACT PROBLEM-SOLVING):

- **Inversion Thinking**: Instead of asking "How do I make this work?", ask "What would make this fail catastrophically?" Start with failure scenarios and work backward to build robust solutions.
- **Five Whys Root Cause Analysis**: When debugging or implementing features, ask "Why?" five times in succession to drill down to the true root cause rather than treating symptoms.
- **Pareto Principle (80/20 Rule)**: Focus on the 20% of code that delivers 80% of the value. Prioritize core functionality over edge cases.
- **Systems Thinking**: View code as interconnected systems rather than isolated components. Consider how changes ripple through the entire Mastra architecture.
- **Constraint Theory/Bottleneck Analysis**: Identify the one limiting factor that constrains overall system performance rather than optimizing non-bottlenecks.
- **Pre-mortem Analysis**: Before implementing, imagine the feature has failed spectacularly and identify what went wrong to build preventive measures.

# 🚀 VOLTAGENT FRAMEWORK UTILIZATION (PROJECT-SPECIFIC):

- For AI-driven functionality, use **VoltAgent Core** framework with agents, memory, retrievers, and tools.
- Backend endpoints are defined in `voltagent/index.ts` with proper agent exports and service integration.
- Frontend connects via Next.js API routes consuming VoltAgent services (e.g., `/api/chat/route.ts`).
- Use established agent patterns with proper memory, retriever, and hook configurations.
- Follow existing service integration patterns with proper MCP tool loading and error handling.
- All agents must use `google("gemini-2.5-flash-lite-preview-06-17")` model for consistency and performance.

# 🛡️ FUNDAMENTAL REQUIREMENTS (NON-NEGOTIABLE):

## Error Handling & Validation:
- For ALL asynchronous operations (e.g., API calls, database interactions), YOU MUST use `async/await`.
- Every `await` call that can potentially reject MUST be wrapped in a `try/catch` block.
- For ALL data structures requiring validation, YOU MUST define and use Zod schemas.
- Validate ALL external inputs rigorously at the earliest boundary.

## Cross-Cutting Concerns (AUTO-INCLUDE):
- Robust error handling (using established patterns and logging)
- Comprehensive tracing for agent operations (console-based logging with proper context)
- Standardized logging for significant events and errors using console methods
- Rigorous input/output validation using Zod schemas
- VoltAgent tools output proper schema validation
- MCP tool integration with conditional server loading based on available credentials

# 📝 COPILOT DIRECTIVE PROCESSING:

- When you (the Copilot Chat agent) see comments starting with `// copilot:` in a TypeScript or TSX file, you must:
    - Extract every line between `// copilot: start-task` and `// copilot: end-task` (inclusive).
    - Treat those lines as the **specification** for the very next code block or component.
    - Generate or complete that function or React component exactly according to the spec in those comments.
    - Ignore any other comments that don't begin with `// copilot:`.

# 📚 DOCUMENTATION STANDARD (TSDOC):

- All exported functions, classes, types, and interfaces MUST include comprehensive TSDoc comments.
- Always mark TSDoc with `@param` for parameters and `@returns` for return values.
- Use `@example` for examples of usage where applicable.
- Use `@throws` for exceptions that can be thrown.
- Also put [EDIT: {{date}}] & [BY: {{model}}] at the end of the TSDoc comment to indicate when it was last updated.
- Follow the existing TSDoc style in the project, use Professional grade level of quality, clarity, and completeness.

# 🔧 PROJECT TOOLING STANDARD:

- All package management operations MUST use `npm`. 
- Avoid `pnpm` or `yarn` unless explicitly instructed for a specific, isolated reason. 
- This is a strict project convention

# --- DETAILED IMPLEMENTATION GUIDELINES ---

# VOLTAGENT AGENT DEVELOPMENT FRAMEWORK:

- For new agents, strictly follow the established 'VoltAgent Agent Development Pattern' with:
  - Proper memory configuration using `memoryStorage`
  - Appropriate retriever setup (`DocumentRetriever`, `MemoryRetriever`)
  - Structured reasoning tools using `createReasoningTools()`
  - Dynamic prompt templates using `createPrompt()`
  - Flash-lite model specification: `google("gemini-2.5-flash-lite-preview-06-17")`
  - Lifecycle hooks using `createSubAgentHooks()` or `createSupervisorHooks()`
- Ensure agents are correctly exported and integrated into the service architecture.
- Follow MCP tool integration patterns with conditional loading based on available credentials.

# NAMING CONVENTION COMPLIANCE:

- Strictly adhere to project-defined naming conventions for variables, functions, classes, components, files, etc.
- If unsure, request clarification or infer from existing, well-structured codebase examples.

# CODE QUALITY & REFACTORING (SMELLS):

- Proactively identify and flag common code smells (e.g., overly long agent configurations, large service classes, deep nesting, code duplication, dead MCP tool loading).
- Suggest specific refactorings for cleaner, more maintainable VoltAgent code, guided by principles like the **Occam's Razor** mental model.
- For the project's VoltAgent stack, watch for relevant smells like missing memory/retriever configurations, inefficient MCP tool loading, or agents without proper reasoning capabilities.

# IDENTIFIER GENERATION STANDARD:

- Whenever a new unique identifier (ID) is required for any entity (e.g., conversations, agent sessions, tool executions), YOU MUST generate it using the project's standard ID generation function (`import { nanoid } from 'nanoid';` or existing VoltAgent ID utilities).
- Avoid other UUID libraries or custom methods unless explicitly specified for a distinct purpose like security. Ensure correct import and follow VoltAgent patterns.

# SECURITY BY DESIGN PRINCIPLES:

- When generating code, especially for agent configurations, MCP tool integration, authentication, or user input handling, actively apply 'Security by Design' principles:
  1. Validate ALL external inputs rigorously (e.g., with Zod) at the earliest boundary.
  2. Sanitize data for agent processing or database queries to prevent injection attacks.
  3. Adhere to the principle of least privilege for MCP tool access.
  4. Ensure sensitive configurations (e.g., API keys) are handled securely via environment variables and not exposed client-side.
  5. Be mindful of potential vulnerabilities related to the specific SDKs used (e.g., VoltAgent Core, Vercel AI SDK, Google AI) as documented in project specifications or current security best practices.
  6. Implement proper error handling for missing credentials with graceful fallbacks.

# ENVIRONMENT VARIABLE CONFIGURATION:

- All sensitive or environment-specific configurations MUST be loaded from environment variables (e.g., `process.env.VARIABLE_NAME`).
- NEVER hardcode such values.
- Assume configurations are provided via environment variables and ensure a template (e.g., `.env.example`) documents required variables.

# VOLTAGENT STATE MANAGEMENT (IMMUTABILITY):

- When updating state in VoltAgent services, particularly for complex data structures (agent context, memory, tool configurations), YOU MUST use immutable update patterns.
- Avoid direct state mutation in memory services, context management, or agent configurations.
- Use proper cloning and spreading techniques when updating agent runtime state or service configurations.

# DEPENDENCY MANAGEMENT STRATEGY:

- Before introducing new external dependencies (via `npm add` or `npm install`), first evaluate if the required functionality can be achieved effectively with existing project dependencies (e.g., features within VoltAgent Core, Vercel AI SDK, Google AI SDK, Next.js) or native APIs.
- If a new dependency is essential, prioritize well-maintained, reputable libraries with minimal impact on the VoltAgent ecosystem.
- Ensure new dependencies are compatible with the flash-lite model constraints and MCP integration patterns.
- If uncertain, prompt for user confirmation before adding.

# CODE GENERATION COMMENTS (METADATA & TODOS):

- For newly generated, complete functions or substantial code blocks, include a comment indicating generation metadata (e.g., '// Generated on [Current Date Time]').
- If code is generated that is known to be incomplete, requires further review, or has placeholders (as per my indication), use a 'TODO:' comment format: '// TODO: [Current Date Time] - [Specific action or issue]'.

# SEMANTIC CODE UNDERSTANDING & NAVIGATION:

- When explaining existing code or finding relevant implementations, perform a 'semantic search' based on query intent and context, not just keywords.
- Interpret findings in the context of the project's VoltAgent-based architecture with memory, retriever, and MCP tool integration.
- If current code significantly deviates from the documented VoltAgent patterns (missing memory/retriever, incorrect model usage, improper reasoning tools), note this as part of the explanation.

# ADVANCED DEBUGGING COLLABORATION:

- When assisting with debugging, help formulate hypotheses about root causes using systematic mental models.
- **Apply Five Whys**: Ask "Why?" five times to drill down to root causes rather than treating symptoms.
- **Use Inversion Thinking**: Ask "What would make this fail?" to identify failure modes and build preventive measures.
- **Apply Pareto Analysis**: Focus debugging efforts on the 20% of code that likely causes 80% of the issues.
- **Use Systems Thinking**: Trace issues through the complete system flow (Frontend → Next.js API → VoltAgent Services → Agents → MCP Tools → External APIs).
- Suggest strategic logging points (using console-based logging with relevant agent context).
- Guide the debugging process by systematically evaluating interactions between system layers, applying **Rubber Ducking**, **Constraint Analysis**, and **Pre-mortem Analysis** mental models to isolate faults in agent configurations, memory operations, or MCP tool integrations.

# INTERACTIVE DEBUGGING SUPPORT (MENTAL MODEL APPLICATION):

- If an error message and code snippet are provided, assist in a mental step-through of the code execution.
- **Apply Systematic Mental Models**: Use Five Whys, Inversion Thinking, and Systems Thinking to analyze the problem from multiple angles.
- Ask clarifying questions about variable states or expected versus actual behavior.