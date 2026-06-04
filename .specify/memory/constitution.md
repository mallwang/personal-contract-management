<!--
  SYNC IMPACT REPORT
  ==================
  Version change: (none) → 1.0.0 (initial ratification)

  Added sections:
    - Core Principles: I. Test-First, II. Type Safety, III. Simplicity (YAGNI)
    - Technical Standards (TypeScript / Node.js stack)
    - Development Workflow
    - Governance

  Removed sections: N/A (initial version)

  Templates checked:
    ✅ .specify/templates/plan-template.md
         Constitution Check section is generic ("Gates determined based on constitution file") — compatible.
         No update required.
    ✅ .specify/templates/spec-template.md
         Requirements and acceptance-scenario structure aligns with type safety and TDD principles.
         No update required.
    ✅ .specify/templates/tasks-template.md
         Already includes TDD guidance ("Write tests FIRST, ensure they FAIL before implementation").
         Aligns with Principle I. No update required.
    ✅ .specify/templates/checklist-template.md
         Generic — no constitution-specific references. No update required.

  Follow-up TODOs: None — all placeholders resolved.
-->

# Personal Contract Management Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

TDD is mandatory for all production code. Tests MUST be written and reviewed before any
implementation code is committed.

- Write a failing test that specifies the desired behavior.
- Confirm the test fails for the right reason before writing implementation code.
- Implement only enough code to make the test pass.
- Refactor while keeping all tests green (Red-Green-Refactor cycle strictly enforced).
- No pull request may be merged containing implementation code without corresponding tests.

**Rationale**: Untested code accrues hidden debt and breaks trust in the codebase. Writing
tests first forces clear thinking about requirements and keeps implementation scope honest.

### II. Type Safety (NON-NEGOTIABLE)

All TypeScript code MUST be fully typed. Implicit `any`, untyped parameters, and untyped
return values are forbidden.

- `tsconfig.json` MUST enable `strict: true` across all packages (backend and frontend).
- All API request/response contracts MUST be expressed as TypeScript types or interfaces.
- Types shared between backend and frontend MUST live in a shared package, not duplicated.
- Prefer `unknown` over `any` when a type cannot be statically determined.
- `@ts-ignore` and `@ts-expect-error` suppressions MUST include a justification comment and
  MUST be reviewed before merge.

**Rationale**: Personal contract data is sensitive and structured. Strong types catch
contract violations at compile time rather than at runtime in production.

### III. Simplicity (YAGNI)

No code is written for hypothetical future requirements. Every abstraction must earn its place.

- Every helper, utility, or abstraction MUST solve a problem that demonstrably exists today.
- Three similar lines of code is preferable to a premature abstraction.
- Complexity introduced beyond the minimum required MUST be justified in the plan or PR
  description; justifications are reviewed as part of the Constitution Check.
- Default to the simplest implementation that passes the acceptance tests.

**Rationale**: Personal-use tools rarely need the scale or extensibility their authors imagine.
Keeping the codebase simple makes it easier to maintain, test, and change direction later.

## Technical Standards

The canonical stack for this project is:

- **Runtime**: Node.js (LTS) with TypeScript in `strict` mode, ESM modules.
- **Backend framework**: Fastify with TypeScript.
- **Frontend framework**: React with TypeScript (Vite).
- **Testing**: Vitest for unit and integration tests; Playwright for end-to-end tests.
- **Linting / Formatting**: ESLint + Prettier, enforced in CI — no merge with lint failures.
- **Package manager**: pnpm with workspaces for monorepo layout.

Any deviation from this stack MUST be justified in the relevant feature's `plan.md` and
approved before implementation begins.

## Development Workflow

1. **Specification first**: Every feature MUST have an approved `spec.md` before planning.
2. **Plan before code**: Every feature MUST have an approved `plan.md` before any code is written.
3. **Tests before implementation**: Per Principle I, failing tests MUST exist before implementation.
4. **Independent stories**: Each user story MUST be independently testable and releasable.
5. **CI gate**: Linting, type-checking (`tsc --noEmit`), and all tests MUST pass before merging.
6. **Constitution Check**: Every `plan.md` MUST include a Constitution Check section confirming
   compliance with Principles I–III before the plan is approved.

## Governance

This constitution supersedes all other development practices and conventions for this project.

- Amendments require a documented rationale and a version bump per the policy below.
- All PRs and reviews MUST verify compliance with Principles I–III.
- Violations of any NON-NEGOTIABLE principle MUST be explicitly justified in the plan's
  Complexity Tracking section and approved before implementation proceeds.

**Versioning policy**:

- **MAJOR**: Removal or fundamental redefinition of a core principle.
- **MINOR**: Addition of a new principle or materially expanded guidance.
- **PATCH**: Clarifications, wording refinements, typo fixes.

**Version**: 1.0.1 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
