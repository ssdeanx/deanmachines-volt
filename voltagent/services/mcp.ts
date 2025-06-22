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
  const servers: Record<string, any> = {};

  // ============================
  // ALWAYS AVAILABLE SERVERS (no auth required)
  // ============================
  servers.filesystem = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd(), "c:/Users/dm/Documents"],
  };

  servers.memory = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  };

  servers.sqlite = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "./data/app.db"],
  };

  servers.browser = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
  };

  servers.git = {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-git", "--repository", process.cwd()],
  };

  servers.docker = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
  };

  servers.everything = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
  };

  servers.sequential_thinking = {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  };

  // ============================
  // CONDITIONAL SERVERS (require credentials)
  // ============================

  // GitHub - only if token is available
  if (process.env.GITHUB_TOKEN) {
    servers.github = {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
      },
    };
    console.log("✅ GitHub MCP server enabled");
  } else {
    console.log("⚠️  GitHub MCP server disabled (GITHUB_TOKEN not found)");
  }

  // GitLab - only if token is available
  if (process.env.GITLAB_TOKEN) {
    servers.gitlab = {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-gitlab"],
      env: {
        GITLAB_PERSONAL_ACCESS_TOKEN: process.env.GITLAB_TOKEN,
      },
    };
    console.log("✅ GitLab MCP server enabled");
  } else {
    console.log("⚠️  GitLab MCP server disabled (GITLAB_TOKEN not found)");
  }

  // Brave Search - only if API key is available
  if (process.env.BRAVE_API_KEY) {
    servers.web_search = {
      type: "stdio", 
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY,
      },
    };
    console.log("✅ Brave Search MCP server enabled");
  } else {
    console.log("⚠️  Brave Search MCP server disabled (BRAVE_API_KEY not found)");
  }

  // PostgreSQL - only if connection string is available
  if (process.env.DATABASE_URL || process.env.POSTGRES_CONNECTION_STRING) {
    servers.postgres = {
      type: "stdio",
      command: "npx", 
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        POSTGRES_CONNECTION_STRING: process.env.DATABASE_URL || process.env.POSTGRES_CONNECTION_STRING,
      },
    };
    console.log("✅ PostgreSQL MCP server enabled");
  } else {
    console.log("⚠️  PostgreSQL MCP server disabled (DATABASE_URL not found)");
  }

  // Google Drive - only if credentials are available
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    servers.google_drive = {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-gdrive"],
      env: {
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
    };
    console.log("✅ Google Drive MCP server enabled");
  } else {
    console.log("⚠️  Google Drive MCP server disabled (GOOGLE_APPLICATION_CREDENTIALS not found)");
  }

  // Slack - only if bot token is available
  if (process.env.SLACK_BOT_TOKEN) {
    servers.slack = {
      type: "stdio",
      command: "npx", 
      args: ["-y", "@modelcontextprotocol/server-slack"],
      env: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
      },
    };
    console.log("✅ Slack MCP server enabled");
  } else {
    console.log("⚠️  Slack MCP server disabled (SLACK_BOT_TOKEN not found)");
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
  private tools: any[] = [];
  private toolsByCategory: Map<string, any[]> = new Map();
  private initialized = false;

  constructor(config: MCPConfiguration = mcpConfig) {
    this.config = config;
  }
  /**
   * Initialize and categorize all MCP tools
   */
  async initializeTools(): Promise<any[]> {
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
   * Categorize tools by their purpose and server type
   */
  private categorizeTools(): void {
    this.toolsByCategory.clear();
    
    const categories = {
      filesystem: ['read_file', 'write_file', 'list_directory', 'create_directory', 'delete_file', 'move_file'],
      memory: ['store_memory', 'recall_memory', 'search_memory', 'delete_memory'],
      git: ['git_commit', 'git_push', 'git_pull', 'git_status', 'git_diff', 'git_log'],
      github: ['create_repository', 'list_repositories', 'get_repository', 'create_issue', 'list_issues'],
      gitlab: ['gitlab_get_project', 'gitlab_list_projects', 'gitlab_create_issue'],
      web: ['browse', 'search', 'screenshot', 'fetch_page', 'extract_text'],
      database: ['query_database', 'execute_sql', 'list_tables', 'describe_table'],
      cloud: ['upload_file', 'download_file', 'list_files', 'share_file'],
      development: ['docker_run', 'docker_ps', 'docker_logs', 'compile_code'],
      thinking: ['sequential_thinking', 'analyze', 'reason', 'plan'],
      general: [] // fallback category
    };

    // Group tools by category based on tool names
    for (const tool of this.tools) {
      let categorized = false;
      
      for (const [category, toolNames] of Object.entries(categories)) {
        if (toolNames.some(name => tool.name?.includes(name) || name.includes(tool.name))) {
          const existingTools = this.toolsByCategory.get(category) || [];
          existingTools.push(tool);
          this.toolsByCategory.set(category, existingTools);
          categorized = true;
          break;
        }
      }
      
      // Add to general category if not categorized
      if (!categorized) {
        const generalTools = this.toolsByCategory.get('general') || [];
        generalTools.push(tool);
        this.toolsByCategory.set('general', generalTools);
      }
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
  getTools(): any[] {
    return this.tools || [];
  }

  /**
   * Get tools by category (safe - never throws)
   */
  getToolsByCategory(category: string): any[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Safely get tools with fallback for uninitialized state
   */
  async getToolsSafe(): Promise<any[]> {
    if (!this.initialized) {
      try {
        return await this.initializeTools();
      } catch (error) {
        console.warn("⚠️  Could not initialize MCP tools, returning empty array");
        return [];
      }
    }
    return this.tools || [];
  }

  /**
   * Get filesystem tools
   */
  getFilesystemTools(): any[] {
    return this.getToolsByCategory('filesystem');
  }

  /**
   * Get memory tools
   */
  getMemoryTools(): any[] {
    return this.getToolsByCategory('memory');
  }

  /**
   * Get web browsing tools
   */
  getWebTools(): any[] {
    return this.getToolsByCategory('web');
  }

  /**
   * Get git/version control tools
   */
  getGitTools(): any[] {
    return [...this.getToolsByCategory('git'), ...this.getToolsByCategory('github'), ...this.getToolsByCategory('gitlab')];
  }

  /**
   * Get database tools
   */
  getDatabaseTools(): any[] {
    return this.getToolsByCategory('database');
  }

  /**
   * Get cloud storage tools
   */
  getCloudTools(): any[] {
    return this.getToolsByCategory('cloud');
  }

  /**
   * Get development tools
   */
  getDevelopmentTools(): any[] {
    return this.getToolsByCategory('development');
  }

  /**
   * Get thinking/reasoning tools
   */
  getThinkingTools(): any[] {
    return this.getToolsByCategory('thinking');
  }

  /**
   * Get tools for a specific agent type
   */
  getToolsForAgent(agentType: 'file' | 'web' | 'dev' | 'data' | 'research' | 'memory'): any[] {
    switch (agentType) {
      case 'file':
        return [...this.getFilesystemTools(), ...this.getCloudTools()];
      case 'web':
        return this.getWebTools();
      case 'dev':
        return [...this.getGitTools(), ...this.getDevelopmentTools()];
      case 'data':
        return this.getDatabaseTools();
      case 'research':
        return [...this.getWebTools(), ...this.getMemoryTools()];
      case 'memory':
        return this.getMemoryTools();
      default:
        return [];
    }
  }
  /**
   * Search tools by name or description (safe - never throws)
   */
  searchTools(query: string): any[] {
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
  async reinitialize(): Promise<any[]> {
    this.initialized = false;
    this.tools = [];
    this.toolsByCategory.clear();
    return this.initializeTools();
  }
}

// Export singleton instance
export const mcpToolsService = new MCPToolsService();
