import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@voltagent/*",
    "npm-check-updates",
    "@ai-sdk/google",
    "@google/generative-ai",
    "@libsql/client",
    "@opentelemetry/*",
    "@swagger-api/apidom-parser-adapter-openapi-json-2",
    "ai"],
};

export default nextConfig;
