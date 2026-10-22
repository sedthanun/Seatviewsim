import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, MonitorPlay } from "lucide-react";
import { canSimulate } from "../data/branches";
import { cinemaPresentation } from "../data/cinemaPresentation";

function Thumbnail({ branch }) {
  const asset = cinemaPresentation[branch.id];
  const [failed, setFailed] = useState(false);
  return asset && !failed ? <img src={asset.thumbnail} alt={asset.alt} onError={() => setFailed(true)} draggable="false" /> :
    <div className="cinema-placeholder" aria-label="ยังไม่มีภาพโรงนี้"><MonitorPlay size={30} /><span>IMAX</span></div>;
}
export default function CinemaCarousel({ catalog, selectedId, onSelect }) {
  const track = useRef(null), cards = useRef([]);
  const index = Math.max(0, catalog.findIndex((branch) => branch.id === selectedId));
  useEffect(() => {
    const card = cards.current[index], rail = track.current;
    if (!card || !rail) return;
    rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [index]);
  function choose(next, focus = false) {
    const target = Math.max(0, Math.min(catalog.length - 1, next));
    onSelect(catalog[target].id);
    if (focus) cards.current[target]?.focus({ preventScroll: true });
  }
  return <section className="cinema-carousel" aria-labelledby="cinema-picker-title">
    <div className="cinema-picker-heading"><h2 id="cinema-picker-title">เลือกโรงภาพยนตร์</h2><span>{String(index + 1).padStart(2, "0")} / {String(catalog.length).padStart(2, "0")}</span></div>
    <div className="cinema-carousel-layout">
      <button type="button" className="carousel-arrow" aria-label="โรงก่อนหน้า" disabled={index === 0} onClick={() => choose(index - 1)}><ChevronLeft size={20} /></button>
      <div ref={track} className="cinema-track" role="radiogroup" aria-label="เลือกสาขา">
        {catalog.map((branch, i) => {
          const ready = branch.auditoriums.some((a) => canSimulate(branch, a));
          return <button key={branch.id} ref={(el) => { cards.current[i] = el; }} type="button" role="radio"
            aria-checked={i === index} aria-label={`${branch.nameTh}${ready ? "" : " (Coming Soon)"}`} tabIndex={i === index ? 0 : -1}
            className={`cinema-level ${i === index ? "is-selected" : ""}`} onClick={() => choose(i)}
            onKeyDown={(event) => {
              const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: catalog.length - 1 }[event.key];
              if (next !== undefined) { event.preventDefault(); choose(next, true); }
            }}>
            <div className="cinema-level-image"><Thumbnail branch={branch} /><span className={`cinema-level-status ${ready ? "is-ready" : ""}`}>{ready ? <MonitorPlay size={12} /> : <Lock size={12} />}{ready ? "พร้อมสำรวจ" : "Coming Soon"}</span></div>
            <span className="cinema-level-brand">IMAX <span>{String(i + 1).padStart(2, "0")}</span></span><span className="cinema-level-name">{branch.nameTh}</span>
          </button>;
        })}
      </div>
      <button type="button" className="carousel-arrow" aria-label="โรงถัดไป" disabled={index === catalog.length - 1} onClick={() => choose(index + 1)}><ChevronRight size={20} /></button>
    </div>
  </section>;
}
