import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { seatCode } from "../simulator/seatCodes";

const isStandard = (seat) => ["standard", "normal"].includes(seat.category);

export default function SeatMap({ seats, selectedIds = [], onSelectionChange, maxSelection = 1, onLimitReached }) {
  const refs = useRef({}), [zoom, setZoom] = useState(1);
  const rows = [...new Set(seats.map((s) => s.rowId))].sort((a, b) => {
    const averageZ = (id) => { const row = seats.filter((s) => s.rowId === id); return row.reduce((sum, s) => sum + s.position[2], 0) / row.length; };
    return averageZ(a) - averageZ(b);
  });
  const xs = seats.map((s) => s.position[0]), zs = seats.map((s) => s.position[2]);
  const minX = Math.min(...xs) - 0.7, width = Math.max(...xs) - minX + 0.7;
  const minZ = Math.min(...zs), zRange = Math.max(...zs) - minZ;
  const mapHeight = Math.max(180, rows.length * 60) * zoom;
  const mapTop = (z) => 16 + (zRange ? (z - minZ) / zRange : 0.5) * (mapHeight - 50);
  function move(event, seat) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const rowIndex = rows.indexOf(seat.rowId);
    const rowSeats = seats.filter((s) => s.rowId === seat.rowId).sort((a, b) => a.position[0] - b.position[0]);
    const next = event.key === "ArrowLeft" || event.key === "ArrowRight"
      ? rowSeats[rowSeats.indexOf(seat) + (event.key === "ArrowLeft" ? -1 : 1)]
      : seats.filter((s) => s.rowId === rows[rowIndex + (event.key === "ArrowUp" ? -1 : 1)])
        .sort((a, b) => Math.abs(a.position[0] - seat.position[0]) - Math.abs(b.position[0] - seat.position[0]))[0];
    next && refs.current[next.id]?.focus();
  }
  function choose(id) {
    if (maxSelection === 1) onSelectionChange([id]);
    else if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((value) => value !== id));
    else if (selectedIds.length < maxSelection) onSelectionChange([...selectedIds, id]);
    else onLimitReached?.();
  }
  return <div className="seat-map" role="group" aria-label="ผังที่นั่งโรงภาพยนตร์">
    <div className="seat-map-tools"><p>ใช้ปุ่มลูกศรเลื่อนระหว่างที่นั่ง แล้วกด Enter หรือ Space เพื่อเลือก</p><div><button type="button" aria-label="ย่อผัง" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.25))}><Minus size={16} /></button><output aria-label="ระดับซูม">{Math.round(zoom * 100)}%</output><button type="button" aria-label="ขยายผัง" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.25))}><Plus size={16} /></button></div></div>
    <div className="map-screen">จอภาพยนตร์</div>
    <div className="map-scroll" onScroll={(event) => event.currentTarget.style.setProperty("--map-pan-x", `${event.currentTarget.scrollLeft}px`)}><div className="seat-map-surface" style={{ width: `${zoom * 100}%`, "--map-zoom": zoom }}>
      <div className="map-inner" style={{ height: mapHeight, position: "relative" }}>
        {rows.map((row) => { const rowSeats = seats.filter((s) => s.rowId === row);
          return <div className="seat-row" key={row} style={{ position: "absolute", inset: 0, height: "100%", pointerEvents: "none" }}>
            <span className="row-label" style={{ position: "absolute", top: mapTop(rowSeats.reduce((sum, s) => sum + s.position[2], 0) / rowSeats.length) + 7 }}>{row}</span>
            <div className="seat-row-positions" style={{ marginLeft: 48, width: "calc(100% - 96px)", height: "100%" }}>
              {rowSeats.map((seat) => <button type="button" key={seat.id} tabIndex={seat.id === (selectedIds[0] || seats[0]?.id) ? 0 : -1} ref={(el) => { refs.current[seat.id] = el; }}
                style={{ left: `${((seat.position[0] - minX) / width) * 100}%`, top: mapTop(seat.position[2]), pointerEvents: "auto" }}
                className={`seat ${isStandard(seat) ? "" : "premium"} ${selectedIds.includes(seat.id) ? "selected" : ""}`}
                aria-label={`ที่นั่ง ${seatCode(seat)} แถว ${seat.rowId} ${isStandard(seat) ? "ปกติ" : "พรีเมียม"}`} aria-pressed={selectedIds.includes(seat.id)}
                aria-disabled={maxSelection > 1 && selectedIds.length >= maxSelection && !selectedIds.includes(seat.id) ? true : undefined}
                onKeyDown={(e) => move(e, seat)} onClick={() => choose(seat.id)}>{seat.number}</button>)}
            </div></div>;
        })}
      </div></div></div>
    <div className="seat-legend"><span><i /> ปกติ</span><span><i className="premium" /> พรีเมียม</span><span><i className="selected" /> ที่นั่งที่เลือก</span></div>
  </div>;
}
