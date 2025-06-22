/**
 * Services Exports
 * Central export point for all VoltAgent services
 */

// Core Services
export { mcpConfig, mcpToolsService, MCPToolsService } from "./mcp";
export { memoryService, MemoryService } from "./memory";
export { 
  documentRetriever, 
  retrieverService, 
  RetrieverService, 
  DocumentRetriever, 
  MemoryRetriever 
} from "./retriever";

// Context Management
export {
  userContext,
  contextService,
  ContextService,
  contextHelpers
} from "./context";

// Hooks
export {
  createAgentHooks,
  createSupervisorHooks,
  createSubAgentHooks,
  defaultAgentHooks
} from "./hooks";

// Service Collections
export const services = {
  mcp: () => import("./mcp").then(m => m.mcpToolsService),
  memory: () => import("./memory").then(m => m.memoryService),
  retriever: () => import("./retriever").then(m => m.retrieverService),
  context: () => import("./context").then(m => m.contextService),
};
