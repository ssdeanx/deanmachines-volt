---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## Headers

## PROJECT RULES

## CODING STANDARDS

## WORKFLOW & RELEASE RULES
- Do not run any code or execute commands without explicit user permission.
- **Always list available documentation and examples before proceeding with implementation.**
- **Always list VoltAgent docs first before searching.**

## TECH STACK
- `@ai-sdk/google` version 1.2.19 (or later)
- Vercel AI SDK
- flash-lite
- ts-node
- tsx
- typescript

## PROJECT DOCUMENTATION & CONTEXT SYSTEM
- Before proceeding with implementation, always list available documentation and examples.
- Use `#list_voltagent_docs` and `#list_voltagent_examples` to search for documentation and examples.

## DEBUGGING
- **Always validate that required environment variables are defined before using them, and provide clear error messages if they are missing. This includes checking for null or undefined values.**

## VOLTAGENT GUIDELINES

When assisting with projects involving Voltagent, prioritize building a professional modular design. Analyze the existing codebase to understand its structure and facilitate improvements. When switching from OpenAI, ensure all OpenAI dependencies are removed, and Google AI dependencies are correctly implemented. When using `@ai-sdk/google` with Vercel AI SDK, ensure compatibility and proper configuration. Always verify that OpenAI dependencies are removed from the package.json and codebase when migrating to Google AI. When working with Voltagent, prefer console-based logging when a specific logger isn't required. Agents should import directly from `googleProvider.ts` to maintain a cleaner dependency structure. Avoid using intermediary files like `models.ts` or `providers.ts` unless necessary. The main `index.ts` file should be clean and simple, just importing and exporting the components. When defining agents, use `flash-lite` and avoid using constants for the actual name in the agents. Always list available documentation and examples before proceeding with implementation. Do not run any code or execute commands without explicit user permission. Ensure that MCP configurations do not fail if tokens are unavailable by adding proper fallback handling and conditional server loading. **Always validate that required environment variables are defined before using them, and provide clear error messages if they are missing. This includes checking for null or undefined values.**