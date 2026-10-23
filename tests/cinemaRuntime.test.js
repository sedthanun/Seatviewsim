import { describe, expect, it } from "vitest";
import paragon from "../src/data/cinemas/paragon.json";
import baseline from "./baselines/paragon-v1.json";
import { buildCinemaRuntime } from "../src/config/buildCinemaRuntime";
import { eyePosition, projectVideo } from "../src/simulator/math";

const runtime = buildCinemaRuntime(paragon).auditorium.config;
function expectNear(actual, expected, path = "") {
  if (typeof expected === "number") {
    expect(typeof actual, path).toBe("number");
    expect(Number.isFinite(actual), path).toBe(true);
    expect(Math.abs(actual - expected), path).toBeLessThanOrEqual(baseline.toleranceMeters);
  }
  else if (expected && typeof expected === "object") {
    expect(Object.keys(actual).sort(), path).toEqual(Object.keys(expected).sort());
    for (const key of Object.keys(expected)) expectNear(actual[key], expected[key], `${path}/${key}`);
  } else expect(actual, path).toEqual(expected);
}

describe("Cinema runtime adapter", () => {
  it("builds the complete Paragon runtime from Cinema JSON", () => {
    expect(runtime.seats).toHaveLength(426);
    expect(runtime.seats.map(({ id, rowId, number, category }) => ({ id, rowId, number, category }))).toEqual(baseline.config.seats.map(({ id, rowId, number, category }) => ({ id, rowId, number, category })));
    expectNear(runtime.geometry.rows.map(({ rowId, z, elevation, front, back }) => ({ rowId, z, elevation, front, back })), baseline.config.geometry.rows.map(({ rowId, z, elevation, front, back }) => ({ rowId, z, elevation, front, back })), "/rows");
    expectNear(runtime.screen, baseline.config.screen, "/screen");
    expectNear(runtime.projection, baseline.config.projection, "/projection");
    expectNear(runtime.camera, baseline.config.camera, "/camera");
    expectNear(runtime.seats.map(seat => ({ id: seat.id, position: seat.position })), baseline.config.seats.map(seat => ({ id: seat.id, position: seat.position })), "/seats");
    expectNear(runtime.seats.map(seat => ({ id: seat.id, position: eyePosition(seat, runtime.camera.eyeHeight) })), baseline.eyes, "/eyes");
    expectNear(runtime.geometry, baseline.config.geometry, "/geometry");
    expectNear(runtime.environment, baseline.config.environment, "/environment");
    for (const sample of baseline.videoProjections) expectNear(projectVideo(runtime.screen, runtime.projection, ...sample.sourceSize), sample.result, "/videoProjections");
  });

  it("keeps null slots and explicit seat overrides data driven", () => {
    const value = structuredClone(paragon);
    value.branchId = "fixture";
    value.auditorium.layout.rows = [
      { id: "A", distanceFromScreen: 8, frontOffset: -0.5, backOffset: 0.5, stairRunToNext: 1, platforms: "full" },
      { id: "B", distanceFromPrevious: 3, frontOffset: -0.5, backOffset: 0.5, platforms: [{ left: -4, right: 4 }] },
    ];
    value.auditorium.layout.architecture.minDepth = 8;
    value.auditorium.layout.architecture.minHeight = 8;
    value.auditorium.seating.rows = [
      { rowId: "A", blocks: [{ startX: -1, seatPitch: 1, numbers: ["1", null, "3"], category: "normal", yaw: 0 }], pairs: [] },
      { rowId: "B", blocks: [{ startX: -2, seatPitch: 1, numbers: ["1", "2"], category: "normal", yaw: 0 }], pairs: [] },
    ];
    value.auditorium.seating.seatOverrides = [{ seatId: "A-3", position: [4, 0.25, 8], yaw: 0.2, eyeOffset: [0.1, 1.3, 0.05] }];
    value.auditorium.capacity = { reported: null, configured: 4 };
    const config = buildCinemaRuntime(value).auditorium.config;
    expect(config.seats.map(seat => seat.id)).toEqual(["A-1", "A-3", "B-1", "B-2"]);
    expect(config.seats[1]).toMatchObject({ position: [4, 0.25, 8], orientation: 0.2, eyeOffset: [0.1, 1.3, 0.05] });
    expect(config.geometry.rows.map(row => row.rowId)).toEqual(["A", "B"]);
  });

  it("applies slope, rise, custom elevation and eye-height calibration overrides", () => {
    const slope = buildCinemaRuntime(paragon, { mode: "slope", slope: 10, frontElevation: 0.4, eyeHeight: 1.3, rowPitch: 1.15, customElevations: null }).auditorium.config;
    const rise = buildCinemaRuntime(paragon, { mode: "rise", rise: 0.2, frontElevation: 0.4, eyeHeight: 1.25, rowPitch: 1.15, customElevations: null }).auditorium.config;
    const custom = buildCinemaRuntime(paragon, { mode: "custom", frontElevation: 0.4, eyeHeight: 1.4, rowPitch: 1.15, customElevations: Array.from({ length: 13 }, (_, index) => 0.4 + index * 0.2) }).auditorium.config;
    expect(slope.geometry.rows[0].elevation).toBeCloseTo(0.4);
    expect(slope.geometry.rows[1].elevation).toBeGreaterThan(0.4);
    expect(rise.geometry.rows[1].elevation - rise.geometry.rows[0].elevation).toBeCloseTo(0.2 * (rise.geometry.rows[1].z - rise.geometry.rows[0].z) / 1.15);
    expect(custom.geometry.rows.map(row => row.elevation)).toEqual(Array.from({ length: 13 }, (_, index) => 0.4 + index * 0.2));
    expect(slope.camera.eyeHeight).toBe(1.3);
    expect(slope.seats[0].eyeOffset[1]).toBe(1.3);
  });
});
