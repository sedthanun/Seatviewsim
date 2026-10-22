import { useEffect, useState } from "react";
import { publicPath } from "../utils/publicPath";

export default function useVideo(initialSource = publicPath("/media/vantage-demo.mp4")) {
  const [video] = useState(() => {
    const el = document.createElement("video");
    el.playsInline = true;
    el.preload = "auto";
    el.muted = true;
    el.autoplay = true;
    return el;
  });
  const [state, setState] = useState({
    playing: false,
    time: 0,
    duration: 0,
    muted: true,
    volume: 1,
    width: 0,
    height: 0,
    loading: true,
    error: "",
  });
  const source = initialSource;
  useEffect(() => {
    let cancelled = false;
    const sync = () =>
      setState((s) => ({
        ...s,
        playing: !video.paused,
        time: video.currentTime || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        muted: video.muted,
        volume: video.volume,
        width: video.videoWidth,
        height: video.videoHeight,
        loading: video.readyState < 3,
      }));
    const error = () => {
      if (!cancelled)
        setState((s) => ({
          ...s,
          loading: false,
          error:
            "ไม่สามารถเล่นวิดีโอได้ กรุณาลองโหลดหน้านี้ใหม่",
        }));
    };
    const events = [
      "loadedmetadata",
      "canplay",
      "play",
      "pause",
      "ended",
      "timeupdate",
      "volumechange",
      "waiting",
      "playing",
    ];
    events.forEach((e) => video.addEventListener(e, sync));
    video.addEventListener("error", error);
    setState((s) => ({
      ...s,
      error: "",
      loading: true,
      width: 0,
      height: 0,
      time: 0,
      duration: 0,
    }));
    // Browsers generally permit muted autoplay, including after a lazy scene load.
    video.muted = true;
    video.src = source;
    video.load();
    video.play().then(
      () => {
        if (!cancelled) setState((s) => ({ ...s, error: "" }));
      },
      (e) => {
        if (!cancelled && e.name !== "AbortError")
          setState((s) => ({
            ...s,
            error:
              e.name === "NotAllowedError"
                ? "เบราว์เซอร์บล็อกการเล่นอัตโนมัติ กดเล่นเพื่อเริ่มวิดีโอ"
                : "ไม่สามารถเล่นวิดีโอได้ กรุณาลองโหลดหน้านี้ใหม่",
          }));
      },
    );
    return () => {
      cancelled = true;
      events.forEach((e) => video.removeEventListener(e, sync));
      video.removeEventListener("error", error);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [video, source]);
  async function play() {
    try {
      await video.play();
      setState((s) => ({ ...s, error: "" }));
    } catch (e) {
      if (e.name !== "AbortError")
        setState((s) => ({
          ...s,
          error:
            e.name === "NotAllowedError"
              ? "เบราว์เซอร์บล็อกการเล่นอัตโนมัติ กดเล่นเพื่อเริ่มวิดีโอ"
              : "ไม่สามารถเล่นวิดีโอได้ กรุณาลองโหลดหน้านี้ใหม่",
        }));
    }
  }
  return { video, state, source, play };
}
