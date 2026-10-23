import { test, expect } from "@playwright/test";

test("home video selector reflects JSON readiness and selected ID survives experience navigation", async ({ page }) => {
  await page.goto("/?branch=paragon&seats=VP-3&seats=VP-2");
  const selector = page.getByRole("combobox", { name: "เลือกวิดีโอ" });
  await expect(selector).toBeVisible();
  await expect(selector).toHaveValue("imax-preshow");
  await expect(selector.locator("option[value='imax-countdown']")).toBeDisabled();
  await expect(selector.locator("option[value='imax-countdown']")).toHaveText("IMAX Countdown — ยังไม่มีไฟล์");
  await page.getByRole("button", { name: "ดูมุมมองจากที่นั่ง" }).click();
  await expect(page).toHaveURL(/video=imax-preshow/);
  await expect(page.locator(".simulation-seat strong")).toHaveText("VP3");
  await page.getByRole("button", { name: "กลับหน้าแรก" }).click();
  await expect(page).toHaveURL(/video=imax-preshow/);
  await expect(selector).toHaveValue("imax-preshow");
  await expect(page.locator(".seat-chip > span")).toHaveText(["VP3", "VP2"]);
});

test("legacy URL uses the JSON default and unavailable video IDs return to Home without loading media", async ({ page }) => {
  const mediaRequests = [];
  page.on("request", request => { if (/\.mp4(?:\?|$)/.test(request.url())) mediaRequests.push(request.url()); });
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-3");
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => mediaRequests.length).toBeGreaterThan(0);
  await page.goto("/?branch=paragon&video=not-in-this-cinema");
  await expect(page.getByRole("status")).toContainText("วิดีโอที่ระบุยังไม่พร้อมใช้งาน");
  await expect(page.getByRole("combobox", { name: "เลือกวิดีโอ" })).toHaveValue("imax-preshow");
  await page.goto("/cinemas/paragon/imax/experience?seat=VP-3&video=imax-countdown");
  await expect(page.getByRole("combobox", { name: "เลือกวิดีโอ" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("วิดีโอที่ระบุยังไม่พร้อมใช้งาน");
  await expect(page).toHaveURL(/\?branch=paragon&seat=VP3&video=imax-preshow$/);
  await expect(page.locator("canvas, video")).toHaveCount(0);
  expect(mediaRequests).toHaveLength(1);
});
