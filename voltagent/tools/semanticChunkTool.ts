import { createTool } from "@voltagent/core";
import { z } from "zod";
import { semanticChunk, transformerSemanticChunk } from "../services/chroma";

/**
 * Semantic Chunking Tool
 * Splits text into semantically meaningful chunks using paragraph or transformer-based chunking.
 */
export const semanticChunkTool = createTool({
  name: "semantic_chunk",
  description:
    "Split text into semantically meaningful chunks using paragraph or transformer-based chunking.",
  parameters: z.object({
    text: z.string().describe("The text to split into chunks."),
    maxChunkSize: z.number().optional().describe("Maximum chunk size in characters (default: 1200)"),
    minChunkSize: z.number().optional().describe("Minimum chunk size in characters (default: 300)"),
    useTransformer: z.boolean().optional().describe("If true, use transformer-based chunking."),
  }),
  execute: async (args) => {
    const { text, maxChunkSize, minChunkSize, useTransformer } = args;
    if (useTransformer) {
      const chunks = await transformerSemanticChunk(text, { maxChunkSize, minChunkSize });
      return { chunks };
    } else {
      const chunks = semanticChunk(text, { maxChunkSize, minChunkSize });
      return { chunks };
    }
  },
});
