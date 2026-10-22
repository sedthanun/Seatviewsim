import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrthographicCamera } from "@react-three/drei";
import { buildParagonConfig } from "../config/paragon/layout";
import { calibrationDefaults, designSource, normalizeCalibration, parseCalibration, serializeCalibration, validateCalibration } from "../config/paragon/calibration";
import Auditorium from "../simulator/Auditorium";
import SeatedCamera from "../simulator/SeatedCamera";
import { RenderBoundary } from "../simulator/Experience";
import SeatCombobox from "../components/SeatCombobox";
import { findSeat } from "../simulator/seatCodes";
import { eyePosition, projectionBounds } from "../simulator/math";
import useVideo from "../simulator/useVideo";
import "./calibration.css";

function InspectionCamera({ view, config }) {
  const ref = useRef();
  const { size } = useThree();
  const g = config.geometry, targetZ = g.depth / 2;
  useEffect(() => {
    const camera = ref.current;
    camera.up.set(0, view === "top" ? 0 : 1, view === "top" ? -1 : 0);
    camera.position.set(...(view === "top" ? [0, 70, targetZ] : [60, g.height / 2, targetZ]));
    camera.lookAt(0, view === "top" ? 0 : g.height / 2, targetZ);
    camera.updateProjectionMatrix();
  }, [view, g.height, targetZ]);
  const zoom = view === "top" ? Math.min(size.width / (g.width + 4), size.height / (g.depth + 4)) : Math.min(size.width / (g.depth + 4), size.height / (g.height + 4));
  return <OrthographicCamera ref={ref} makeDefault zoom={zoom} near={0.1} far={200} />;
}
function Guides({ config, view }) {
  const g = config.geometry, rows = g.rows;
  const line = rows.map((row) => [0, row.elevation + 0.02, row.z]);
  const eyes = rows.map((row) => [0, row.elevation + config.camera.eyeHeight, row.z]);
  return <>
    <Line points={line} color="#56b9ff" lineWidth={2} />
    {view === "side" && <Line points={eyes} color="#ecba76" lineWidth={1.5} dashed dashSize={0.2} gapSize={0.15} />}
    {rows.map((row) => <Line key={row.rowId} points={[[0, 0.01, row.z], [0, row.elevation, row.z]]} color="#5c7395" />)}
    {view === "top" && [-1, 1].map((side) => <Line key={side}
      points={[[side * g.architecture.innerWallX, 0.03, 0], [side * g.architecture.innerWallX, 0.03, g.depth]]}
      color="#65e7ff" lineWidth={2} />)}
    {view === "top" && g.architecture.rowClearances.map((bounds, i) => <group key={bounds.rowId}>
      {[[bounds.seatLeft, -g.architecture.innerWallX], [bounds.seatRight, g.architecture.innerWallX]].map(([seatX, wallX], side) => {
        const row = rows[i], z = row.z + g.curvature * seatX * seatX;
        return <Line key={side} points={[[seatX, row.elevation + 0.1, z], [wallX, row.elevation + 0.1, z]]} color="#ecba76" dashed dashSize={0.2} gapSize={0.1} />;
      })}
    </group>)}
  </>;
}
const fields = [
  ["slope", "ความชัน (°)", 0.5, 1, 40], ["rise", "ความสูงต่างแถวปกติ (ม.)", 0.01, 0.05, 1.5],
  ["rowPitch", "ระยะแถวแนวราบ (ม.)", 0.05, 0.9, 2.5], ["eyeHeight", "ความสูงสายตาเหนือพื้น (ม.)", 0.05, 0.7, 1.6],
  ["frontDistance", "ระยะแถว L จากจอ (ม.)", 0.25, 5, 25], ["frontElevation", "ระดับพื้นแถว L (ม.)", 0.05, 0.05, 5],
  ["screenBottom", "ขอบจอล่างเหนือพื้น (ม.)", 0.05, 0.05, 8], ["crossAisle", "ช่องทางเดินเพิ่ม F/E (ม.)", 0.1, 0.5, 4],
  ["vpDistance", "ระยะ A–VP (ม.)", 0.1, 1.15, 5], ["curvature", "ความโค้งแถว (1/ม.)", 0.0005, 0, 0.006],
];
export default function Calibration() {
  const initial = useMemo(() => buildParagonConfig(), []);
  const [draft, setDraft] = useState(initial.calibration), [config, setConfig] = useState(initial);
  const [view, setView] = useState("side"), [code, setCode] = useState("VP6"), [notice, setNotice] = useState(""), [reset, setReset] = useState(0);
  const media = useVideo("/media/Infinite%20Worlds.mp4");
  const [quality, setQuality] = useState(1);
  const [simple, setSimple] = useState(() => matchMedia("(max-width: 760px)").matches);
  useEffect(() => {
    const query = matchMedia("(max-width: 760px)");
    const update = () => setSimple(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const seatInput = useRef();
  const errors = validateCalibration(draft);
  const seat = findSeat(config.seats, code) || config.seats.find((seat) => seat.id === "VP-6");
  const viewpoint = useMemo(() => view === "seat" ? eyePosition(seat, config.camera.eyeHeight) : null, [view, seat, config.camera]);
  const rows = config.geometry.rows, first = rows[0], last = rows.at(-1);
  const projectionFrame = projectionBounds(config.screen, config.projection);
  const slope = Math.atan((last.elevation - first.elevation) / (last.z - first.z)) * 180 / Math.PI;
  const stairRun = rows[1].front - rows[0].front;
  const stairSlope = Math.atan((rows[1].elevation - rows[0].elevation) / stairRun) * 180 / Math.PI;
  const maxStairSlope = Math.max(...rows.slice(1).map((row, i) => Math.atan((row.elevation - rows[i].elevation) / Math.min(config.calibration.rowPitch, row.front - rows[i].front)) * 180 / Math.PI));
  const apply = (next) => {
    setNotice("");
    if (validateCalibration(next).length) { setDraft(next); return; }
    const config = buildParagonConfig(next);
    setDraft(config.calibration); setConfig(config);
  };
  const changeMode = (mode) => apply({ ...config.calibration, mode,
    customElevations: mode === "custom" ? rows.map((row) => row.elevation) : null });
  const change = (key, value) => {
    const next = { ...draft, [key]: value };
    if (key === "frontElevation" && draft.mode === "custom") {
      const offset = value - draft.frontElevation;
      next.customElevations = draft.customElevations.map((y) => y + offset);
    }
    apply(next);
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([serializeCalibration(draft)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "paragon-calibration-v1.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("ดาวน์โหลดค่าแล้ว ฉากสาธารณะยังใช้ค่าเริ่มต้น");
  };
  const importJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error("ไฟล์ปรับเทียบใหญ่เกิน 100 KB");
      const next = parseCalibration(await file.text()); apply(next);
      setNotice("นำเข้าค่าแล้ว มีผลเฉพาะหน้าปรับเทียบนี้");
    } catch (error) { setNotice(`นำเข้าไม่ได้: ${error.message}`); }
    event.target.value = "";
  };
  return <main className="calibration-page">
    <aside className="calibration-panel">
      <Link to="/">← กลับหน้าแรก</Link>
      <h1>Paragon Calibration</h1><p>เครื่องมือพัฒนา · ทุกระยะเป็นค่าประมาณ ยกเว้นขนาดจอที่ผู้ใช้ให้มา</p>
      <p className="calibration-source">22.5° อิงช่วง 20–25° จาก <a href={designSource} target="_blank" rel="noreferrer">IMAX Design Facts (1991)</a> ไม่ใช่มุมที่วัดได้ของพารากอน</p>
      <label>โหมดปรับระดับพื้น<select value={draft.mode} onChange={(event) => changeMode(event.target.value)}>
        <option value="slope">กำหนดความชัน</option><option value="rise">กำหนด rise</option><option value="custom">กำหนดระดับรายแถว</option>
      </select></label>
      <div className="calibration-fields">{fields.map(([key, label, step, min, max]) => <label key={key}>{label}<span className="estimate-badge">ประมาณ</span>
        <input type="number" step={step} min={min} max={max} value={Number.isFinite(draft[key]) ? Number(draft[key].toFixed(5)) : ""}
          disabled={(key === "slope" && draft.mode !== "slope") || (key === "rise" && draft.mode !== "rise")}
          onChange={(event) => change(key, event.target.value === "" ? NaN : Number(event.target.value))} />
      </label>)}</div>
      {draft.mode === "custom" && <fieldset><legend>ระดับพื้นรายแถว (ม.) · ประมาณ</legend><div className="calibration-fields">
        {rows.map((row, i) => <label key={row.rowId}>แถว {row.rowId}<input type="number" aria-label={`ระดับแถว ${row.rowId}`} min="0.05" max="30" step="0.05"
          value={Number.isFinite(draft.customElevations[i]) ? Number(draft.customElevations[i].toFixed(5)) : ""}
          onChange={(event) => {
            const levels = [...draft.customElevations]; levels[i] = event.target.value === "" ? NaN : Number(event.target.value);
            apply({ ...draft, customElevations: levels, frontElevation: levels[0] });
          }} /></label>)}
      </div></fieldset>}
      {errors.length > 0 && <p role="alert">{errors.join(" · ")} — ฉากแสดงค่าที่ถูกต้องล่าสุด</p>}
      <div className="calibration-actions"><button onClick={exportJson} disabled={errors.length > 0}>ดาวน์โหลด JSON</button><label className="calibration-import">นำเข้า JSON<input aria-label="นำเข้า Calibration JSON" type="file" accept=".json,application/json" onChange={importJson} /></label>
        <button onClick={() => apply(normalizeCalibration(calibrationDefaults))}>คืนค่าเริ่มต้น</button></div>
      <p role="status">{notice}</p>
      <p>426 รหัสที่นั่ง · ยอด 421 ยังรอตรวจสอบ · การปรับหน้านี้ไม่เปลี่ยนฉากสาธารณะ</p>
    </aside>
    <section className="calibration-preview">
      <header><div className="calibration-views" aria-label="มุมมองปรับเทียบ">
        {[["side", "ด้านข้าง"], ["top", "ด้านบน"], ["seat", "จากที่นั่ง"]].map(([id, name]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{name}</button>)}
      </div><div className="calibration-seat-input"><label htmlFor="seat-code">เลือกที่นั่งเพื่อดูมุมมอง</label><SeatCombobox seats={config.seats} value={code} onChange={setCode} inputRef={seatInput} /></div>
        {view === "seat" && <button onClick={() => setReset((value) => value + 1)}>หันกลับหาจอ</button>}
        <button onClick={() => media.state.playing ? media.video.pause() : media.play()}>{media.state.playing ? "หยุดวิดีโอ" : "เล่นวิดีโอ"}</button>
      </header>
      <div className="calibration-canvas" data-eye-position={eyePosition(seat, config.camera.eyeHeight).join(",")}>
        <RenderBoundary>
        <Canvas dpr={quality} gl={{ antialias: false, powerPreference: "high-performance" }} camera={{ near: 0.05, far: 200 }} fallback={<p role="alert">ไม่สามารถแสดง WebGL ได้</p>}>
          <Auditorium config={config} media={media} simple={simple} inspection={view !== "seat"} viewpoint={viewpoint} onQualityChange={setQuality} />
          {view === "seat" ? <SeatedCamera seat={seat} settings={config.camera} reset={reset} /> : <><InspectionCamera view={view} config={config} /><Guides config={config} view={view} /></>}
        </Canvas>
        </RenderBoundary>
      </div>
      {media.state.error && <p role="status">{media.state.error}</p>}
      {!findSeat(config.seats, code) && <p role="status">ไม่พบที่นั่งนี้ — แสดงมุมมอง VP6 ชั่วคราว</p>}
      <div className="calibration-metrics">
        <span>ความชันศูนย์กลางแถว <strong data-testid="rake">{slope.toFixed(2)}°</strong></span>
        <span>บันได L–K <strong>{stairSlope.toFixed(2)}°</strong> · มุมบันไดสูงสุด <strong>{maxStairSlope.toFixed(2)}°</strong> · ขั้นสูงสุด {Math.max(...config.geometry.stairs.map((step) => step.stepRise)).toFixed(3)} ม.</span>
        <span>จอ <strong>26.3 × 19.8 ม.</strong> · ผู้ใช้ระบุ</span><span>สายตา {code.toUpperCase().trim()} <strong>{eyePosition(seat, config.camera.eyeHeight).map((value) => value.toFixed(2)).join(" / ")} ม.</strong></span>
        <span>กรอบฉาย CoLa <strong data-testid="projection-size">{projectionFrame.size.map((v) => v.toFixed(4)).join(" × ")} ม.</strong> · {config.projection.aspectRatio.toFixed(2)}:1 · ผู้ใช้ระบุ</span>
        <span>ตำแหน่งภาพจากกลางจอ <strong data-testid="projection-offset">{projectionFrame.position.map((v) => v.toFixed(2)).join(" / ")} ม.</strong> · วางกลางจอและครอปบนล่างเป็นค่าจำลอง</span>
        <span>ระยะขอบเก้าอี้ถึงผนังขั้นต่ำ ซ้าย / ขวา <strong data-testid="side-clearance">{["left", "right"].map((side) => Math.min(...config.geometry.architecture.rowClearances.map((row) => row[side])).toFixed(2)).join(" / ")} ม.</strong></span>
        <span>ทางเดินข้าง <strong>{config.geometry.architecture.sideAisleWidth.toFixed(3)} ม.</strong> · เส้นฟ้าในมุมบนคือผิวผนังด้านใน</span>
      </div>
      <div className="calibration-table"><table><caption>แนวศูนย์กลางแถวและระยะขอบเก้าอี้ถึงผนัง · ค่าประมาณ (เมตร)</caption><thead><tr><th>แถว</th><th>ระยะจากจอ</th><th>ระดับพื้น</th><th>ระยะแถว</th><th>ความสูงต่างแถว</th><th>ผนังซ้าย</th><th>ผนังขวา</th></tr></thead>
        <tbody>{rows.map((row, i) => <tr key={row.rowId}><th>{row.rowId}</th><td>{row.z.toFixed(3)}</td><td>{row.elevation.toFixed(3)}</td><td>{i ? (row.z - rows[i - 1].z).toFixed(3) : "—"}</td><td>{i ? (row.elevation - rows[i - 1].elevation).toFixed(3) : "—"}</td><td>{config.geometry.architecture.rowClearances[i].left.toFixed(3)}</td><td>{config.geometry.architecture.rowClearances[i].right.toFixed(3)}</td></tr>)}</tbody>
      </table></div>
    </section>
  </main>;
}
