import { describe, expect, it, vi } from "vitest";
import { loadCinema, CinemaLoadError } from "../src/config/loadCinema";
import { branches, canSimulate } from "../src/data/branches";
import paragon from "../src/data/cinemas/paragon.json";

describe("loadCinema", () => {
  it("loads ready Paragon runtime lazily and separates directory metadata", async () => {
    const result = await loadCinema("paragon");
    expect(result.branch.id).toBe("paragon");
    expect(result.auditorium.config.seats).toHaveLength(426);
    expect(branches.find(branch => branch.id === "paragon").auditoriums[0]).not.toHaveProperty("config");
    expect(canSimulate(branches[0], result.auditorium)).toBe(true);
    expect(branches[0].auditoriums[0]).not.toHaveProperty("videoSrc");
  });
  it("uses typed errors for unknown IDs and non-ready metadata", async () => {
    await expect(loadCinema("unknown")).rejects.toMatchObject({ kind: "not-found" });
    await expect(loadCinema("ratchayothin")).rejects.toMatchObject({ kind: "unavailable" });
  });
  it("distinguishes load, invalid identity, invalid schema, and readiness failures", async () => {
    const importer = vi.fn(async () => { throw new Error("missing chunk"); });
    await expect(loadCinema("paragon", { importer })).rejects.toMatchObject({ kind: "load" });
    const mismatched = { ...paragon, branchId: "other" };
    await expect(loadCinema("paragon", { importer: async () => ({ default: mismatched }) }))
      .rejects.toMatchObject({ kind: "invalid", validation: { errors: expect.arrayContaining([expect.objectContaining({ code: "BRANCH_MISMATCH" })]) } });
    const malformed = { ...paragon, auditorium: { ...paragon.auditorium, screen: { ...paragon.auditorium.screen, width: "bad" } } };
    await expect(loadCinema("paragon", { importer: async () => ({ default: malformed }) }))
      .rejects.toMatchObject({ kind: "invalid", validation: { errors: expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_TYPE" })]) } });
    const comingSoon = {
      ...paragon,
      branchId: "ratchayothin",
      status: "coming-soon",
      source: null,
      verifiedAt: null,
      evidence: [],
      estimates: [],
      unresolved: [],
      auditorium: { id: "imax", name: "IMAX", referenceStatus: "missing" },
    };
    const importerForUnavailable = vi.fn(async () => ({ default: comingSoon }));
    await expect(loadCinema("ratchayothin", { registry: { ratchayothin: importerForUnavailable } }))
      .rejects.toMatchObject({ kind: "unavailable" });
    expect(importerForUnavailable).not.toHaveBeenCalled();
    expect(CinemaLoadError).toBeTypeOf("function");
  });
});
