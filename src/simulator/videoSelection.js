export function resolveCinemaVideo(media, requestedId = null) {
  const fallback = media?.clips?.find(clip => clip.id === media.defaultVideoId && clip.status === "ready" && typeof clip.src === "string") ?? null;
  const clip = requestedId === null
    ? fallback
    : media?.clips?.find(item => item.id === requestedId && item.status === "ready" && typeof item.src === "string") ?? null;
  if (!clip) return { ok: false, videoId: fallback?.id ?? null, src: fallback?.src ?? null, reason: requestedId === null ? "missing-default" : "unavailable" };
  return { ok: true, videoId: clip.id, src: clip.src, reason: "" };
}
