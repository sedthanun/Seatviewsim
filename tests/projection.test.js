import { describe, it, expect } from "vitest";
import { Texture, Vector2 } from "three";
import { projectVideo, projectionBounds, validateProjection, validateConfig } from "../src/simulator/math";
import { applyVideoProjection } from "../src/simulator/videoTexture";
import { screenDimensions, projection, activeProjection } from "../src/config/paragon/screen";
import { buildParagonConfig } from "../src/config/paragon/layout";
import { fixture } from "../src/dev/fixture";

const project = (width, height) => projectVideo(screenDimensions, projection, width, height);
describe("CoLa projection on the physical screen", () => {
  it("derives a centered 1.90 frame with separate physical margins", () => {
    const frame = projectionBounds(screenDimensions, projection);
    expect(activeProjection.height).toBe(25 / 1.90);
    expect(frame.size).toEqual([25, 25 / 1.90]);
    expect(frame.position).toEqual([0, 0]);
    expect(frame.margins.left).toBeCloseTo(0.65);
    expect(frame.margins.right).toBeCloseTo(0.65);
    expect(frame.margins.top).toBeCloseTo(3.3210526316);
    expect(frame.margins.bottom).toBeCloseTo(3.3210526316);
    const config = buildParagonConfig();
    expect(config.screen.width).toBe(26.3);
    expect(config.screen.height).toBe(19.8);
    expect(config.projection).toEqual(projection);
    expect(validateConfig(config)).toEqual([]);
  });
  it("crops the actual 1546×1080 source symmetrically without stretching", () => {
    const result = project(1546, 1080);
    expect(result.size).toEqual([25, 25 / 1.90]);
    expect(result.uv.repeat[0]).toBe(1);
    expect(result.uv.repeat[1] * 1080).toBeCloseTo(813.684210526);
    expect(result.uv.offset[1] * 1080).toBeCloseTo(133.157894737);
    expect(result.uv.repeat[1] + 2 * result.uv.offset[1]).toBeCloseTo(1);
    expect(result.size[0] / (1546 * result.uv.repeat[0]))
      .toBeCloseTo(result.size[1] / (1080 * result.uv.repeat[1]));
  });
  it.each([[1900, 1000, 1], [1920, 1080, (1920 / 1080) / 1.90]])(
    "maps %i×%i footage into the frame", (width, height, retained) => {
      const result = project(width, height);
      expect(result.size).toEqual([25, 25 / 1.90]);
      expect(result.uv.repeat[1]).toBeCloseTo(retained);
      expect(result.uv.offset[1]).toBeCloseTo((1 - retained) / 2);
    },
  );
  it("fits 2.39 footage at full width and retains every source pixel", () => {
    const result = project(2390, 1000);
    expect(result.size).toEqual([25, 25 / 2.39]);
    expect(result.position).toEqual([0, 0]);
    expect(result.uv).toEqual({ repeat: [1, 1], offset: [0, 0] });
    expect(result.size[1]).toBeLessThan(result.frame.size[1]);
  });
  it("moves image and margins together in screen-local coordinates", () => {
    const result = projectVideo(screenDimensions, { ...projection, offset: [0.3, -1] }, 1900, 1000);
    expect(result.position).toEqual([0.3, -1]);
    expect(result.frame.margins.left).toBeCloseTo(0.95);
    expect(result.frame.margins.right).toBeCloseTo(0.35);
    expect(result.frame.margins.top).toBeCloseTo(4.3210526316);
    expect(result.frame.margins.bottom).toBeCloseTo(2.3210526316);
  });
  it.each([[0, 0], [1546, 0], [-1, 1080], [NaN, 1080], [1546, Infinity]])(
    "does not create an image for unavailable/invalid metadata %s×%s", (width, height) => {
      expect(project(width, height)).toBeNull();
    },
  );
  it.each([
    { width: 0 }, { width: NaN }, { aspectRatio: 0 }, { aspectRatio: Infinity },
    { offset: null }, { offset: [0] }, { offset: [0, NaN] },
    { width: 27 }, { aspectRatio: 1 }, { aspectRatio: Number.MIN_VALUE },
    { offset: [1, 0] }, { offset: [0, 4] }, { tallContentMode: "stretch" },
  ])("rejects bad or out-of-bounds projection %j", (invalid) => {
    const value = { ...projection, ...invalid };
    expect(validateProjection(screenDimensions, value)).not.toEqual([]);
    expect(validateConfig({ ...fixture, screen: screenDimensions, projection: value })).not.toEqual([]);
    expect(() => projectVideo(screenDimensions, value, 0, 0)).toThrow(/Projection/);
  });
  it("preserves contain fitting for legacy configs without a projection", () => {
    const result = projectVideo(fixture.screen, undefined, 1920, 1080);
    expect(result.size).toEqual([12, 6.75]);
    expect(result.uv).toEqual({ repeat: [1, 1], offset: [0, 0] });
    expect(validateConfig(fixture)).toEqual([]);
  });
  it("resets the actual texture transform from cropped to wide/pending sources", () => {
    const texture = new Texture();
    applyVideoProjection(texture, project(1546, 1080));
    const top = new Vector2(0.5, 1).applyMatrix3(texture.matrix);
    expect(top.y).toBeCloseTo(1 - 133.157894737 / 1080);
    for (const layout of [project(2390, 1000), project(1900, 1000), null]) {
      applyVideoProjection(texture, layout);
      expect(texture.repeat.toArray()).toEqual([1, 1]);
      expect(texture.offset.toArray()).toEqual([0, 0]);
      expect(new Vector2(0.5, 1).applyMatrix3(texture.matrix).toArray()).toEqual([0.5, 1]);
    }
    texture.dispose();
  });
});
