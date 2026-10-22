import { test, expect } from "@playwright/test";

test("homepage glass panel keeps aligned controls and readable type across viewports", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 480 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const heading = page.locator("#cinema-picker-title");
    const label = page.locator('label[for="seat-code"]');
    await expect(heading).toHaveCSS("font-size", "14px");
    await expect(label).toHaveCSS("font-size", "14px");
    await expect(label).toHaveCSS("font-family", 'Prompt, sans-serif');
    await expect(heading).toHaveCSS("font-family", 'Prompt, sans-serif');
    await expect(page.locator(".entry-description")).toHaveCSS("font-family", '"Google Sans", sans-serif');
    await expect(page.locator(".entry-dev-note")).toHaveCSS("font-family", '"Google Sans", sans-serif');
    await expect(page.locator(".entry-credit")).toHaveCSS("font-family", '"Google Sans", sans-serif');
    const h = await heading.boundingBox(), l = await label.boundingBox();
    expect(Math.abs(h.x - l.x)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const input = page.getByRole("combobox");
    await expect(input).toHaveCSS("font-size", "16px");
    await expect(page.locator(".seat-input-shell")).toHaveCSS("min-height", "52px");
    if (viewport.height > 480) await page.screenshot({ path: `output/playwright/glass-home-${viewport.width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Enter Simulation" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await input.fill("A2");
    await expect(page.getByRole("listbox")).toBeInViewport();
    await input.press("Escape");
  }
  const noteFont = await page.evaluate(async () => {
    const faces = await document.fonts.load('400 16px "Google Sans"', "เลือกที่นั่ง");
    return faces.map((face) => face.status);
  });
  expect(noteFont.length).toBeGreaterThan(0);
  expect(noteFont.every((status) => status === "loaded")).toBe(true);
});

test("carousel selects upcoming venues, clears seats and retains the fixed backdrop", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?branch=paragon&seat=A2");
  const selected = page.getByRole("radio", { name: "พารากอน ซีนีเพล็กซ์", exact: true });
  const input = page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" });
  const background = page.locator(".entry-backdrop img");
  await expect.poll(() => background.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole("button", { name: "โรงก่อนหน้า" })).toBeDisabled();
  await selected.focus(); await selected.press("ArrowRight");
  const upcoming = page.getByRole("radio", { name: "เมเจอร์ รัชโยธิน (Coming Soon)", exact: true });
  await expect(upcoming).toBeFocused(); await expect(upcoming).toHaveAttribute("aria-checked", "true");
  await expect(input).toHaveValue(""); await expect(input).toBeDisabled();
  await expect(page.getByRole("button", { name: "เลือกจากผังโรง" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Enter Simulation" })).toBeDisabled();
  await upcoming.press("End");
  await expect(page.getByRole("radio", { name: "เมเจอร์ รังสิต (Coming Soon)", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "โรงถัดไป" })).toBeDisabled();
  await page.keyboard.press("Home"); await expect(input).toBeEnabled();
  await expect(background).toHaveAttribute("src", "/images/paragon-home-desktop.webp");
  await expect(page.locator("canvas, video")).toHaveCount(0);
  expect(requests.filter((url) => /\.mp4|\/src\/simulator\/(Experience|Auditorium)\.jsx/.test(url))).toEqual([]);
  await page.goto("/?branch=ratchayothin&seat=A2");
  await expect(upcoming).toHaveAttribute("aria-checked", "true");
  await expect(input).toBeDisabled();
});

test("seat map confirms only real seats, cancels drafts and traps/restores focus", async ({ page }) => {
  await page.goto("/?branch=paragon&seat=A2");
  const input = page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" });
  const opener = page.getByRole("button", { name: "เลือกจากผังโรง", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "เลือกที่นั่งจากผังโรง" });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const bounds = await dialog.boundingBox();
    expect(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
  }
  const a2 = dialog.getByRole("button", { name: /^ที่นั่ง A2 แถว/ });
  await expect(a2).toHaveAttribute("aria-pressed", "true"); await expect(a2).toBeFocused();
  await expect(dialog.locator(".seat")).toHaveCount(426);
  await expect(dialog.getByRole("button", { name: /^ที่นั่ง K1 แถว/ })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /^ที่นั่ง L3 แถว/ })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /^ที่นั่ง VP/ })).toHaveCount(22);
  const l4 = dialog.getByRole("button", { name: /^ที่นั่ง L4 แถว/ });
  await l4.click(); await expect(dialog.locator('.seat[aria-pressed="true"]')).toHaveCount(2);
  await dialog.getByRole("button", { name: "ยกเลิก", exact: true }).click();
  await expect(dialog).toHaveCount(0); await expect(page.locator(".seat-chip > span")).toHaveText(["A2"]); await expect(opener).toBeFocused();
  await opener.click(); await a2.press("ArrowLeft"); await page.keyboard.press("Space");
  await expect(dialog.locator('.seat[aria-pressed="true"]')).toHaveCount(2);
  await dialog.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  await expect(page.locator(".seat-chip > span")).toHaveText(["A2", "A1"]); await expect(opener).toBeFocused();
  const chosen = await page.locator(".seat-chip > span").allTextContents();
  await opener.click();
  await dialog.getByRole("button", { name: "ปิดผังโรง" }).focus(); await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Escape"); await expect(page.locator(".seat-chip > span")).toHaveText(chosen); await expect(opener).toBeFocused();
  await input.fill("VP12"); await input.press("Enter"); await input.press("Tab"); await opener.click();
  await expect(dialog.getByRole("button", { name: /^ที่นั่ง VP12 แถว/ })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByText("จอภาพยนตร์", { exact: true })).toBeInViewport();
  await expect(dialog.getByText("VP", { exact: true })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "ขยายผัง" })).toBeInViewport();
  await page.screenshot({ path: "output/playwright/home-seat-map-desktop.png" });
  await page.keyboard.press("Escape");
});

test("map selection restores its origin after exit, Escape and browser Back", async ({ page }) => {
  await page.goto("/__dev/entry/");
  const opener = page.getByRole("button", { name: "เลือกจากผังโรง", exact: true });
  const input = page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" });
  await opener.click();
  await page.getByRole("button", { name: /^ที่นั่ง A4 แถว/ }).click();
  await page.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  for (const exit of ["button", "escape", "back"]) {
    await page.getByRole("button", { name: "Enter Simulation" }).click();
    await expect(page).toHaveURL(/experience\?seat=TEST-A-4$/); await expect(page.locator("canvas")).toBeVisible();
    if (exit === "button") await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
    else if (exit === "escape") await page.keyboard.press("Escape");
    else await page.goBack();
    await expect(page.locator(".seat-chip > span")).toHaveText(["A4"]); await expect(opener).toBeFocused();
  }
});

test("mobile map supports pan, zoom, reduced viewport and touch carousel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?seat=L4&branch=paragon");
  await expect.poll(() => page.locator(".entry-backdrop img").evaluate((img) => img.currentSrc)).toContain("paragon-home-mobile.webp");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // A real touch gesture scrolls the native rail; tapping explicitly selects a card.
  const rail = page.locator(".cinema-track");
  const touch = await page.context().newCDPSession(page);
  await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const bounds = await rail.boundingBox();
  const before = await rail.evaluate((element) => element.scrollLeft);
  const y = bounds.y + bounds.height / 2;
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bounds.x + bounds.width - 20, y }] });
  for (const fraction of [.75, .5, .25]) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: bounds.x + bounds.width * fraction, y }] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
  await touch.detach();
  await page.getByRole("radio", { name: "เมเจอร์ รัชโยธิน (Coming Soon)", exact: true }).click();
  await expect(page.getByRole("button", { name: "เลือกจากผังโรง" })).toBeDisabled();
  await page.getByRole("button", { name: "โรงก่อนหน้า" }).click();
  await page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" }).fill("L4");
  await page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" }).press("Enter");
  await page.getByRole("button", { name: "เลือกจากผังโรง", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveJSProperty("clientWidth", 390);
  await expect(dialog.getByRole("button", { name: /^ที่นั่ง L4 แถว/ })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "ขยายผัง" }).click();
  await expect(dialog.getByRole("status").filter({ hasText: "125%" })).toHaveCount(1);
  const scroll = dialog.locator(".map-scroll");
  expect(await scroll.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 480 });
  await expect(dialog.getByRole("button", { name: "ยืนยันที่นั่ง" })).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/playwright/home-seat-map-mobile.png" });
  await dialog.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  await page.screenshot({ path: "output/playwright/home-selection-mobile.png", fullPage: true });
});

test("missing images and reduced motion retain usable selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/images/*.webp", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".entry-backdrop img")).toHaveCSS("visibility", "hidden");
  await expect(page.locator(".cinema-placeholder")).toHaveCount(11);
  await expect(page.getByRole("radio").first()).toHaveCSS("transition-duration", "0s");
  await page.getByRole("button", { name: "เลือกจากผังโรง", exact: true }).click();
  await expect(page.getByRole("button", { name: "ยืนยันที่นั่ง" })).toBeDisabled();
  await page.getByRole("button", { name: /^ที่นั่ง L4 แถว/ }).click();
  await page.getByRole("button", { name: "ยืนยันที่นั่ง" }).click();
  await expect(page.locator(".seat-chip > span")).toHaveText(["L4"]);
});

