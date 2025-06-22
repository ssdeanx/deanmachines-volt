/**
 * Agent Exports
 * Central export point for all VoltAgent agents
 */

// Specialized Sub-Agents
export { mathAgent } from "./mathAgent";
export { fileAgent } from "./fileAgent";
export { webAgent } from "./webAgent";
export { devAgent } from "./devAgent";
export { dataAgent } from "./dataAgent";
export { commsAgent } from "./commsAgent";
export { memoryAgent } from "./memoryAgent";

// Supervisor Agent
export { supervisorAgent } from "./supervisorAgent";

// Agent Collections
export const subAgents = {
  math: () => import("./mathAgent").then(m => m.mathAgent),
  file: () => import("./fileAgent").then(m => m.fileAgent),
  web: () => import("./webAgent").then(m => m.webAgent),
  dev: () => import("./devAgent").then(m => m.devAgent),
  data: () => import("./dataAgent").then(m => m.dataAgent),
  comms: () => import("./commsAgent").then(m => m.commsAgent),
  memory: () => import("./memoryAgent").then(m => m.memoryAgent),
};

export const allAgents = {
  supervisor: () => import("./supervisorAgent").then(m => m.supervisorAgent),
  ...subAgents,
};
