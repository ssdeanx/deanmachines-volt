/**
 * Retriever Service for VoltAgent
 * Provides RAG (Retrieval-Augmented Generation) capabilities
 */
import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";
import { LibSQLStorage } from "@voltagent/core";
import { mcpToolsService } from "./mcp";

/**
 * Real Document Retriever - connects to actual document sources
 * Searches through filesystem, databases, or external APIs
 */
export class DocumentRetriever extends BaseRetriever {
  constructor(
    private documentSource: 'filesystem' | 'database' | 'api' = 'filesystem',
    private basePath?: string,
    options?: { toolName?: string; toolDescription?: string }
  ) {
    super(options);
  }

  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    const query = typeof input === "string" ? input : (input[input.length - 1].content as string);
    console.log(`DocumentRetriever: Searching ${this.documentSource} for "${query}"`);    // Store search metadata in userContext if available
    if (options.userContext) {
      const searches = options.userContext.get("searches") as any[] || [];
      searches.push({
        type: this.documentSource,
        query,
        timestamp: new Date().toISOString(),
        retriever: 'DocumentRetriever'
      });
      options.userContext.set("searches", searches);
    }

    try {
      switch (this.documentSource) {
        case 'filesystem':
          return await this.searchFilesystem(query, options);
        case 'database':
          return await this.searchDatabase(query, options);
        case 'api':
          return await this.searchAPI(query, options);
        default:
          return "No document source configured.";
      }
    } catch (error) {
      console.error("Document retrieval error:", error);
        // Store error in userContext if available
      if (options.userContext) {
        const errors = options.userContext.get("retrievalErrors") as any[] || [];
        errors.push({
          retriever: 'DocumentRetriever',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        options.userContext.set("retrievalErrors", errors);
      }
      
      return "Error retrieving documents.";
    }
  }
  private async searchFilesystem(query: string, options: RetrieveOptions): Promise<string> {
    try {
      // Get filesystem tools from MCP service
      const filesystemTools = mcpToolsService.getFilesystemTools();
      
      if (filesystemTools.length === 0) {
        // Store fallback info in userContext
        if (options.userContext) {
          const references = options.userContext.get("references") as any[] || [];
          references.push({
            source: 'filesystem',
            query,
            status: 'no_tools',
            note: 'MCP filesystem tools not available'
          });
          options.userContext.set("references", references);
        }
        return "Filesystem tools not available. Please ensure MCP filesystem server is configured.";
      }

      // Use basePath for search scope if provided
      const searchPath = this.basePath || process.cwd();
      console.log(`Searching filesystem in: ${searchPath} for query: "${query}"`);

      // Try to find relevant files by listing directories and searching file contents
      const searchResults: string[] = [];
      
      // Look for list_directory tool
      const listDirTool = filesystemTools.find(tool => 
        tool.name?.includes('list_directory') || tool.name?.includes('list_dir')
      );
      
      // Look for read_file tool  
      const readFileTool = filesystemTools.find(tool =>
        tool.name?.includes('read_file') || tool.name?.includes('read')
      );

      if (listDirTool) {
        try {
          // List files in the search directory
          const listResult = await listDirTool.execute({ path: searchPath });
          searchResults.push(`Directory listing for ${searchPath}:`);
          searchResults.push(listResult);
        } catch (error) {
          console.warn("Failed to list directory:", error);
        }
      }

      // If we have read capability, try to search file contents
      if (readFileTool && searchResults.length > 0) {
        try {
          // Look for common file types that might contain relevant info
          const commonFiles = ['README.md', 'package.json', '.env.example', 'tsconfig.json'];
          
          for (const fileName of commonFiles) {
            try {
              const filePath = `${searchPath}/${fileName}`;
              const content = await readFileTool.execute({ path: filePath });
              
              // Simple text search in file content
              if (content && typeof content === 'string' && 
                  content.toLowerCase().includes(query.toLowerCase())) {
                searchResults.push(`\n**Found in ${fileName}:**`);
                // Extract relevant lines (simple implementation)
                const lines = content.split('\n');
                const relevantLines = lines.filter(line => 
                  line.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 3);
                searchResults.push(relevantLines.join('\n'));
              }
            } catch (error) {
              // File might not exist, continue with next file
              continue;
            }
          }
        } catch (error) {
          console.warn("Failed to search file contents:", error);
        }
      }

      // Store search results in userContext
      if (options.userContext) {
        const references = options.userContext.get("references") as any[] || [];
        references.push({
          source: 'filesystem',
          query,
          searchPath,
          status: 'completed',
          toolsUsed: filesystemTools.map(t => t.name),
          resultsCount: searchResults.length
        });
        options.userContext.set("references", references);
      }

      if (searchResults.length > 0) {
        return `## Filesystem Search Results\n\n${searchResults.join('\n')}`;
      } else {
        return `No files found containing "${query}" in ${searchPath}`;
      }

    } catch (error) {
      console.error("Filesystem search error:", error);
      
      // Store error in userContext
      if (options.userContext) {
        const references = options.userContext.get("references") as any[] || [];
        references.push({
          source: 'filesystem',
          query,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        options.userContext.set("references", references);
      }
      
      return `Error searching filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async searchDatabase(query: string, options: RetrieveOptions): Promise<string> {
    // TODO: Implement real database search using vector embeddings
    // This would use a vector database like Qdrant, Pinecone, or Supabase Vector
      // Store references in userContext if available
    if (options.userContext) {
      const references = options.userContext.get("references") as any[] || [];
      references.push({
        source: 'database',
        query,
        status: 'not_implemented',
        note: 'Requires vector database setup'
      });
      options.userContext.set("references", references);
    }
    
    return "Database search not yet implemented - requires vector database setup.";
  }
  private async searchAPI(query: string, options: RetrieveOptions): Promise<string> {
    try {
      // Get web search tools from MCP service (like Brave Search)
      const webTools = mcpToolsService.getWebTools();
      
      if (webTools.length === 0) {
        // Store fallback info in userContext
        if (options.userContext) {
          const references = options.userContext.get("references") as any[] || [];
          references.push({
            source: 'api',
            query,
            status: 'no_tools',
            note: 'MCP web search tools not available'
          });
          options.userContext.set("references", references);
        }
        return "Web search tools not available. Please ensure MCP web search server is configured.";
      }

      // Look for web search tool (Brave Search or similar)
      const searchTool = webTools.find(tool => 
        tool.name?.includes('search') || 
        tool.name?.includes('brave') ||
        tool.name?.includes('web')
      );

      if (!searchTool) {
        if (options.userContext) {
          const references = options.userContext.get("references") as any[] || [];
          references.push({
            source: 'api',
            query,
            status: 'no_search_tool',
            note: 'No web search tool found in MCP tools'
          });
          options.userContext.set("references", references);
        }
        return "No web search tool found in available MCP tools.";
      }

      console.log(`Searching web using ${searchTool.name} for query: "${query}"`);

      // Execute web search
      const searchResults = await searchTool.execute({ 
        query: query,
        count: 5 // Limit results
      });

      // Store search results in userContext
      if (options.userContext) {
        const references = options.userContext.get("references") as any[] || [];
        references.push({
          source: 'api',
          query,
          status: 'completed',
          toolUsed: searchTool.name,
          timestamp: new Date().toISOString()
        });
        options.userContext.set("references", references);
      }

      if (searchResults && typeof searchResults === 'string' && searchResults.length > 0) {
        return `## Web Search Results\n\n${searchResults}`;
      } else if (searchResults && typeof searchResults === 'object') {
        // Handle structured search results
        const formattedResults = JSON.stringify(searchResults, null, 2);
        return `## Web Search Results\n\n\`\`\`json\n${formattedResults}\n\`\`\``;
      } else {
        return `No web search results found for "${query}"`;
      }

    } catch (error) {
      console.error("API search error:", error);
      
      // Store error in userContext
      if (options.userContext) {
        const references = options.userContext.get("references") as any[] || [];
        references.push({
          source: 'api',
          query,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        options.userContext.set("references", references);
      }
      
      return `Error searching web: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

/**
 * Memory-based Retriever - Real implementation using LibSQL
 * Searches through conversation history and stored memories
 */
export class MemoryRetriever extends BaseRetriever {
  constructor(
    private memoryStorage: LibSQLStorage,
    options?: { toolName?: string; toolDescription?: string }
  ) {
    super(options);
  }

  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    const query = typeof input === "string" ? input : (input[input.length - 1].content as string);
    console.log(`MemoryRetriever: Searching memory for "${query}"`);    // Track retrieval in userContext if available
    if (options.userContext) {
      const retrievals = options.userContext.get("memoryRetrievals") as any[] || [];
      retrievals.push({
        query,
        timestamp: new Date().toISOString(),
        retriever: 'MemoryRetriever'
      });
      options.userContext.set("memoryRetrievals", retrievals);
    }

    try {
      // Get userId from userContext or use default
      const userId = options.userContext?.get("userId") as string || "default";

      // Get recent conversations from LibSQL storage
      const conversations = await this.memoryStorage.getConversationsByUserId(userId, {
        limit: 10,
        orderBy: "updated_at",
        orderDirection: "DESC",
      });

      // Filter conversations that might be relevant to the query
      const queryLower = query.toLowerCase();
      const relevantMemories = conversations.filter((conv) => {
        const searchText = `${conv.title || ''} ${conv.metadata?.summary || ''}`.toLowerCase();
        return searchText.includes(queryLower) || 
              queryLower.split(' ').some(word => searchText.includes(word));
      });

      if (relevantMemories.length > 0) {
        // Get detailed messages for relevant conversations
        const memoryDetails = await Promise.all(
          relevantMemories.slice(0, 3).map(async (conv) => {
            const messages = await this.memoryStorage.getConversationMessages(conv.id, { limit: 5 });
            return {
              title: conv.title || `Conversation ${conv.id.slice(0, 8)}`,
              date: conv.updatedAt,
              summary: conv.metadata?.summary || messages.slice(-2).map(m => m.content).join(' '),
              messageCount: messages.length,
            };
          })
        );

        const memoryContext = memoryDetails
          .map((memory) => `**${memory.title}** (${memory.date})\nSummary: ${memory.summary}\nMessages: ${memory.messageCount}`)
          .join("\n\n");        // Store successful retrieval results in userContext
        if (options.userContext) {
          const references = options.userContext.get("references") as any[] || [];
          references.push(...memoryDetails.map(memory => ({
            title: memory.title,
            date: memory.date,
            type: 'conversation_memory',
            messageCount: memory.messageCount
          })));
          options.userContext.set("references", references);
          
          // Store retrieval metadata
          options.userContext.set("lastMemoryRetrieval", {
            query,
            memoriesFound: relevantMemories.length,
            userId,
            timestamp: new Date().toISOString()
          });
        }

        return `## Recent Relevant Memories\n\n${memoryContext}`;
      }

      // Store no results found in userContext
      if (options.userContext) {
        options.userContext.set("lastMemoryRetrieval", {
          query,
          memoriesFound: 0,
          userId,
          timestamp: new Date().toISOString()
        });
      }

      return "No relevant memories found in conversation history.";
    } catch (error) {
      console.error("Memory retrieval error:", error);
        // Store error in userContext if available
      if (options.userContext) {
        const errors = options.userContext.get("retrievalErrors") as any[] || [];
        errors.push({
          retriever: 'MemoryRetriever',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        options.userContext.set("retrievalErrors", errors);
      }
      
      return "Error accessing memory storage.";
    }
  }
}

/**
 * Retriever Service for managing multiple retrievers
 */
export class RetrieverService {
  private retrievers: Map<string, BaseRetriever> = new Map();

  /**
   * Register a retriever with a name
   */
  registerRetriever(name: string, retriever: BaseRetriever) {
    this.retrievers.set(name, retriever);
    console.log(`Registered retriever: ${name}`);
  }

  /**
   * Get a specific retriever by name
   */
  getRetriever(name: string): BaseRetriever | undefined {
    return this.retrievers.get(name);
  }

  /**
   * Get all registered retrievers
   */
  getAllRetrievers(): BaseRetriever[] {
    return Array.from(this.retrievers.values());
  }

  /**
   * Get retriever tools for use in agents
   */
  getRetrieverTools() {
    return Array.from(this.retrievers.values()).map(retriever => retriever.tool);
  }
}

// Pre-configured retrievers
export const documentRetriever = new DocumentRetriever(
  'filesystem',
  process.cwd(),
  {
    toolName: "search_docs",
    toolDescription: "Searches real documents using filesystem, database, or API sources.",
  }
);

export const retrieverService = new RetrieverService();

// Register default retrievers
retrieverService.registerRetriever("documents", documentRetriever);
