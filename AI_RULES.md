# AI Development Rules

This document outlines the technology stack and conventions for this project to ensure consistent and maintainable development by an AI assistant.

## Technology Stack

- **Framework**: React 18 with Vite.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS is used for all styling. The Play CDN is used, so all utility classes are available.
- **UI Components**: All components are custom-built and located in `src/components/`. There is no external component library.
- **Icons**: Icons are custom SVG components located in `src/components/Icons.tsx`.
- **State Management**: State is managed locally within components using React Hooks (`useState`, `useEffect`, `useCallback`).
- **Linting/Formatting**: While not explicitly configured, follow standard TypeScript and React best practices. Use consistent formatting (e.g., 4-space indentation).
- **Routing**: This is a single-page application with no routing library.

## Development Guidelines

- **Styling**:
  - **Always** use Tailwind CSS utility classes for styling.
  - Do not add custom CSS files or use inline `style` objects.
  - Use `dark:` variants for dark mode styling, which is enabled via the `class` strategy on the `<html>` element.

- **Components**:
  - Create new components in the `src/components/` directory.
  - Keep components small, focused, and reusable.
  - All components must be functional components using React Hooks.

- **Icons**:
  - When adding a new icon, create it as a React component and add it to `src/components/Icons.tsx`.
  - Ensure icons use `currentColor` for `stroke` or `fill` to be easily styled with text color utilities.

- **State Management**:
  - For now, continue using React's built-in hooks for state.
  - Do not introduce a global state management library (like Redux or Zustand) unless the application's complexity significantly increases and it becomes necessary.

- **Dependencies**:
  - Avoid adding new third-party libraries unless they provide significant value and cannot be easily replicated with the existing stack.