---
trigger: always_on
globs: voltagent/**/*.ts, app/**/*.tsx, app/**/*.ts
---

- **TypeScript Best Practices**:
  - Ensure all functions and methods have explicit return types.
  - Use interfaces or types for complex object shapes.
  - Avoid using `any` unless absolutely necessary. Prefer `unknown` for type-safe operations.
  - Enable and adhere to strict mode (`"strict": true`) in `tsconfig.json`.
  - Always use unread imports & variables, values. Never remove them unless you are absolutely sure it is unnescessary, because removing 1 critical function, type, ect can break everything.
  - Use Professional TSDoc in each file
  - Never guess or assume anything.
      - Always make sure whatever your working is consistent with similar files & always check valid info.
  - Use all your mcp tools for example 'vibe_check' is an amazing tool, to help you not only helps you at that moment but if you also use 'vibe_distill' & 'vibe_learn' all together is very powerful
  - Also use Vibe-Tools, with instructions from '.windsurfrules', this is another extremely powerful tool you can use whenever especially Vibe-Tools web, repo & other commands.


- **React/Next.js Component Rules**:
  - Components should be functional and use Hooks.
  - Keep components small and focused on a single responsibility.
  - Use `memo` for components that render frequently with the same props.
  - All components in `app/components` should be client components (`'use client'`) unless they are purely presentational and have no interactivity.

- **Dependency Management**:
  - Regularly run `npm audit` or `yarn audit` to check for vulnerabilities.
  - Keep dependencies up-to-date, especially major frameworks like Next.js and VoltAgent.
  - Remove unused dependencies from `package.json`.