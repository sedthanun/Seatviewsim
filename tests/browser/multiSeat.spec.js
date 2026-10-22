import { test, expect } from "@playwright/test";
import { Quaternion, Vector3 } from "three";

const input = (page) => page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง", exact: true });
const chips = (page) => page.locator(".seat-chip > span");
const next = (page) => page.getByRole("button", { name: "ที่นั่งถัดไป", exact: true });
const previous = (page) => page.getByRole("button", { name: "ที่นั่งก่อนหน้า", exact: true });
const code = (page) => page.locator(".simulation-seat strong");
const cameraState = async (page) => JSON.parse(await page.locator("canvas").getAttribute("data-seat-camera"));
const scene = "/__dev/entry/cinemas/synthetic/imax/experience?seat=TEST-A-1&seats=TEST-A-1&seats=TEST-B-5&seats=TEST-C-12";
async function add(page, value) { await input(page).fill(value); await input(page).press("Enter"); }
async function idle(page, seatId) {
  await expect.poll(async () => {
    const state = await cameraState(page);
    return !state.transitioning && (!seatId || state.seatId === seatId);
  }, { timeout: 10000 }).toBe(true);
}
function expectPosition(state, expected) {
  state.position.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
  const actualDirection = new Vector3(0, 0, -1).applyQuaternion(new Quaternion(...state.quaternion));
  const screenDirection = new Vector3(0, 5, 0).sub(new Vector3(...expected)).normalize();
  expect(actualDirection.distanceTo(screenDirection)).toBeLessThan(1e-5);
}

test("chips keep selection order, reject duplicates and a seventh seat, and support keyboard removal", async ({ page }) => {
  await page.goto("/");
  const selected = ["VP12", "A2", "L4", "B18", "VP1", "A3"];
  for (const value of selected) await add(page, value);
  await expect(chips(page)).toHaveText(selected);
  await expect(input(page)).toHaveValue("");
  await expect(page.locator("#seat-selection-count")).toContainText("6 / 6");
  await add(page, "VP12");
  await expect(chips(page)).toHaveText(selected);
  await expect(page.getByRole("status")).toContainText("ถูกเลือกแล้ว");
  await add(page, "A4");
  await expect(page.getByRole("alert")).toContainText("สูงสุด 6");
  await expect(chips(page)).toHaveText(selected);
  await input(page).fill("K99");
  await page.getByRole("button", { name: "Enter Simulation" }).click();
  await expect(page.getByRole("alert")).toContainText("ไม่พบที่นั่ง");
  await expect(chips(page)).toHaveText(selected);
  await page.getByRole("button", { name: "ลบที่นั่ง B18", exact: true }).click();
  await expect(input(page)).toBeFocused();
  await add(page, "B18");
  await expect(chips(page)).toHaveText(["VP12", "A2", "L4", "VP1", "A3", "B18"]);
  await input(page).press("Backspace");
  await expect(page.getByRole("button", { name: "ลบที่นั่ง B18", exact: true })).toBeFocused();
  await page.keyboard.press("Delete");
  await expect(chips(page)).toHaveCount(5);
  await expect(input(page)).toBeFocused();
  await add(page, "B18");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".seat-chip").first()).toHaveCSS("font-family", '"Google Sans", sans-serif');
    await input(page).fill("VP");
    const list = await page.getByRole("listbox").boundingBox();
    expect(list.x).toBeGreaterThanOrEqual(0);
    expect(list.x + list.width).toBeLessThanOrEqual(width);
    expect(list.y).toBeGreaterThanOrEqual(0);
    expect(list.y + list.height).toBeLessThanOrEqual(width === 1440 ? 1000 : 844);
    await input(page).press("Escape");
    await input(page).fill("");
    await input(page).press("Escape");
    await page.screenshot({ path: `output/playwright/multi-seat-chips-${width}.png`, fullPage: true });
  }
});

test("map edits remain a draft, enforce six seats, and sync all chips on confirmation", async ({ page }) => {
  await page.goto("/?branch=paragon&seat=A2");
  await input(page).fill("VP");
  const open = page.getByRole("button", { name: "เลือกจากผังโรง", exact: true });
  const dialog = page.getByRole("dialog");
  const seat = (value) => dialog.getByRole("button", { name: new RegExp(`^ที่นั่ง ${value} แถว`) });
  await open.click();
  await seat("L4").click();
  await seat("A2").click();
  await dialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(chips(page)).toHaveText(["A2"]);
  await expect(input(page)).toHaveValue("VP");
  await expect(open).toBeFocused();
  await open.click();
  for (const value of ["L4", "VP12", "A3", "A4", "A5"]) await seat(value).click();
  await expect(dialog.locator('.seat[aria-pressed="true"]')).toHaveCount(6);
  await expect(seat("A6")).toHaveAttribute("aria-disabled", "true");
  await seat("A6").press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("สูงสุด 6");
  await seat("A2").click();
  await seat("A6").click();
  await page.setViewportSize({ width: 390, height: 480 });
  await expect(dialog.getByRole("button", { name: "ยืนยันที่นั่ง" })).toBeInViewport();
  await dialog.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  await expect(chips(page)).toHaveText(["L4", "VP12", "A3", "A4", "A5", "A6"]);
  await expect(input(page)).toHaveValue("");
  await expect(open).toBeFocused();
  await page.getByRole("button", { name: "โรงถัดไป", exact: true }).click();
  await expect(chips(page)).toHaveCount(0);
  await expect(input(page)).toBeDisabled();
});

test("real camera transitions, rapid retargeting and reset retain the canvas and video state", async ({ page }) => {
  await page.addInitScript(() => {
    window.seatVideos = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...args) {
      const element = create.call(this, tag, ...args);
      if (tag === "video") {
        element.loadCalls = 0;
        const load = element.load;
        element.load = function (...args) { this.loadCalls++; return load.apply(this, args); };
        window.seatVideos.push(element);
      }
      return element;
    };
  });
  await page.goto(scene);
  await expect(page.locator("canvas")).toHaveAttribute("data-seat-camera", /"transitioning":false/);
  expectPosition(await cameraState(page), [-3.675, 1.15, 8]);
  await page.waitForFunction(() => window.seatVideos.some((video) => video.hasAttribute("src") && video.readyState >= 3));
  await page.evaluate(async () => {
    window.activeSeatVideo = window.seatVideos.find((video) => video.hasAttribute("src"));
    const video = window.activeSeatVideo;
    video.loop = true; video.muted = false; video.volume = .35;
    await video.play();
    window.originalSeatCanvas = document.querySelector("canvas");
    window.originalSeatSource = video.src;
    window.originalSeatLoads = video.loadCalls;
  });
  await page.locator("canvas").focus();
  await page.keyboard.press("ArrowRight");
  await next(page).click();
  await expect(code(page)).toHaveText("B5");
  await expect(page.locator(".simulation-seat-count")).toHaveText("2 / 3");
  await expect.poll(async () => (await cameraState(page)).transitioning).toBe(true);
  await page.getByRole("button", { name: "หันกลับหาจอ", exact: true }).click();
  await next(page).click();
  await expect(code(page)).toHaveText("C12");
  await expect(next(page)).toBeDisabled();
  await idle(page, "TEST-C-12");
  expectPosition(await cameraState(page), [5.375, 2.45, 14]);
  expect(await page.evaluate(() => {
    const video = window.activeSeatVideo;
    return document.querySelector("canvas") === window.originalSeatCanvas && video.src === window.originalSeatSource && video.loadCalls === window.originalSeatLoads && !video.paused && !video.muted && video.volume === .35;
  })).toBe(true);
  await page.evaluate(() => { window.activeSeatVideo.pause(); window.activeSeatVideo.currentTime = 3; });
  await page.waitForFunction(() => !window.activeSeatVideo.seeking);
  await previous(page).click();
  await idle(page, "TEST-B-5");
  expectPosition(await cameraState(page), [-1.125, 1.8, 11]);
  expect(await page.evaluate(() => window.activeSeatVideo.paused && Math.abs(window.activeSeatVideo.currentTime - 3) < .01 && window.activeSeatVideo.loadCalls === window.originalSeatLoads)).toBe(true);
  expect(new URL(page.url()).searchParams.get("seat")).toBe("TEST-B-5");
  await page.reload();
  await expect(code(page)).toHaveText("B5");
  await expect(page.locator(".simulation-seat-count")).toHaveText("2 / 3");
  await idle(page, "TEST-B-5");
  expectPosition(await cameraState(page), [-1.125, 1.8, 11]);
});

test("all selections and map focus survive exit, Escape and browser Back after switching seats", async ({ page }) => {
  await page.goto("/__dev/entry/");
  const open = page.getByRole("button", { name: "เลือกจากผังโรง", exact: true });
  await open.click();
  for (const value of ["A4", "B5"]) await page.getByRole("dialog").getByRole("button", { name: new RegExp(`^ที่นั่ง ${value} แถว`) }).click();
  await page.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  for (const exit of ["button", "escape", "back"]) {
    await page.getByRole("button", { name: "Enter Simulation" }).click();
    await expect(code(page)).toHaveText("A4");
    await expect(previous(page)).toBeDisabled();
    await next(page).click();
    await expect(code(page)).toHaveText("B5");
    if (exit === "button") await page.getByRole("button", { name: "กลับหน้าแรก", exact: true }).click();
    else if (exit === "escape") await page.keyboard.press("Escape");
    else await page.goBack();
    await expect(chips(page)).toHaveText(["A4", "B5"]);
    await expect(open).toBeFocused();
  }
});

test("valid legacy and duplicate links load safely while invalid multi-seat links never start 3D", async ({ page }) => {
  await page.goto("/?branch=paragon&seat=vp12");
  await expect(chips(page)).toHaveText(["VP12"]);
  await page.goto("/__dev/entry/cinemas/synthetic/imax/experience?seats=TEST-B-5&seats=TEST-A-1&seats=TEST-B-5");
  await expect(code(page)).toHaveText("B5");
  await expect(page.locator(".simulation-seat-count")).toHaveText("1 / 2");
  for (const query of ["seats=missing", "seat=TEST-C-12&seats=TEST-A-1", Array.from({ length: 7 }, (_, i) => `seats=TEST-A-${i + 1}`).join("&")]) {
    await page.goto(`/__dev/entry/cinemas/synthetic/imax/experience?${query}`);
    await expect(input(page)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText(/ไม่พบที่นั่ง|สูงสุด 6/);
  }
});

test("reduced motion changes seats immediately and preview uses the real camera", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(scene);
  await expect(code(page)).toHaveText("A1");
  await next(page).click();
  await expect(code(page)).toHaveText("B5");
  await idle(page, "TEST-B-5");
  expectPosition(await cameraState(page), [-1.125, 1.8, 11]);
  expect((await cameraState(page)).transitioning).toBe(false);
  await page.goto("/__dev/simulation-ui");
  await expect(code(page)).toHaveText("TEST-A1");
  const before = await cameraState(page);
  await next(page).click();
  await expect(code(page)).toHaveText("TEST-A2");
  await idle(page, "TEST-A-2");
  expect((await cameraState(page)).position).not.toEqual(before.position);
  await expect(page.getByText("ตัวอย่าง UI — มุมมองคงที่", { exact: true })).toHaveCount(0);
});
