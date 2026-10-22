import { test, expect } from "@playwright/test";

async function screenState(page) {
  return JSON.parse(await page.locator("canvas").getAttribute("data-screen-projection"));
}
async function expectCoLa(page) {
  await expect(page.locator("canvas")).toHaveAttribute("data-screen-projection", /"image":\{/);
  const state = await screenState(page);
  expect(state.frame.size).toEqual([25, 25 / 1.90]);
  expect(state.frame.position).toEqual([0, 0]);
  expect(state.frame.margins.left).toBeCloseTo(0.65);
  expect(state.frame.margins.top).toBeCloseTo(3.3210526316);
  expect(state.image.size).toEqual([25, 25 / 1.90]);
  expect(state.image.position).toEqual([0, 0, 0.09]);
  expect(state.image.uv.repeat[1]).toBeCloseTo((1546 / 1080) / 1.90);
  expect(state.image.uv.offset[1]).toBeCloseTo((1 - (1546 / 1080) / 1.90) / 2);
  expect(state.image.flipY).toBe(true);
}
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`CoLa mesh and UV survive play/pause on ${viewport.width}px`, async ({ page }) => {
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/cinemas/paragon/imax/experience?seat=VP-12", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "หยุดชั่วคราว", exact: true })).toBeVisible();
    await expectCoLa(page);
    const before = await screenState(page);
    await page.mouse.move(200, 200);
    await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).focus();
    await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
    await expect(page.getByRole("button", { name: "เล่น", exact: true })).toBeVisible();
    expect(await screenState(page)).toEqual(before);
    await page.screenshot({ path: `output/playwright/paragon-cola-${viewport.width}.png` });
    await page.getByRole("button", { name: "เล่น", exact: true }).click();
    await expectCoLa(page);
    expect(errors).toEqual([]);
  });
}
test("calibration shares projector framing and keeps v1 geometry-only export", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/__dev/paragon/calibration");
  await expect(page.getByTestId("projection-size")).toHaveText("25.0000 × 13.1579 ม.");
  await expect(page.getByTestId("projection-offset")).toHaveText("0.00 / 0.00 ม.");
  await expectCoLa(page);
  await page.getByRole("button", { name: "จากที่นั่ง", exact: true }).click();
  await expectCoLa(page);
  await page.getByLabel("ขอบจอล่างเหนือพื้น", { exact: false }).fill("1.5");
  await expectCoLa(page);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "ดาวน์โหลด JSON" }).click();
  const download = await downloadEvent;
  const { readFile } = await import("node:fs/promises");
  const json = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(json.version).toBe(1);
  expect(json.calibration.screenBottom).toBe(1.5);
  expect(json.projection).toBeUndefined();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectCoLa(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("metadata pending leaves only the physical screen, then renders when ready", async ({ page }) => {
  let release;
  const hold = new Promise((resolve) => { release = resolve; });
  await page.route("**/media/*.mp4", async (route) => { await hold; await route.continue(); });
  try {
    await page.goto("/cinemas/paragon/imax/experience?seat=VP-12", { waitUntil: "domcontentloaded" });
    await expect(page.locator("canvas")).toHaveAttribute("data-screen-projection", /"image":null/);
    expect((await screenState(page)).frame.size).toEqual([25, 25 / 1.90]);
  } finally { release(); }
  await expectCoLa(page);
});
test("wide source replaces the cropped texture UV and fits within the same frame", async ({ page }) => {
  await page.addInitScript(() => {
    window.projectionVideos = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...args) {
      const element = create.call(this, tag, ...args);
      if (tag === "video") window.projectionVideos.push(element);
      return element;
    };
  });
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-12");
  await expectCoLa(page);
  // A real 2.39:1 stream supplies metadata and pixels without adding a product file picker.
  await page.evaluate(async () => {
    const video = window.projectionVideos.find((v) => v.videoWidth === 1546);
    const canvas = document.createElement("canvas");
    canvas.width = 478; canvas.height = 200;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fc0000"; context.fillRect(0, 0, 478, 100);
    context.fillStyle = "#0000fc"; context.fillRect(0, 100, 478, 100);
    video.pause(); video.removeAttribute("src");
    video.srcObject = canvas.captureStream(1);
    await video.play();
    // Keep the stream/canvas alive throughout acceptance checks.
    window.projectionStreamCanvas = canvas;
  });
  await expect.poll(async () => (await screenState(page)).image?.uv.repeat).toEqual([1, 1]);
  const wide = await screenState(page);
  expect(wide.frame.size).toEqual([25, 25 / 1.90]);
  expect(wide.image.size[0]).toBe(25);
  expect(wide.image.size[1]).toBeCloseTo(25 / 2.39);
  expect(wide.image.uv.offset).toEqual([0, 0]);
  await page.screenshot({ path: "output/playwright/paragon-cola-wide-orientation.png" });
  await page.evaluate(() => { window.projectionVideos.forEach((v) => v.srcObject?.getTracks().forEach((track) => track.stop())); });
});
test("invalid projection is reported before creating a WebGL scene", async ({ page }) => {
  await page.route("**/src/config/paragon/screen.js*", async (route) => {
    const response = await route.fetch();
    const code = await response.text();
    expect(code).toContain("width: 25");
    await route.fulfill({ response, body: code.replace("width: 25", "width: 40") });
  });
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-12");
  await expect(page.getByRole("alert")).toContainText("Projection area extends beyond the physical screen.");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page.locator(".seat-chip > span")).toHaveText(["VP12"]);
});
