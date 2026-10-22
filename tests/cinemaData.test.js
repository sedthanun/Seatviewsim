import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import schema from "../src/data/schemas/cinema.schema.json";
import paragon from "../src/data/cinemas/paragon.json";
import baseline from "./baselines/paragon-v1.json";
import { validateCinema } from "../src/config/validateCinema";
import { resolveCinemaSeating } from "../src/config/resolveCinemaSeating";
import { defaultParagon } from "../src/config/paragon/layout";
import { serializeCalibration, calibrationDefaults } from "../src/config/paragon/calibration";
import { eyePosition, projectVideo } from "../src/simulator/math";

const copy = value => structuredClone(value);
const codes = value => validateCinema(value).errors.map(error => error.code);
const change = fn => { const value = copy(paragon); fn(value); return value; };
const structural = new Ajv({ strict: true, allErrors: true }).compile(schema);
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function smallCinema() {
  const value = copy(paragon);
  value.branchId = "test-cinema";
  value.evidence = []; value.estimates = []; value.unresolved = [];
  value.auditorium.media.clips = [{ id: "demo", name: "Test video", status: "ready", src: "/media/demo.mp4", evidenceIds: [] }];
  value.auditorium.media.defaultVideoId = "demo";
  value.auditorium.capacity = { reported: null, configured: 6 };
  value.auditorium.layout.curvature = 0;
  value.auditorium.layout.elevation = { mode: "slope", frontElevation: 0.25, degrees: 0 };
  value.auditorium.layout.rows = [
    { id: "A", distanceFromScreen: 8, frontOffset: -0.5, backOffset: 0.65, stairRunToNext: 1, platforms: "full" },
    { id: "B", distanceFromPrevious: 3, frontOffset: -0.5, backOffset: 0.65, platforms: [{ left: -4, right: 4 }] },
  ];
  value.auditorium.seating.rows = [
    { rowId: "A", blocks: [{ startX: -1.5, seatPitch: 1, numbers: ["1", null, "3"], category: "normal", yaw: 0 }], pairs: [] },
    { rowId: "B", blocks: [{ startX: -2, seatPitch: 1, numbers: ["1", "2", "3", "4"], category: "normal", yaw: 0 }], pairs: [{ id: "b-pair", numbers: ["1", "2"] }] },
  ];
  value.auditorium.seating.seatOverrides = [];
  return value;
}
function expectNear(actual, expected, path = "") {
  if (typeof expected === "number") {
    expect(Number.isFinite(actual), path).toBe(true);
    expect(Math.abs(actual - expected), path).toBeLessThanOrEqual(baseline.toleranceMeters);
  } else if (expected && typeof expected === "object") {
    expect(Array.isArray(actual), path).toBe(Array.isArray(expected));
    expect(Object.keys(actual).sort(), path).toEqual(Object.keys(expected).sort());
    for (const key of Object.keys(expected)) expectNear(actual[key], expected[key], `${path}/${key}`);
  } else expect(actual, path).toEqual(expected);
}

describe("Cinema v1 source contract", () => {
  it("accepts the Paragon source with 426 individual seats and an explained capacity warning", () => {
    expect(structural(paragon), JSON.stringify(structural.errors)).toBe(true);
    const result = validateCinema(paragon, { expectedBranchId: "paragon" });
    expect(result).toMatchObject({ valid: true, canSimulate: true, errors: [], configuredSeatCount: 426 });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ code: "CAPACITY_DISCREPANCY", path: "/auditorium/capacity" });
    const { seats } = resolveCinemaSeating(paragon.auditorium);
    expect(seats.some(seat => ["K-1", "L-1", "L-2", "L-3"].includes(seat.id))).toBe(false);
    expect(seats.filter(seat => seat.rowId === "VP")).toHaveLength(22);
    expect(paragon.auditorium.seating.rows.at(-1).pairs).toHaveLength(11);
  });
  it("does not mutate, coerce, remove unknown fields or fill defaults", () => {
    const value = freeze(copy(paragon));
    const before = JSON.stringify(value);
    expect(validateCinema(value).valid).toBe(true);
    expect(JSON.stringify(value)).toBe(before);
    expect(codes(change(value => value.auditorium.screen.width = "26.3"))).toContain("SCHEMA_TYPE");
    const missing = change(value => delete value.auditorium.camera);
    expect(validateCinema(missing).valid).toBe(false);
    expect(missing.auditorium.camera).toBeUndefined();
    const unknown = change(value => value.auditorium.screen.wdith = 12);
    expect(codes(unknown)).toContain("SCHEMA_ADDITIONALPROPERTIES");
    expect(unknown.auditorium.screen.wdith).toBe(12);
  });
  it("supports unequal rows, permanent gaps, pairs, and complete positional overrides", () => {
    const value = smallCinema();
    value.auditorium.seating.seatOverrides = [{ seatId: "B-4", position: [2.5, 0.25, 11.3], yaw: 0.2, eyeOffset: [0.1, 1.3, 0.05] }];
    expect(validateCinema(value)).toMatchObject({ valid: true, configuredSeatCount: 6, warnings: [] });
    const { seats } = resolveCinemaSeating(value.auditorium);
    expect(seats.filter(seat => seat.rowId === "A").map(seat => seat.position[0])).toEqual([-1.5, 0.5]);
    expect(seats.some(seat => seat.id === "A-2")).toBe(false);
    expect(seats.find(seat => seat.id === "B-4")).toMatchObject({ position: [2.5, 0.25, 11.3], orientation: 0.2, eyeOffset: [0.1, 1.3, 0.05] });
  });
  it("keeps leading zeroes and declared numbering direction", () => {
    const value = smallCinema();
    value.auditorium.seating.rows[0].blocks[0].numbers = ["03", null, "01"];
    expect(validateCinema(value).valid).toBe(true);
    expect(resolveCinemaSeating(value.auditorium).seats.slice(0, 2).map(seat => seat.id)).toEqual(["A-03", "A-01"]);
  });
  it("uses only the active elevation source and derives rise proportionally across gaps", () => {
    const value = smallCinema();
    value.auditorium.layout.elevation = { mode: "rise", frontElevation: 0.25, rise: 0.4, run: 1 };
    expect(validateCinema(value).valid).toBe(true);
    expect(resolveCinemaSeating(value.auditorium).rows[1].elevation).toBeCloseTo(1.45);
    value.auditorium.layout.elevation = { mode: "custom", levels: [0.25, 2] };
    expect(validateCinema(value).valid).toBe(true);
    expect(resolveCinemaSeating(value.auditorium).rows.map(row => row.elevation)).toEqual([0.25, 2]);
    value.auditorium.layout.elevation.degrees = 22.5;
    expect(validateCinema(value).valid).toBe(false);
  });
  it("allows metadata-only Coming Soon without making it playable", () => {
    const value = { schemaVersion: 1, branchId: "future", nameTh: "สาขาใหม่", name: "Future", brand: "Test", location: "Bangkok", features: [], status: "coming-soon", source: null, verifiedAt: null,
      auditorium: { id: "imax", name: "IMAX", referenceStatus: "missing" }, evidence: [], estimates: [], unresolved: [] };
    expect(structural(value)).toBe(true);
    expect(validateCinema(value)).toEqual({ valid: true, canSimulate: false, configuredSeatCount: 0, errors: [], warnings: [] });
    value.status = "available";
    expect(validateCinema(value).valid).toBe(false);
  });
  it("disallows inconsistent availability/reference status", () => {
    expect(codes(change(value => value.auditorium.referenceStatus = "missing"))).toContain("SCHEMA_ENUM");
    expect(validateCinema(change(value => value.status = "coming-soon")).valid).toBe(false);
  });
  it("accepts reviewed data only after its reported seat count is reconciled", () => {
    expect(codes(change(value => value.auditorium.referenceStatus = "reviewed"))).toContain("REVIEWED_CAPACITY_MISMATCH");
    const value = smallCinema(); value.auditorium.referenceStatus = "reviewed"; value.auditorium.capacity.reported = 6;
    expect(validateCinema(value).valid).toBe(true);
  });
  it("rejects a capacity gap without explanation and a stale declared configured count", () => {
    expect(codes(change(value => delete value.auditorium.capacity.discrepancy))).toContain("CAPACITY_EXPLANATION_REQUIRED");
    expect(codes(change(value => value.auditorium.capacity.discrepancy = "  "))).toContain("CAPACITY_EXPLANATION_REQUIRED");
    expect(codes(change(value => value.auditorium.capacity.configured = 421))).toContain("CONFIGURED_COUNT_MISMATCH");
  });
  it("rejects unsupported versions, Calibration documents and multiple auditoriums", () => {
    expect(codes(change(value => value.schemaVersion = 2))).toContain("SCHEMA_CONST");
    expect(validateCinema(JSON.parse(serializeCalibration(calibrationDefaults))).valid).toBe(false);
    expect(codes(change(value => value.auditorium = [value.auditorium]))).toContain("SCHEMA_TYPE");
  });
  it("keeps parse errors separate from parsed-object validation", () => {
    expect(() => JSON.parse('{"schemaVersion":')).toThrow(SyntaxError);
    expect(validateCinema('{"schemaVersion":1}').valid).toBe(false);
  });
  it.each([null, [], {}, 1, undefined])("rejects malformed roots without throwing: %j", value => {
    expect(validateCinema(value).valid).toBe(false);
  });
  it.each([NaN, Infinity, -Infinity])("rejects nonfinite source numbers: %s", invalid => {
    expect(codes(change(value => value.auditorium.screen.position[0] = invalid))).toContain("NON_FINITE");
  });
  it("rejects non-JSON objects, functions, sparse vectors and cycles", () => {
    expect(codes(change(value => value.source = new Date()))).toContain("NOT_JSON");
    expect(codes(change(value => value.source = () => "url"))).toContain("NOT_JSON");
    const sparse = change(value => value.auditorium.screen.position = Array(3));
    expect(codes(sparse)).toContain("NOT_JSON");
    const cycle = copy(paragon); cycle.source = cycle;
    expect(codes(cycle)).toContain("NOT_JSON");
  });
  it("rejects incomplete vectors, invalid dimensions and invalid camera limits", () => {
    for (const mutate of [
      value => value.auditorium.screen.position = [0, 1],
      value => value.auditorium.screen.width = 0,
      value => value.auditorium.camera.fov = 180,
      value => value.auditorium.camera.eyeHeight = -1,
      value => value.auditorium.appearance.parts.arm.size[0] = 0,
    ]) expect(validateCinema(change(mutate)).valid).toBe(false);
  });
  it("checks filename identity and actual calendar dates", () => {
    expect(validateCinema(paragon, { expectedBranchId: "other" }).errors[0].code).toBe("BRANCH_MISMATCH");
    expect(codes(change(value => value.verifiedAt = "2026-02-30"))).toContain("INVALID_DATE");
  });
  it("rejects duplicate IDs/numbers and normalized display-code collisions", () => {
    expect(codes(change(value => value.auditorium.seating.rows[0].blocks[0].numbers[1] = "4"))).toContain("DUPLICATE_SEAT_ID");
    const value = smallCinema();
    value.auditorium.layout.rows[1].id = "a"; value.auditorium.seating.rows[1].rowId = "a";
    expect(codes(value)).toContain("DUPLICATE_SEAT_CODE");
    value.auditorium.layout.rows[0].id = "A1"; value.auditorium.seating.rows[0].rowId = "A1";
    value.auditorium.seating.rows[0].blocks[0].numbers = ["1", null, "2"];
    value.auditorium.layout.rows[1].id = "A"; value.auditorium.seating.rows[1].rowId = "A";
    value.auditorium.seating.rows[1].blocks[0].numbers[2] = "12";
    expect(codes(value)).toContain("DUPLICATE_SEAT_CODE");
  });
  it("rejects unknown and duplicated rows/categories", () => {
    expect(codes(change(value => value.auditorium.layout.rows[1].id = "L"))).toContain("DUPLICATE_ROW");
    expect(codes(change(value => value.auditorium.seating.rows[0].rowId = "X"))).toContain("UNKNOWN_ROW");
    expect(codes(change(value => value.auditorium.seating.rows[0].blocks[0].category = "unknown"))).toContain("UNKNOWN_CATEGORY");
    expect(codes(change(value => value.auditorium.seating.rows.pop()))).toContain("ROW_SEATING_REQUIRED");
  });
  it("rejects invalid pair references, reused seats and duplicate pair IDs", () => {
    expect(codes(change(value => value.auditorium.seating.rows.at(-1).pairs[0].numbers[0] = "23"))).toContain("UNKNOWN_PAIR_SEAT");
    expect(codes(change(value => value.auditorium.seating.rows.at(-1).pairs[1].numbers[0] = "1"))).toContain("SEAT_IN_MULTIPLE_PAIRS");
    expect(codes(change(value => value.auditorium.seating.rows.at(-1).pairs[1].id = "vp-pair-1"))).toContain("DUPLICATE_PAIR");
  });
  it("rejects invalid or duplicate overrides and coincident seats", () => {
    expect(codes(change(value => value.auditorium.seating.seatOverrides = [{ seatId: "K-1", yaw: 0 }]))).toContain("UNKNOWN_OVERRIDE_SEAT");
    expect(codes(change(value => value.auditorium.seating.seatOverrides = [{ seatId: "L-4", yaw: 0 }, { seatId: "L-4", yaw: 1 }]))).toContain("DUPLICATE_OVERRIDE");
    const value = smallCinema();
    value.auditorium.seating.seatOverrides = [{ seatId: "A-1", position: [0.5, 0.25, 8] }];
    expect(codes(value)).toContain("COINCIDENT_SEATS");
    value.auditorium.seating.seatOverrides = [{ seatId: "A-1", eyeOffset: [0, 0, 0] }];
    expect(codes(value)).toContain("INVALID_EYE_OFFSET");
  });
  it("rejects bad projection bounds and retains contain when projection is omitted", () => {
    expect(codes(change(value => value.auditorium.projection.offset = [2, 0]))).toContain("INVALID_PROJECTION");
    expect(codes(change(value => value.auditorium.projection.width = 27))).toContain("INVALID_PROJECTION");
    expect(codes(change(value => value.auditorium.projection.aspectRatio = 0.5))).toContain("INVALID_PROJECTION");
    const value = smallCinema(); delete value.auditorium.projection;
    expect(validateCinema(value).valid).toBe(true);
  });
  it("rejects bad row distances, incomplete/custom reversed levels and overlapping floor", () => {
    expect(codes(change(value => value.auditorium.layout.rows[0].distanceFromPrevious = 1))).toContain("INVALID_ROW_DISTANCE");
    expect(codes(change(value => delete value.auditorium.layout.rows[1].distanceFromPrevious))).toContain("INVALID_ROW_DISTANCE");
    expect(codes(change(value => value.auditorium.layout.elevation = { mode: "custom", levels: [1, 0] }))).toContain("INVALID_LEVELS");
    expect(codes(change(value => value.auditorium.layout.rows[0].backOffset = 10))).toContain("OVERLAPPING_ROWS");
    expect(codes(change(value => value.auditorium.layout.rows[0].stairRunToNext = 10))).toContain("STAIR_RUN_TOO_LONG");
    expect(codes(change(value => value.auditorium.layout.aisles = []))).toContain("INVALID_CENTRAL_AISLE");
  });
  it("reports overflow in computed positions instead of approving finite but unusable source data", () => {
    const value = smallCinema(); value.auditorium.layout.curvature = Number.MAX_VALUE;
    expect(codes(value)).toContain("NON_FINITE");
  });
  it("checks evidence, estimate and unresolved references using JSON pointers", () => {
    expect(codes(change(value => value.evidence[1].id = value.evidence[0].id))).toContain("DUPLICATE_EVIDENCE");
    expect(codes(change(value => value.estimates[0].evidenceIds = ["missing"]))).toContain("UNKNOWN_EVIDENCE");
    expect(codes(change(value => value.estimates[0].path = "/auditorium/unknown"))).toContain("UNKNOWN_PATH");
    expect(codes(change(value => value.evidence[0].supports = ["/name~2"]))).toContain("UNKNOWN_PATH");
    expect(codes(change(value => value.unresolved[0].paths = ["/bad"]))).toContain("UNKNOWN_PATH");
    expect(codes(change(value => value.unresolved[1].id = value.unresolved[0].id))).toContain("DUPLICATE_ISSUE");
  });
  it("checks media membership and readiness while allowing a pending non-default clip", () => {
    expect(codes(change(value => value.auditorium.media.defaultVideoId = "imax-countdown"))).toContain("INVALID_DEFAULT_VIDEO");
    expect(codes(change(value => value.auditorium.media.defaultVideoId = "unknown"))).toContain("INVALID_DEFAULT_VIDEO");
    expect(codes(change(value => value.auditorium.media.defaultVideoId = null))).toContain("INVALID_DEFAULT_VIDEO");
    expect(codes(change(value => value.auditorium.media.clips[1].id = "imax-preshow"))).toContain("DUPLICATE_CLIP");
    expect(codes(change(value => value.auditorium.media.clips[0].evidenceIds = ["missing"]))).toContain("UNKNOWN_EVIDENCE");
    expect(validateCinema(change(value => value.auditorium.media.clips[0].src = null)).valid).toBe(false);
    expect(validateCinema(change(value => value.auditorium.media.clips[1].src = "/media/not-ready.mp4")).valid).toBe(false);
  });
  it("returns Thai, field-addressed diagnostics", () => {
    const result = validateCinema(change(value => value.auditorium.screen.unknown = true));
    expect(result.canSimulate).toBe(false);
    expect(result.errors.some(error => error.path === "/auditorium/screen/unknown")).toBe(true);
    for (const error of result.errors) { expect(error.code).toBeTruthy(); expect(error.message).toMatch(/[ก-๙]/); }
  });
});

describe("frozen pre-migration Paragon baseline", () => {
  it("matches the current runtime's complete scene within 1e-6", () => {
    expect(baseline.configuredCapacity).toBe(426);
    expect(baseline.reportedCapacity).toBe(421);
    expectNear(defaultParagon, baseline.config, "/config");
    expectNear(defaultParagon.seats.map(seat => ({ id: seat.id, position: eyePosition(seat, defaultParagon.camera.eyeHeight) })), baseline.eyes, "/eyes");
    for (const sample of baseline.videoProjections)
      expectNear(projectVideo(defaultParagon.screen, defaultParagon.projection, ...sample.sourceSize), sample.result, "/projection");
  });
  it("reproduces every source seat and row against the frozen runtime values", () => {
    const { rows, seats } = resolveCinemaSeating(paragon.auditorium);
    expectNear(seats, baseline.config.seats, "/seats");
    expectNear(rows, baseline.config.geometry.rows.map(({ rowId, z, elevation, front, back }) => ({ rowId, z, elevation, front, back })), "/rows");
    expectNear(paragon.auditorium.screen, baseline.config.screen, "/screen");
    expectNear(paragon.auditorium.projection, baseline.config.projection, "/projection");
    const { target, ...camera } = paragon.auditorium.camera;
    expect(target.kind).toBe("screen-center");
    expectNear({ ...camera, target: paragon.auditorium.screen.position }, baseline.config.camera, "/camera");
  });
});
