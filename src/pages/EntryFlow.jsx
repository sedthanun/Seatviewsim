import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Home from "./Home";
import Loader from "../components/ui/loader-4";
import { branches, canSimulate } from "../data/branches";
import { loadCinema as defaultLoadCinema } from "../config/loadCinema";
import { resolveSeatSelection, homeSelectionQuery, experienceSelectionQuery } from "../simulator/seatSelection";
import { resolveCinemaVideo } from "../simulator/videoSelection";
const Experience = lazy(() => import("../simulator/Experience"));
// Keep the entry route mounted to preserve navigation and return focus.
export default function EntryFlow({
  catalog = branches,
  prefix = "",
  synthetic = false,
  loadCinema = defaultLoadCinema,
}) {
  const location = useLocation(),
    navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const relative = location.pathname.slice(prefix.length);
  const match = relative.match(
    /^\/cinemas\/([^/]+)(?:\/([^/]+)\/(seats|experience))?\/?$/,
  );
  const branchId = match?.[1] || params.get("branch") || catalog[0].id;
  const directoryBranch = catalog.find((b) => b.id === branchId);
  const directoryStatus = directoryBranch?.status;
  const syntheticAuditorium = synthetic ? directoryBranch?.auditoriums.find(
    (a) => a.id === (match?.[2] || "imax"),
  ) : null;
  const [loaded, setLoaded] = useState(null);
  const [loadState, setLoadState] = useState({ branchId: null, status: "idle", error: "" });
  const requestId = useRef(0);
  useEffect(() => {
    if (synthetic || !directoryBranch || directoryStatus !== "available") {
      setLoaded(null);
      setLoadState({ branchId, status: "idle", error: "" });
      return;
    }
    let active = true;
    const currentRequest = ++requestId.current;
    setLoaded(null);
    setLoadState({ branchId, status: "loading", error: "" });
    loadCinema(branchId).then(result => {
      if (!active || currentRequest !== requestId.current) return;
      setLoaded(result);
      setLoadState({ branchId, status: "ready", error: "" });
    }).catch(error => {
      if (!active || currentRequest !== requestId.current) return;
      setLoaded(null);
      setLoadState({ branchId, status: "error", error: error?.message || "โหลดข้อมูลสาขาไม่สำเร็จ" });
    });
    return () => { active = false; };
  }, [branchId, directoryStatus, synthetic, loadCinema]);
  const branch = synthetic ? directoryBranch : loaded?.branch;
  const auditorium = synthetic ? syntheticAuditorium : loaded?.auditorium;
  const ready = synthetic
    ? canSimulate(branch, auditorium)
    : loaded?.branch?.id === branchId && canSimulate(branch, auditorium);
  const immersive = match?.[3] === "experience";
  const selection = ready
    ? resolveSeatSelection(params, auditorium.config.seats, { home: !immersive })
    : { ids: [], activeId: null, draft: "", error: "" };
  const selectedSeats = selection.ids.map((id) => auditorium.config.seats.find((seat) => seat.id === id));
  const seat = selectedSeats.find((seat) => seat.id === selection.activeId);
  const requestedVideoId = params.has("video") ? params.get("video") : null;
  const resolvedVideo = ready && !synthetic ? resolveCinemaVideo(auditorium.media, requestedVideoId) : null;
  const activeVideoId = resolvedVideo?.ok ? resolvedVideo.videoId : auditorium?.media?.defaultVideoId ?? null;
  const invalidVideo = Boolean(ready && !synthetic && requestedVideoId !== null && !resolvedVideo?.ok);
  const returnUrl = `${prefix}/?${homeSelectionQuery(branch?.id || catalog[0].id, selectedSeats)}`;
  const leave = useCallback(
    () => navigate(returnUrl, { replace: true, state: { returned: true, returnFocus: location.state?.returnFocus || "combobox" } }),
    [navigate, returnUrl, location.state?.returnFocus],
  );
  const previouslyImmersive = useRef(false);
  const returnedFromScene = previouslyImmersive.current && !immersive;
  useEffect(() => {
    previouslyImmersive.current = immersive;
  }, [immersive]);
  const homeCatalog = useMemo(() => synthetic ? catalog : catalog.map(item => item.id === branchId && loaded
    ? { ...item, ...loaded.branch, referenceStatus: loaded.auditorium.config.referenceStatus, auditoriums: [loaded.auditorium] }
    : item), [synthetic, catalog, branchId, loaded]);
  const enter = (b, a, selectedSeats, returnFocus = "combobox") => {
    navigate(
      `${prefix}/?${homeSelectionQuery(b.id, selectedSeats)}`,
      { replace: true, state: { returnFocus } },
    );
    navigate(
      `${prefix}/cinemas/${b.id}/${a.id}/experience?${experienceSelectionQuery(selectedSeats, selectedSeats[0]?.id, activeVideoId)}`,
      { state: { returnFocus } },
    );
  };
  const changeSeat = (id) => {
    if (!selectedSeats.some((seat) => seat.id === id)) return;
    navigate(`${location.pathname}?${experienceSelectionQuery(selectedSeats, id, activeVideoId)}`, { replace: true, state: location.state });
  };
  const changeVideo = (id) => {
    if (!immersive || !auditorium?.media?.clips?.some((clip) => clip.id === id && clip.status === "ready" && clip.src)) return;
    navigate(`${location.pathname}?${experienceSelectionQuery(selectedSeats, seat?.id, id)}`, { replace: true, state: location.state });
  };
  useEffect(() => {
    if (!invalidVideo || !immersive || !ready) return;
    navigate(`${prefix}/?${homeSelectionQuery(branchId, selectedSeats, activeVideoId)}`, { replace: true, state: { returned: true, videoError: true, returnFocus: location.state?.returnFocus || "combobox" } });
  }, [invalidVideo, immersive, ready, navigate, prefix, branchId, selectedSeats.map(item => item.id).join("\u0000"), activeVideoId, location.state?.returnFocus]);
  if (immersive && ready && seat && !invalidVideo)
    return (
      <Suspense
        fallback={
          <main className="loading-scene simulation-loading-scene">
            <Loader label="กำลังเตรียมมุมมองที่นั่ง" />
            <p>กำลังเตรียมมุมมองที่นั่ง…</p>
            <button onClick={leave}>กลับหน้าแรก</button>
          </main>
        }
      >
        <Experience
          config={auditorium.config}
          videoSrc={resolvedVideo?.src}
          videoOptions={synthetic ? [] : auditorium.media?.clips || []}
          videoId={resolvedVideo?.videoId || ""}
          onVideoChange={changeVideo}
          seat={seat}
          selectedSeats={selectedSeats}
          onSeatChange={changeSeat}
          onExit={leave}
        />
      </Suspense>
    );
  const notice =
    selection.error
      ? selection.error
      : !directoryBranch
        ? "ไม่พบสาขาที่ระบุ กรุณาเลือกสาขาใหม่"
        : loadState.branchId === branchId && loadState.status === "error"
          ? `โหลดข้อมูลสาขาไม่สำเร็จ: ${loadState.error}`
        : "";
  return (
    <Home
      catalog={homeCatalog}
      initialBranch={branch?.id || directoryBranch?.id}
      initialSeatIds={selection.ids}
      initialDraft={selection.draft}
      onEnter={enter}
      onBranchChange={id => navigate(`${prefix}/?${homeSelectionQuery(id, [], null)}`, { replace: true })}
      notice={invalidVideo || location.state?.videoError ? "วิดีโอที่ระบุยังไม่พร้อมใช้งาน กรุณาเลือกวิดีโอที่พร้อมแล้ว" : notice}
      returned={Boolean(location.state?.returned) || returnedFromScene}
      returnFocus={location.state?.returnFocus || "combobox"}
      synthetic={synthetic}
      loading={loadState.branchId === branchId && loadState.status === "loading"}
      loadingError={loadState.branchId === branchId && loadState.status === "error"}
    />
  );
}
