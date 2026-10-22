import { wallInteriorX } from "./architecture";

// Based on the supplied blue-lit auditorium photograph; all fixture dimensions are estimates.
export const environmentDefaults = {
  materials: { wall: "#181818", ceiling: "#141414", carpet: "#62616b", railing: "#454b60", back: "#292a38", arm: "#292c3a" },
  wash: { wallColor: "#075bff", ceilingColor: "#0640d5" },
  strips: { countPerSide: 6, width: 0.045, bottom: 0.35, ceilingGap: 0.6, color: "#65e7ff", haloColor: "#0879ff", haloWidth: 0.85 },
  sconces: { countPerSide: 2, heightAboveFloor: 4.1, color: "#ffbb63", intensity: 24, distance: 7 },
  exits: { width: 1.2, height: 2.2, landingDepth: 1.8, signWidth: 0.75, signHeight: 0.28, lightIntensity: 3 },
  lighting: { ambient: 0.85, hemisphere: 1.1, overhead: 1.4, wallFill: 0.45, rearWallFill: 0.25, dimLevel: 0.2, transitionSeconds: 1.2, desktopSconceLights: 2, mobileSconceLights: 0 },
};
export function buildEnvironment(geometry, settings = environmentDefaults) {
  const first = geometry.rows[0], last = geometry.rows.at(-1), curve = geometry.curvature;
  const innerWallX = wallInteriorX(geometry), wallX = innerWallX - 0.08;
  const landing = { left: -innerWallX, right: innerWallX,
    front: first.front - settings.exits.landingDepth, back: first.front, elevation: first.elevation, rowId: "front-landing" };
  const exits = [-1, 1].map((side) => ({ id: side < 0 ? "left" : "right", side,
    position: [side * wallX, first.elevation, (landing.front + landing.back) / 2 + curve * wallX * wallX],
    rotation: [0, -side * Math.PI / 2, 0], ...settings.exits }));
  const fixtures = [-1, 1].flatMap((side) => Array.from({ length: settings.strips.countPerSide }, (_, i) => {
    const z = first.z + (last.z - first.z) * (settings.strips.countPerSide === 1 ? 0.5 : i / (settings.strips.countPerSide - 1));
    const row = geometry.rows.reduce((best, row) => Math.abs(row.z - z) < Math.abs(best.z - z) ? row : best);
    return { id: `${side}-${i}`, side, index: i, floor: row.elevation,
      stripHeight: geometry.height - settings.strips.ceilingGap - row.elevation - settings.strips.bottom,
      sconce: i >= settings.strips.countPerSide - settings.sconces.countPerSide,
      position: [side * wallX, row.elevation, z + curve * wallX * wallX], rotation: [0, -side * Math.PI / 2, 0] };
  }));
  return { ...settings, landing, exits, fixtures };
}
