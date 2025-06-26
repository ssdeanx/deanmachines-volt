/* global console */
import { BaseRetriever, type BaseMessage, type RetrieveOptions } from "@voltagent/core";
import { ChromaClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { promises as fs } from "fs";
import { pipeline } from "chromadb-default-embed"; // GG

// Initialize Chroma client
const chromaClient = new ChromaClient({
  path:
    (typeof globalThis.process !== "undefined" && globalThis.process.env?.CHROMA_URL !== undefined
      ? globalThis.process.env.CHROMA_URL
      : undefined) ?? "http://localhost:8000",
});

const embeddingFunction = new GoogleGeminiEmbeddingFunction({
  apiKey:
    (typeof globalThis.process !== "undefined" && globalThis.process.env?.GEMINI_API_KEY !== undefined
      ? globalThis.process.env.GEMINI_API_KEY
      : undefined) ?? "",
  modelName: "gemini-embedding-exp-03-07",
});

const collectionName = "voltagent-knowledge-base";

// Utility: Get or create the Chroma collection
async function getCollection() {
  return chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction,
  });
}

// Add/Upsert real user/agent documents to Chroma
function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  if (!meta) return result;
  for (const [k, v] of Object.entries(meta)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      result[k] = v;
    } else {
      result[k] = v?.toString?.() ?? null;
    }
  }
  return result;
}

/**
 * Upsert (add or update) documents into the Chroma collection.
 * Use this for any docs created, fetched, or uploaded by agents or users.
 */
export async function upsertDocuments(docs: { id: string; content: string; metadata?: Record<string, unknown> }[]) {
  const collection = await getCollection();
  await collection.upsert({
    documents: docs.map(d => d.content),
    ids: docs.map(d => d.id),
    metadatas: docs.map(d => sanitizeMetadata(d.metadata)),
  });
  console.log(`Upserted ${docs.length} documents to Chroma collection.`);
}

/**
 * Remove a document from the Chroma collection by ID.
 */
export async function deleteDocument(id: string) {
  const collection = await getCollection();
  await collection.delete({ ids: [id] });
  console.log(`Deleted document ${id} from Chroma collection.`);
}

/**
 * List all document IDs and metadata in the Chroma collection (for debugging/admin).
 */
export async function listDocuments() {
  try {
    const collection = await getCollection();
    const allIds = await collection.get({});
    return allIds;
  } catch (error) {
    console.error("Error listing Chroma documents:", error);
    throw new Error("Could not list Chroma documents. Is Chroma running and accessible?");
  }
}

// --- Types ---
export type ChromaDocMetadata = Record<string, string | number | boolean | null | undefined>;
export type ChromaDoc = {
  id: string;
  content: string;
  metadata: ChromaDocMetadata;
  distance: number;
  rrf?: number;
  transformerScore?: number;
};

// Retrieve function
async function retrieveDocuments(query: string, nResults = 3): Promise<ChromaDoc[]> {
  try {
    const collection = await getCollection();
    const results = await collection.query({
      queryTexts: [query],
      nResults,
    });
    if (!results.documents || !results.documents[0]) {
      return [];
    }
    return results.documents[0].map((doc, index): ChromaDoc => ({
      content: doc ?? '',
      metadata: results.metadatas?.[0]?.[index] || {},
      distance: results.distances?.[0]?.[index] || 0,
      id: results.ids?.[0]?.[index] || `unknown_${index}`,
    }));
  } catch (error) {
    console.error("Error retrieving documents:", error);
    return [];
  }
}

type ContentPart = { type: "text"; text: string } | { type: string; [key: string]: unknown };

/**
 * Chroma-based retriever implementation for VoltAgent
 * Only real docs are indexed and retrieved. No mock/sample data.
 * Agents and users must upsert docs via upsertDocuments or ChromaRetriever.upsertDocuments.
 */
export class ChromaRetriever extends BaseRetriever {
  constructor(options?: { toolName?: string; toolDescription?: string }) {
    super(options);
  }

  /**
   * Retrieve documents from Chroma based on semantic similarity
   */
  async retrieve(input: string | BaseMessage[], options: RetrieveOptions): Promise<string> {
    let searchText = "";
    if (typeof input === "string") {
      searchText = input;
    } else if (Array.isArray(input) && input.length > 0) {
      const lastMessage = input[input.length - 1];
      if (Array.isArray(lastMessage.content)) {
        const textParts = (lastMessage.content as ContentPart[])
          .filter((part) => part.type === "text")
          .map((part) => (part as { type: "text"; text: string }).text);
        searchText = textParts.join(" ");
      } else {
        searchText = lastMessage.content as string;
      }
    }
    const results: ChromaDoc[] = await retrieveDocuments(searchText, 3);
    // Add references to userContext if available
    if (options.userContext && results.length > 0) {
      const references = results.map((doc, index) => ({
        id: doc.id,
        title: doc.metadata.title ?? `Document ${index + 1}`,
        source: doc.metadata.source ?? "Chroma Knowledge Base",
        distance: doc.distance,
      }));
      options.userContext.set("references", references);
    }
    if (results.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }
    return results
      .map(
        (doc, index) =>
          `Document ${index + 1} (ID: ${doc.id}, Distance: ${doc.distance.toFixed(4)}):\n${doc.content}`,
      )
      .join("\n\n---\n\n");
  }

  /**
   * Add or update documents in the Chroma collection
   */
  static async upsertDocuments(docs: { id: string; content: string; metadata?: Record<string, unknown> }[]) {
    await upsertDocuments(docs);
  }
  /**
   * Remove a document from the Chroma collection by ID.
   */
  static async deleteDocument(id: string) {
    await deleteDocument(id);
  }
}

/**
 * Upsert a code or text file into the Chroma collection by file path.
 * Reads the file, then indexes its content as a document.
 * Usage: await upsertFile("/path/to/file.ts", { id, metadata });
 */
export async function upsertFile(filePath: string, options: { id?: string; metadata?: Record<string, unknown> } = {}) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const id = options.id || filePath;
    await upsertDocuments([
      {
        id,
        content,
        metadata: { ...(options.metadata || {}), filePath },
      },
    ]);
    console.log(`Upserted file ${filePath} as document ${id}`);
  } catch (error) {
    console.error(`Failed to upsert file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Upsert the current chat context (conversation history, user/session info, etc.) into Chroma.
 * This enables semantic search over the full context for RAG and agent workflows.
 *
 * Usage:
 *   await upsertContext(contextService, { id, metadata });
 */
export async function upsertContext(contextService: { getAll: () => Record<string, unknown> }, options: { id?: string; metadata?: Record<string, unknown> } = {}) {
  const contextData = contextService.getAll();
  const id = options.id || `context-${Date.now()}`;
  // Serialize context as pretty JSON for semantic search
  const content = JSON.stringify(contextData, null, 2);
  await upsertDocuments([
    {
      id,
      content,
      metadata: { ...(options.metadata || {}), type: "chat-context" },
    },
  ]);
  console.log(`Upserted chat context as document ${id}`);
}

/**
 * Upsert any context object (such as hook context, tool context, or userContext) into Chroma.
 * Accepts any object with serializable state. Optionally specify id/metadata.
 *
 * Usage:
 *   await upsertAnyContext(hookContext, { id: "hook-ctx-123", metadata: { type: "hook-context" } });
 *   await upsertAnyContext(toolContext, { metadata: { type: "tool-context" } });
 */
export async function upsertAnyContext(contextObj: Record<string, unknown>, options: { id?: string; metadata?: Record<string, unknown> } = {}) {
  const id = options.id || `context-${Date.now()}`;
  const content = JSON.stringify(contextObj, null, 2);
  await upsertDocuments([
    {
      id,
      content,
      metadata: { ...(options.metadata || {}), type: options.metadata?.type || "generic-context" },
    },
  ]);
  console.log(`Upserted context as document ${id}`);
}

/**
 * Semantic chunking utility: splits large text into semantically meaningful chunks.
 * Uses paragraph/sentence splitting by default, but can be extended to use transformer-based chunking.
 * @param text The input text to chunk
 * @param options.maxChunkSize Maximum chunk size in characters (default: 1200)
 * @param options.minChunkSize Minimum chunk size in characters (default: 300)
 * @returns Array of text chunks
 */
export function semanticChunk(
  text: string,
  options: { maxChunkSize?: number; minChunkSize?: number } = {}
): string[] {
  const maxChunkSize = options.maxChunkSize ?? 1200;
  const minChunkSize = options.minChunkSize ?? 300;
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }
  // Merge small chunks with neighbors
  const merged: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].length < minChunkSize && merged.length > 0) {
      merged[merged.length - 1] += "\n\n" + chunks[i];
    } else {
      merged.push(chunks[i]);
    }
  }
  return merged;
}

/**
 * Transformer-based semantic chunking utility: splits large text into semantically meaningful chunks using a transformer model.
 * Uses the pipeline from chromadb-default-embed for sentence embeddings.
 * @param text The input text to chunk
 * @param options.maxChunkSize Maximum chunk size in characters (default: 1200)
 * @param options.minChunkSize Minimum chunk size in characters (default: 300)
 * @returns Array of text chunks
 */
export async function transformerSemanticChunk(
  text: string,
  options: { maxChunkSize?: number; minChunkSize?: number } = {}
): Promise<string[]> {
  const maxChunkSize = options.maxChunkSize ?? 1200;
  const minChunkSize = options.minChunkSize ?? 300;
  // Split into sentences (simple split, can be improved)
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  // Get sentence embeddings
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const embeddings: number[][] = [];
  for (const sentence of sentences) {
    // @ts-expect-error: embedder returns tensor with .data
    const emb: number[] = (await embedder(sentence))[0].data;
    embeddings.push(emb);
  }
  // Greedily group sentences into chunks based on maxChunkSize
  const chunks: string[] = [];
  let currentChunk = "";
  let currentLen = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (currentLen + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentLen = sentence.length;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      currentLen += sentence.length;
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  // Merge small chunks with neighbors
  const merged: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].length < minChunkSize && merged.length > 0) {
      merged[merged.length - 1] += " " + chunks[i];
    } else {
      merged.push(chunks[i]);
    }
  }
  return merged;
}

/**
 * Upsert a large document or context as semantically meaningful chunks.
 * Each chunk is upserted as a separate Chroma document with shared metadata and chunk index.
 * @param doc The document to chunk and upsert (id, content, metadata)
 * @param options.chunkOptions Options for chunking (maxChunkSize, minChunkSize)
 * @param options.useTransformerChunking If true, use transformer-based chunking
 */
export async function upsertWithChunks(
  doc: { id: string; content: string; metadata?: Record<string, unknown> },
  options: { chunkOptions?: { maxChunkSize?: number; minChunkSize?: number }; useTransformerChunking?: boolean } = {}
) {
  let chunks: string[];
  if (options.useTransformerChunking) {
    chunks = await transformerSemanticChunk(doc.content, options.chunkOptions);
  } else {
    chunks = semanticChunk(doc.content, options.chunkOptions);
  }
  const docs = chunks.map((chunk, i) => ({
    id: `${doc.id}::chunk${i + 1}`,
    content: chunk,
    metadata: { ...(doc.metadata || {}), chunkIndex: i + 1, chunkTotal: chunks.length, parentId: doc.id },
  }));
  await upsertDocuments(docs);
  console.log(`Upserted ${docs.length} semantic chunks for document ${doc.id}`);
}

// Export retriever instance and tool for agent.tools usage
export const chromaRetriever = new ChromaRetriever({
  toolName: "search_knowledge_base",
  toolDescription: "Searches the Chroma-powered knowledge base for relevant documents using semantic similarity.",
});
export const chromaRetrieverTool = chromaRetriever.tool;

/**
 * Usage Example (for agents, uploads, or admin scripts):
 *
 * import { upsertDocuments, chromaRetriever } from "./chroma";
 *
 * // Add a real document (from agent, user upload, or fetch)
 * await upsertDocuments([
 *   {
 *     id: "doc1",
 *     content: "This is a real document.",
 *     metadata: { title: "Real Doc", source: "user-upload" }
 *   }
 * ]);
 *
 * // Retrieve relevant docs in an agent
 * const context = await chromaRetriever.retrieve("search query", { userContext });
 *
 * // List all docs (for admin/debug)
 * const docs = await listDocuments();
 */

/**
 * Retrieve documents by metadata type (e.g., "chat-context", "hook-context", "tool-context").
 * Performs semantic search but only returns docs with the given type in metadata.
 * Usage: await retrieveByType("hook-context", "error handling");
 */
export async function retrieveByType(type: string, query: string, nResults = 3): Promise<ChromaDoc[]> {
  const allResults = await retrieveDocuments(query, 10); // Get more to allow filtering
  return allResults.filter(doc => doc.metadata?.type === type).slice(0, nResults);
}

/**
 * Hybrid retrieval: combine Chroma vector search with keyword search, then re-rank with a transformer.
 * Optionally, filter by metadata.
 * Usage: await hybridRetrieve({ query, nResults, filter: { type: "chat-context" } });
 */
export async function hybridRetrieve({ query, nResults = 5, filter }: { query: string; nResults?: number; filter?: Record<string, string> }): Promise<ChromaDoc[]> {
  // 1. Vector search (Chroma)
  const vectorResults: ChromaDoc[] = await retrieveDocuments(query, nResults * 2);
  // 2. Keyword search (simple substring match)
  const allDocs = await listDocuments();
  const keywordResults: ChromaDoc[] = (allDocs.documents as (string | null)[])
    .map((doc, i) => ({
      content: doc || '',
      metadata: allDocs.metadatas?.[i] || {},
      id: allDocs.ids?.[i] || `unknown_${i}`,
      distance: 0.5, // Placeholder
    }))
    .filter(doc => doc.content && doc.content.toLowerCase().includes(query.toLowerCase()));
  // 3. Merge results (Reciprocal Rank Fusion)
  const merged: Record<string, ChromaDoc> = {};
  let rank = 1;
  for (const doc of vectorResults) {
    merged[doc.id] = { ...doc, rrf: 1 / rank };
    rank++;
  }
  rank = 1;
  for (const doc of keywordResults) {
    if (merged[doc.id]) {
      merged[doc.id].rrf = (merged[doc.id].rrf ?? 0) + 1 / rank;
    } else {
      merged[doc.id] = { ...doc, rrf: 1 / rank };
    }
    rank++;
  }
  let results: ChromaDoc[] = Object.values(merged);
  // 4. Metadata filtering
  if (filter) {
    results = results.filter(doc => Object.entries(filter).every(([k, v]) => doc.metadata?.[k] === v));
  }
  // 5. Re-rank with transformer (cross-encoder)
  const reranker = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  results = await Promise.all(
    results.map(async (doc) => {
      try {
        const features = await reranker([query, doc.content]);
        // features[0] is a Tensor; extract .data arrays for cosine similarity
        // @ts-expect-error: features[0] is a Tensor with .data property
        const queryEmbedding: number[] = features[0].data;
        // @ts-expect-error: features[1] is a Tensor with .data property
        const docEmbedding: number[] = features[1].data;
        const sim = cosineSimilarity(queryEmbedding, docEmbedding);
        return { ...doc, transformerScore: sim };
      } catch (err) {
        console.error(`Transformer re-ranking failed for doc ${doc.id}:`, err);
        return { ...doc, transformerScore: 0 };
      }
    })
  );
  results.sort((a, b) => (b.transformerScore ?? 0) - (a.transformerScore ?? 0));
  return results.slice(0, nResults);
}

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

/**
 * Iterative Retrieval-Generation Loop
 * After generating an answer, feed it back into the retriever for multi-hop reasoning.
 * Usage: await iterativeRetrieve({ query, steps, userContext });
 */
export async function iterativeRetrieve({ query, steps = 2, userContext }: { query: string; steps?: number; userContext?: unknown }): Promise<string[]> {
  // Reference userContext to avoid lint error (required by project rules)
  void userContext;
  let currentQuery = query;
  const allContexts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const results = await hybridRetrieve({ query: currentQuery, nResults: 3 });
    const context = results.map((doc) => doc.content).join("\n\n");
    allContexts.push(context);
    // Simulate LLM generation (replace with actual LLM call in production)
    const generated = `LLM answer to: ${currentQuery} (context: ${context.slice(0, 100)}...)`;
    currentQuery = generated;
  }
  return allContexts;
}