import { describe, it, expect } from "vitest";
import { eyePosition, fitVideo, validateConfig } from "../src/simulator/math";
import { fixture } from "../src/dev/fixture";
import { branches, canSimulate } from "../src/data/branches";
import paragonCinema from "../src/data/cinemas/paragon.json";
import { screenDimensions } from "../src/config/paragon/screen";
import { seats as paragonSeats, seatingEstimate } from "../src/config/paragon/seating";
describe("seat geometry", () => {
  it("adds eye height to the tier elevation exactly once", () =>
    expect(eyePosition({ position: [2, 3, 8], orientation: 0 })).toEqual([
      2, 4.15, 8,
    ]));
  it("rotates local eye offset with seat orientation", () => {
    const p = eyePosition({
      position: [0, 2, 9],
      orientation: Math.PI / 2,
      eyeOffset: [0, 1.2, -0.2],
    });
    expect(p[0]).toBeCloseTo(-0.2);
    expect(p[1]).toBeCloseTo(3.2);
    expect(p[2]).toBeCloseTo(9);
  });
  it("produces distinct front, middle, rear, and side viewpoints", () => {
    const points = ["TEST-A-4", "TEST-B-5", "TEST-D-6", "TEST-D-1"].map((id) =>
      eyePosition(fixture.seats.find((s) => s.id === id)),
    );
    expect(new Set(points.map(JSON.stringify)).size).toBe(4);
    expect(points[2][1]).toBeGreaterThan(points[0][1]);
  });
  it("validates missing references and duplicate IDs", () => {
    expect(validateConfig(fixture)).toEqual([]);
    expect(validateConfig({})).toHaveLength(2);
    expect(
      validateConfig({
        ...fixture,
        seats: [fixture.seats[0], fixture.seats[0]],
      }),
    ).toContain("Seat IDs must be unique.");
  });
});
describe("aspect fit", () => {
  it("letterboxes wide footage", () =>
    expect(fitVideo(12, 7, 1920, 1080)).toEqual([12, 6.75]));
  it("pillarboxes portrait footage", () =>
    expect(fitVideo(12, 7, 1080, 1920)).toEqual([3.9375, 7]));
  it("does not create geometry before metadata loads", () =>
    expect(fitVideo(12, 7, 0, 0)).toBeNull());
  it("retains the legacy physical-screen fit independently of projector framing", () => {
    const [width, height] = fitVideo(
      screenDimensions.width,
      screenDimensions.height,
      1546,
      1080,
    );
    expect(width).toBe(26.3);
    expect(height).toBeCloseTo(18.37257, 4);
    expect(width / height).toBeCloseTo(1546 / 1080);
    expect(height).toBeLessThan(screenDimensions.height);
  });
});
it("registers the supplied Paragon video in Cinema JSON, not directory metadata", () => {
  const paragon = branches.find((branch) => branch.id === "paragon");
  expect(paragonCinema.auditorium.media.clips.find(clip => clip.id === paragonCinema.auditorium.media.defaultVideoId).src).toBe(
    "/media/Infinite%20Worlds.mp4",
  );
  expect(paragon.auditoriums[0]).not.toHaveProperty("videoSrc");
  expect(canSimulate(paragon, { ...paragon.auditoriums[0], referenceStatus: "prototype", seats: [1] })).toBe(true);
});
it("keeps upcoming branches and synthetic fixtures closed", () => {
  for (const branch of branches.filter((item) => item.id !== "paragon"))
    expect(canSimulate(branch, branch.auditoriums[0])).toBe(false);
  expect(canSimulate({ status: "available" }, { config: fixture })).toBe(false);
});
it("keeps the provisional seat inventory explicit", () => {
  expect(paragonSeats).toHaveLength(426);
  expect(seatingEstimate).toEqual({ capacityFromIds: 426, reportedCapacity: 421 });
  expect(new Set(paragonSeats.map((seat) => seat.id)).size).toBe(426);
  expect(paragonSeats.some((seat) => seat.id === "K-1")).toBe(false);
  expect(paragonSeats.some((seat) => seat.id === "L-3")).toBe(false);
  expect(paragonSeats.some((seat) => seat.id === "VP-22")).toBe(true);
  expect(eyePosition(paragonSeats.find((seat) => seat.id === "VP-1"))[2])
    .toBeGreaterThan(eyePosition(paragonSeats.find((seat) => seat.id === "A-1"))[2]);
});
