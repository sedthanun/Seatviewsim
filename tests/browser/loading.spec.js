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

  await expect(page.locator("canvas")).toBeVisible();
  await expect(loader).toHaveCount(0);
});
