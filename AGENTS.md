# Repository Guidelines

## Project Structure & Module Organization

Qwerty Learner is a React 18 + TypeScript Vite application. Code lives in `src/`: features are under `src/pages/`, reusable UI under `src/components/`, shared state in `src/store/`, and utilities in `src/utils/`. Static dictionaries, sounds, and browser assets belong in `public/`; imported images and SVGs belong in `src/assets/`. Playwright tests are in `tests/e2e/`. The desktop wrapper is isolated in `src-tauri/`, while deployment helpers live in `.github/` and `scripts/`. Do not commit generated `build/`, Playwright reports, or local environment files.

## Build, Test, and Development Commands

Use Yarn because `yarn.lock` is the tracked dependency lockfile.

- `yarn install` — install dependencies.
- `yarn dev` (or `yarn start`) — start Vite locally, normally at `http://localhost:5173`.
- `yarn build` — create the production bundle in `build/`.
- `yarn lint` — run ESLint over the repository.
- `yarn prettier` — format supported files and sort imports/Tailwind classes.
- `yarn test:e2e` — run all Playwright browser projects; use `yarn test:e2e --project=chromium` for a quicker focused run.

`yarn test` currently prints `No tests`; it is not a validation step. Playwright targets the deployed `baseURL` in `playwright.config.ts` by default, so confirm the intended test environment before running destructive or data-changing scenarios.

## Coding Style & Naming Conventions

Prettier is authoritative: two-space indentation, single quotes in TypeScript, no semicolons, trailing commas, and a 140-character print width. ESLint enforces React Hooks rules, sorted imports, and consistent type-only imports. Use PascalCase for React components and component folders (`ResultScreen/`), `useX` for hooks, camelCase for functions and atoms, and `*.module.css` for component-scoped styles. Prefer the `@/` alias for imports from `src/`.

## Testing Guidelines

Add user-facing regression coverage as `tests/e2e/<feature>.spec.ts`. Group scenarios with `test.describe`, keep tests independent, and prefer accessible locators such as `getByLabel` or `getByRole`. Run the affected browser project during development, then the full E2E suite for cross-browser-sensitive changes. There is no stated coverage threshold.

## Commit & Pull Request Guidelines

History uses short Chinese or English subjects, often with `feat:`, `fix:`, or `test:` prefixes. Keep each commit focused and write an imperative summary, for example `fix: preserve custom dictionary progress`. Discuss substantial work in an issue first, link that issue in the PR, and open a draft early when feedback would help. PRs should explain behavior changes, list validation performed, and include screenshots or recordings for visible UI changes. Update relevant documentation or dictionary metadata when behavior or bundled content changes.
