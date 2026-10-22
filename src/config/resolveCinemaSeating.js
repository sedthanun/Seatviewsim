// Pure source-data expansion, not a renderer adapter. Input must pass structural validation.
// It never fills source fields or changes the supplied document.
export function resolveCinemaSeating(auditorium) {
  const { layout, seating, camera } = auditorium;
  const elevation = layout.elevation;
  let z = 0;
  const rows = layout.rows.map((row, index) => {
    z = index === 0 ? row.distanceFromScreen : z + row.distanceFromPrevious;
    const gradient = elevation.mode === "slope"
      ? Math.tan(elevation.degrees * Math.PI / 180)
      : elevation.mode === "rise" ? elevation.rise / elevation.run : 0;
    const y = elevation.mode === "custom" ? elevation.levels[index]
      : elevation.frontElevation + (z - layout.rows[0].distanceFromScreen) * gradient;
    return { rowId: row.id, z, elevation: y, front: z + row.frontOffset, back: z + row.backOffset };
  });
  const byRow = new Map(rows.map(row => [row.rowId, row]));
  const overrides = new Map(seating.seatOverrides.map(value => [value.seatId, value]));
  const seats = seating.rows.flatMap(seatingRow => {
    const row = byRow.get(seatingRow.rowId);
    return seatingRow.blocks.flatMap(block => block.numbers.flatMap((number, index) => {
      if (number === null) return [];
      const id = `${row.rowId}-${number}`;
      const x = block.startX + index * block.seatPitch;
      const override = overrides.get(id);
      return [{ id, rowId: row.rowId, number, category: block.category,
        position: override?.position ? [...override.position] : [x, row.elevation, row.z + layout.curvature * x * x],
        orientation: override?.yaw ?? block.yaw,
        eyeOffset: override?.eyeOffset ? [...override.eyeOffset] : [0, camera.eyeHeight, 0],
      }];
    }));
  });
  return { rows, seats };
}
