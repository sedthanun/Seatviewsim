import { cameraDefaults } from "../camera";
import { screenDimensions, projection } from "./screen";
import { calibrationDefaults, normalizeCalibration, rowOrder } from "./calibration";
import { buildEnvironment, environmentDefaults } from "./environment";
import { architectureDefaults, buildArchitecture } from "./architecture";

// Floor, chairs and eyes share these centerlines; all non-screen distances are estimates.
export const seatAppearance = {
  rounded: true, cupHolders: true,
  back: { size: [0.65, 0.9, 0.18], offset: [0, 0.72, 0.26] },
  backInset: { size: [0.53, 0.7, 0.025], offset: [0, 0.7, 0.355] },
  upholstery: { size: [0.59, 0.82, 0.04], offset: [0, 0.72, 0.15] },
  headrest: { size: [0.64, 0.12, 0.2], offset: [0, 1.1, 0.26] },
  cushion: { size: [0.62, 0.18, 0.65], offset: [0, 0.48, 0] },
  arm: { size: [0.09, 0.15, 0.7], offset: [0.35, 0.65, 0] },
  base: { size: [0.4, 0.06, 0.4], offset: [0, 0.03, 0] },
  stem: { size: [0.12, 0.36, 0.12], offset: [0, 0.24, 0] },
};
export const curvedZ = (z, x, curvature) => z + curvature * x * x;
export function buildParagonConfig(input = calibrationDefaults, architectureSettings = architectureDefaults) {
  const c = normalizeCalibration(input);
  let z = c.frontDistance;
  const rows = rowOrder.map((rowId, i) => {
    if (i > 0) z += rowId === "VP" ? c.vpDistance : c.rowPitch + (rowId === "E" ? c.crossAisle : 0);
    const gradient = c.mode === "rise" ? c.rise / c.rowPitch : Math.tan(c.slope * Math.PI / 180);
    const elevation = c.mode === "custom" ? c.customElevations[i] : c.frontElevation + (z - c.frontDistance) * gradient;
    return { rowId, z, elevation, first: rowId === "K" ? 2 : rowId === "L" ? 4 : 1,
      last: rowId === "VP" ? 22 : 34,
      category: rowId === "VP" ? "opera" : "ABCDE".includes(rowId) ? "honeymoon" : "normal",
      front: z - 0.5, back: z + (rowId === "VP" ? 0.95 : c.rowPitch - 0.5) };
  });
  const seats = rows.flatMap((row) => Array.from({ length: row.last - row.first + 1 }, (_, i) => {
    const number = row.first + i;
    const slot = number - 17.5;
    const x = row.rowId === "VP" ? (Math.floor((number - 1) / 2) - 5) * 2.35 + (number % 2 ? -0.39 : 0.39) : slot * 0.78 + (slot < 0 ? -0.68 : 0.68);
    const seatZ = curvedZ(row.z, x, c.curvature);
    // Chair fronts face local -Z (backs sit at +Z); the screen is at world Z=0.
    // Keep all chairs perpendicular to the screen, independent of the row curve.
    return { id: `${row.rowId}-${number}`, rowId: row.rowId, number: String(number), category: row.category,
      position: [x, row.elevation, seatZ], orientation: 0, eyeOffset: [0, c.eyeHeight, 0] };
  }));
  const architecture = buildArchitecture(seats, seatAppearance, architectureSettings);
  const edge = architecture.platformEdge, halfCenter = architecture.centralAisle / 2;
  const bands = [[-edge, -halfCenter], [halfCenter, edge]];
  const aisles = [{ x: 0, width: architecture.centralAisle }, ...[-1, 1].map((side) => ({
    x: side * (edge + architecture.sideAisleWidth / 2), width: architecture.sideAisleWidth,
  }))];
  // The rear paired VP row bridges the central aisle; its center pair is not split.
  const platforms = rows.flatMap((row) => (row.rowId === "VP" ? [[-edge, edge]] : bands).map(([left, right]) => ({ ...row, left, right })));
  const stairs = [], landings = [];
  rows.slice(0, -1).forEach((row, i) => {
    const next = rows[i + 1], run = next.front - row.front;
    const stairRun = Math.min(c.rowPitch, run), start = next.front - stairRun;
    if (next.front > row.back + 0.001) bands.forEach(([left, right]) => landings.push({
      left, right, front: row.back, back: next.front, elevation: row.elevation, rowId: `${row.rowId}-${next.rowId}`,
    }));
    const count = Math.ceil((next.elevation - row.elevation) / 0.18);
    for (const aisle of aisles) {
      if (start > row.front) landings.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2,
        front: row.front, back: start, elevation: row.elevation, rowId: row.rowId });
      for (let k = 0; k < count; k++) stairs.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2,
        front: start + stairRun * k / count, back: start + stairRun * (k + 1) / count,
        elevation: row.elevation + (next.elevation - row.elevation) * (k + 1) / count,
        stepRise: (next.elevation - row.elevation) / count, transition: `${row.rowId}-${next.rowId}` });
    }
  });
  for (const aisle of aisles.filter((aisle) => aisle.x !== 0)) landings.push({ left: aisle.x - aisle.width / 2, right: aisle.x + aisle.width / 2,
    front: rows.at(-1).front, back: rows.at(-1).back, elevation: rows.at(-1).elevation, rowId: "VP" });
  const screen = { ...screenDimensions, position: [0, c.screenBottom + screenDimensions.height / 2, 0], rotation: [0, 0, 0] };
  const rearSurface = Math.max(...[...platforms, ...landings, ...stairs].map((surface) =>
    surface.back + c.curvature * Math.max(surface.left ** 2, surface.right ** 2)));
  const depth = Math.max(29, rearSurface + architecture.rearClearance);
  const geometry = { width: architecture.width, architecture, depth, height: Math.max(23, screen.position[1] + screen.height / 2 + 2, rows.at(-1).elevation + 3),
    seatColor: "#a4303d", rows, aisles, platforms, stairs, landings, curvature: c.curvature, seatAppearance,
    seatColors: { normal: "#dc294c", honeymoon: "#ce9959", opera: "#bb8a50" },
    railX: [-edge + architecture.railRadius, edge - architecture.railRadius] };
  const environment = buildEnvironment(geometry);
  geometry.landings.unshift(environment.landing);
  geometry.materials = environmentDefaults.materials;
  return { id: "imax", name: "Paragon Cineplex · IMAX Laser — Prototype", referenceStatus: "prototype",
    screen, projection: { ...projection, offset: [...projection.offset] }, geometry, seats, environment, calibration: c, camera: { ...cameraDefaults, eyeHeight: c.eyeHeight, target: [...screen.position] } };
}
export const defaultParagon = buildParagonConfig();
