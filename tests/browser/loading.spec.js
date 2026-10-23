import { test, expect } from "@playwright/test";

test("entering a simulation shows an accessible loader until the scene module is ready", async ({ page }) => {
  let releaseExperience;
  let markExperienceRequested;
  const experienceRequested = new Promise((resolve) => {
    markExperienceRequested = resolve;
  });
  const holdExperience = new Promise((resolve) => {
    releaseExperience = resolve;
  });

  await page.route("**/src/simulator/Experience.jsx*", async (route) => {
    markExperienceRequested();
    await holdExperience;
    await route.continue();
  });

  await page.goto("/cinemas/paragon/imax/experience?seat=L-4", {
    waitUntil: "domcontentloaded",
  });
  await experienceRequested;

  const loader = page.getByRole("status", {
    name: "กำลังเตรียมมุมมองที่นั่ง",
  });
  await expect(loader).toBeVisible();
  await expect(loader.locator(".cell")).toHaveCount(9);
  await expect(page.locator("canvas")).toHaveCount(0);

  releaseExperience();

  await expect(page.locator("canvas")).toBeVisible({ timeout: 30000 });
  await expect(loader).toHaveCount(0);
});

test("Paragon Cinema JSON loads before seat controls become available", async ({ page }) => {
  await page.goto("/?branch=paragon");
  await expect(page.getByRole("status")).toContainText("กำลังโหลดข้อมูลสาขา");
  await expect(page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" })).toBeEnabled();
  await expect(page.getByText("426 / 6", { exact: false })).toHaveCount(0);
  await page.getByRole("combobox", { name: "เลือกหรือพิมพ์ที่นั่ง" }).fill("L4");
  await expect(page.getByRole("option", { name: "L4" })).toBeVisible();
  await page.getByRole("option", { name: "L4" }).click();
  await expect(page.locator(".seat-chip > span")).toHaveText(["L4"]);
  await page.getByRole("button", { name: "ดูมุมมองจากที่นั่ง" }).click();
  await expect(page).toHaveURL(/\/cinemas\/paragon\/imax\/experience\?seat=L-4&video=imax-preshow$/);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".simulation-page")).toBeVisible();
});

test("broken Paragon JSON chunk shows an error and never falls back to simulator", async ({ page }) => {
  await page.route("**/src/data/cinemas/paragon.json*", route => route.abort());
  await page.goto("/?branch=paragon");
  await expect(page.getByRole("alert")).toContainText("โหลดข้อมูลสาขาไม่สำเร็จ");
  await expect(page.locator("canvas, video")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ดูมุมมองจากที่นั่ง" })).toBeDisabled();
});
