import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { MAX_SELECTED_SEATS } from "../simulator/seatSelection";
import { normalizeSeatCode, seatCode } from "../simulator/seatCodes";

export default function SeatCombobox({ seats, value, onChange, onSelect, selectedIds = [], onRemove, inputRef, disabled, invalid, describedBy }) {
  const root = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(-1);
  const [placement, setPlacement] = useState({ above: false, height: 240 });
  const multiple = Boolean(onSelect);
  const options = useMemo(() => {
    const query = normalizeSeatCode(value);
    return [...seats]
      .filter((seat) => !filtering || normalizeSeatCode(seatCode(seat)).startsWith(query))
      .sort((a, b) => {
        if (a.rowId !== b.rowId) {
          if (a.rowId === "VP") return -1;
          if (b.rowId === "VP") return 1;
          return a.rowId.localeCompare(b.rowId, "en", { numeric: true });
        }
        return String(a.number).localeCompare(String(b.number), "en", { numeric: true });
      });
  }, [seats, value, filtering]);
  const groups = options.reduce((rows, seat, index) => {
    if (rows.at(-1)?.rowId !== seat.rowId) rows.push({ rowId: seat.rowId, items: [] });
    rows.at(-1).items.push({ seat, index });
    return rows;
  }, []);

  function showList(filter = false) {
    setFiltering(filter);
    setActive(-1);
    setOpen(true);
  }
  function choose(seat) {
    if (multiple) onSelect(seat);
    else onChange(seatCode(seat));
    setOpen(false);
    inputRef.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = root.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      // Keep the stacked homepage map button reachable without moving it when the list closes.
      const stackedHome = root.current.closest(".entry-panel") && window.matchMedia("(max-width: 600px)").matches;
      const useAbove = (stackedHome && above >= 240) || (below < 240 && above > below);
      setPlacement({ above: useAbove, height: Math.max(64, Math.min(240, useAbove ? above : below)) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);
  useEffect(() => {
    if (open && active >= 0) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function keyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        showList();
        setActive(event.key === "ArrowDown" ? 0 : seats.length - 1);
      } else {
        setActive((index) => Math.max(0, Math.min(options.length - 1,
          index < 0 ? (event.key === "ArrowDown" ? 0 : options.length - 1) : index + (event.key === "ArrowDown" ? 1 : -1))));
      }
    } else if (event.key === "Enter" && open) {
      if (options.length) { event.preventDefault(); choose(options[active < 0 ? 0 : active]); }
      else setOpen(false);
    } else if (event.key === "Backspace" && !value && selectedIds.length) {
      event.preventDefault();
      root.current.querySelectorAll(".seat-chip button").item(selectedIds.length - 1)?.focus();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="seat-combobox" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <div className={multiple ? `seat-input-shell${disabled ? " is-disabled" : ""}${invalid ? " is-invalid" : ""}` : "seat-single-input"}>
      {multiple && <ul className="seat-chip-list" aria-label="ที่นั่งที่เลือก">
        {selectedIds.map((id) => {
          const seat = seats.find((seat) => seat.id === id);
          if (!seat) return null;
          const code = seatCode(seat);
          return <li className="seat-chip" key={id}><span>{code}</span><button type="button" disabled={disabled}
            aria-label={`ลบที่นั่ง ${code}`} onClick={() => onRemove(id)} onKeyDown={(event) => {
              if (["Backspace", "Delete"].includes(event.key)) { event.preventDefault(); onRemove(id); }
            }}><X size={14} aria-hidden="true" /></button></li>;
        })}
      </ul>}
      <input
        id="seat-code"
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(invalid)}
        aria-describedby={describedBy}
        value={value}
        disabled={disabled}
        placeholder={multiple && selectedIds.length >= MAX_SELECTED_SEATS ? "เลือกครบ 6 ที่นั่งแล้ว" : "เช่น A12 หรือ VP2"}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        onClick={() => { if (!open) showList(); }}
        onChange={(event) => {
          onChange(event.target.value);
          showList(true);
        }}
        onKeyDown={keyDown}
      />
      </div>
      <button className="seat-combobox-toggle" type="button" tabIndex={-1} disabled={disabled}
        aria-label={open ? "ปิดรายการที่นั่ง" : "เปิดรายการที่นั่ง"}
        aria-expanded={open} aria-controls={open ? listId : undefined}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => {
          inputRef.current?.focus();
          if (open) setOpen(false); else showList();
        }}>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && !disabled && (
        <div className={`seat-combobox-list ${placement.above ? "above" : ""}`} id={listId}
          role="listbox" aria-label="รายการที่นั่ง" aria-multiselectable={multiple || undefined} style={{ maxHeight: placement.height }}>
          {groups.map((group) => (
            <div role="group" aria-label={`แถว ${group.rowId}`} key={group.rowId}>
              <div className="seat-combobox-row" aria-hidden="true">แถว {group.rowId}</div>
              {group.items.map(({ seat, index }) => {
                const selected = multiple ? selectedIds.includes(seat.id) : normalizeSeatCode(value) === normalizeSeatCode(seatCode(seat));
                return (
                  <div key={seat.id} id={`${listId}-${index}`} role="option" aria-selected={selected}
                    ref={(element) => { optionRefs.current[index] = element; }}
                    className={`seat-combobox-option ${index === active ? "active" : ""}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(seat)}>
                    <span>{seatCode(seat)}</span>
                    {selected && <Check size={16} aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          ))}
          {!options.length && <p className="seat-combobox-empty" role="status">ไม่พบที่นั่งนี้</p>}
        </div>
      )}
    </div>
  );
}
