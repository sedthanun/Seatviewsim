import { test, expect } from "@playwright/test";
test("homepage, Paragon prototype, and upcoming guards", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Seat View Simulator",
  );
  await expect(page.getByRole("radio", { name: "พารากอน ซีนีเพล็กซ์", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio")).toHaveCount(11);
  await expect(page.getByRole("radio", { name: /Coming Soon/ })).toHaveCount(10);
  await expect(page.getByRole("radio", { name: "เมเจอร์ รังสิต (Coming Soon)", exact: true })).toBeEnabled();
  await expect(page.getByLabel("เลือกหรือพิมพ์ที่นั่ง")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Enter Simulation" })).toBeEnabled();
  await expect(page.getByText("ต้นแบบจากผังที่นั่ง", { exact: false })).toBeVisible();
  await expect(page.locator("header, footer, canvas, video")).toHaveCount(0);
  await expect(page.locator(".entry-backdrop img")).toBeVisible();
  await page.goto("/cinemas/paragon/imax/experience");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByText("ไม่พบที่นั่งที่ระบุ", { exact: false }),
  ).toBeVisible();
  await page.goto("/cinemas/ratchayothin/imax/experience");
  await expect(
    page.getByText("สาขานี้ยังไม่พร้อมใช้งาน (Coming Soon)", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto("/cinemas/rangsit/imax/experience?seat=A-2");
  await expect(page.getByText("สาขานี้ยังไม่พร้อมใช้งาน (Coming Soon)", { exact: true })).toBeVisible();
  await expect(page.getByLabel("เลือกหรือพิมพ์ที่นั่ง")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Enter Simulation" })).toBeDisabled();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("typed seat entry validates, enters directly, and retains values on exit", async ({
  page,
}) => {
  await page.goto("/__dev/entry/");
  const input = page.getByLabel("เลือกหรือพิมพ์ที่นั่ง");
  await input.fill("A99");
  await expect(page.getByRole("status")).toHaveText("ไม่พบที่นั่งนี้");
  await input.press("Enter");
  await page.getByRole("button", { name: "Enter Simulation" }).click();
  await expect(page.getByRole("alert")).toContainText("ไม่พบที่นั่งนี้");
  await input.fill(" a4 ");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "ลบที่นั่ง A4", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.press("Enter");
  await expect(page).toHaveURL(/experience\?seat=TEST-A-4$/);
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page.getByRole("button", { name: "ลบที่นั่ง A4", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Enter Simulation" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "ลบที่นั่ง A4", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await page.goto(
    "/__dev/entry/cinemas/synthetic/imax/experience?seat=missing",
  );
  await expect(page.getByRole("status")).toContainText("ไม่พบที่นั่ง");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("Paragon prototype enters L4 and autoplays the supplied video", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("เลือกหรือพิมพ์ที่นั่ง").fill(" l4 ");
  await page.getByRole("button", { name: "Enter Simulation" }).click();
  await expect(page).toHaveURL(/paragon\/imax\/experience\?seat=L-4$/);
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Prototype")).toBeVisible();
  await expect(page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" })).toBeEnabled({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "หยุดชั่วคราว", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" }).inputValue())).toBeGreaterThan(1);
  await page.screenshot({ path: "output/playwright/paragon-prototype.png" });
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page.getByRole("button", { name: "ลบที่นั่ง L4", exact: true })).toBeVisible();
});

test("seat combobox filters, groups, selects and fits mobile", async ({ page }) => {
  await page.goto("/?branch=paragon&seat=A2");
  const input = page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" });
  await expect(page.getByRole("button", { name: "ลบที่นั่ง A2", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#seat-hint")).toHaveCount(0);
  await page.getByRole("button", { name: "เปิดรายการที่นั่ง" }).click();
  await expect(page.getByRole("group", { name: "แถว VP", exact: true })).toBeVisible();
  await expect(page.getByRole("listbox").getByRole("option").first()).toHaveText("VP1");
  await expect(page.getByRole("option", { name: "A2", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option", { name: "K1", exact: true })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "L3", exact: true })).toHaveCount(0);
  await page.getByRole("option", { name: "VP12", exact: true }).click();
  await expect(page.getByRole("button", { name: "ลบที่นั่ง VP12", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.fill(" a2 ");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveText(["A2", "A20", "A21", "A22", "A23", "A24", "A25", "A26", "A27", "A28", "A29"]);
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "ลบที่นั่ง A20", exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(page.locator("canvas")).toHaveCount(0);
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.fill("K99");
  await expect(page.getByRole("status")).toHaveText("ไม่พบที่นั่งนี้");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "เลือกจากผังโรง" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await input.fill("VP");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(22);
  const bounds = await page.getByRole("listbox").boundingBox();
  expect(bounds.height).toBeLessThanOrEqual(240);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: "output/playwright/seat-combobox-mobile.png" });
});

test("typed entry never requests fullscreen and supports Escape", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.fullscreenCalls = 0;
    Element.prototype.requestFullscreen = () => {
      window.fullscreenCalls++;
      return Promise.reject(new Error("Unexpected fullscreen request"));
    };
  });
  await page.goto("/__dev/entry/");
  await page.getByLabel("เลือกหรือพิมพ์ที่นั่ง").fill(" b5 ");
  await page.getByRole("button", { name: "Enter Simulation" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  expect(await page.evaluate(() => window.fullscreenCalls)).toBe(0);
  await expect(page.locator(".fullscreen-note")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "ลบที่นั่ง B5", exact: true })).toBeVisible();
});
test("synthetic seat selection, fixed video controls and exit", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/__dev/simulator/seats");
  await page
    .getByRole("button", { name: "ที่นั่ง TEST-B5 แถว TEST-B ปกติ", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" })).toBeEnabled({
    timeout: 20000,
  });
  await expect(
    page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        await page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" }).inputValue(),
      ),
    )
    .toBeGreaterThan(1);
  await page.getByRole("button", { name: "เปิดเสียง", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ปิดเสียง", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
  await page.getByRole("button", { name: "หันกลับหาจอ" }).click();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText("Change video", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "เล่น", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        await page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" }).inputValue(),
      ),
    )
    .toBeGreaterThan(1);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
  await page.screenshot({ path: "output/playwright/experience.png" });
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(
    page.getByRole("button", {
      name: "ที่นั่ง TEST-B5 แถว TEST-B ปกติ",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Enter test experience" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test("autoplay restriction presents the Thai play prompt", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Blocked in test", "NotAllowedError"));
  });
  await page.goto("/__dev/simulator/seats");
  await page
    .getByRole("button", { name: "ที่นั่ง TEST-A4 แถว TEST-A ปกติ", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(
    page.getByText("เบราว์เซอร์บล็อกการเล่นอัตโนมัติ", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "เล่น", exact: true }).click();
  await expect(
    page.getByText("กดเล่นเพื่อเริ่มวิดีโอ", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page).toHaveURL(/\/seats$/);
});
test("WebGL unavailable state retains an exit", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.goto("/__dev/simulator/seats");
  await page
    .getByRole("button", { name: "ที่นั่ง TEST-A4 แถว TEST-A ปกติ", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page).toHaveURL(/\/seats$/);
});
test("viewport entry, Escape, keyboard seats, and repeated entry", async ({
  page,
}) => {
  await page.goto("/__dev/simulator/seats");
  const first = page.getByRole("button", {
    name: "ที่นั่ง TEST-A4 แถว TEST-A ปกติ",
    exact: true,
  });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", {
      name: "ที่นั่ง TEST-A5 แถว TEST-A ปกติ",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/seats$/);
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page).toHaveURL(/\/seats$/);
});
test("desktop and mobile layouts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "output/playwright/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "output/playwright/home-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/__dev/simulator/seats");
  await page
    .getByRole("button", { name: "ที่นั่ง TEST-A4 แถว TEST-A ปกติ", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter test experience" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" })).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        await page.getByRole("slider", { name: "ตำแหน่งวิดีโอ" }).inputValue(),
      ),
    )
    .toBeGreaterThan(1);
  await page.getByRole("button", { name: "หยุดชั่วคราว", exact: true }).click();
  await page.screenshot({ path: "output/playwright/experience-mobile.png" });
});

test("Paragon overlays fill the tab, keep seat visible and stop media on exit", async ({ page }) => {
  await page.addInitScript(() => {
    window.fullscreenCalls = 0;
    Element.prototype.requestFullscreen = () => {
      window.fullscreenCalls++;
      return Promise.reject(new Error("Unexpected fullscreen request"));
    };
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...args) {
      const element = create.call(this, tag, ...args);
      if (tag === "video") window.testVideo = element;
      return element;
    };
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const [code, id] of [["VP6", "VP-6"], ["A2", "A-2"], ["L4", "L-4"]]) {
      await page.goto(`/cinemas/paragon/imax/experience?seat=${id}`);
      await expect(page.locator("canvas")).toBeVisible();
      await expect(page.locator(".simulation-seat strong")).toHaveText(code);
      await expect(page.locator(".simulation-seat strong")).toHaveCSS("font-size", width === 390 ? "26px" : "32px");
      await expect.poll(() => page.locator("canvas").boundingBox()).toMatchObject({ x: 0, y: 0, width, height: width === 390 ? 844 : 900 });
      const back = await page.getByRole("button", { name: "กลับหน้าแรก" }).boundingBox();
      const seat = await page.locator(".simulation-seat").boundingBox();
      expect(back.x + back.width).toBeLessThanOrEqual(seat.x);
      expect(await page.evaluate(() => window.fullscreenCalls)).toBe(0);
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      if (code === "VP6") {
        await expect(page.getByRole("button", { name: "หยุดชั่วคราว" })).toBeVisible();
        await page.locator("canvas").focus();
        await expect(page.locator(".simulation-controls")).toHaveClass(/is-hidden/, { timeout: 6000 });
        await expect(page.getByRole("button", { name: "กลับหน้าแรก" })).toBeVisible();
        await expect(page.locator(".simulation-seat")).toBeVisible();
        await page.keyboard.press("ArrowRight");
        await expect(page.locator(".simulation-controls")).not.toHaveClass(/is-hidden/);
        await page.getByRole("button", { name: "หยุดชั่วคราว" }).focus();
        await expect(page.getByRole("button", { name: "หยุดชั่วคราว" })).toBeVisible();
        await page.screenshot({ path: `output/playwright/simulation-${width}.png` });
      }
      await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
      await expect(page.getByRole("button", { name: `ลบที่นั่ง ${code}`, exact: true })).toBeVisible();
      await expect(page.getByLabel("เลือกหรือพิมพ์ที่นั่ง")).toBeFocused();
      expect(await page.evaluate(() => window.testVideo.paused && !window.testVideo.hasAttribute("src"))).toBe(true);
    }
  }
});

test("fixed media failure suggests a reload and recovers after reload", async ({ page }) => {
  await page.route("**/media/*.mp4", (route) => route.fulfill({ contentType: "video/mp4", body: "broken video" }));
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-6");
  await expect(page.getByRole("status")).toContainText("กรุณาลองโหลดหน้านี้ใหม่");
  await page.unroute("**/media/*.mp4");
  await page.reload();
  await expect(page.getByRole("button", { name: "หยุดชั่วคราว" })).toBeVisible();
  await expect(page.getByText("ไม่สามารถเล่นวิดีโอได้ กรุณาลองโหลดหน้านี้ใหม่", { exact: true })).toHaveCount(0);
});

