import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import SeatMap from "./SeatMap";
import { seatCode } from "../simulator/seatCodes";
import { MAX_SELECTED_SEATS, selectionLimitMessage } from "../simulator/seatSelection";

export default function SeatMapDialog({ branchName, seats, selectedIds, onConfirm, onClose }) {
  const dialog = useRef(null), [draftIds, setDraftIds] = useState(selectedIds);
  const [limitNotice, setLimitNotice] = useState("");
  useEffect(() => {
    const element = dialog.current, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; element.showModal();
    const selected = element.querySelector('.seat[aria-pressed="true"]');
    if (selected) {
      selected.focus({ preventScroll: true });
      const scroll = element.querySelector(".map-scroll");
      const seatBounds = selected.getBoundingClientRect(), bounds = scroll.getBoundingClientRect();
      scroll.scrollTo({ left: scroll.scrollLeft + seatBounds.left - bounds.left - (scroll.clientWidth - seatBounds.width) / 2,
        top: scroll.scrollTop + seatBounds.top - bounds.top - (scroll.clientHeight - seatBounds.height) / 2 });
    }
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  function close() { dialog.current.close(); onClose(); }
  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const targets = [...dialog.current.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), [tabindex]")]
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length);
    const first = targets[0], last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const chosen = draftIds.map((id) => seats.find((s) => s.id === id));
  return <dialog ref={dialog} className="seat-dialog" aria-labelledby="seat-dialog-title" aria-describedby="seat-dialog-help" onKeyDown={trapFocus} onCancel={(event) => { event.preventDefault(); close(); }}>
    <div className="seat-dialog-header"><div><p>{branchName}</p><h2 id="seat-dialog-title">เลือกที่นั่งจากผังโรง</h2></div><button type="button" aria-label="ปิดผังโรง" onClick={close}><X size={22} /></button></div>
    <p id="seat-dialog-help">เลือกได้สูงสุด {MAX_SELECTED_SEATS} ที่นั่ง กดที่นั่งที่เลือกซ้ำเพื่อยกเลิก เลื่อนผังเพื่อดูทั้งโรง หรือใช้ปุ่มขยายผัง</p>
    <div className="seat-dialog-body"><SeatMap seats={seats} selectedIds={draftIds} maxSelection={MAX_SELECTED_SEATS}
      onSelectionChange={(ids) => { setDraftIds(ids); setLimitNotice(""); }} onLimitReached={() => setLimitNotice(selectionLimitMessage)} /></div>
    <div className="seat-dialog-footer"><div className="seat-dialog-selection"><p role="status">{chosen.length ? `เลือกแล้ว ${chosen.length} / ${MAX_SELECTED_SEATS}: ${chosen.map(seatCode).join(", ")}` : "ยังไม่ได้เลือกที่นั่ง"}</p>{limitNotice && <p role="alert">{limitNotice}</p>}</div><div><button type="button" onClick={close}>ยกเลิก</button><button type="button" className="confirm-seat" disabled={!chosen.length} onClick={() => { dialog.current.close(); onConfirm(draftIds); }}>ยืนยันที่นั่ง</button></div></div>
  </dialog>;
}
