import { describe, it, expect } from "vitest";
import { buildParagonConfig } from "../src/config/paragon/layout";
import { buildEnvironment } from "../src/config/paragon/environment";
import { calibrationDefaults, serializeCalibration, parseCalibration } from "../src/config/paragon/calibration";
import { lightingTarget, transitionLighting } from "../src/simulator/lighting";
import { fixture } from "../src/dev/fixture";
import { Color } from "three";

describe("reference-inspired environment", () => {
  it("anchors both inward-facing exits on the front landing across calibration and room width changes", () => {
    for (const changes of [{}, { frontDistance: 13, frontElevation: 0.8, curvature: 0.005 }]) {
      const config = buildParagonConfig({ ...calibrationDefaults, ...changes });
      for (const width of [34, 38]) {
        const e = buildEnvironment({ ...config.geometry, width });
        expect(e.exits.map((exit) => exit.id)).toEqual(["left", "right"]);
        for (const exit of e.exits) {
          expect(exit.position[1]).toBe(e.landing.elevation);
          expect(exit.position[0]).toBeCloseTo(exit.side * (width / 2 - 0.18));
          expect(Math.sin(exit.rotation[1]) * exit.side).toBeCloseTo(-1);
          const centerZ = exit.position[2] - config.geometry.curvature * exit.position[0] ** 2;
          expect(centerZ).toBeCloseTo((e.landing.front + e.landing.back) / 2);
          expect(centerZ - exit.width / 2).toBeGreaterThan(e.landing.front);
          expect(centerZ + exit.width / 2).toBeLessThan(e.landing.back);
        }
        expect(e.landing.back).toBe(config.geometry.rows[0].front);
      }
    }
  });
  it("keeps 22 VP seats without side tables", () => {
    const config = buildParagonConfig();
    const vp = config.seats.filter((seat) => seat.rowId === "VP");
    expect(vp).toHaveLength(22);
    expect(config.environment.tables).toBeUndefined();
  });
  it("adds six configurable fixture sets on each wall without changing calibration JSON or synthetic fixtures", () => {
    const config = buildParagonConfig();
    expect(config.environment.fixtures.filter((fixture) => fixture.side === -1)).toHaveLength(6);
    expect(config.environment.fixtures.filter((fixture) => fixture.side === 1)).toHaveLength(6);
    expect(config.seats).toHaveLength(426);
    expect(config.screen.width).toBe(26.3); expect(config.screen.height).toBe(19.8);
    const json = serializeCalibration(config.calibration);
    expect(JSON.parse(json).version).toBe(1);
    expect(JSON.parse(json).calibration.environment).toBeUndefined();
    expect(buildParagonConfig(parseCalibration(json))).toEqual(config);
    expect(fixture.environment).toBeUndefined();
  });
  it("extends twelve cyan strips near the ceiling and limits warm sconces to the rear", () => {
    for (const changes of [{}, { mode: "custom", customElevations: Array.from({ length: 13 }, (_, i) => 0.25 + i * 0.8) }]) {
      const config = buildParagonConfig({ ...calibrationDefaults, ...changes });
      const e = config.environment, g = config.geometry;
      for (const strip of e.fixtures) {
        expect(strip.stripHeight).toBeGreaterThan(0);
        expect(strip.position[1] + e.strips.bottom + strip.stripHeight).toBeCloseTo(g.height - 0.6);
        expect(strip.position[1] + e.strips.bottom).toBeCloseTo(strip.floor + 0.35);
        expect(strip.position[2]).toBeLessThan(g.depth);
        expect(strip.sconce).toBe(strip.index >= 4);
      }
      for (const side of [-1, 1]) expect(e.fixtures.filter((fixture) => fixture.side === side && fixture.sconce)).toHaveLength(2);
      expect(e.panels).toBeUndefined();
      expect(e.tables).toBeUndefined();
      for (const key of ["wall", "ceiling"]) {
        const color = new Color(e.materials[key]);
        expect(color.r).toBeCloseTo(color.g);
        expect(color.g).toBeCloseTo(color.b);
        expect(color.r).toBeLessThan(0.02);
      }
      const wash = new Color(e.wash.wallColor);
      expect(wash.b).toBeGreaterThan(wash.r);
    }
  });
});
describe("house-light transitions", () => {
  const initial = { value: 1, start: 1, target: 1, elapsed: 1.2 };
  it("dims smoothly to 20 percent within 1.2 seconds and restores when paused", () => {
    const halfway = transitionLighting(initial, 0.2, 0.6);
    expect(halfway.value).toBeCloseTo(0.6);
    const dim = transitionLighting(halfway, 0.2, 0.6);
    expect(dim.value).toBeCloseTo(0.2);
    const bright = transitionLighting(dim, 1, 1.2);
    expect(bright.value).toBe(1);
    expect(transitionLighting(bright, 1, 10).value).toBe(1);
  });
  it("reverses a transition without a jump and ignores negative frame deltas", () => {
    const current = transitionLighting(initial, 0.2, 0.4);
    expect(transitionLighting(current, 1, 0).value).toBe(current.value);
    expect(transitionLighting(current, 0.2, -1).value).toBe(current.value);
  });
  it("keeps inspection, ended/paused and errored or blocked playback bright", () => {
    expect(lightingTarget(true, "", false)).toBe(0.2);
    expect(lightingTarget(false, "", false)).toBe(1);
    expect(lightingTarget(true, "media error", false)).toBe(1);
    expect(lightingTarget(true, "", true)).toBe(1);
  });
});
