---
description: AI rules derived by SpecStory from the project AI interaction history
applyTo: "/voltagent/**/*.{ts,tsx}"
---
# VoltAgent Development Guidelines

## Overview

This project implements a professional, modular VoltAgent AI agent system using Vercel AI SDK with Google (Gemini) models. The system follows VoltAgent best practices for memory, retrieval, structured reasoning, and MCP integration.

## Architecture Principles

### Core Design Rules

- **Professional modular design** with clear separation of concerns
- **Clean dependency structure** - agents import directly from `googleProvider.ts`
- **Flash-lite model optimization** for performance
- **Robust error handling** with graceful fallbacks
- **MCP integration** with conditional server loading

### Agent Structure

```typescript
// Standard agent pattern
export const agentName = new Agent({
  name: "AgentName", // No constants, use string literals
  description: "Professional description with capabilities",
  instructions: dynamicPrompt(), // Use createPrompt for dynamic templates
  llm: new VercelAIProvider(),
  model: google("gemini-2.5-flash-lite-preview-06-17"), // Always flash-lite
  tools: [reasoningToolkit, ...domainTools], // Include reasoning tools
  memory: memoryStorage, // Explicit memory configuration
  retriever: new DocumentRetriever(), // Appropriate retriever type
  hooks: createSubAgentHooks(), // Lifecycle management
});
```

## Technology Stack

### Required Dependencies

- `@ai-sdk/google` version 1.2.19 (or later)
- `@voltagent/core` for agent framework
- `@voltagent/vercel-ai` for provider integration
- `@google/generative-ai` for Gemini models
- `zod` for schema validation

### Model Configuration

- **Primary Model**: `gemini-2.5-flash-lite-preview-06-17`
- **Provider**: Vercel AI SDK with Google integration
- **No OpenAI dependencies** - fully migrated to Google AI

## Agent System Components

### 1. GoogleProvider Configuration (`config/googleProvider.ts`)

```typescript
import { google } from "@ai-sdk/google";

// Robust provider with console logging
export const googleProvider = google({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  // Additional configuration
});
```

### 2. Memory Management (`services/memory.ts`)

```typescript
export const memoryStorage = new LibSQLStorage({
  url: process.env.DATABASE_URL || "file:.voltagent/memory.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
  tablePrefix: "voltagent_memory",
  storageLimit: 100,
  debug: process.env.NODE_ENV === "development",
});
```

### 3. MCP Tools Service (`services/mcp.ts`)

```typescript
// Conditional MCP server loading with safe error handling
export class MCPToolsService {
  // Only loads servers with available credentials
  // Provides fallback for missing tokens
  // Categorized tool management
}
```

### 4. Retriever Services (`services/retriever.ts`)

```typescript
export class DocumentRetriever extends BaseRetriever {
  // Real implementation for document search
}

export class MemoryRetriever extends BaseRetriever {
  // Memory-based knowledge retrieval
}
```

## Agent Hierarchy

### Supervisor Agent (`agents/supervisorAgent.ts`)

- **Role**: Main orchestrator and task coordinator
- **Features**: Dynamic prompts, reasoning tools, all sub-agents
- **Tools**: `createReasoningTools()` for structured delegation
- **Memory**: Full conversation context
- **Retriever**: Cross-domain knowledge access

### Sub-Agents

1. **MathAgent** - Mathematical calculations with structured reasoning
2. **FileAgent** - File operations with memory and document retrieval
3. **WebAgent** - Web research with analysis and memory storage
4. **DevAgent** - Development tasks with code analysis and project memory
5. **DataAgent** - Database operations with schema retrieval
6. **CommsAgent** - Communication with template and contact management
7. **MemoryAgent** - Knowledge management with memory retrieval

## Development Patterns

### Dynamic Prompts with `createPrompt`

```typescript
const agentPrompt = createPrompt({
  template: `You are a specialist in {{domain}}.
  
Current Context: {{context}}
Task Type: {{task_type}}

{{strategy}}

Always use 'think' to analyze before proceeding.`,
  variables: {
    domain: "your specialty",
    context: "general context",
    task_type: "standard",
    strategy: "Your approach strategy"
  }
});
```

### Structured Reasoning with `createReasoningTools`

```typescript
const reasoningToolkit = createReasoningTools({
  think: true,    // Problem analysis and planning
  analyze: true,  // Result evaluation and next steps
  addInstructions: true, // Include usage guidelines
  addFewShot: true // Include examples
});
```

### Memory and Retriever Integration

```typescript
// Every agent should have explicit memory and appropriate retriever
export const agentName = new Agent({
  // ...other config
  memory: memoryStorage, // For conversation context
  retriever: new DocumentRetriever('database', undefined, {
    toolName: "search_domain_docs",
    toolDescription: "Search domain-specific documentation"
  }),
});
```

## Best Practices

### Code Standards

- Use TypeScript with strict typing
- Follow VoltAgent naming conventions
- Implement proper error boundaries
- Include comprehensive JSDoc comments
- Use console-based logging (not PinoLogger)

### Agent Design

- **Always validate environment variables** before using them
- **Provide clear error messages** for missing credentials
- **Use conditional server loading** for MCP configurations
- **Include reasoning tools** for complex decision-making
- **Structure prompts dynamically** with template variables

### Performance Optimization

- Use `flash-lite` models for speed
- Implement tool categorization for efficient loading
- Cache MCP tool responses where appropriate
- Optimize memory retrieval with proper limits

### Error Handling

```typescript
// Example: Safe environment variable handling
if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn("Google AI API key not found. Some features may be limited.");
  // Provide fallback or disable functionality gracefully
}
```

## Testing and Validation

### Environment Setup

```bash
# Required environment variables
GOOGLE_AI_API_KEY=your_google_ai_key
DATABASE_URL=your_database_url (optional, defaults to local SQLite)
DATABASE_AUTH_TOKEN=your_auth_token (for Turso)

# Optional MCP server credentials
BRAVE_API_KEY=your_brave_search_key
SLACK_BOT_TOKEN=your_slack_token
# ... other service tokens
```

### Validation Checklist

- [ ] All agents use `flash-lite` models
- [ ] No OpenAI dependencies remain
- [ ] Memory and retriever are explicitly configured
- [ ] MCP tools load conditionally based on available credentials
- [ ] Reasoning tools are included for complex agents
- [ ] Dynamic prompts use `createPrompt`
- [ ] Error handling provides clear feedback
- [ ] Console logging is used consistently

## Documentation References

- [VoltAgent Core Documentation](https://voltagent.dev/docs/)
- [Memory Management](https://voltagent.dev/docs/agents/memory/overview/)
- [Retriever Guide](https://voltagent.dev/docs/agents/retriever/)
- [Reasoning Tools](https://voltagent.dev/docs/tools/reasoning-tool/)
- [createPrompt Utility](https://voltagent.dev/docs/utils/create-prompt/)
- [MCP Integration](https://voltagent.dev/docs/agents/mcp/)

## Project Structure

```
voltagent/
├── index.ts                 # Main export point
├── config/
│   └── googleProvider.ts    # Google AI configuration
├── services/
│   ├── mcp.ts              # MCP tools service
│   ├── memory.ts           # Memory management
│   ├── retriever.ts        # Retrieval services
│   ├── hooks.ts            # Lifecycle hooks
│   ├── context.ts          # Context management
│   └── index.ts            # Service exports
├── agents/
│   ├── supervisorAgent.ts  # Main coordinator
│   ├── mathAgent.ts        # Math specialist
│   ├── fileAgent.ts        # File operations
│   ├── webAgent.ts         # Web research
│   ├── devAgent.ts         # Development tasks
│   ├── dataAgent.ts        # Database operations
│   ├── commsAgent.ts       # Communication
│   ├── memoryAgent.ts      # Knowledge management
│   └── index.ts            # Agent exports
└── tools/
    └── calculator.ts       # Custom tools
```

This architecture provides a robust, scalable, and maintainable VoltAgent system following all official best practices and guidelines.
