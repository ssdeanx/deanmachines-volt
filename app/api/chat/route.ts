import { supervisorAgent, subAgents } from "@/voltagent/agents";
import { mergeIntoDataStream } from "@voltagent/vercel-ui";
import { createDataStreamResponse } from "ai";

export async function POST(req: Request) {
  try {
    const { messages, agentName: requestedAgentName } = await req.json();

    const lastMessage = messages[messages.length - 1];

    const agentToUseName = requestedAgentName || 'supervisor';

    let selectedAgentInstance;

    // Dynamically import and get the agent instance
    if (agentToUseName === 'supervisor') {
      selectedAgentInstance = supervisorAgent; // supervisorAgent is directly imported
    } else if (subAgents && typeof (subAgents as any)[agentToUseName] === 'function') {
      // If it's a sub-agent and it's a function that returns a promise, await it
      selectedAgentInstance = await (subAgents as any)[agentToUseName]();
    } else {
      throw new Error(`Agent '${agentToUseName}' not found or not correctly configured.`);
    }

    if (!selectedAgentInstance || typeof selectedAgentInstance.streamText !== 'function') {
        throw new Error(`Agent '${agentToUseName}' not found or does not support streaming text.`);
    }

    return createDataStreamResponse({
      async execute(dataStream) {
        try {
          const result = await selectedAgentInstance.streamText(lastMessage.content);
          mergeIntoDataStream(dataStream, result.fullStream!); // Fixed syntax: removed 'n'
        } catch (error) {
          console.error("Stream processing error:", error);
          dataStream.writeMessageAnnotation({
            type: "error",
            value: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      },
      onError: (error) =>
        `VoltAgent stream error: ${error instanceof Error ? error.message : String(error)}`,
    });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
