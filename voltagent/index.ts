import { VoltAgent, VoltAgentExporter } from "@voltagent/core";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { mathAgent } from "./agents/mathAgent";
import { fileAgent } from "./agents/fileAgent";
import { webAgent } from "./agents/webAgent";
import { devAgent } from "./agents/devAgent";
import { dataAgent } from "./agents/dataAgent";
import { commsAgent } from "./agents/commsAgent";
import { memoryAgent } from "./agents/memoryAgent";
import { supervisorAgent } from "./agents/supervisorAgent";
import { LangfuseExporter } from "@voltagent/langfuse-exporter";


const voltagentPublicKey = process.env.PK;
const voltagentSecretKey = process.env.SK;

// Validate required environment variables
if (!voltagentPublicKey) {
  throw new Error("PK environment variable is required");
}

if (!voltagentSecretKey) {
  throw new Error("SK environment variable is required");
}

new VoltAgent({
  agents: {
    math: mathAgent,
    file: fileAgent,
    web: webAgent,
    dev: devAgent,
    data: dataAgent,
    comms: commsAgent,
    memory: memoryAgent,
    supervisor: supervisorAgent,
  },
  server: {
    autoStart: true,
    enableSwaggerUI: true,
    port: 3141,
  },
  telemetryExporter: [
    new VoltAgentExporter({
      publicKey: voltagentPublicKey,
      secretKey: voltagentSecretKey,
      baseUrl: "https://api.voltagent.dev", // Default URL for the VoltAgent cloud service
    }),
    new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
      debug: true,
    })
  ],
});


 // Initialize OpenTelemetry SDK
    const sdk = new NodeSDK({
      traceExporter: new ConsoleSpanExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    
    sdk.start();

// Handle graceful shutdown
process.on("SIGTERM", () => sdk.shutdown());
process.on("SIGINT", () => sdk.shutdown());


