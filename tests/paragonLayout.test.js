import { describe, it, expect } from "vitest";
import { buildParagonConfig, seatAppearance, curvedZ } from "../src/config/paragon/layout";
import { calibrationDefaults, serializeCalibration, parseCalibration } from "../src/config/paragon/calibration";
import { eyePosition, validateConfig } from "../src/simulator/math";
import { architectureDefaults, buildArchitecture, seatFootprint, wallInteriorX } from "../src/config/paragon/architecture";

const build = (changes = {}) => buildParagonConfig({ ...calibrationDefaults, ...changes });
const slopeBetween = (a, b) => Math.atan((b.elevation - a.elevation) / (b.z - a.z)) * 180 / Math.PI;
describe("Paragon shared row model", () => {
  it("keeps every transition, including aisle gaps, at the configured rake", () => {
    for (const rowPitch of [0.95, 1.15, 1.6]) {
      const config = build({ rowPitch });
      expect(validateConfig(config)).toEqual([]);
      const rows = config.geometry.rows;
      expect(rows.map((r) => r.rowId).join(",")).toBe("L,K,J,I,H,G,F,E,D,C,B,A,VP");
      rows.slice(1).forEach((row, i) => expect(slopeBetween(rows[i], row)).toBeCloseTo(22.5, 8));
      expect(rows[1].elevation - rows[0].elevation).toBeCloseTo(rowPitch * Math.tan(Math.PI / 8));
      expect(rows[7].z - rows[6].z).toBeCloseTo(rowPitch + 1.2);
      expect(rows[12].z - rows[11].z).toBeCloseTo(2.8);
    }
  });
  it("supports rise and nonuniform custom elevations without competing sources", () => {
    const rise = build({ mode: "rise", rise: 0.4, slope: 10 });
    expect(rise.geometry.rows[1].elevation - rise.geometry.rows[0].elevation).toBeCloseTo(0.4);
    expect(rise.calibration.slope).toBeCloseTo(Math.atan(0.4 / 1.15) * 180 / Math.PI);
    const elevations = Array.from({ length: 13 }, (_, i) => 0.25 + i * 0.3 + i * i * 0.01);
    const custom = build({ mode: "custom", customElevations: elevations });
    expect(custom.geometry.rows.map((row) => row.elevation)).toEqual(elevations);
    expect(custom.calibration.slope).toBeCloseTo(slopeBetween(custom.geometry.rows[0], custom.geometry.rows.at(-1)));
  });
  it("puts all 426 chair bases on their curved platforms, without crossing a tier edge", () => {
    const config = build();
    const base = seatAppearance.base;
    for (const seat of config.seats) {
      expect(seat.position[1] + base.offset[1] - base.size[1] / 2).toBeCloseTo(seat.position[1]);
      const surface = config.geometry.platforms.find((p) => p.rowId === seat.rowId && seat.position[0] >= p.left && seat.position[0] <= p.right);
      expect(surface).toBeDefined();
      expect(surface.elevation).toBe(seat.position[1]);
      for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) {
        const a = seat.orientation;
        const x = seat.position[0] + dx * Math.cos(a) + dz * Math.sin(a);
        const z = seat.position[2] - dx * Math.sin(a) + dz * Math.cos(a);
        expect(x).toBeGreaterThan(surface.left); expect(x).toBeLessThan(surface.right);
        expect(z).toBeGreaterThan(curvedZ(surface.front, x, config.geometry.curvature));
        expect(z).toBeLessThan(curvedZ(surface.back, x, config.geometry.curvature));
      }
    }
    expect(config.seats).toHaveLength(426);
  });
  it("partitions platforms/landings/stairs without horizontal overlap and connects every level", () => {
    const config = build(), g = config.geometry;
    const surfaces = [...g.platforms, ...g.landings, ...g.stairs];
    for (let i = 0; i < surfaces.length; i++) for (let j = i + 1; j < surfaces.length; j++) {
      const a = surfaces[i], b = surfaces[j];
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const depth = Math.min(a.back, b.back) - Math.max(a.front, b.front);
      expect(width > 0.000001 && depth > 0.000001).toBe(false);
    }
    for (const step of g.stairs) expect(step.stepRise).toBeLessThanOrEqual(0.18);
    g.rows.slice(1).forEach((next, i) => {
      const transition = `${g.rows[i].rowId}-${next.rowId}`;
      for (const aisle of g.aisles) {
        const steps = g.stairs.filter((s) => s.transition === transition && Math.abs((s.left + s.right) / 2 - aisle.x) < 0.001);
        expect(steps.at(-1).elevation).toBeCloseTo(next.elevation);
        expect(steps.at(-1).back).toBeCloseTo(next.front);
      }
    });
  });
  it("updates front/middle/rear/side eyes, screen target and keeps FOV constant", () => {
    const original = build(), changed = build({ slope: 25, eyeHeight: 1.3, screenBottom: 1 });
    for (const id of ["L-18", "F-18", "VP-12", "A-2"]) {
      const a = original.seats.find((s) => s.id === id), b = changed.seats.find((s) => s.id === id);
      expect(eyePosition(b, changed.camera.eyeHeight)[1]).toBeCloseTo(b.position[1] + 1.3);
      expect(eyePosition(b)).not.toEqual(eyePosition(a));
    }
    expect(changed.camera.target).toEqual(changed.screen.position);
    expect(changed.screen.width).toBe(26.3); expect(changed.screen.height).toBe(19.8);
    expect(changed.screen.position[1]).toBe(10.9);
    expect(changed.camera.fov).toBe(65);
  });
  it("measures side clearance from the rendered arm edges and preserves the complete seat layout", () => {
    const config = build(), g = config.geometry;
    expect(g.width).toBeCloseTo(34.09, 8);
    expect(wallInteriorX(g)).toBeCloseTo(16.945, 8);
    expect(g.architecture.sideAisleWidth).toBeCloseTo(2.745, 8);
    for (const clearance of g.architecture.rowClearances) {
      expect(clearance.left).toBeGreaterThanOrEqual(3 - 1e-10);
      expect(clearance.right).toBeGreaterThanOrEqual(3 - 1e-10);
    }
    expect(g.architecture.rowClearances.find((row) => row.rowId === "L").left).toBeCloseTo(5.34);
    expect(g.architecture.rowClearances.find((row) => row.rowId === "VP").left).toBeCloseTo(4.41);
    for (const seat of config.seats) {
      const bounds = seatFootprint(seat, seatAppearance);
      expect(bounds.left).toBeCloseTo(seat.position[0] - 0.395);
      expect(bounds.right).toBeCloseTo(seat.position[0] + 0.395);
      const expectedX = seat.rowId === "VP"
        ? (Math.floor((Number(seat.number) - 1) / 2) - 5) * 2.35 + (Number(seat.number) % 2 ? -0.39 : 0.39)
        : (Number(seat.number) - 17.5) * 0.78 + (Number(seat.number) < 17.5 ? -0.68 : 0.68);
      expect(seat.position[0]).toBeCloseTo(expectedX);
      expect(seat.orientation).toBe(0);
    }
  });
  it("connects both side stairways to the inner walls, front landing and VP across calibration", () => {
    for (const changes of [{}, { curvature: 0.006, rowPitch: 1.6, mode: "rise", rise: 0.6 }]) {
      const config = build(changes), g = config.geometry, inner = wallInteriorX(g);
      const sides = g.aisles.filter((aisle) => aisle.x !== 0);
      for (const aisle of sides) {
        const sign = Math.sign(aisle.x);
        expect(Math.abs(aisle.x) + aisle.width / 2).toBeCloseTo(inner);
        expect(Math.abs(aisle.x) - aisle.width / 2).toBeCloseTo(g.architecture.platformEdge);
        expect(Math.abs(g.railX.find((x) => Math.sign(x) === sign)) + g.architecture.railRadius).toBeCloseTo(g.architecture.platformEdge);
        for (const row of g.rows.slice(0, -1)) {
          const next = g.rows[g.rows.indexOf(row) + 1];
          const surfaces = [...g.stairs, ...g.landings].filter((surface) =>
            Math.abs((surface.left + surface.right) / 2 - aisle.x) < 1e-8 &&
            surface.front >= row.front - 1e-8 && surface.back <= next.front + 1e-8);
          const intervals = surfaces.sort((a, b) => a.front - b.front);
          expect(intervals[0].front).toBeCloseTo(row.front);
          intervals.slice(1).forEach((surface, i) => expect(surface.front).toBeCloseTo(intervals[i].back));
          expect(intervals.at(-1).back).toBeCloseTo(next.front);
        }
        expect(g.landings.some((surface) => surface.rowId === "VP" && Math.abs((surface.left + surface.right) / 2 - aisle.x) < 1e-8)).toBe(true);
      }
      expect(config.environment.landing.left).toBeCloseTo(-inner);
      expect(config.environment.landing.right).toBeCloseTo(inner);
      for (const surface of [...g.platforms, ...g.landings, ...g.stairs]) {
        expect(surface.left).toBeGreaterThanOrEqual(-inner - 1e-8);
        expect(surface.right).toBeLessThanOrEqual(inner + 1e-8);
        expect(curvedZ(surface.back, Math.max(Math.abs(surface.left), Math.abs(surface.right)), g.curvature)).toBeLessThanOrEqual(g.depth - g.architecture.rearClearance + 1e-8);
      }
    }
  });
  it("derives room width from changed chair parts or architecture settings without changing calibration JSON", () => {
    const config = build();
    const widerAppearance = { ...seatAppearance, arm: { ...seatAppearance.arm, offset: [0.5, 0.65, 0] } };
    const wider = buildArchitecture(config.seats, widerAppearance);
    expect(wider.width).toBeCloseTo(config.geometry.width + 0.3);
    for (const sideClearance of [2, 4]) {
      const custom = buildParagonConfig(calibrationDefaults, { ...architectureDefaults, sideClearance, wallThickness: 0.4 });
      expect(custom.seats).toEqual(config.seats);
      expect(custom.calibration).toEqual(config.calibration);
      expect(Math.min(...custom.geometry.architecture.rowClearances.flatMap((row) => [row.left, row.right]))).toBeCloseTo(sideClearance);
      expect(custom.environment.landing.right).toBeCloseTo(wallInteriorX(custom.geometry));
    }
    expect(() => buildArchitecture(config.seats, seatAppearance, { sideClearance: -1 })).toThrow();
    expect(() => buildArchitecture(config.seats, seatAppearance, { wallThickness: NaN })).toThrow();
    expect(() => buildArchitecture(config.seats, seatAppearance, { sideClearance: 0.1 })).toThrow();
  });
});
describe("calibration file contract", () => {
  it("round trips all modes through versioned files and removes stale custom levels", () => {
    for (const mode of ["slope", "rise", "custom"]) {
      const input = { ...calibrationDefaults, mode, customElevations: Array.from({ length: 13 }, (_, i) => 0.25 + i * 0.5) };
      const config = buildParagonConfig(input);
      expect(buildParagonConfig(parseCalibration(serializeCalibration(input)))).toEqual(config);
      if (mode !== "custom") expect(config.calibration.customElevations).toBeNull();
    }
  });
  it("rejects unsupported files, invalid dimensions and reversed or missing row levels", () => {
    expect(() => parseCalibration('{"version":2,"auditorium":"paragon-imax"}')).toThrow();
    expect(() => parseCalibration('{"version":1,"auditorium":"other"}')).toThrow();
    expect(() => parseCalibration('{"version":1,"auditorium":"paragon-imax","calibration":null}')).toThrow();
    for (const bad of [{ rowPitch: 0 }, { eyeHeight: NaN }, { mode: "custom", customElevations: [1, 2] },
      { mode: "custom", customElevations: Array(13).fill(0.25) }]) expect(() => build(bad)).toThrow();
  });
});
