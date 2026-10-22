# IMAX Seat View Simulator

A Thai-language cinema selection menu and reusable R3F seat-POV simulator. The homepage uses a fixed WebP still captured from the Paragon model, a centered carousel of eleven branches, a searchable seat combobox and a seat-map dialog. Prompt and Google Sans remain the shared fonts. **Paragon is available as a clearly marked prototype based on the supplied seating screenshot and written row details.** The ten Coming Soon branches can be browsed and selected, but their seat controls and simulation remain disabled, including Major Rangsit. Missing venue thumbnails use explicit placeholders. The Paragon geometry and some seat positions are visual estimates, not surveyed measurements.

Development handoff: [Markdown log](docs/DEVELOPMENT-LOG.md) and [HTML log](docs/DEVELOPMENT-LOG.html). They record current behavior, evidence, architecture, performance, and the planned migration to **one JSON file per branch with one auditorium**, followed by IMAX Preshow/Countdown selection. These roadmap features are not implemented yet. Edit the Markdown source and regenerate HTML with `node scripts/build-development-log.mjs`.

**Progress: 71% of the tracked milestones are complete (12/17). Next-session priority: NEXT-02, migrate Paragon to Cinema JSON.** NEXT-01 now provides a draft-07 schema, Ajv 8 validator, an unconnected Paragon JSON example and a frozen pre-migration baseline. See the [Cinema Data v1 authoring guide](docs/CINEMA-DATA-V1.md). CoLa projection framing is implemented and verified in DL-020; ISSUE-PARAGON-001 was resolved and visually verified on 11 October 2026. The checklist tracks five remaining milestones; this percentage counts completed tasks equally, not effort or auditorium accuracy.

## Run locally

Requires Node 22. Modern npm (10.5+) is recommended by a transitive Drei dependency; installation and validation also ran with npm 8.19.1, which emits an engine warning.

```sh
npm install
npm run dev
```

Open the printed localhost URL. Public homepage: `/`. Isolated synthetic development previews: `/__dev/simulator/seats` for the seat map and `/__dev/entry/` for the text-entry flow. Both routes and their fixtures are removed from production by Vite's `import.meta.env.DEV` guard.

Seat selection supports up to six unique seats in selection order. The homepage combobox commits one code at a time into removable Google Sans chips; the seat-map dialog edits a draft of the same list. Confirming the dialog replaces the chips, while cancel/Escape preserves both chips and uncommitted input. The TH/EN pill remains a remembered UI preference without translations. Simulation keeps the dark HUD and framed seat code, now with a position counter and working previous/next navigation. The labelled video dropdown remains disabled in production. `/__dev/simulation-ui` uses the real moving camera with three synthetic seats and a mockup video selector; its fixtures and route stay excluded from production.

```sh
npm test
npm run test:browser
npm run build
npm run test:production
npm run preview
```

Browser tests use locally installed Google Chrome and a software WebGL renderer. Tests start/reuse a localhost Vite server. Screenshots go to ignored `output/playwright/`. Software rendering verifies behavior, not real GPU performance.

## Architecture

- `src/data/branches.js`: directory metadata, source/asset provenance, availability gate. Paragon's explicit `prototype` configuration can render; other branches stay closed.
- `src/config/paragon/`: screen dimensions, CoLa projection configuration, calibration parameters and a shared row builder deriving curved platforms, stairs, seat coordinates and camera settings. `src/config/camera.js` contains configurable ergonomic defaults.
- `src/config/paragon/environment.js`: reference-inspired materials, tall cyan wall strips, rear sconces and front EXIT doors derived from the shared geometry. `architecture.js` calculates room bounds, side aisles and chair-to-wall clearance. These settings are separate from calibration JSON v1.
- `src/components/CinemaCarousel.jsx` and `src/data/cinemaPresentation.js`: snap-scrolling venue cards, availability labels and display assets kept separate from geometry. Click, touch swipe, arrows and Home/End are supported; no autoplay or wrapping.
- `src/components/SeatMap.jsx` and `SeatMapDialog.jsx`: project shared seat records into curved rows, preserving positions, aisle gaps and VP pairs. Pan/zoom, Thai labels, keyboard neighbors, modal focus trapping and draft/confirm/cancel selection are supported. Row labels stay visible while panning. Selection uses an ordered ID array capped at six seats; uncommitted search input remains separate from the selected chips.
- `src/components/SeatCombobox.jsx`: a controlled, keyboard-accessible seat input with prefix search, grouped VP/A–L options, selected-seat highlighting and a scrollable popup that fits the viewport. Focus restoration does not reopen the popup.
- `src/pages/EntryFlow.jsx`: public form/direct seat-URL routing and return-focus handling. Exit and browser Back restore the branch, seat code and originating combobox/map-button focus. `src/pages/Simulator.jsx`: development-only seat-map flow. `src/simulator/`: camera, meshes, video and a viewport-filling glass overlay UI. 3D code is lazy-loaded; neither WebGL nor video is started on the homepage.
- `src/dev/`: isolated synthetic test configurations and a Paragon calibration preview; these routes/tools are excluded from production.

## Configuration contract

Cinema Data v1 is defined in `src/data/schemas/cinema.schema.json`; `validateCinema(data, { expectedBranchId })` returns `{ valid, canSimulate, errors, warnings, configuredSeatCount }` without modifying input. The example `src/data/cinemas/paragon.json` uses row blocks, gap slots, pairs and optional seat overrides. It is not imported by the public registry yet. `tests/baselines/paragon-v1.json` preserves the current scene, all seat/eye positions and three projection/UV samples for NEXT-02. Tests never regenerate this baseline; intentional recapture uses `node scripts/capture-cinema-baseline.mjs` after reviewing the changes. Calibration trial v1 remains a separate document format.

The branch registry includes Thai display names and source links. Ten IMAX entries have a verification date of 2026-10-10; Major Rangsit is an additional user-requested placeholder with no confirmed auditorium formats and no verification date. The registry is static, not a runtime API call. IMAX format confirmation is separate from simulation readiness.

Seat input trims spaces and normalizes case, then resolves a unique configured seat code. Dropdown selection or Enter adds a chip and clears the query; duplicate selection keeps its original order. Enter Simulation commits a valid pending code before entry, rejecting invalid codes or a seventh seat without dropping existing chips. Legacy homepage `?seat=VP12` and Simulation `?seat=VP-12` links remain supported. Multi-seat links repeat stable `seats` IDs and use `seat` for the active ID, for example `?seat=VP-12&seats=VP-12&seats=A-2`. Duplicate IDs are removed in order; unknown IDs, more than six seats, or an active ID outside the list show Home without starting 3D. Seat navigation replaces the current history entry, so browser Back restores all chips and the originating control focus. Refresh preserves the active seat; entering again from Home starts at the first selected seat.

Each auditorium holds `id`, `name` and its configuration with `referenceStatus`, `screen`, optional `projection`, `geometry`, `camera`, and `seats`. An optional auditorium-level `videoSrc` selects its default media URL. Paragon points to `/media/Infinite%20Worlds.mp4`. Screen has meter dimensions and a position/rotation; projection defines a separate active frame as described below. Paragon geometry adds shared row centerlines, curved `platforms`, `landings`, `stairs`, aisle widths, rail positions and instanced seat-part sizes/colors. Each floor surface has left/right X bounds, front/back centerline Z bounds and an elevation; its Z edges follow the shared curvature. The older simple row-box contract is retained for synthetic fixtures.

Seats contain `id`, `rowId`, original `number` as a string, `category`, `position: [x,y,z]` at floor level, yaw `orientation` in radians, and optional `eyeOffset: [x,y,z]`. Omitting eyeOffset uses the configurable eye height. Positions are meters. Camera settings contain `eyeHeight`, vertical `fov`, yaw/pitch limits in degrees and screen `target: [x,y,z]`. Keep all estimates/provenance in reference-analysis.md alongside configuration.

## Paragon prototype and refinement

1. The working prototype follows the user's VP rear row, A–L order, K2 and L4 starts, central aisle, rear/front category blocks and paired VP seats. It renders the supplied video by default.
2. The written seat-code ranges yield 426 possible IDs, five above the user-reported 421. The prototype accepts the stated ranges provisionally; no unsupported five IDs were removed. Exact seat omissions, numbering direction, category boundaries and aisle geometry need review against a readable plan.
3. Default rake is 22.5°, horizontal pitch 1.15 m and front-row distance 10 m, using historical IMAX design guidance as a prototype baseline. These are not measured Paragon geometry or current-standard certification. Room bounds, curvature, screen mounting height, seat dimensions and aisle placement remain estimates. See `reference-analysis.md`.
4. When the missing details are reconciled and viewpoints checked against known-seat photos, update the configuration and change `referenceStatus` from `prototype` to `reviewed`.

Physical screen ratio, projector frame ratio and source video ratio are independent. Paragon uses the CoLa crop/fit policy below. Add a local video to `public/media/` and set the auditorium's `videoSrc` to its `/media/<filename>.mp4` URL; there is no runtime file picker. H.264/AAC MP4 is the baseline supported format. Playback starts automatically with sound muted; blocked autoplay presents the Thai Play prompt. The scene occupies `100dvh` inside the browser tab and never requests browser fullscreen. Thai playback controls fade after 3.5 seconds of inactivity; the enlarged seat code and return button remain visible. Exit or Escape pauses and unloads media and restores the seat-input focus.

The Paragon scene follows the supplied blue-lit auditorium photograph: rounded red front chairs, tan/gold rear chairs with dark back inserts, black acoustic foam sheets on the walls/ceiling with subtle seams and pores, charcoal carpet, six tall cyan strips and two rear amber sconces on each wall, and two fixed green EXIT signs above the front side-wall doors. The neutral black surfaces and separate translucent blue light wash are independent; there is no blue material or triangular tile pattern. VP retains 22 individual seats in 11 pairs with no tables. EXIT positions follow the L-row front landing when calibration changes. Successful video playback dims house lights and decorative emission to 20% over 1.2 seconds; pause/end/error restores brightness. EXIT and screen illumination remain on independently. Mobile retains the architecture but uses simpler rounded meshes and fewer sconce lights. Dimensions and lighting remain prototype estimates; see reference-analysis.md.

Room width is derived from every chair part, including both armrests, and the estimated minimum 3 m clearance to each inner side wall. Defaults produce a 34.09 m wall-center width, 16.945 m inner-wall half-span and 2.745 m side aisles extending from the platforms to the walls. K/L omissions and the narrower VP row have larger clearances. Side stairs/landings and front exits share these bounds; depth includes the full curved rear floor and 2 m rear margin. Architecture defaults are in `src/config/paragon/architecture.js`; the optional second argument of `buildParagonConfig(calibration, architectureSettings)` overrides them without changing calibration JSON.

Rendering batches the fixed floor and rails into shared meshes and merges chair parts before instancing. Chairs within 7 m of the fixed eye position retain rounded silhouettes and cup holders; distant chairs retain simpler rounded backs/headrests with the same dimensions, placement and upholstery colors. Static vertex shading and textured light halos replace expensive per-pixel material lighting. The auditorium does not rerender for playback-timeline or volume updates. Canvas pixel ratio adapts between 0.55 and 1 when frame rate is low; HTML controls remain sharp and the original video file/aspect ratio stays unchanged. WebGL requests the high-performance GPU where available, with no antialiasing, bloom or dynamic shadows.

## CoLa image projection

Paragon's user-reported IMAX Commercial Laser (CoLa) uses a 1.90:1 projection frame. The physical screen remains 26.3 × 19.8 m (approximately 1.328:1). `config.projection` carries `system`, `aspectRatio`, `width`, `offset` and `tallContentMode`; height is derived from width/aspectRatio. The 25 m frame is 13.1578947 m tall, leaving 0.65 m on each side and 3.3210526 m above/below when centered. Offsets are meters from screen center in local X/Y; out-of-screen bounds and invalid projection settings are rejected.

The actual 1546 × 1080 video is center-cropped vertically through texture UVs, retaining 813.6842105 source pixels in height. Sources at 1.90:1 use their full image; wider sources fit at full width with unused space above/below. The MP4 is unchanged and no image is stretched. Center placement and center cropping are simulation assumptions, not measured installation or verified theatrical framing. Baked-in bars and changing per-shot aspect ratios are not automatically detected. Configs without `projection` retain legacy contain fitting. Playback-timeline and volume updates do not recalculate the mesh/UV transform.

Calibration shows read-only frame dimensions/offsets and shares the public renderer. Calibration JSON remains geometry-only v1. Tests inspect `canvas[data-screen-projection]`, whose image size/position/UV are read from the committed mesh and texture, alongside visual screenshots.

## Developer calibration

Open `/__dev/paragon/calibration` with `npm run dev`. Switch between side, top and seated views, choose any configured seat, and adjust slope/rise/custom row elevations, pitch, eye height, front distance and screen mounting height. The selected mode is authoritative; other rake/rise values are derived. Invalid edits leave the last valid scene visible and disable export. The table shows centerline distances/elevations and each row's left/right chair-to-wall clearances, while stair rises/angles are reported separately. Top view includes cyan inner-wall guides and dashed gold clearance spans; the metrics show minimum clearance and side-aisle width.

Download `paragon-calibration-v1.json` to retain a trial, or import it to restore that trial. JSON has `version: 1`, `auditorium: "paragon-imax"` and `calibration` parameters. Import rejects unsupported versions, nonfinite/out-of-range values and non-increasing custom levels. These files never change public defaults automatically; defaults remain in `src/config/paragon/calibration.js`. Reload/reset restores defaults. The whole auditorium has not been migrated to JSON. Production requests to the development path fall back to the public homepage.

## Assets and deployment

Homepage art is captured from the paused, fully lit Paragon renderer at `/__dev/paragon/still`, with a fixed wide rear camera and no overlays. With the Vite dev server on port 5173, run `node scripts/capture-home-art.mjs` to regenerate desktop/mobile/thumbnail WebP files (local Chrome and Python with Pillow required). The mobile file is a portrait crop of the same scene. The capture route is excluded from production; homepage image failures retain usable controls over a dark fallback. Selecting a venue does not change the fixed Paragon background. Multi-seat chips and simulator viewpoint switching are implemented; Cinema JSON migration remains future work.

The committed demo and original SVG art work offline after installation. Regenerate art with `node scripts/create-art.mjs`; regenerate the demo using Python with Pillow and imageio-ffmpeg via `python scripts/create-demo.py`. They are project artwork, never reference evidence.

This delivery is local-only. Deploy `dist/` to a static host with SPA fallback to `index.html` if desired; no backend or accounts are needed. Registered videos are included in the site's static build. See ASSET-CREDITS.md and VALIDATION.md.

Changing seats animates camera position and quaternion for one second with ease-in-out interpolation, turning toward the screen. Rapid navigation retargets from the in-flight pose; canvas look input pauses during movement and view reset never snaps the camera position. Initial entry and reduced-motion changes position immediately. The same Canvas and video element remain mounted, preserving playback time, mute and volume. No collision/pathfinding is performed between seats. Development camera diagnostics expose the committed renderer pose for browser acceptance tests.

