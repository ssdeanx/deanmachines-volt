---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## Headers

## PROJECT RULES
- All agents set `thinkingConfig: { thinkingBudget: 0, includeThoughts: false }` by default.
- **Ensure all agents have thinkingConfig at 0 & false by default.**
- **If you continue stopping with errors, then I'm finished working with you.**

## CODING STANDARDS
- **Never stop with errors.**
- **Do not remove any variables or parameters during code fixes, ensure all are fully implemented and used.**

## WORKFLOW & RELEASE RULES
- Do not run any code or execute commands without explicit user permission.
- **Always list available documentation and examples before proceeding with implementation.**
- **Always list VoltAgent docs first before searching.**
- **Quit searching: always list first.**
- No stopping until the code is error-free.
- **Do not stop with errors.**
- **Do not remove any variables or parameters during code fixes, ensure all are fully implemented and used.**
- **Run get_errors before you stop.**

## TECH STACK
- `@ai-sdk/google` version 1.2.19 (or later)
- Vercel AI SDK
- flash-lite
- ts-node
- tsx
- typescript
- `@xenova/transformers` (add to your dependencies for transformer re-ranking).
- `memfs` version ^4.17.2
- `chromadb-default-embed`
- `simple-git`
- `wikibase-sdk`

## PROJECT DOCUMENTATION & CONTEXT SYSTEM
- Before proceeding with implementation, always list available documentation and examples.
- Use `#list_voltagent_docs` and `#list_voltagent_examples` to search for documentation and examples.
- When asked to fix a file, **always list available VoltAgent documentation and examples related to the request first.**

## DEBUGGING
- **Always validate that required environment variables are defined before using them, and provide clear error messages if they are missing. This includes checking for null or undefined values.**
- Resolve all TypeScript and lint errors, including unused variables, incorrect types, and unnecessary ESLint disables.
- **All variables and parameters must be referenced to avoid breaking the hooks.**

## VOLTAGENT GUIDELINES

When assisting with projects involving Voltagent, prioritize building a professional modular design. Analyze the existing codebase to understand its structure and facilitate improvements. When switching from OpenAI, ensure all OpenAI dependencies are removed, and Google AI dependencies are correctly implemented. When using `@ai-sdk/google` with Vercel AI SDK, ensure compatibility and proper configuration. Always verify that OpenAI dependencies are removed from the package.json and codebase when migrating to Google AI. When working with Voltagent, prefer console-based logging when a specific logger isn't required. Agents should import directly from `googleProvider.ts` to maintain a cleaner dependency structure. Avoid using intermediary files like `models.ts` or `providers.ts` unless necessary. The main `index.ts` file should be clean and simple, just importing and exporting the components. When defining agents, use `flash-lite` and avoid using constants for the actual name in the agents. Always list available documentation and examples before proceeding with implementation. Do not run any code or execute commands without explicit user permission. Ensure that MCP configurations do not fail if tokens are unavailable by adding proper fallback handling and conditional server loading. **Always validate that required environment variables are defined before using them, and provide clear error messages if they are missing. This includes checking for null or undefined values.** **Ensure all agents have thinkingConfig at 0 & false by default.** Ensure all hooks are robust to missing context values (null/undefined). Add clear error messages if required environment variables or context are missing. Ensure all hooks are modular, concise, and match the latest VoltAgent docs. The `onHandoff` hook is important for observability and should be implemented with robust logging and tracking.
- **When working with `UserContextMap` always use a generic type parameter for value types.**
- **When initializing a session, use `Record<string, unknown>` instead of `Record<string, any>` for metadata to ensure stricter typing.**
- **When tracking handoffs, ensure `handoffs` is always an array before calling `push`. Add a type guard and cast as needed.**
- **When storing or retrieving operation results using `storeResult` and `getResult`, ensure the `results` object is explicitly typed as `Record<string, any>` to allow string indexing.**
- **When dealing with `handoffs` arrays, define a specific type for handoff entries (e.g., `HandoffEntry`) and use this type for improved type safety instead of `Array<any>`.**
- **When working with `contextService`, always ensure the data stored and retrieved is explicitly typed to avoid `any` types. Specifically, when dealing with collections like `conversations` and `references`, define specific types such as `ConversationEntry` and `ReferenceEntry` and use them with `Record<string, Type[]>` for better type safety.**
- **Do not remove any variables or parameters during code fixes, ensure all are fully implemented and used.**
- In `googleProvider.ts`, explicitly declare `/* global console */` at the top of the file to inform TypeScript and linters that `console` is a global variable.
- In `mcp.ts`, explicitly declare `/* global console */` at the top of the file to inform TypeScript and linters that `console` is a global variable.
- In `chroma.ts`, explicitly declare `/* global console */` at the top of the file to inform TypeScript and linters that `console` is a global variable.
- **When fixing `'process' is not defined` errors, use a safer check for environment variables that works in both Node.js and browser-like environments. Use `globalThis.process` and check for its existence before accessing environment variables.**
- **When accessing environment variables, always provide a fallback value to ensure a string is always returned. Use the nullish coalescing operator (`??`) to provide a default value if the environment variable is undefined.**
- **When working with `getConversationMessagesBatched` in `memory.ts`:**
    - **Define a specific `ConversationMessage` type to represent the structure of conversation messages.**
    - **When processing messages in batches, if the underlying storage returns a different message type (e.g., `MemoryMessage`), map the storage's message type to `ConversationMessage`. Ensure all properties required by `ConversationMessage` are present, using fallback values where necessary.**
    - **When mapping `MemoryMessage` to `ConversationMessage`, use the nullish coalescing operator (`??`) to provide default values for missing properties like `conversationId` and `userId`.**
    - **If the linter complains about an unused `batch` parameter in the `processor` callback, add an inline comment to clarify its usage and suppress the warning, as the parameter is required by the callback signature.**
    - **Always specify a concrete type (e.g., `ConversationMessage`) instead of `any` when mapping or processing batches of messages.**
    - **When defining the `processor` callback for `getConversationMessagesBatched`, ensure the parameter is explicitly named `messages` and add an inline comment to suppress the "unused variable" warning, as the parameter is required by the callback signature.**
- **When working with MCP configurations:**
    - **Ensure that the `env` property in all server definitions has all values as strings (never `undefined`). Use the nullish coalescing operator (`?? ""`) to provide a default empty string for any possibly undefined environment variable.**
    - **When defining the `MCPServer` interface, the `type` property must be explicitly typed as `"stdio"` (not just `string`).**
    - **When defining the `tools` array in `MCPToolsService`, replace the `any[]` type with a more specific type. Define an `MCPTool` interface to represent the structure of a tool (at minimum, it should have `name` and `description`). Use this type for `tools` and all related arrays/maps.**
    - **When catching errors during MCP initialization, reference the `error` variable in the `console.error` statement to avoid "unused variable" lint errors.**
- **When dealing with message content in `chroma.ts`:**
    - **Define a specific type for message content parts (e.g., `ContentPart`) with properties `type` and `text`.**
    - **When processing message content, ensure the content array is explicitly typed as `ContentPart[]`.**
    - **When filtering content parts by type, use type assertions (e.g., `part as { type: "text"; text: string }`) to ensure type safety when accessing properties.**
- **When making the Chroma retriever useful for real documents:**
    - **Use the provided `upsertDocuments` or `ChromaRetriever.upsertDocuments` method to add your own real documents at runtime.**
    - **Once you upsert your real docs, retrieval will work on your content, not the mock data.**
    - **The sample docs are only for initial setup/testing and are not required for real use.**
    - **The core for real doc support is in `chroma.ts` (`upsertDocuments`, `ChromaRetriever`, `chromaRetrieverTool`).**
    - **Agents/tools should call these methods after creating or fetching docs.**
    - **The retriever is then able to search and return real, user-supplied or agent-generated documents.**
    - **No mock/sample data is required; you can remove or ignore the `initializeCollection` sample logic.**
    - **Only documents explicitly upserted by agents or users (via `upsertDocuments` or `ChromaRetriever.upsertDocuments`) are stored and retrieved.**
    - **You can also delete docs by ID (`deleteDocument`).**
- **You can now upsert any file—including `context.ts`—into Chroma as a searchable document using the `upsertFile` function.**
- **Use `upsertDocuments` with any chat context as `content` and metadata (e.g., conversationId, userId, etc.).**
- **Use `upsertFile` to upsert chat logs saved as files.**
- **You can now upsert any context object—including hook context, tool context, or userContext—into Chroma for semantic search and RAG using `upsertAnyContext`.**
- **Use `retrieveByType(type, query)` to semantically search only documents with a specific context type (e.g., `"chat-context"`, `"hook-context"`, `"tool-context"`).**
- **When using transformer models for re-ranking, add `@xenova/transformers` to your dependencies.**
- If using `chromadb-default-embed` for transformer models, ensure it is correctly implemented.
- **You can now use transformer-based chunking with the `transformerSemanticChunk` utility.**

## TOOLKIT GUIDELINES
- **To define a VoltAgent toolkit, use `createToolkit` from `@voltagent/core` and group your tools in an object with `name`, `description`, `tools`, and (optionally) `instructions` and `addInstructions`.**
- **Each toolkit should be in its own file**
- **Each tool should use the correct schema and be imported from its own file**
- **Toolkit files should only export the toolkit.**
- **Each tool should be defined within the main toolkit function.**
- **When using `createTool` from `@voltagent/core`, the property for the tool's schema should be named `schema`.**