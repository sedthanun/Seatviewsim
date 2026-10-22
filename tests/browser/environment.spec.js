import { test, expect } from "@playwright/test";
test.setTimeout(60000);

async function captureVideo(page) {
  await page.addInitScript(() => {
    window.environmentVideos = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...args) {
      const result = create.call(this, tag, ...args);
      if (tag === "video") window.environmentVideos.push(result);
      return result;
    };
  });
}
test("house lights follow playback while both EXIT signs stay visible; rear and wall visual checks", async ({ page }) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await captureVideo(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-12");
  const canvas = page.locator("canvas");
  await expect(page.getByRole("button", { name: "หยุดชั่วคราว", exact: true })).toBeVisible();
  await expect(canvas).toHaveAttribute("data-house-light-level", "0.200", { timeout: 10000 });
  await expect(canvas).toHaveAttribute("data-exit-signs", "2");
  await expect(canvas).toHaveAttribute("data-wall-strips", "12");
  await expect(canvas).toHaveAttribute("data-warm-sconces", "4");
  await page.screenshot({ path: "output/playwright/paragon-playing.png" });
  await page.mouse.move(400, 200);
  await expect(page.locator(".simulation-controls")).not.toHaveClass(/is-hidden/);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-house-light-level", "1.000", { timeout: 10000 });
  await page.screenshot({ path: "output/playwright/paragon-paused.png" });
  await canvas.focus();
  for (let i = 0; i < 15; i++) await canvas.press("ArrowLeft");
  for (let i = 0; i < 5; i++) await canvas.press("ArrowDown");
  await page.screenshot({ path: "output/playwright/paragon-left-exit.png" });
  await page.getByRole("button", { name: "หันกลับหาจอ" }).click();
  await canvas.focus();
  for (let i = 0; i < 15; i++) await canvas.press("ArrowRight");
  for (let i = 0; i < 5; i++) await canvas.press("ArrowDown");
  await page.screenshot({ path: "output/playwright/paragon-right-exit.png" });
  await page.getByRole("button", { name: "เล่น", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-house-light-level", "0.200", { timeout: 10000 });
  await page.evaluate(() => {
    const video = window.environmentVideos.find((video) => video.hasAttribute("src") && Number.isFinite(video.duration) && video.duration > 0);
    video.currentTime = video.duration - 0.1;
  });
  await expect.poll(() => page.evaluate(() => window.environmentVideos.some((video) => video.hasAttribute("src") && video.ended)), { timeout: 10000 }).toBe(true);
  await expect(canvas).toHaveAttribute("data-house-light-level", "1.000", { timeout: 10000 });
  await expect(canvas).toHaveAttribute("data-exit-signs", "2");
  await expect(canvas).toHaveAttribute("data-wall-strips", "12");
  await expect(canvas).toHaveAttribute("data-warm-sconces", "4");
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page.locator(".seat-chip > span")).toHaveText(["VP12"]);
  expect(errors).toEqual([]);
});
test("mobile keeps all environment details and light lifecycle with preserved seat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cinemas/paragon/imax/experience?seat=A-18");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-house-light-level", "0.200", { timeout: 15000 });
  await expect(canvas).toHaveAttribute("data-exit-signs", "2");
  await expect(canvas).toHaveAttribute("data-wall-strips", "12");
  await expect(canvas).toHaveAttribute("data-warm-sconces", "4");
  await page.mouse.move(200, 200);
  await expect(page.locator(".simulation-controls")).not.toHaveClass(/is-hidden/);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).focus();
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-house-light-level", "1.000", { timeout: 10000 });
  await canvas.focus();
  for (let i = 0; i < 15; i++) await canvas.press("ArrowLeft");
  for (let i = 0; i < 5; i++) await canvas.press("ArrowDown");
  await page.screenshot({ path: "output/playwright/paragon-environment-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".seat-chip > span")).toHaveText(["A18"]);
});
test("blocked autoplay and broken media restore bright lights without disabling EXIT", async ({ page }) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Blocked", "NotAllowedError")); });
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-12");
  await expect(page.getByText("เบราว์เซอร์บล็อกการเล่นอัตโนมัติ", { exact: false })).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute("data-house-light-level", "1.000");
  await expect(page.locator("canvas")).toHaveAttribute("data-exit-signs", "2");
  await page.route("**/media/*.mp4", (route) => route.fulfill({ contentType: "video/mp4", body: "bad video" }));
  await page.reload();
  await expect(page.getByText("ไม่สามารถเล่นวิดีโอได้", { exact: false })).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute("data-house-light-level", "1.000");
  await expect(page.locator("canvas")).toHaveAttribute("data-exit-signs", "2");
});
