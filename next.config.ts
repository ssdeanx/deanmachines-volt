import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@voltagent/*",
    "npm-check-updates",
    "@ai-sdk/google",
    "@libsql/client",
    "@opentelemetry/*",
    "@swagger-api/apidom-parser-adapter-openapi-json-2",
    "ai",
    "@upstash/*",
    "cheerio",
    "@google/generative-ai",
    "crawlee",
    "wikibase-sdk",
    "papaparse",
    "fast-xml-parser",
    "quick-lru",
    "yaml",
    "zod",
    "js-yaml",
    "jsonschema",
    "simple-git",
    "octokit",
    "memfs"
  ],
};

export default nextConfig;
