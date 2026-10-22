import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Home from "./Home";
import Loader from "../components/ui/loader-4";
import { branches, canSimulate } from "../data/branches";
import { resolveSeatSelection, homeSelectionQuery, experienceSelectionQuery } from "../simulator/seatSelection";
const Experience = lazy(() => import("../simulator/Experience"));
// Keep the entry route mounted to preserve navigation and return focus.
export default function EntryFlow({
  catalog = branches,
  prefix = "",
  synthetic = false,
}) {
  const location = useLocation(),
    navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const relative = location.pathname.slice(prefix.length);
  const match = relative.match(
    /^\/cinemas\/([^/]+)(?:\/([^/]+)\/(seats|experience))?\/?$/,
  );
  const branchId = match?.[1] || params.get("branch") || catalog[0].id;
  const branch = catalog.find((b) => b.id === branchId);
  const auditorium = branch?.auditoriums.find(
    (a) => a.id === (match?.[2] || "imax"),
  );
  const ready = canSimulate(branch, auditorium);
  const immersive = match?.[3] === "experience";
  const selection = ready
    ? resolveSeatSelection(params, auditorium.config.seats, { home: !immersive })
    : { ids: [], activeId: null, draft: "", error: "" };
  const selectedSeats = selection.ids.map((id) => auditorium.config.seats.find((seat) => seat.id === id));
  const seat = selectedSeats.find((seat) => seat.id === selection.activeId);
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
  const enter = (b, a, selectedSeats, returnFocus = "combobox") => {
    navigate(
      `${prefix}/?${homeSelectionQuery(b.id, selectedSeats)}`,
      { replace: true, state: { returnFocus } },
    );
    navigate(
      `${prefix}/cinemas/${b.id}/${a.id}/experience?${experienceSelectionQuery(selectedSeats)}`,
      { state: { returnFocus } },
    );
  };
  const changeSeat = (id) => {
    if (!selectedSeats.some((seat) => seat.id === id)) return;
    navigate(`${location.pathname}?${experienceSelectionQuery(selectedSeats, id)}`, { replace: true, state: location.state });
  };
  if (immersive && ready && seat)
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
          videoSrc={auditorium.videoSrc}
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
      : !branch
        ? "ไม่พบสาขาที่ระบุ กรุณาเลือกสาขาใหม่"
        : "";
  return (
    <Home
      key={location.pathname + location.search}
      catalog={catalog}
      initialBranch={branch?.id}
      initialSeatIds={selection.ids}
      initialDraft={selection.draft}
      onEnter={enter}
      notice={notice}
      returned={Boolean(location.state?.returned) || returnedFromScene}
      returnFocus={location.state?.returnFocus || "combobox"}
      synthetic={synthetic}
    />
  );
}
