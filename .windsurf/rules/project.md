---
trigger: always_on
---

- **Project Structure**:
  - The `app` directory contains the Next.js frontend. All UI components, pages, and client-side logic reside here.
  - The `voltagent` directory contains the backend agentic logic. Each agent should be in its own file within `voltagent/agents`.
  - Shared configuration should be placed in the `voltagent/config` directory.
  - Reusable services used by agents should be in `voltagent/services`.

- **API and Environment**:
  - All external API keys and secrets (like `PK` and `SK`) must be loaded from environment variables and never hardcoded.
  - The frontend communicates with the backend via the VoltAgent server endpoint.