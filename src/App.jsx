import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import EntryFlow from "./pages/EntryFlow";
const DevPreview = import.meta.env.DEV
  ? lazy(() => import("./dev/Preview"))
  : null;
const FormPreview = import.meta.env.DEV
  ? lazy(() => import("./dev/FormPreview"))
  : null;
const Calibration = import.meta.env.DEV ? lazy(() => import("./dev/Calibration")) : null;
const StillPreview = import.meta.env.DEV ? lazy(() => import("./dev/StillPreview")) : null;
const SimulationUIPreview = import.meta.env.DEV ? lazy(() => import("./dev/SimulationUIPreview")) : null;
export default function App() {
  return (
    <Suspense fallback={<div className="loading-scene">กำลังโหลด…</div>}>
      <Routes>
        {SimulationUIPreview && <Route path="/__dev/simulation-ui" element={<SimulationUIPreview />} />}
        {StillPreview && <Route path="/__dev/paragon/still" element={<StillPreview />} />}
        {Calibration && <Route path="/__dev/paragon/calibration" element={<Calibration />} />}
        {DevPreview && (
          <Route path="/__dev/simulator/:view" element={<DevPreview />} />
        )}
        {FormPreview && (
          <Route path="/__dev/entry/*" element={<FormPreview />} />
        )}
        <Route path="/*" element={<EntryFlow />} />
      </Routes>
    </Suspense>
  );
}
