---
trigger: glob
globs: voltagent/**/*.ts, app/**/*.tsx, app/**/*.ts
---

- **TypeScript Best Practices**:
  - Ensure all functions and methods have explicit return types.
  - Use interfaces or types for complex object shapes.
  - Avoid using `any` unless absolutely necessary. Prefer `unknown` for type-safe operations.
  - Enable and adhere to strict mode (`"strict": true`) in `tsconfig.json`.

- **React/Next.js Component Rules**:
  - Components should be functional and use Hooks.
  - Keep components small and focused on a single responsibility.
  - Use `memo` for components that render frequently with the same props.
  - All components in `app/components` should be client components (`'use client'`) unless they are purely presentational and have no interactivity.

- **Dependency Management**:
  - Regularly run `npm audit` or `yarn audit` to check for vulnerabilities.
  - Keep dependencies up-to-date, especially major frameworks like Next.js and VoltAgent.
  - Remove unused dependencies from `package.json`.