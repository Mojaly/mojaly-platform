# Mojaly Developer Console

This repository contains the frontend developer console for the Mojaly payment platform.

## Required reading

Before proposing or making changes, read:

- `docs/architecture.md`
- `docs/frontend-scope.md`
- `docs/api-contracts.md`
- `docs/design-system.md`
- `docs/development-rules.md`

## Working rules

1. Inspect relevant existing files before proposing changes.
2. Work on one small task or phase at a time.
3. Do not install, remove, or upgrade dependencies without approval.
4. Do not modify unrelated files.
5. Do not implement backend logic in the frontend.
6. Do not invent permanent API contracts.
7. Use typed mocks when backend endpoints are unavailable.
8. Run lint and build after meaningful changes.
9. Report all changed files and verification results.
10. Do not commit, push, or open pull requests without approval.

## Technology stack

- Next.js App Router
- React
- TypeScript
- Refine Core used headlessly
- Tailwind CSS
- shadcn/ui with Base UI
- Ory Kratos
- Ky
- React Hook Form
- Zod

## Architecture boundaries

- Next.js owns routes and layouts.
- Refine manages resources, data operations, authentication integration, access control, and notifications.
- Ory Kratos manages authentication and identity.
- The separate Mojaly backend owns business data and authorization enforcement.
- shadcn/ui and Tailwind own the visual interface.
- Do not use Refine's generic generated admin appearance.
- Do not add backend implementations or database code.

## Current workflow

Before editing:

1. Explain the current state.
2. Propose the smallest next step.
3. List the exact files that will change.
4. State assumptions and risks.

After editing:

1. Run the relevant checks.
2. Explain every changed file.
3. Report failures honestly.
4. Stop after completing the approved scope.