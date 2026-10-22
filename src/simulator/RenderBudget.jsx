import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
export default function RenderBudget({ onQualityChange }) {
  const { gl, setDpr } = useThree();
  const sample = useRef({ time: 0, frames: 0, warmup: 0 });
  useFrame((_, delta) => {
    const s = sample.current;
    s.warmup += delta;
    if (s.warmup < 3) return;
    s.time += delta; s.frames++;
    if (s.time < 2) return;
    const fps = s.frames / s.time, dpr = gl.getPixelRatio();
    const update = onQualityChange ?? setDpr;
    if (fps < 25 && dpr > 0.55) update(Math.max(0.55, dpr - 0.15));
    else if (fps > 55 && dpr < 1) update(Math.min(1, dpr + 0.05));
    s.time = 0; s.frames = 0;
  });
  return null;
}
