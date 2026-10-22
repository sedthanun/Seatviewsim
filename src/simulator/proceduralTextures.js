import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, NoColorSpace } from "three";

function drawTexture(width, height, paint, repeat) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); paint(ctx, width, height);
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
  if (repeat) { texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(...repeat); }
  return texture;
}
export function useProceduralTextures(enabled = true) {
  const textures = useMemo(() => {
    if (!enabled) return null;
    let seed = 20261011;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const carpet = drawTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#75767e"; ctx.fillRect(0, 0, w, h);
      const colors = ["#444650", "#9a9ca3", "#686b77", "#84838a", "#565c71"];
      for (let i = 0; i < 16000; i++) {
        ctx.fillStyle = colors[Math.floor(random() * colors.length)];
        ctx.fillRect(random() * w, random() * h, 0.5 + random(), 0.5 + random());
      }
    }, [2, 2]);
    // Neutral acoustic foam sheets. Blue belongs to the separate light wash, never the material.
    const acousticFabric = (ctx, w, h) => {
      const shading = ctx.createLinearGradient(0, 0, w, h);
      shading.addColorStop(0, "#b5b5b5"); shading.addColorStop(0.5, "#a4a4a4"); shading.addColorStop(1, "#b0b0b0");
      ctx.fillStyle = shading; ctx.fillRect(0, 0, w, h);
      // Large sheets have restrained seams and uneven shallow creases; no triangular tiles.
      const seam = ctx.createLinearGradient(0, 0, 12, 0);
      seam.addColorStop(0, "#484848"); seam.addColorStop(1, "#a9a9a9");
      ctx.fillStyle = seam; ctx.fillRect(0, 0, 12, h);
      const horizontalSeam = ctx.createLinearGradient(0, 0, 0, 8);
      horizontalSeam.addColorStop(0, "#606060"); horizontalSeam.addColorStop(1, "#adadad");
      ctx.fillStyle = horizontalSeam; ctx.fillRect(0, 0, w, 8);
      for (let crease = 0; crease < 100; crease++) {
        const x = random() * w, y = random() * h, length = 12 + random() * 75;
        const endX = x + length, endY = y + (random() - 0.5) * 35;
        const bendX = x + length * 0.45, bendY = y + (random() - 0.5) * 28;
        for (const highlight of [false, true]) {
          const offset = highlight ? 1.5 : 0;
          ctx.strokeStyle = highlight ? "#e5e5e52e" : "#42424245";
          ctx.lineWidth = highlight ? 1.2 : 2.5;
          ctx.beginPath(); ctx.moveTo(x, y + offset);
          ctx.quadraticCurveTo(bendX, bendY + offset, endX, endY + offset); ctx.stroke();
        }
      }
      for (let i = 0; i < 28000; i++) {
        ctx.fillStyle = random() < 0.5 ? "#ffffff13" : "#00000020";
        ctx.fillRect(random() * w, random() * h, 0.7 + random(), 0.7 + random());
      }
    };
    const wall = drawTexture(512, 512, acousticFabric, [8, 5]);
    const ceiling = drawTexture(512, 512, acousticFabric, [8, 8]);
    // Opaque grayscale alpha mask: wide soft illumination strongest near the upper wall.
    const wash = drawTexture(128, 256, (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#202020"); gradient.addColorStop(0.45, "#878787");
      gradient.addColorStop(0.8, "#d0d0d0"); gradient.addColorStop(1, "#eeeeee");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    });
    wash.colorSpace = NoColorSpace;
    const stripGlow = drawTexture(128, 256, (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "#ffffff00"); gradient.addColorStop(0.35, "#ffffff12");
      gradient.addColorStop(0.5, "#ffffffc0"); gradient.addColorStop(0.65, "#ffffff12"); gradient.addColorStop(1, "#ffffff00");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-in";
      const ends = ctx.createLinearGradient(0, 0, 0, h);
      ends.addColorStop(0, "#ffffff00"); ends.addColorStop(0.04, "#ffffff");
      ends.addColorStop(0.96, "#ffffff"); ends.addColorStop(1, "#ffffff00");
      ctx.fillStyle = ends; ctx.fillRect(0, 0, w, h);
    });
    const exit = drawTexture(512, 192, (ctx, w, h) => {
      ctx.fillStyle = "#087b42"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#a7f9bc"; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 138px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("EXIT", w / 2, h / 2 + 8);
    });
    const glow = drawTexture(128, 128, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, "#ffffffa0"); gradient.addColorStop(0.3, "#ffffff60"); gradient.addColorStop(1, "#ffffff00");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    });
    return { carpet, wall, ceiling, wash, stripGlow, exit, glow };
  }, [enabled]);
  useEffect(() => () => Object.values(textures ?? {}).forEach((texture) => texture.dispose()), [textures]);
  return textures;
}
