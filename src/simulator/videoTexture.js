// Always set both values: a new/wider source must not retain an earlier crop.
export function applyVideoProjection(texture, layout) {
  texture.repeat.set(...(layout?.uv.repeat ?? [1, 1]));
  texture.offset.set(...(layout?.uv.offset ?? [0, 0]));
  texture.updateMatrix();
}
