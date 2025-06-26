# Gemini Workspace: voltagent

This document provides context and best practices for working within the `voltagent` directory.

## Core Architecture

The `voltagent` module is a TypeScript-based multi-agent system designed for task automation. Its architecture consists of several key components:

1.  **Supervisor Agent (`supervisorAgent.ts`):** This is the primary orchestrator. It receives tasks, breaks them down, and delegates them to the appropriate specialized agent. All high-level logic and inter-agent communication flows through the supervisor.

2.  **Specialized Agents (`agents/*.ts`):** Each agent (`mathAgent`, `devAgent`, `fileAgent`, etc.) is an expert in a specific domain. They are designed to handle a narrow set of tasks delegated by the supervisor.

3.  **Tools (`tools/*.ts`):** Agents are equipped with tools to interact with the outside world or perform specific actions (e.g., `calculator.ts`). Tools are the fundamental building blocks of an agent's capabilities.

4.  **Services (`services/*.ts`):** These provide core, reusable functionalities that support the agents and tools. This includes:
    *   **Memory:** `memory.ts` (session memory), `supaMemory.ts` (persistent memory via Supabase), and `chroma.ts` (vector-based retrieval) provide a multi-layered memory system.
    *   **Data Retrieval:** `retriever.ts` is used for fetching information.
    *   **Configuration:** `config/googleProvider.ts` manages the connection to the underlying Google AI models.

5.  **Entry Point (`index.ts`):** This file initializes and wires together all the agents, tools, and services.

## Design Patterns & Best Practices

This section outlines the key design patterns used in `voltagent` and the best practices to follow during development.

### Core Design Patterns

-   **Supervisor-Worker Pattern:** The entire system is built on this pattern. The `supervisorAgent` acts as the central dispatcher, routing tasks to the appropriate specialized `Worker` agent (e.g., `mathAgent`, `devAgent`). This promotes a clear separation of concerns and makes the system highly extensible.
-   **Tool-Based Architecture:** Agents are given capabilities through `Tools`. This is a form of the **Strategy Pattern**, where each tool encapsulates a specific algorithm or action. This makes it easy to add new functionality without modifying the agent's core logic.
-   **Service Layer:** The `services` directory is an implementation of the **Service Locator Pattern**. It provides a centralized place to access shared resources like memory, databases, and external APIs.
-   **Multi-Layered Memory:** The memory system uses a **Chain of Responsibility Pattern**. When an agent needs to recall information, it can query the `memory` service, which will check the session memory,  and finally the vector store (`chroma`) if necessary.

### Best Practices

-   **Start with the Supervisor:** For any new task or workflow, the `supervisorAgent` is the first point of modification. The supervisor is responsible for understanding the task and delegating it correctly.
-   **Create Specialized Tools:** When adding a new capability, always implement it as a `Tool`. Tools should be small, single-purpose, and placed in the `voltagent/tools/` directory. This makes them reusable and easy to test.
-   **Create New Agents for New Domains:** If a new capability represents a completely new domain of expertise (e.g., interacting with a new third-party API), create a new specialized agent in the `voltagent/agents/` directory. Do not add unrelated responsibilities to existing agents.
-   **Use Services for Shared Logic:** If a piece of logic needs to be shared across multiple agents or tools (e.g., accessing a database, calling an external API), implement it as a `Service` in the `voltagent/services/` directory.
-   **Manage Memory Appropriately:** Be mindful of the different memory services available. Use `memory.ts` for short-term, conversational context. Use `supaMemory.ts` or `chroma.ts` for long-term knowledge that needs to be persisted and searched.
-   **Register New Components:** After creating a new agent, tool, or service, ensure it is correctly imported and registered in the main `voltagent/index.ts` file.

## Common Anti-Patterns to Avoid

-   **Monolithic Agents:** Do not add multiple, unrelated responsibilities to a single agent. If an agent is doing too much, it should be broken down into smaller, more specialized agents.
-   **Fat Tools:** Avoid creating tools that perform multiple, complex operations. A tool should do one thing and do it well. If a tool's logic is becoming too complex, consider splitting it into multiple tools or moving the complex logic into a dedicated `Service`.
-   **Bypassing the Supervisor:** Never have specialized agents communicate directly with each other. All inter-agent communication must be orchestrated by the `supervisorAgent`. This ensures a clear and predictable flow of information.
-   **Ignoring the Service Layer:** Do not instantiate service clients (like database connections or API clients) directly within an agent or tool. Always access these resources through the appropriate `Service` to ensure proper lifecycle management and reusability.
-   **Mixing Memory Types:** Avoid using the wrong type of memory for the task. Don't store long-term, searchable knowledge in the session memory. Conversely, don't clutter the persistent memory with transient, conversational data.
