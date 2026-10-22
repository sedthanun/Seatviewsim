import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Shape, Quaternion, Vector3, Float32BufferAttribute, Color, TorusGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Fixed auditorium surfaces need inexpensive directional shading, not per-pixel PBR.
export function bakeSurfaceShading(geometry, tint = "#ffffff") {
  const normals = geometry.attributes.normal, colors = new Float32Array(normals.count * 3);
  const color = new Color(tint);
  for (let i = 0; i < normals.count; i++) {
    const intensity = 0.45 + Math.max(0, normals.getY(i)) * 0.5 + Math.max(0, -normals.getZ(i)) * 0.22 + Math.abs(normals.getX(i)) * 0.08;
    colors[i * 3] = intensity * 0.94 * color.r; colors[i * 3 + 1] = intensity * 0.97 * color.g; colors[i * 3 + 2] = intensity * color.b;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function chairGeometry(appearance, materials, detailed, simple) {
  const colored = [], frame = [];
  function add(part, target, tint = "#ffffff", axis = "z") {
    const silhouette = appearance.rounded && (detailed || part === appearance.back || part === appearance.headrest);
    const geometry = silhouette ? roundedSeatGeometry(part.size, axis, simple || !detailed) : new BoxGeometry(...part.size);
    geometry.translate(...part.offset); target.push(bakeSurfaceShading(geometry, tint));
  }
  add(appearance.back, appearance.backInset || !appearance.upholstery ? colored : frame,
    appearance.backInset || !appearance.upholstery ? "#ffffff" : materials?.back ?? "#17212d");
  if (appearance.backInset) add(appearance.backInset, frame, materials?.back ?? "#17212d");
  if (appearance.upholstery) {
    add(appearance.upholstery, colored);
    if (appearance.rounded && appearance.headrest) add(appearance.headrest, colored);
  }
  add(appearance.cushion, colored, "#ffffff", "y");
  for (const side of [-1, 1]) {
    add({ ...appearance.arm, offset: [side * appearance.arm.offset[0], ...appearance.arm.offset.slice(1)] }, frame, materials?.arm ?? "#1e2632", "y");
    if (detailed && appearance.cupHolders) {
      const ring = new TorusGeometry(0.03, 0.008, 4, 8).rotateX(-Math.PI / 2).translate(side * 0.35, 0.736, -0.18);
      const cup = new CylinderGeometry(0.03, 0.025, 0.014, 8).translate(side * 0.35, 0.728, -0.18);
      frame.push(bakeSurfaceShading(ring, "#696466"), bakeSurfaceShading(cup, "#080a11"));
    }
  }
  add(appearance.base, frame, "#222936"); add(appearance.stem, frame, "#303848");
  return { colored: mergeStaticGeometry(colored), frame: mergeStaticGeometry(frame) };
}

// Round only the silhouette, rather than subdividing every flat face into a grid.
export function roundedSeatGeometry(size, axis = "z", simple = false) {
  const [width, height, depth] = size;
  const h = axis === "y" ? depth : height, thickness = axis === "y" ? height : depth;
  const x = width / 2, y = h / 2, r = Math.min(axis === "z" ? 0.1 : 0.08, width / 4, h / 4);
  const shape = new Shape();
  shape.moveTo(-x + r, -y); shape.lineTo(x - r, -y); shape.quadraticCurveTo(x, -y, x, -y + r);
  shape.lineTo(x, y - r); shape.quadraticCurveTo(x, y, x - r, y);
  shape.lineTo(-x + r, y); shape.quadraticCurveTo(-x, y, -x, y - r);
  shape.lineTo(-x, -y + r); shape.quadraticCurveTo(-x, -y, -x + r, -y);
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: simple ? 1 : 2, steps: 1 });
  geometry.translate(0, 0, -thickness / 2);
  if (axis === "y") geometry.rotateX(-Math.PI / 2);
  return geometry;
}
export function curvedSurfaceGeometry(surface, curvature) {
  const { left, right, front, back, elevation } = surface;
  const shape = new Shape(), segments = Math.max(2, Math.ceil((right - left) / 0.4));
  shape.moveTo(left, front + curvature * left * left);
  for (let i = 1; i <= segments; i++) { const x = left + (right - left) * i / segments; shape.lineTo(x, front + curvature * x * x); }
  for (let i = segments; i >= 0; i--) { const x = left + (right - left) * i / segments; shape.lineTo(x, back + curvature * x * x); }
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: elevation, bevelEnabled: false, steps: 1 });
  geometry.rotateX(Math.PI / 2); geometry.translate(0, elevation, 0);
  return geometry;
}
export function mergeStaticGeometry(parts) {
  const normalized = parts.map((geometry) => geometry.index ? geometry.toNonIndexed() : geometry);
  const geometry = mergeGeometries(normalized, false);
  for (const part of new Set([...parts, ...normalized])) part.dispose();
  geometry.computeBoundingSphere();
  return geometry;
}
export function floorGeometry(g) {
  return bakeSurfaceShading(mergeStaticGeometry([...g.platforms, ...g.landings, ...g.stairs].map((surface) => curvedSurfaceGeometry(surface, g.curvature))));
}
export function railingGeometry(g) {
  const parts = [];
  const radius = g.architecture?.railRadius ?? 0.025;
  for (const x of g.railX) {
    for (const row of g.rows) parts.push(new BoxGeometry(0.035, 1, 0.035).translate(x, row.elevation + 0.5, row.front + g.curvature * x * x));
    for (let i = 0; i < g.rows.length - 1; i++) {
      const row = g.rows[i], next = g.rows[i + 1];
      const a = new Vector3(x, row.elevation + 1, row.front + g.curvature * x * x);
      const b = new Vector3(x, next.elevation + 1, next.front + g.curvature * x * x);
      const direction = b.clone().sub(a), midpoint = a.clone().add(b).multiplyScalar(0.5);
      const part = new CylinderGeometry(radius, radius, direction.length(), 6);
      part.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
      part.translate(...midpoint.toArray()); parts.push(part);
    }
  }
  return bakeSurfaceShading(mergeStaticGeometry(parts));
}
