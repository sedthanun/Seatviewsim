import { cameraDefaults } from "../config/camera";
// TEST FIXTURE ONLY. These dimensions and seat IDs do not describe Paragon.
const rows = [
  { label: "TEST-A", z: 8, y: 0, count: 8 },
  { label: "TEST-B", z: 11, y: 0.65, count: 10 },
  { label: "TEST-C", z: 14, y: 1.3, count: 12 },
  { label: "TEST-D", z: 17, y: 1.95, count: 12 },
];
export const fixture = {
  id: "synthetic",
  name: "Synthetic test auditorium",
  referenceStatus: "synthetic",
  screen: { width: 12, height: 7, position: [0, 5, 0], rotation: [0, 0, 0] },
  geometry: {
    width: 20,
    depth: 22,
    height: 12,
    rows: rows.map((r) => ({ z: r.z, elevation: r.y, depth: 3 })),
    aisles: [{ x: 0, width: 1.4 }],
    seatColor: "#384e69",
  },
  camera: { ...cameraDefaults, target: [0, 5, 0] },
  seats: rows.flatMap((r) =>
    Array.from({ length: r.count }, (_, i) => ({
      id: `${r.label}-${i + 1}`,
      rowId: r.label,
      number: String(i + 1),
      category: i === 0 ? "test-premium" : "standard",
      position: [
        (i - (r.count - 1) / 2) * 0.85 + (i < r.count / 2 ? -0.7 : 0.7),
        r.y,
        r.z,
      ],
      orientation: 0,
      eyeOffset: [0, 1.15, 0],
    })),
  ),
};
