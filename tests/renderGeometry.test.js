import { it, expect } from "vitest";
import { buildParagonConfig, seatAppearance } from "../src/config/paragon/layout";
import { roundedSeatGeometry, chairGeometry, curvedSurfaceGeometry, floorGeometry } from "../src/simulator/renderGeometry";
const triangles = (geometry) => (geometry.index?.count ?? geometry.attributes.position.count) / 3;
it("retains centered physical seat dimensions while rounding only the silhouette", () => {
  for (const axis of ["y", "z"]) for (const part of [seatAppearance.back, seatAppearance.cushion, seatAppearance.arm]) {
    const geometry = roundedSeatGeometry(part.size, axis);
    geometry.computeBoundingBox();
    part.size.forEach((size, i) => {
      expect(geometry.boundingBox.min.getComponent(i)).toBeCloseTo(-size / 2, 5);
      expect(geometry.boundingBox.max.getComponent(i)).toBeCloseTo(size / 2, 5);
    });
    expect(triangles(geometry)).toBeLessThan(70);
    geometry.dispose();
  }
});
it("retains distant rounded backs under 180 triangles and nearby details under 600", () => {
  const config = buildParagonConfig();
  const far = chairGeometry(seatAppearance, config.environment.materials, false, false);
  const near = chairGeometry(seatAppearance, config.environment.materials, true, false);
  expect(triangles(far.colored) + triangles(far.frame)).toBeLessThan(180);
  expect(triangles(near.colored) + triangles(near.frame)).toBeLessThan(600);
  for (const chair of [far, near]) {
    chair.frame.computeBoundingBox();
    expect(chair.frame.boundingBox.min.y).toBeCloseTo(0);
  }
  for (const geometry of [...Object.values(far), ...Object.values(near)]) {
    expect(geometry.attributes.color.count).toBe(geometry.attributes.position.count);
    expect([...geometry.attributes.color.array].every(Number.isFinite)).toBe(true);
    geometry.computeBoundingBox(); expect(geometry.boundingBox.min.y).toBeGreaterThanOrEqual(-0.00001);
    geometry.dispose();
  }
});
it("merges every tier/landing/step without losing surfaces or their world bounds", () => {
  const config = buildParagonConfig(), g = config.geometry;
  const surfaces = [...g.platforms, ...g.landings, ...g.stairs];
  const source = surfaces.map((surface) => curvedSurfaceGeometry(surface, g.curvature));
  const merged = floorGeometry(g);
  expect(triangles(merged)).toBe(source.reduce((total, geometry) => total + triangles(geometry), 0));
  merged.computeBoundingBox();
  expect(merged.boundingBox.min.y).toBeCloseTo(0, 5);
  expect(merged.boundingBox.max.y).toBeCloseTo(g.rows.at(-1).elevation, 5);
  expect(merged.groups).toHaveLength(0);
  merged.dispose(); source.forEach((geometry) => geometry.dispose());
});
