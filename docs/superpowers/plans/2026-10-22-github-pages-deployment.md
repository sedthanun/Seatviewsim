# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the Vite React application at `https://sedthanun.github.io/Seatviewsim/` from `main` through GitHub Actions.

**Architecture:** Make public-file URLs and React Router respect Vite's configured base URL while preserving `/` for local builds. A Pages workflow builds with `/Seatviewsim/`, adds an SPA fallback, uploads `dist`, and deploys it through GitHub's official Pages actions.

**Tech Stack:** React 19, React Router 7, Vite 6, Vitest 3, GitHub Actions, GitHub Pages

**Spec:** User request in this chat: publish the existing website on GitHub Pages.

## Global Constraints

- Preserve the current local development and production-test behavior at `/`.
- Deploy the repository project site beneath `/Seatviewsim/`.
- Push only after tests, type checking, the Pages build, and production checks pass.
- Keep the deployment automated on future pushes to `main`.

## Review Focus

- Generated HTML and bundled assets must use `/Seatviewsim/`, not the origin root.
- Runtime image and video URLs must include the Pages base path.
- React Router must strip `/Seatviewsim/` before matching application routes.
- Direct visits to nested application URLs must load the SPA fallback.
- Local builds and existing tests must continue to use `/`.

---

### Task 1: Base-aware runtime paths

**Files:**
- Create: `src/utils/publicPath.js`
- Create: `tests/publicPath.test.js`
- Modify: `src/main.jsx`
- Modify: `src/data/branches.js`
- Modify: `src/data/cinemaPresentation.js`
- Modify: `src/simulator/useVideo.js`
- Modify: `src/dev/Calibration.jsx`
- Modify: `vite.config.js`

**Interfaces:**
- Produces: `publicPath(path, base?) -> string`, resolving root-relative public assets beneath Vite's base URL.
- Consumes: `import.meta.env.BASE_URL` and optional `BASE_PATH` at build time.

- [ ] Write tests showing `/images/a.webp` becomes `/Seatviewsim/images/a.webp`, `/` stays well-formed, and remote URLs remain unchanged.
- [ ] Run `npm test -- tests/publicPath.test.js` and confirm the missing module fails.
- [ ] Implement `publicPath`, apply it to runtime public assets, configure `BrowserRouter` basename, and read `BASE_PATH` in Vite config.
- [ ] Run `npm test -- tests/publicPath.test.js` and the full `npm test` suite.
- [ ] Run `npm run typecheck`.

### Task 2: Automated Pages deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: `BASE_PATH=/Seatviewsim/`, npm lockfile, Vite `dist` output.
- Produces: a `github-pages` deployment and its environment URL.

- [ ] Add the official Pages workflow for pushes to `main` and manual dispatch.
- [ ] Build locally with `BASE_PATH=/Seatviewsim/` and copy `dist/index.html` to `dist/404.html`.
- [ ] Verify generated HTML, JS asset references, runtime public assets, and SPA fallback use the project path.
- [ ] Run `npm run test:production` against the normal `/` build to preserve the existing production contract.
- [ ] Commit the deployment changes, fast-forward `main`, push, and verify the Actions run and live URL.
