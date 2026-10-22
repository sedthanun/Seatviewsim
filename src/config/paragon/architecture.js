// World units are meters. These are reconstruction estimates, not surveyed dimensions.
export const architectureDefaults = Object.freeze({
  sideClearance: 3, wallThickness: 0.2, platformMargin: 0.255,
  centralAisle: 1.36, rearClearance: 2, railRadius: 0.025,
});

// Include every rendered chair part, rather than measuring seat centers or cushions alone.
export function seatFootprint(seat, appearance) {
  const parts = Object.entries(appearance).filter(([, part]) => part?.size && part?.offset);
  let left = Infinity, right = -Infinity, front = Infinity, back = -Infinity;
  const cos = Math.cos(seat.orientation), sin = Math.sin(seat.orientation);
  for (const [name, part] of parts) {
    for (const side of name === "arm" ? [-1, 1] : [1]) {
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        const localX = side * part.offset[0] + dx * part.size[0] / 2;
        const localZ = part.offset[2] + dz * part.size[2] / 2;
        const x = seat.position[0] + localX * cos + localZ * sin;
        const z = seat.position[2] - localX * sin + localZ * cos;
        left = Math.min(left, x); right = Math.max(right, x);
        front = Math.min(front, z); back = Math.max(back, z);
      }
    }
  }
  return { left, right, front, back };
}

export function buildArchitecture(seats, appearance, settings = architectureDefaults) {
  const values = { ...architectureDefaults, ...settings };
  if (Object.values(values).some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error("Architecture distances must be positive finite meters.");
  const footprints = seats.map((seat) => ({ ...seatFootprint(seat, appearance), rowId: seat.rowId }));
  const outerSeat = Math.max(...footprints.map((bounds) => Math.max(-bounds.left, bounds.right)));
  const innerWallX = outerSeat + values.sideClearance;
  const platformEdge = outerSeat + values.platformMargin;
  if (platformEdge >= innerWallX || values.railRadius >= values.platformMargin)
    throw new Error("The side aisle and railing must fit outside the chairs.");
  const rowClearances = [...new Set(seats.map((seat) => seat.rowId))].map((rowId) => {
    const bounds = footprints.filter((bounds) => bounds.rowId === rowId);
    const left = Math.min(...bounds.map((bounds) => bounds.left));
    const right = Math.max(...bounds.map((bounds) => bounds.right));
    return { rowId, seatLeft: left, seatRight: right, left: left + innerWallX, right: innerWallX - right };
  });
  return { ...values, innerWallX, platformEdge, rowClearances,
    width: 2 * innerWallX + values.wallThickness, sideAisleWidth: innerWallX - platformEdge };
}

export const wallInteriorX = (geometry) => geometry.width / 2 -
  (geometry.architecture?.wallThickness ?? architectureDefaults.wallThickness) / 2;
