# Gemini Workspace: app

This document provides context and best practices for working within the `app` directory, which contains the Next.js frontend for the `voltagent` system.

## Core Architecture

The `app` directory is a standard Next.js application with the App Router. It is responsible for providing the user interface and interacting with the `voltagent` backend.

1.  **API Route (`app/api/chat/route.ts`):** This is the single entry point for all communication between the frontend and the `voltagent` system. It receives user messages, passes them to the `supervisorAgent`, and streams the response back to the client.

2.  **Pages (`app/**/*.page.tsx`):** Each page (e.g., `/calculator`, `/dev`, `/file`) corresponds to a specific agent interface. These pages are responsible for rendering the chat UI for their respective agent.

3.  **Chat Components (`app/components/*-chat.tsx`):** The core of the user interface is a set of specialized chat components (e.g., `calculator-chat.tsx`, `dev-chat.tsx`). Each of these components is tailored to a specific agent and handles the user input and message display for that agent's chat interface.

4.  **Shared Components (`app/components/navbar.tsx`):** The `navbar.tsx` component provides consistent navigation across all pages.

5.  **Layout (`app/layout.tsx`):** This is the root layout for the entire application. It sets up the main HTML structure and includes the `navbar`.

## Design Patterns & Best Practices

This section outlines the key design patterns used in the `app` and the best practices to follow during development.

### Core Design Patterns

-   **API Gateway Pattern:** The `app/api/chat/route.ts` file acts as a single API Gateway for the entire frontend. All requests to the AI backend are routed through this single endpoint, which simplifies security, logging, and request handling.
-   **Component-Based Architecture:** The UI is built using a standard React component model. This promotes reusability and a clear separation of concerns. The `app/components/` directory contains all the reusable UI components.
-   **Container/Presentational Pattern:** The page files (`app/**/*.page.tsx`) act as **Container Components**. They are responsible for fetching data and managing state. The chat components (`app/components/*-chat.tsx`) are **Presentational Components**. They are responsible for rendering the UI and passing user events up to the container.

### Best Practices

-   **One Page Per Agent:** Each specialized agent in the `voltagent` system should have its own corresponding page in the `app` directory. For example, if you create a new `emailAgent`, you should also create an `app/email/page.tsx`.
-   **Create Dedicated Chat Components:** For each new agent page, create a dedicated chat component in `app/components/`. For an `emailAgent`, this would be `email-chat.tsx`. This component will contain the logic for interacting with that specific agent via the API.
-   **Use the API Route for Communication:** All communication with the `voltagent` system must go through the `/api/chat` endpoint. Do not attempt to import or call the `voltagent` code directly from the frontend components.
-   **Keep Pages Simple:** The main page components (`*.page.tsx`) should be kept as simple as possible. Their primary responsibility is to render the correct chat component.
-   **Style with `globals.css`:** Use the existing `globals.css` file for any new global styles. For component-specific styles, consider using CSS Modules or a similar solution if the complexity warrants it.
-   **Update the Navbar:** When adding a new page, be sure to add a corresponding link to the `navbar.tsx` component to make it accessible to users.

## Common Anti-Patterns to Avoid

-   **Fat Pages:** Avoid putting all of your logic directly into the page components. Pages should be responsible for layout and data fetching, while the actual UI and interaction logic should be encapsulated in the `components`.
-   **Direct Backend Communication:** Never import or call the `voltagent` code directly from a frontend component. This creates a tight coupling between the frontend and backend and makes the system much harder to maintain. Always use the `/api/chat` route.
-   **State in Presentational Components:** Avoid storing complex state in your presentational components (`*-chat.tsx`). State should be managed by the container components (`*.page.tsx`) and passed down as props.
-   **Inconsistent UI:** When creating new pages and components, be sure to reuse the existing components in `app/components/` as much as possible to maintain a consistent look and feel.
