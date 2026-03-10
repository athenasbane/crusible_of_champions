# Crusible of Champions

Crusible of Champions (Yeah I'm aware that's misspelled I will probably never change it) is a React + TypeScript app for building custom 40k-style champion profiles from faction data.  
You select a faction, archetype, specialisms, abilities, and weapons, and the app validates choices before generating a printable/viewable character sheet.

## What This Project Does

- Loads faction rules from JSON files in `src/rules/`
- Normalizes and validates those rules with Zod schemas
- Applies choice/effect logic in the engine layer
- Renders a guided builder UI (`src/builder/`)
- Renders a character sheet output (`src/sheet/`)

## Tech Stack

- React 19
- TypeScript
- Vite
- Zod
- Vitest + Testing Library
- ESLint

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

## Project Structure

- `src/builder/`: Builder UI and state management hooks
- `src/engine/`: Rule evaluation, requirement checks, sheet assembly
- `src/rules/`: Faction JSON data and loader/inheritance logic
- `src/sheet/`: Character sheet rendering
- `tests/`: Unit and hook tests

## Working With Faction JSON

Most contribution issues come from invalid JSON shape. Use `src/engine/schema.ts` as source of truth.

For each faction:

- `specialisms` must be either a `ChoiceGroup` with `id`, `title`, `pick`, `options`
- `specialisms` can also be a split object with `partA` and `partB` (each a full `ChoiceGroup`)
- `abilities` must be a `ChoiceGroup` with `id`, `title`, `pick`, `options`
- `archetypeIs` requirements should use `archetypeId` (loader can normalize legacy `value`, but use `archetypeId` in new data)

If a faction extends `adeptus_astartes`, inheritance can fill missing fields in some cases, but standalone factions must define complete groups explicitly.

## Reporting Issues

When opening an issue, include enough information to reproduce quickly.

Recommended issue format:

1. Summary: one sentence describing the bug or request
2. Environment: OS, Node version, browser
3. Steps to reproduce: exact sequence
4. Expected result
5. Actual result
6. Evidence (console/log output, screenshot/GIF for UI bugs, relevant faction ID/JSON snippet)
7. Scope estimate (is it one faction, many factions, or all builders?)

Useful labels:

- `bug`
- `rules-data`
- `ui`
- `engine`
- `tests`
- `good-first-issue`

## Contributing

### Workflow

1. Create a branch from `main`
2. Make focused changes (one concern per PR when possible)
3. Run `npm run test`, `npm run lint`, and `npm run build`
4. Open a PR with a clear problem statement, short implementation summary, before/after screenshots for UI changes, and schema/data compatibility notes if touching `src/rules/`

### Contribution Guidelines

- Keep JSON changes minimal and explicit
- Prefer adding or updating tests when changing engine behavior
- Do not silently change rule semantics without documenting why
- Keep PRs reviewable (small and scoped beats large and mixed)
- If changing schema expectations, update `src/engine/schema.ts`, loader normalization (if needed), affected faction files, and tests

## Advice for Good Contributions

- Start with a failing test for engine logic changes
- Validate faction JSON against the schema before broad edits
- For UI changes, test both desktop and mobile
- If you add a new faction or major data set, verify choice limits (`pick`, loadout caps/mins), requirement predicates (`hasChoice`, `keywordHas`, `archetypeIs`), and sheet output (abilities, weapons, keywords, points)

## License

No license is currently declared in this repository.
