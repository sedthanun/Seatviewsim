export function eyePosition(seat, eyeHeight = 1.15) {
  const [x, y, z] = seat.position;
  const [ox, oy, oz] = seat.eyeOffset ?? [0, eyeHeight, 0];
  const a = seat.orientation ?? 0;
  return [
    x + ox * Math.cos(a) + oz * Math.sin(a),
    y + oy,
    z - ox * Math.sin(a) + oz * Math.cos(a),
  ];
}
export function fitVideo(width, height, videoWidth, videoHeight) {
  if (
    ![width, height, videoWidth, videoHeight].every(
      (v) => Number.isFinite(v) && v > 0,
    )
  )
    return null;
  const scale = Math.min(width / videoWidth, height / videoHeight);
  return [videoWidth * scale, videoHeight * scale];
}
export function validateConfig(config) {
  const errors = [];
  if (
    !config?.screen ||
    ![config.screen.width, config.screen.height].every(
      (v) => v > 0 && Number.isFinite(v),
    )
  )
    errors.push("Screen dimensions are missing.");
  errors.push(...validateProjection(config?.screen, config?.projection));
  if (!config?.seats?.length) errors.push("Seat references are missing.");
  const ids = new Set();
  for (const s of config?.seats ?? []) {
    if (!s.id || ids.has(s.id)) errors.push("Seat IDs must be unique.");
    ids.add(s.id);
    if (
      !s.rowId ||
      s.number == null ||
      s.position?.length !== 3 ||
      !s.position.every(Number.isFinite) ||
      !Number.isFinite(s.orientation)
    )
      errors.push(`Invalid seat ${s.id}.`);
  }
  return errors;
}
export function validateProjection(screen, projection) {
  if (projection == null) return [];
  if (
    ![screen?.width, screen?.height, projection.width, projection.aspectRatio].every(
      (v) => Number.isFinite(v) && v > 0,
    ) ||
    !Array.isArray(projection.offset) || projection.offset.length !== 2 ||
    !projection.offset.every(Number.isFinite) ||
    projection.tallContentMode !== "crop"
  ) return ["Projection dimensions, offset or crop policy are invalid."];
  const height = projection.width / projection.aspectRatio;
  if (!Number.isFinite(height) || height <= 0 ||
    Math.abs(projection.offset[0]) + projection.width / 2 > screen.width / 2 ||
    Math.abs(projection.offset[1]) + height / 2 > screen.height / 2
  ) return ["Projection area extends beyond the physical screen."];
  return [];
}
// Size and position are local to the physical screen, in meters.
export function projectionBounds(screen, projection) {
  const errors = validateProjection(screen, projection);
  if (errors.length) throw new Error(errors.join(" "));
  const size = projection ? [projection.width, projection.width / projection.aspectRatio] : [screen.width, screen.height];
  const position = projection ? [...projection.offset] : [0, 0];
  const [width, height] = size, [x, y] = position;
  return { size, position, margins: {
    left: (screen.width - width) / 2 + x, right: (screen.width - width) / 2 - x,
    bottom: (screen.height - height) / 2 + y, top: (screen.height - height) / 2 - y,
  } };
}
export function projectVideo(screen, projection, videoWidth, videoHeight) {
  const frame = projectionBounds(screen, projection);
  if (![videoWidth, videoHeight].every((v) => Number.isFinite(v) && v > 0)) return null;
  const sourceRatio = videoWidth / videoHeight;
  const crop = Boolean(projection) && sourceRatio < projection.aspectRatio;
  const size = projection && sourceRatio <= projection.aspectRatio ? [...frame.size] : fitVideo(...frame.size, videoWidth, videoHeight);
  if (!size) return null;
  const visibleHeight = crop ? sourceRatio / projection.aspectRatio : 1;
  return { frame, size, position: [...frame.position], uv: {
    repeat: [1, visibleHeight], offset: [0, (1 - visibleHeight) / 2],
  } };
}
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
