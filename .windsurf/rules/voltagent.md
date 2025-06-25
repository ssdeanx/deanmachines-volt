---
trigger: glob
globs: voltagent/**/*.ts
---

- **Agent Design**:
  - Each agent should have a clear, single purpose (e.g., `mathAgent` for calculations, `fileAgent` for file operations).
  - Agents should be stateless if possible. If state is needed, manage it explicitly.
  - Use the `supervisorAgent` to coordinate complex tasks between other agents.

- **Error Handling**:
  - All agent functions should have robust error handling.
  - Return meaningful error messages to the caller.

- **Tooling**:
  - When adding new tools to an agent, ensure they are well-documented and tested.
  - Prefer using existing services from `voltagent/services` before creating new ones.

- **Telemetry**:
  - Ensure telemetry is correctly configured for all agents to monitor performance and errors via the VoltAgent cloud service.