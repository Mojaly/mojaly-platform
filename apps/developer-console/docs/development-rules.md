# Development Rules

## Scope control

- Complete only the requested task.
- Do not begin the next phase automatically.
- Do not refactor unrelated code.
- Prefer small, reviewable changes.

## Dependencies

Never install, remove, or upgrade a dependency without approval.

Before proposing a dependency, explain:

1. Why it is needed.
2. Whether an installed dependency already solves the problem.
3. The exact installation command.
4. The compatibility and maintenance impact.

## File changes

Before editing:

1. Inspect the relevant files.
2. Explain the current implementation.
3. List the files to be modified.
4. State assumptions.

After editing:

1. List all changed files.
2. Explain what changed.
3. Run lint.
4. Run the production build when appropriate.
5. Report unresolved issues.

## TypeScript

- Do not use `any`.
- Use explicit domain types.
- Validate untrusted data.
- Keep financial values as strings or minor-unit representations.
- Do not calculate monetary values with floating-point numbers.

## API

- Do not place raw API calls inside UI components.
- Use the shared Ky client.
- Keep endpoint details in services or the Refine data provider.
- Use typed mocks when backend endpoints are unavailable.
- Do not silently invent API contracts.

## Git

- Do not commit.
- Do not push.
- Do not create branches.
- Do not open pull requests unless explicitly requested.