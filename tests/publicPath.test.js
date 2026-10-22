import { describe, expect, test } from "vitest";
import { publicPath } from "../src/utils/publicPath";

describe("publicPath", () => {
  test("prefixes root-relative assets with the configured project base", () => {
    expect(publicPath("/images/a.webp", "/Seatviewsim/")).toBe(
      "/Seatviewsim/images/a.webp",
    );
  });

  test("keeps root-base asset URLs well formed", () => {
    expect(publicPath("/media/trailer.mp4", "/")).toBe(
      "/media/trailer.mp4",
    );
  });

  test("does not rewrite absolute remote URLs", () => {
    expect(publicPath("https://cdn.example.com/a.webp", "/Seatviewsim/")).toBe(
      "https://cdn.example.com/a.webp",
    );
  });
});
