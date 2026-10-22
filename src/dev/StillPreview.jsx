import { useLayoutEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import Auditorium from "../simulator/Auditorium";
import { paragonPrototype } from "../config/paragon";

function StillCamera({ position, target }) {
  const { camera } = useThree();
  useLayoutEffect(() => { camera.position.set(...position); camera.lookAt(...target); camera.updateProjectionMatrix(); }, [camera, position, target]);
  return null;
}

// Dev-only, paused and UI-free source for homepage artwork. No video is fetched.
export default function StillPreview() {
  const [video] = useState(() => document.createElement("video"));
  const [quality, setQuality] = useState(1);
  const config = paragonPrototype, rear = config.geometry.rows.at(-1);
  const viewpoint = [0, rear.elevation + 3, Math.max(...config.seats.map((s) => s.position[2])) + 0.8];
  const media = { video, source: "", state: { playing: false, error: "", width: 0, height: 0 } };
  return <div style={{ position: "fixed", inset: 0 }}><Canvas dpr={quality} gl={{ antialias: true }} camera={{ position: viewpoint, fov: 70, near: 0.05, far: 150 }}>
    <StillCamera position={viewpoint} target={[0, 4, 8]} />
    <Auditorium config={config} media={media} simple={false} viewpoint={viewpoint} onQualityChange={setQuality} />
  </Canvas></div>;
}
