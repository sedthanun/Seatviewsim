# NEXT-02 Cinema JSON Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Paragon to Cinema Data v1 JSON as the sole branch/auditorium source while preserving runtime behavior and creating a repeatable path for adding branches.

**Architecture:** Keep the renderer's runtime contract and add a pure builder from validated Cinema v1 inputs. A static registry supplies lazy JSON imports; the loader validates branch identity and readiness before EntryFlow passes runtime config onward.

**Tech Stack:** React 19, Vite 6, JavaScript ES modules, Ajv 8, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-23-next-02-cinema-json-migration-design.md`

## Global Constraints

- One JSON file per branch and one auditorium object per file.
- Keep Calibration trial v1 distinct and preserve its import/export and DEV-only exclusion.
- Runtime IDs, positions, camera, floor, screen, projection/UV, environment, and EXIT match the frozen Paragon baseline within `1e-6`.
- Preserve the 421 reported / 426 configured discrepancy, URL behavior, stable IDs, and no-fallback guard.
- Do not implement NEXT-03/04/05 or DATA-01.

## Review Focus

- Missing or invalid branch JSON: loader error, no simulator/video and no Paragon fallback (Task 3).
- Valid `coming-soon` or valid but non-simulatable data: blocked from runtime (Task 3).
- Unequal row widths, null slots, pairs, overrides: builder preserves positions and identities (Task 2).
- Calibration trial JSON is not mistaken for Cinema v1; edits affect preview only (Task 4).
- Direct URL, browser Back and branch changes preserve current routing semantics (Task 5).

---

## File Map

- `src/config/buildCinemaRuntime.js`: Cinema v1 to renderer runtime adapter.
- `src/config/resolveCinemaSeating.js`: source seat expansion, retained as a builder primitive.
- `src/data/cinemaRegistry.js`: lazy loaders keyed by branch ID.
- `src/config/loadCinema.js`: load, validate, readiness checks, and typed failures.
- `src/data/branches.js`: directory metadata only; no auditorium/runtime configuration.
- `src/pages/EntryFlow.jsx`: selected branch asynchronous lifecycle and guards.
- `src/dev/Calibration.jsx`: load the Paragon JSON through the same builder; retain trial format.
- `src/config/paragon/*.js`: convert venue-specific constants into reusable recipe logic or retire duplicated inputs.
- `tests/cinemaRuntime.test.js`, `tests/cinemaLoader.test.js`, existing cinema/browser tests: adapter parity, failures, and integration.
- `docs/CINEMA-DATA-V1.md`, `README.md`, `docs/DEVELOPMENT-LOG.md`: update status and usage after migration.

### Task 1: Build Runtime Adapter

**Files:**
- Create: `src/config/buildCinemaRuntime.js`
- Modify: `src/config/resolveCinemaSeating.js` only if a shared primitive needs a narrow extension
- Test: `tests/cinemaRuntime.test.js`
- Reference: `src/config/paragon/layout.js`, `src/config/paragon/geometry.js`, `src/config/paragon/architecture.js`, `src/config/paragon/environment.js`, `src/config/paragon/screen.js`

**Interfaces:**
- Consumes: a structurally valid Cinema v1 document.
- Produces: `buildCinemaRuntime(cinema, calibrationOverrides?) -> { branch, auditorium }`, where `auditorium.config` matches the existing `Experience` runtime config and video source comes from `auditorium.media.defaultVideoId`.

- [ ] Write failing tests for Paragon runtime parity: all runtime keys/values, seat IDs/categories/pairs, eyes, screen/projection, camera, rows/platforms/stairs, environment/EXIT; numeric tolerance `1e-6`.
- [ ] Run `npm test -- tests/cinemaRuntime.test.js`; confirm the new tests fail because the builder is absent.
- [ ] Implement the adapter with recipe functions parameterized by JSON values; derived positions remain out of JSON.
- [ ] Add a non-Paragon fixture assertion for unequal rows, null slots and explicit seat override.
- [ ] Run `npm test -- tests/cinemaRuntime.test.js`; confirm parity and fixture tests pass.
- [ ] Commit the adapter and tests.

### Task 2: Define Lazy Registry and Loader

**Files:**
- Create: `src/data/cinemaRegistry.js`
- Create: `src/config/loadCinema.js`
- Test: `tests/cinemaLoader.test.js`
- Modify: `src/data/branches.js` to export directory metadata independent of runtime auditorium data

**Interfaces:**
- Consumes: `buildCinemaRuntime` from Task 1 and existing `validateCinema(data, { expectedBranchId })`.
- Produces: `loadCinema(branchId) -> Promise<{ branch, auditorium }>`; rejects with a typed error carrying `kind` (`not-found`, `load`, `invalid`, `unavailable`) and validation diagnostics when relevant.

- [ ] Write tests for successful Paragon load; unknown ID; import rejection; mismatched `branchId`; schema-invalid JSON; `coming-soon`; valid but non-simulatable data.
- [ ] Run `npm test -- tests/cinemaLoader.test.js`; confirm missing loader and registry cause failures.
- [ ] Implement a static registry with `paragon: () => import("./cinemas/paragon.json")`; do not use runtime network fetch or broad glob imports.
- [ ] Validate identity and structure before building; only `available` with valid sim-ready auditorium returns runtime.
- [ ] Run `npm test -- tests/cinemaLoader.test.js`; confirm typed outcomes and lazy import behavior pass.
- [ ] Commit loader, registry, metadata split and tests.

### Task 3: Integrate EntryFlow Loading and Guards

**Files:**
- Modify: `src/pages/EntryFlow.jsx`
- Modify: `src/pages/Home.jsx` only for loading/error presentation contract
- Test: existing `tests/browser/loading.spec.js`, `tests/browser/homeSelection.spec.js`, `tests/browser/flows.spec.js`; add focused tests if existing cases cannot assert no fallback.

**Interfaces:**
- Consumes: `loadCinema(branchId)` from Task 2.
- Produces: selected runtime auditorium state for EntryFlow; Home receives explicit loading/error notice and remains the return destination.

- [ ] Add/adjust tests proving branch selection loads only that branch and a broken/missing/non-ready branch never starts Experience or video.
- [ ] Add/adjust direct-route tests proving old seat URLs still resolve and invalid branch IDs do not substitute Paragon.
- [ ] Run the targeted browser specs and confirm expected failures before integration.
- [ ] Implement async loading with stale-request protection when branch/location changes; preserve Back and return-focus behavior.
- [ ] Run targeted browser specs; confirm success and no console/unhandled promise errors.
- [ ] Commit EntryFlow integration.

### Task 4: Migrate Calibration and Retire Duplicate Constants

**Files:**
- Modify: `src/dev/Calibration.jsx`
- Modify or retire: `src/config/paragon/layout.js`, `geometry.js`, `architecture.js`, `environment.js`, `screen.js`, `seating.js`
- Modify: `tests/cinemaData.test.js`, `tests/calibration*` as applicable

**Interfaces:**
- Consumes: `buildCinemaRuntime` from Task 1 and Paragon source JSON.
- Produces: Calibration default config built from source JSON; trial v1 continues to override preview inputs and serialize/parse with the current contract.

- [ ] Add tests that default Calibration config matches the source builder and a trial v1 import changes preview config only.
- [ ] Run targeted calibration tests; confirm failures before wiring the new source.
- [ ] Build Calibration defaults from Paragon JSON and apply trial inputs through supported source overrides.
- [ ] Remove only constants duplicated by JSON; keep generic reusable recipe code and any presentation-only text/assets.
- [ ] Verify production exclusion with `npm run test:production` and run calibration browser specs.
- [ ] Commit Calibration migration and duplicate-source cleanup.

### Task 5: Full Compatibility Checks and Documentation

**Files:**
- Modify: `docs/CINEMA-DATA-V1.md`
- Modify: `README.md`
- Modify: `docs/DEVELOPMENT-LOG.md` and regenerate `docs/DEVELOPMENT-LOG.html` using its documented script
- Tests: full unit, build, production and relevant browser suite

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: documented NEXT-02 implementation state and verified migration.

- [ ] Run `npm test`; expected all unit tests pass, including frozen baseline parity.
- [ ] Run `npm run build`; expected production build succeeds.
- [ ] Run `npm run test:production`; expected DEV/calibration code remains excluded.
- [ ] Run `npm run test:browser -- --grep "home|loading|flow|calibration"`; expected existing URL, selection, Back, error and Calibration behaviors pass.
- [ ] Search for remaining production imports of `src/config/paragon` and Paragon seat/geometry constants; remove any source duplication or document legitimate recipe-only modules.
- [ ] Update docs/log with NEXT-02 completion, validation evidence, limitations, and next priority; regenerate HTML from Markdown.
- [ ] Run `git diff --check` and review all changes against the spec; do not regenerate baseline.
- [ ] Commit docs and final migration checks.
