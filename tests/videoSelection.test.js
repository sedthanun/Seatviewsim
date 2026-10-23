import { expect, it } from "vitest";
import { resolveCinemaVideo } from "../src/simulator/videoSelection";

const media = {
  defaultVideoId: "imax-preshow",
  clips: [
    { id: "imax-preshow", name: "IMAX Preshow", status: "ready", src: "/media/preshow.mp4" },
    { id: "imax-countdown", name: "IMAX Countdown", status: "pending", src: null },
  ],
};

it("uses the cinema's ready default for legacy URLs without a video ID", () => {
  expect(resolveCinemaVideo(media, null)).toMatchObject({ ok: true, videoId: "imax-preshow", src: "/media/preshow.mp4" });
});

it("resolves only a ready clip by its catalog ID", () => {
  expect(resolveCinemaVideo(media, "imax-preshow")).toMatchObject({ ok: true, videoId: "imax-preshow", src: "/media/preshow.mp4" });
});

it.each(["imax-countdown", "unknown", ""]) ("rejects unavailable or invalid video ID %s", (id) => {
  expect(resolveCinemaVideo(media, id)).toMatchObject({ ok: false, videoId: "imax-preshow", src: "/media/preshow.mp4" });
});
