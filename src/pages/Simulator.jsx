import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Armchair } from "lucide-react";
import SeatMap from "../components/SeatMap";
import Loader from "../components/ui/loader-4";
import { Header } from "../components/Layout";
import { validateConfig } from "../simulator/math";
const Experience = lazy(() => import("../simulator/Experience"));
export default function Simulator({ config, basePath, synthetic = false }) {
  const [selected, setSelected] = useState(null);
  const location = useLocation(),
    navigate = useNavigate(),
    enterButton = useRef();
  const immersive = location.pathname.endsWith("/experience");
  const leave = useCallback(
    () => navigate(`${basePath}/seats`, { replace: true }),
    [navigate, basePath],
  );
  const seat = config.seats.find((s) => s.id === selected);
  useEffect(() => {
    if (immersive && !seat) leave();
    if (!immersive && seat) enterButton.current?.focus();
  }, [immersive, seat, leave]);
  const errors = validateConfig(config);
  if (errors.length)
    return (
      <main className="section-shell branch-page">
        <h1>Reference configuration incomplete</h1>
        <p>{errors.join(" ")}</p>
        <Link to="/">Return home</Link>
      </main>
    );
  if (immersive && seat)
    return (
      <Suspense
        fallback={
          <main className="loading-scene simulation-loading-scene">
            <Loader label="Preparing your perspective" />
            <p>Preparing your perspective…</p>
            <button onClick={leave}>Return to seats</button>
          </main>
        }
      >
        <Experience
          config={config}
          seat={seat}
          onExit={leave}
        />
      </Suspense>
    );
  return (
    <>
      <Header />
      <main className="seat-page section-shell">
        <Link className="text-link" to="/">
          <ArrowLeft size={16} /> All cinemas
        </Link>
        <p className="eyebrow">
          {synthetic
            ? "DEVELOPMENT ONLY · NOT PARAGON"
            : "SELECT YOUR PERSPECTIVE"}
        </p>
        <h1>{config.name}</h1>
        {synthetic && (
          <p className="fixture-warning">
            Synthetic geometry for testing only. These seat labels, dimensions,
            and materials do not represent a real cinema.
          </p>
        )}
        <div className="selection-layout">
          <SeatMap
            seats={config.seats}
            selectedIds={selected ? [selected] : []}
            onSelectionChange={(ids) => setSelected(ids[0] || null)}
          />
          <aside className="selection-panel">
            <Armchair size={28} />
            <p className="eyebrow">YOUR PERSPECTIVE</p>
            <h2>{seat ? `Seat ${seat.number}` : "Find your seat."}</h2>
            <p>
              {seat
                ? `Row ${seat.rowId} · ${seat.category}`
                : "Select a seat to explore its eye-level view of the screen."}
            </p>
            <button
              ref={enterButton}
              disabled={!seat}
              className="button primary"
              onClick={() => {
                navigate(`${basePath}/experience`);
              }}
            >
              Enter {synthetic ? "test" : "IMAX"} experience{" "}
              <ArrowUpRight size={16} />
            </button>
            <p className="small-note">
              A fixed seated perspective. Drag to look around.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
