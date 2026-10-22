import { useEffect, useRef, useState } from "react";
import { canSimulate } from "../data/branches";
import { homeBackdrop } from "../data/cinemaPresentation";
import { findSeat, seatCode } from "../simulator/seatCodes";
import SeatCombobox from "../components/SeatCombobox";
import CinemaCarousel from "../components/CinemaCarousel";
import SeatMapDialog from "../components/SeatMapDialog";
import LanguageToggle from "../components/LanguageToggle";
import { appendSeatId, MAX_SELECTED_SEATS } from "../simulator/seatSelection";
import { Armchair, ArrowRight, Map } from "lucide-react";
import "../entry.css";

export default function Home({ catalog, initialBranch, initialSeatIds = [], initialDraft = "", onEnter, returned = false, returnFocus = "combobox", notice = "", synthetic = false }) {
  const [branchId, setBranchId] = useState(initialBranch || catalog[0].id);
  const branch = catalog.find((b) => b.id === branchId) || catalog[0];
  const auditorium = branch.auditoriums.find((a) => canSimulate(branch, a));
  const seats = auditorium?.config.seats || [], ready = Boolean(auditorium);
  const [value, setValue] = useState(initialDraft);
  const [selectedSeatIds, setSelectedSeatIds] = useState(initialSeatIds);
  const [selectionSource, setSelectionSource] = useState(returnFocus);
  const [mapOpen, setMapOpen] = useState(false), [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showNotice, setShowNotice] = useState(true);
  const input = useRef(null), mapButton = useRef(null);
  useEffect(() => { if (returned) (returnFocus === "map" ? mapButton : input).current?.focus(); }, [returned, returnFocus]);
  function changeCode(code) {
    setValue(code); setError(""); setFeedback(""); setShowNotice(false); setSelectionSource("combobox");
  }
  function commitCode(code) {
    const seat = findSeat(seats, code);
    if (!seat) { setError("ไม่พบที่นั่งนี้ กรุณาตรวจสอบรหัสที่นั่งอีกครั้ง"); return null; }
    const result = appendSeatId(selectedSeatIds, seat.id);
    if (result.error) { setError(result.error); return null; }
    setSelectedSeatIds(result.ids); setValue(""); setError(""); setShowNotice(false); setSelectionSource("combobox");
    setFeedback(result.duplicate ? "ที่นั่งนี้ถูกเลือกแล้ว" : "");
    return result.ids;
  }
  function removeSeat(id) {
    setSelectedSeatIds((ids) => ids.filter((value) => value !== id));
    setError(""); setFeedback(""); setShowNotice(false); setSelectionSource("combobox"); input.current?.focus();
  }
  function closeMap() { setMapOpen(false); mapButton.current?.focus(); }
  function submit(event) {
    event.preventDefault(); if (!ready) return;
    const ids = value.trim() ? commitCode(value) : selectedSeatIds;
    if (!ids?.length) { if (ids) setError("กรุณาเลือกหรือกรอกรหัสที่นั่งอย่างน้อย 1 ที่นั่ง"); input.current?.focus(); return; }
    setError(""); onEnter(branch, auditorium, ids.map((id) => seats.find((seat) => seat.id === id)), value.trim() ? "combobox" : selectionSource);
  }
  return <main className="entry-page">
    <picture className="entry-backdrop" aria-hidden="true"><source media="(max-width: 600px)" srcSet={homeBackdrop.mobile} /><img src={homeBackdrop.desktop} alt="" fetchPriority="high" onLoad={(event) => { event.currentTarget.style.visibility = "visible"; }} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /></picture>
    <div className="entry-toolbar"><LanguageToggle /></div>
    <section className="entry-panel" aria-labelledby="entry-title">
      <div className="entry-heading"><h1 id="entry-title">Seat View Simulator</h1><p className="entry-description">เลือกที่นั่ง แล้วสัมผัสมุมมองก่อนเข้าโรง</p></div>
      <CinemaCarousel catalog={catalog} selectedId={branch.id} onSelect={(id) => { if (id !== branch.id) { setBranchId(id); setValue(""); setSelectedSeatIds([]); setError(""); setFeedback(""); setShowNotice(false); setSelectionSource("combobox"); } }} />
      <form onSubmit={submit} noValidate>
        <label htmlFor="seat-code"><Armchair size={16} aria-hidden="true" />เลือกหรือพิมพ์ที่นั่ง</label>
        <p className="entry-seat-help">พิมพ์รหัสที่นั่ง หรือเลือกจากผังโรง</p>
        <div className="entry-seat-controls"><SeatCombobox key={branch.id} inputRef={input} seats={seats} value={value} onChange={changeCode}
          selectedIds={selectedSeatIds} onSelect={(seat) => commitCode(seatCode(seat))} onRemove={removeSeat}
          disabled={!ready} describedBy={error ? "seat-error" : !ready ? "seat-hint" : "seat-selection-count"} invalid={Boolean(error)} />
          <button ref={mapButton} className="open-seat-map" type="button" disabled={!ready} onClick={() => setMapOpen(true)}><Map size={18} aria-hidden="true" /><span>เลือกจากผังโรง</span></button></div>
        {!ready && <p id="seat-hint" className="entry-seat-status">{branch.status === "coming-soon" ? "สาขานี้ยังไม่พร้อมใช้งาน (Coming Soon)" : "กำลังรอข้อมูลที่นั่งของสาขานี้"}</p>}
        {ready && <p id="seat-selection-count" className="entry-seat-status" aria-live="polite">เลือกแล้ว {selectedSeatIds.length} / {MAX_SELECTED_SEATS} — {selectedSeatIds.length === MAX_SELECTED_SEATS ? "ลบที่นั่งเดิมเพื่อเพิ่ม" : "กด Enter เพื่อเพิ่ม"}</p>}
        {error && <p id="seat-error" role="alert" className="entry-error">{error}</p>}{(feedback || (showNotice && notice)) && <p role="status" className="entry-error">{feedback || notice}</p>}
        <button className="entry-submit" type="submit" disabled={!ready}>ดูมุมมองจากที่นั่ง <ArrowRight size={18} aria-hidden="true" /></button>
        {synthetic && <p className="entry-dev-note">ข้อมูลทดสอบเท่านั้น — ไม่ใช่โรงภาพยนตร์จริง</p>}
        {branch.id === "paragon" && ready && <p className="entry-dev-note">ต้นแบบจากผังที่นั่ง — ตำแหน่งและจำนวนที่นั่งบางส่วนยังเป็นค่าประมาณ</p>}
      </form><p className="entry-credit">ขอบคุณข้อมูลจาก K9 Cineblog</p>
    </section>
    {mapOpen && ready && <SeatMapDialog branchName={branch.nameTh} seats={seats} selectedIds={selectedSeatIds} onClose={closeMap} onConfirm={(ids) => { setSelectedSeatIds(ids); setValue(""); setSelectionSource("map"); setError(""); setFeedback(""); setShowNotice(false); closeMap(); }} />}
  </main>;
}
