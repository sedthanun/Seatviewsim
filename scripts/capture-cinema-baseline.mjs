import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";

// Explicit maintenance command only. Tests read this frozen artifact; never regenerate it.
const server = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { defaultParagon } = await server.ssrLoadModule("/src/config/paragon/layout.js");
  const { eyePosition, projectVideo } = await server.ssrLoadModule("/src/simulator/math.js");
  const baseline = {
    baselineVersion: 1,
    capturedAt: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()),
    source: "Current JavaScript Paragon prototype before Cinema JSON migration",
    toleranceMeters: 1e-6,
    reportedCapacity: 421,
    configuredCapacity: defaultParagon.seats.length,
    config: defaultParagon,
    eyes: defaultParagon.seats.map(seat => ({ id: seat.id, position: eyePosition(seat, defaultParagon.camera.eyeHeight) })),
    videoProjections: [[1546, 1080], [1900, 1000], [2390, 1000]].map(([width, height]) => ({
      sourceSize: [width, height], result: projectVideo(defaultParagon.screen, defaultParagon.projection, width, height),
    })),
  };
  const directory = new URL("../tests/baselines/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("paragon-v1.json", directory), JSON.stringify(baseline, null, 2) + "\n");
  console.log(`Captured ${baseline.configuredCapacity} seats, floor/camera/screen/environment and three projection samples.`);
} finally { await server.close(); }
