import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Run against npm run dev; the capture route is excluded from production.
await mkdir("output/playwright", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("http://127.0.0.1:5173/__dev/paragon/still");
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.houseLightLevel === "1.000");
  await page.locator("canvas").screenshot({ path: "output/playwright/paragon-home-source.png" });
} finally { await browser.close(); }
execFileSync("python", ["-c", `from PIL import Image, ImageOps
from pathlib import Path
image = Image.open('output/playwright/paragon-home-source.png').convert('RGB')
target = Path('public/images')
image.save(target / 'paragon-home-desktop.webp', quality=85, method=6)
ImageOps.fit(image, (780, 1200), method=Image.Resampling.LANCZOS).save(target / 'paragon-home-mobile.webp', quality=85, method=6)
ImageOps.fit(image, (600, 340), method=Image.Resampling.LANCZOS).save(target / 'paragon-thumbnail.webp', quality=88, method=6)
print('Exported desktop/mobile/thumbnail WebP from the paused Paragon model.')`], { stdio: "inherit" });
