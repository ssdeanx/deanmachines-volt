/* global console */
/**
 * MCP (Model Context Protocol) Tools Service
 * Provides tools from MCP servers for VoltAgent
 * Comprehensive integration with official and community MCP servers
 */
import { MCPConfiguration } from "@voltagent/core";

/**
 * Create MCP servers configuration based on available environment variables
 * Only includes servers that have required credentials or work without them
 */
function createMCPServers() {
  interface MCPServer {
    name: string;
    type: "stdio"; // <-- Fix: restrict to "stdio"
    timeout?: number;
    command: string;
    args: string[];
    env?: Record<string, string>; // <-- Fix: all values must be string
    disabled?: boolean;
  }

  const servers: Record<string, MCPServer> = {};

  // ============================
  // ALWAYS AVAILABLE SERVERS (no auth required)
  // ============================
  servers.filesystem = {
    name: "File_System",
    type: "stdio",
    timeout: 60000,
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      (typeof globalThis.process !== "undefined" && typeof globalThis.process.cwd === "function")
        ? globalThis.process.cwd()
        : ".",
      "c:/Users/dm/Documents/deanmachines-volt"
    ],
  };

  servers.memory = {
    name: "Memory",
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  };

  servers.browser = {
    name: "Browser",
    type: "stdio",
    timeout: 60000,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
  };

  servers.git = {
    name: "Git",
    type: "stdio",
    timeout: 60000,
    command: "uvx",
    args: [
      "mcp-server-git",
      "--repository",
      (typeof globalThis.process !== "undefined" && typeof globalThis.process.cwd === "function")
        ? globalThis.process.cwd()
        : ".",
      "c:/Users/dm/Documents/deanmachines-volt"
    ],
  };

  servers.docker = {
    name: "Docker",
    type: "stdio",
    timeout: 60000,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
  };

  servers.everything = {
    name: "Everything",
    type: "stdio",
    timeout: 60000,
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
  };

  servers.voltagent = {
    name: "Voltagent",
    type: "stdio",
    command: "npx",
    args: ["-y", "@voltagent/docs-mcp"],
    timeout: 60000,
    disabled: false
  };

  servers.vibe_check = {
    name: "Vibe_Check",
    timeout: 60000,
    type: "stdio",
    command: "node",
    args: [
      "C:\\Users\\dm\\vibe-check-mcp-server\\build\\index.js"
      ],
    env: {
      GEMINI_API_KEY: (typeof globalThis.process !== "undefined" && globalThis.process.env?.GEMINI_API_KEY) 
        ? globalThis.process.env.GEMINI_API_KEY ?? ""
        : "",
    },
    disabled: false
  };


  // ============================
  // CONDITIONAL SERVERS (require credentials)
  // ============================

  // GitHub - only if token is available
  if (typeof globalThis.process !== "undefined" && globalThis.process.env?.GITHUB_TOKEN) {
    servers.github = {
      name: "GitHub",
      timeout: 60000,
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: globalThis.process.env.GITHUB_TOKEN ?? "",
      },
    };
    console.log("✅ GitHub MCP server enabled");
  } else {
    console.log("⚠️  GitHub MCP server disabled (GITHUB_TOKEN not found)");
  }

  // Brave Search - only if API key is available
  if (typeof globalThis.process !== "undefined" && globalThis.process.env?.BRAVE_API_KEY) {
    servers.web_search = {
      name: "Brave_Search",
      timeout: 60000,
      type: "stdio", 
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: globalThis.process.env.BRAVE_API_KEY ?? "",
      },
    };
    console.log("✅ Brave Search MCP server enabled");
  } else {
    console.log("⚠️  Brave Search MCP server disabled (BRAVE_API_KEY not found)");
  }

  // PostgreSQL - only if connection string is available
  if (typeof globalThis.process !== "undefined" && globalThis.process.env?.SUPABASE_URI) {
    servers.postgres = {
      name: "Supabase",
      timeout: 60000,
      type: "stdio",
      command: "npx", 
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        POSTGRES_CONNECTION_STRING: globalThis.process.env.SUPABASE_URI ?? "",
      },
    };
    console.log("✅ Supabase MCP server enabled");
  } else {
    console.log("⚠️  Supabase MCP server disabled (SUPABASE_URI not found)");
  }
  console.log(`🔧 MCP Configuration: ${Object.keys(servers).length} servers configured`);
  return servers;
}

/**
 * Enhanced MCP Configuration with conditional server loading
 * Only includes servers that have required credentials or work without them
 */
export const mcpConfig = new MCPConfiguration({
  servers: createMCPServers(),
});

/**
 * Enhanced MCP Tools Service with categorized tool management
 */
export class MCPToolsService {
  private config: MCPConfiguration;
  private tools: MCPTool[] = [];
  private toolsByCategory: Map<string, MCPTool[]> = new Map();
  private initialized = false;

  constructor(config: MCPConfiguration = mcpConfig) {
    this.config = config;
  }
  /**
   * Initialize and categorize all MCP tools
   */
  async initializeTools(): Promise<MCPTool[]> {
    if (this.initialized) {
      return this.tools;
    }

    try {
      console.log("🔧 Initializing MCP tools from servers...");
      this.tools = await this.config.getTools();
      
      // Categorize tools by server type
      this.categorizeTools();
      
      console.log(`✅ Initialized ${this.tools.length} MCP tools from ${this.toolsByCategory.size} categories`);
      this.logToolsSummary();
      
      this.initialized = true;
      return this.tools;
    } catch (error) {
      console.error("❌ Failed to initialize MCP tools:", error);
      console.log("🔄 Continuing with empty tools array - agents will work without MCP tools");
      
      // Set as initialized to prevent retries, but with empty tools
      this.initialized = true;
      this.tools = [];
      return [];
    }
  }

  

  /**
   * Categorize tools by their originating server name.
   * Assumes tool names are namespaced, e.g., 'filesystem_read_file'.
   */
  private categorizeTools(): void {
    this.toolsByCategory.clear();
    for (const tool of this.tools) {
      // Assumes tool name is in format 'serverName_toolAction'
      const parts = tool.name?.split('_');
      const category = parts && parts.length > 1 ? parts[0] : 'general';

      const existingTools = this.toolsByCategory.get(category) || [];
      existingTools.push(tool);
      this.toolsByCategory.set(category, existingTools);
    }
  }

  /**
   * Log summary of available tools
   */
  private logToolsSummary(): void {
    console.log("📊 MCP Tools Summary:");
    for (const [category, tools] of this.toolsByCategory.entries()) {
      console.log(`   ${category}: ${tools.length} tools`);
    }
  }
  /**
   * Get all tools (safe - never throws)
   */
  getTools(): MCPTool[] {
    return this.tools || [];
  }

  /**
   * Get tools by category (safe - never throws)
   */
  getToolsByCategory(category: string): MCPTool[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Safely get tools with fallback for uninitialized state
   */
  async getToolsSafe(): Promise<MCPTool[]> {
    if (!this.initialized) {
      try {
        return await this.initializeTools();
      } catch {
        console.warn("⚠️  Could not initialize MCP tools, returning empty array");
        return [];
      }
    }
    return this.tools || [];
  }

  /**
   * Get filesystem tools
   */
  getFilesystemTools(): MCPTool[] {
    return this.getToolsByCategory('filesystem');
  }

  /**
   * Get memory tools
   */
  getMemoryTools(): MCPTool[] {
    return this.getToolsByCategory('memory');
  }

  /**
   * Get web browsing tools
   */
  getWebTools(): MCPTool[] {
    return this.getToolsByCategory('web');
  }

  /**
   * Get git/version control tools
   */
  getGitTools(): MCPTool[] {
    return [
      ...this.getToolsByCategory('git'),
      ...this.getToolsByCategory('github'),
      ...this.getToolsByCategory('gitlab')
    ];
  }

  /**
   * Get database tools
   */
  getDatabaseTools(): MCPTool[] {
    return this.getToolsByCategory('database');
  }

  /**
   * Get cloud storage tools
   */
  getCloudTools(): MCPTool[] {
    return this.getToolsByCategory('cloud');
  }

  /**
   * Get development tools
   */
  getDevelopmentTools(): MCPTool[] {
    return this.getToolsByCategory('development');
  }

  /**
   * Get thinking/reasoning tools
   */
  getThinkingTools(): MCPTool[] {
    return this.getToolsByCategory('thinking');
  }

  /**
   * Get tools for a specific agent by providing an array of server names
   */
  getToolsForAgent(serverNames: string[]): MCPTool[] {
    let agentTools: MCPTool[] = [];
    for (const serverName of serverNames) {
      agentTools = [...agentTools, ...this.getToolsByCategory(serverName)];
    }
    return agentTools;
  }
  /**
   * Search tools by name or description (safe - never throws)
   */
  searchTools(query: string): MCPTool[] {
    if (!this.tools || this.tools.length === 0) {
      return [];
    }
    
    const queryLower = query.toLowerCase();
    return this.tools.filter(tool => 
      tool.name?.toLowerCase().includes(queryLower) ||
      tool.description?.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get tool statistics
   */
  getStats(): {
    totalTools: number;
    categoriesCount: number;
    categories: Record<string, number>;
    topCategories: Array<{ category: string; count: number }>;
  } {
    const categories: Record<string, number> = {};
    for (const [category, tools] of this.toolsByCategory.entries()) {
      categories[category] = tools.length;
    }

    const topCategories = Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTools: this.tools.length,
      categoriesCount: this.toolsByCategory.size,
      categories,
      topCategories
    };
  }

  /**
   * Check if tools are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reinitialize tools (useful for config changes)
   */
  async reinitialize(): Promise<MCPTool[]> {
    this.initialized = false;
    this.tools = [];
    this.toolsByCategory.clear();
    return this.initializeTools();
  }
}


// Define MCPTool interface for type safety
interface MCPTool {
  name: string;
  description?: string;
  // ...add other properties as needed...
}


export const toolsets = mcpConfig.getToolsets();



// Export singleton instance
export const mcpToolsService = new MCPToolsService();

// Preload MCP tools on startup
mcpToolsService.initializeTools().catch(error => console.error("Error initializing MCP tools:", error));
// Preload MCP tools on startup
mcpToolsService.initializeTools().catch(error => console.error("Error initializing MCP tools:", error));
