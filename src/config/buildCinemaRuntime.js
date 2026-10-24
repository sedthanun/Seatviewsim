import { resolveCinemaSeating } from "./resolveCinemaSeating";
import { buildArchitecture } from "./paragon/architecture";
import { buildEnvironment } from "./paragon/environment";
import { cameraDefaults } from "./camera";
import { normalizeCalibration, calibrationDefaults } from "./paragon/calibration";
import { publicPath } from "../utils/publicPath";

const clone = value => value == null ? value : structuredClone(value);

function buildAisles(layout, architecture) {
  const edge = architecture.platformEdge;
  const half = architecture.centralAisle / 2;
  return layout.aisles.map(aisle => {
    if (aisle.kind === "central") return { x: 0, width: architecture.centralAisle };
    if (aisle.kind === "side") return { x: aisle.side * (edge + architecture.sideAisleWidth / 2), width: architecture.sideAisleWidth };
    return { x: aisle.x, width: aisle.width };
  }).filter(aisle => Number.isFinite(aisle.x) && Number.isFinite(aisle.width));
}

function bandsForRow(row, architecture) {
  const edge = architecture.platformEdge, half = architecture.centralAisle / 2;
  if (row.platforms === "split") return [[-edge, -half], [half, edge]];
  if (row.platforms === "full") return [[-edge, edge]];
  return row.platforms.map(({ left, right }) => [left, right]);
}

function buildGeometry(auditorium, seats, rows, appearance) {
  const { layout } = auditorium;
  const architecture = buildArchitecture(seats, appearance.parts, layout.architecture);
  const runtimeArchitecture = (({ sideClearance, wallThickness, platformMargin, centralAisle, rearClearance, railRadius, innerWallX, platformEdge, sideAisleWidth, rowClearances, width }) => ({ sideClearance, wallThickness, platformMargin, centralAisle, rearClearance, railRadius, innerWallX, platformEdge, sideAisleWidth, rowClearances, width }))(architecture);
  const aisles = buildAisles(layout, architecture);
  const platforms = rows.flatMap(row => bandsForRow(layout.rows.find(source => source.id === row.rowId), architecture)
    .map(([left, right]) => ({ ...row, left, right })));
  const stairs = [], landings = [];
  rows.slice(0, -1).forEach((row, index) => {
    const next = rows[index + 1], source = layout.rows[index], run = next.front - row.front;
    const stairRun = Math.min(source.stairRunToNext ?? run, run);
    const start = next.front - stairRun;
    const nextSource = layout.rows[index + 1];
    if (next.front > row.back + 0.001) bandsForRow(source, architecture).forEach(([left, right]) => landings.push({ left, right, front: row.back, back: next.front, elevation: row.elevation, rowId: `${row.rowId}-${next.rowId}` }));
    const count = Math.ceil((next.elevation - row.elevation) / layout.architecture.maxStepRise);
    if (count <= 0) return;
    for (const aisle of aisles) {
      if (start > row.front) landings.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2, front: row.front, back: start, elevation: row.elevation, rowId: row.rowId });
      for (let step = 0; step < count; step++) stairs.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2, front: start + stairRun * step / count, back: start + stairRun * (step + 1) / count, elevation: row.elevation + (next.elevation - row.elevation) * (step + 1) / count, stepRise: (next.elevation - row.elevation) / count, transition: `${row.rowId}-${next.rowId}` });
    }
    void nextSource;
  });
  const last = rows.at(-1);
  for (const aisle of aisles.filter(aisle => aisle.x !== 0)) landings.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2, front: last.front, back: last.back, elevation: last.elevation, rowId: last.rowId });
  const screen = clone(auditorium.screen);
  const curvature = layout.curvature;
  const rearSurface = Math.max(...[...platforms, ...landings, ...stairs].map(surface => surface.back + curvature * Math.max(surface.left ** 2, surface.right ** 2)));
  const depth = Math.max(layout.architecture.minDepth, rearSurface + layout.architecture.rearClearance);
  const height = Math.max(layout.architecture.minHeight, screen.position[1] + screen.height / 2 + layout.architecture.screenTopClearance, last.elevation + layout.architecture.rearHeadroom);
  const geometry = { width: architecture.width, architecture: runtimeArchitecture, depth, height, seatColor: appearance.baseColor, rows, aisles, platforms, stairs, landings, curvature, seatAppearance: { rounded: appearance.rounded, cupHolders: appearance.cupHolders, ...appearance.parts }, seatColors: Object.fromEntries(Object.entries(auditorium.seating.categories).map(([id, category]) => [id, category.color])), railX: [-architecture.platformEdge + architecture.railRadius, architecture.platformEdge - architecture.railRadius] };
  const { kind: _kind, exits: { sides: _sides, ...exitSettings }, ...environmentSettings } = auditorium.environment;
  environmentSettings.exits = exitSettings;
  const environment = buildEnvironment(geometry, environmentSettings);
  geometry.landings.unshift(environment.landing);
  geometry.materials = auditorium.environment.materials;
  return { geometry, environment };
}

export function buildCinemaRuntime(cinema, calibrationOverrides = null) {
  const auditorium = cinema.auditorium;
  const calibration = normalizeCalibration({ ...calibrationDefaults, ...(calibrationOverrides ?? {}) });
  const baseRows = auditorium.layout.rows;
  const source = { ...auditorium,
    camera: { ...auditorium.camera, eyeHeight: calibration.eyeHeight },
    screen: { ...auditorium.screen, position: [auditorium.screen.position[0], calibration.screenBottom + auditorium.screen.height / 2, auditorium.screen.position[2]] },
    layout: { ...auditorium.layout, curvature: calibration.curvature,
      elevation: calibration.mode === "custom" ? { mode: "custom", levels: calibration.customElevations } : calibration.mode === "rise" ? { mode: "rise", frontElevation: calibration.frontElevation, rise: calibration.rise, run: calibration.rowPitch } : { mode: "slope", frontElevation: calibration.frontElevation, degrees: calibration.slope },
      rows: baseRows.map((row, index) => ({ ...row,
        ...(index === 0 ? { distanceFromScreen: calibration.frontDistance } : { distanceFromPrevious: row.id === "VP" ? calibration.vpDistance : calibration.rowPitch + (row.id === "E" ? calibration.crossAisle : 0) }),
        ...(row.id === "VP" ? { backOffset: 0.95 } : { backOffset: calibration.rowPitch - 0.5 }),
        ...(index < baseRows.length - 1 ? { stairRunToNext: calibration.rowPitch } : {}),
      })) },
  };
  const expanded = resolveCinemaSeating(source);
  const rows = expanded.rows.map(row => {
    const seatingRow = source.seating.rows.find(value => value.rowId === row.rowId);
    const numbers = seatingRow.blocks.flatMap(block => block.numbers).filter(number => number !== null).map(Number);
    const categories = [...new Set(seatingRow.blocks.map(block => block.category))];
    return { ...row, first: Math.min(...numbers), last: Math.max(...numbers), category: categories.length === 1 ? categories[0] : null };
  });
  const seats = expanded.seats;
  const appearance = { ...source.appearance, parts: source.appearance.parts };
  const { geometry, environment } = buildGeometry(source, seats, rows, appearance);
  const media = clone(source.media);
  media?.clips.forEach(clip => {
    if (clip.src) clip.src = publicPath(clip.src);
  });
  const video = media?.clips.find(clip => clip.id === media.defaultVideoId);
  const config = { id: source.id, name: source.name, referenceStatus: source.referenceStatus, screen: clone(source.screen), projection: clone(source.projection), geometry, seats, environment, calibration, camera: { ...cameraDefaults, ...clone(source.camera), target: source.camera.target.kind === "screen-center" ? clone(source.screen.position) : clone(source.camera.target.position) } };
  return { branch: { id: cinema.branchId, nameTh: cinema.nameTh, name: cinema.name, brand: cinema.brand, location: cinema.location, status: cinema.status, referenceStatus: source.referenceStatus, features: clone(cinema.features), source: cinema.source, verifiedAt: cinema.verifiedAt }, auditorium: { id: source.id, name: source.name, config, media, videoSrc: video?.src ?? null } };
}
