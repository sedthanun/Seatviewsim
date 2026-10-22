import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const root = resolve("dist");
const scripts = (await readdir(resolve(root, "assets"))).filter((file) => file.endsWith(".js"));
for (const file of scripts) {
  const content = await readFile(resolve(root, "assets", file), "utf8");
  assert(!content.includes("Paragon Calibration"), "Calibration UI leaked into production");
  assert(!content.includes("/__dev/paragon/calibration"), "Calibration route leaked into production");
  assert(!content.includes("/__dev/paragon/still"), "Still capture route leaked into production");
  assert(!content.includes("/__dev/simulation-ui"), "Simulation UI preview route leaked into production");
  assert(!content.includes("TEST-A"), "Synthetic fixture leaked into production");
}
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".mp4": "video/mp4", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  try {
    let path = resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
    if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    let info = await stat(path).catch(() => null);
    if (!info?.isFile()) { path = resolve(root, "index.html"); info = await stat(path); }
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0, end = range && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    const headers = { "Content-Type": mime[extname(path)] || "application/octet-stream", "Accept-Ranges": "bytes", "Content-Length": end - start + 1 };
    if (range) headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    response.writeHead(range ? 206 : 200, headers);
    createReadStream(path, { start, end }).pipe(response);
  } catch { response.writeHead(500).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.productionVideos = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...args) {
      const element = create.call(this, tag, ...args);
      if (tag === "video") window.productionVideos.push(element);
      return element;
    };
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/__dev/paragon/calibration`);
  await page.getByRole("heading", { name: "Seat View Simulator", exact: true }).waitFor();
  assert.equal(await page.getByRole("radio").count(), 11);
  assert.equal(await page.locator("canvas, video").count(), 0);
  await page.waitForFunction(() => { const image = document.querySelector(".entry-backdrop img"); return image?.complete && image.naturalWidth > 0; });
  assert.equal(await page.getByRole("heading", { name: "Paragon Calibration" }).count(), 0);
  await page.goto(`${base}/__dev/simulation-ui`);
  await page.getByRole("heading", { name: "Seat View Simulator", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "ที่นั่งถัดไป" }).count(), 0);
  assert.equal(await page.locator("canvas").count(), 0);
  await page.goto(`${base}/cinemas/paragon/imax/experience?seat=VP-6`);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).waitFor();
  assert.equal(await page.locator(".simulation-seat strong").textContent(), "VP6");
  assert(await page.getByRole("combobox", { name: "รูปแบบวิดีโอ (ตัวอย่างปุ่ม)" }).isDisabled());
  assert.equal(await page.locator(".simulation-video-field > span").textContent(), "วิดีโอ");
  assert(await page.getByRole("button", { name: "ที่นั่งก่อนหน้า", exact: true }).isDisabled());
  assert(await page.getByRole("button", { name: "ที่นั่งถัดไป", exact: true }).isDisabled());
  await page.waitForFunction(() => {
    const state = document.querySelector("canvas")?.dataset.screenProjection;
    return state && JSON.parse(state).image;
  });
  const projection = JSON.parse(await page.locator("canvas").getAttribute("data-screen-projection"));
  assert.deepEqual(projection.frame.size, [25, 25 / 1.90]);
  assert.deepEqual(projection.image.size, [25, 25 / 1.90]);
  assert(Math.abs(projection.image.uv.repeat[1] - (1546 / 1080) / 1.90) < 1e-9);
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await page.getByRole("button", { name: "ลบที่นั่ง VP6", exact: true }).waitFor();
  assert.equal(await page.getByLabel("เลือกหรือพิมพ์ที่นั่ง").inputValue(), "");
  await page.goto(`${base}/cinemas/paragon/imax/experience?seat=VP-6&seats=VP-6&seats=A-2`);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).waitFor();
  await page.evaluate(() => {
    window.productionCanvas = document.querySelector("canvas");
    window.productionVideo = window.productionVideos.find((video) => video.hasAttribute("src"));
    window.productionVideoTime = window.productionVideo.currentTime;
  });
  assert(!(await page.getByRole("button", { name: "ที่นั่งถัดไป", exact: true }).isDisabled()));
  await page.getByRole("button", { name: "ที่นั่งถัดไป", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".simulation-seat strong")?.textContent === "A2");
  assert.equal(await page.locator(".simulation-seat-count").textContent(), "2 / 2");
  assert(await page.getByRole("button", { name: "ที่นั่งถัดไป", exact: true }).isDisabled());
  assert(await page.evaluate(() => document.querySelector("canvas") === window.productionCanvas && window.productionVideo.hasAttribute("src") && !window.productionVideo.paused && window.productionVideo.currentTime >= window.productionVideoTime));
  await page.getByRole("button", { name: "กลับหน้าแรก", exact: true }).click();
  await page.getByRole("button", { name: "ลบที่นั่ง A2", exact: true }).waitFor();
  assert.deepEqual(await page.locator(".seat-chip > span").allTextContents(), ["VP6", "A2"]);
  console.log("Production checks passed: preview fixtures excluded, single/multi-seat URLs, disabled video selector, CoLa projection, continuous video/canvas and restored chips.");
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
