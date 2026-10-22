import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowLeft, Armchair } from "lucide-react";
import Auditorium from "./Auditorium";
import SeatedCamera from "./SeatedCamera";
import useVideo from "./useVideo";
import VideoControls from "../components/VideoControls";
import SeatNavigator from "../components/SeatNavigator";
import { seatCode } from "./seatCodes";
import { eyePosition, validateConfig } from "./math";
import "./experience.css";
export class RenderBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-error" role="alert">
        ไม่สามารถแสดงฉาก 3D ได้ กรุณาเปิดการเร่งความเร็วกราฟิกในเบราว์เซอร์
        หรือกลับหน้าแรกเพื่อเลือกที่นั่ง
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Experience({ config, seat, selectedSeats = [seat], onSeatChange, onExit, videoSrc, seatSummary, controlsBeforeTimeline, controlsAction }) {
  const media = useVideo(videoSrc ?? config.videoSrc);
  const [quality, setQuality] = useState(1);
  const [reset, setReset] = useState(0),
    [visible, setVisible] = useState(true);
  const timer = useRef();
  const controls = useRef();
  const simple = matchMedia("(max-width: 760px)").matches;
  const viewpoint = useMemo(() => eyePosition(seat, config.camera.eyeHeight), [seat, config.camera]);
  const configErrors = useMemo(() => validateConfig(config), [config]);
  const activeIndex = selectedSeats.findIndex((selected) => selected.id === seat.id);
  const wake = useCallback(() => {
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!controls.current?.contains(document.activeElement))
        setVisible(false);
    }, 3500);
  }, []);
  useEffect(() => {
    wake();
    const key = (e) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("keydown", key);
    };
  }, [onExit, wake]);
  if (configErrors.length) return <div className="webgl-error" role="alert">
    <p>ข้อมูลโรงหรือพื้นที่ฉายไม่ถูกต้อง: {configErrors.join(" ")}</p>
    <button onClick={onExit}>กลับหน้าแรก</button>
  </div>;
  return (
    <div
      className="simulation-page"
      onPointerMoveCapture={wake}
      onPointerDownCapture={wake}
      onFocus={wake}
      onKeyDown={wake}
    >
      <div className={`simulation-top${seatSummary ? " has-seat-summary" : ""}`}>
        <button className="simulation-back" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" /> กลับหน้าแรก
        </button>
        {seatSummary || <div className="simulation-seat" aria-label={`ที่นั่งของคุณ ${seatCode(seat)}`}>
          <span><Armchair size={14} aria-hidden="true" /> ที่นั่งของคุณ</span>
          <strong>{seatCode(seat)}</strong>
          {selectedSeats.length > 1 && <small className="simulation-seat-count" role="status" aria-live="polite">{activeIndex + 1} / {selectedSeats.length}</small>}
        </div>}
        <div className="simulation-venue">
          <span>
            {config.referenceStatus === "prototype" ? "Paragon Cineplex · IMAX Laser" : config.name}
          </span>
          <small>
          {config.referenceStatus === "synthetic"
            ? "ฉากทดสอบ — ข้อมูลสังเคราะห์"
            : config.referenceStatus === "prototype"
              ? "Prototype"
              : ""}
          </small>
        </div>
      </div>
      <RenderBoundary>
        <Canvas
          dpr={quality}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          camera={{ near: 0.05, far: 150 }}
          fallback={
            <div className="webgl-error" role="alert">
              ไม่สามารถแสดงฉาก 3D ได้ กรุณาเปิดการเร่งความเร็วกราฟิกในเบราว์เซอร์
            </div>
          }
        >
          <Auditorium config={config} media={media} simple={simple} viewpoint={viewpoint} onQualityChange={setQuality} />
          <SeatedCamera seat={seat} settings={config.camera} reset={reset} />
        </Canvas>
      </RenderBoundary>
      <div
        ref={controls}
        className={`simulation-controls ${visible || !media.state.playing || media.state.error ? "" : "is-hidden"}`}
        inert={
          !visible && media.state.playing && !media.state.error
            ? true
            : undefined
        }
      >
        <VideoControls media={media} onReset={() => setReset((v) => v + 1)}
          beforeTimeline={controlsBeforeTimeline ?? <SeatNavigator seatCodes={selectedSeats.map(seatCode)} activeIndex={activeIndex}
            disabled={!onSeatChange} onChange={(index) => onSeatChange(selectedSeats[index].id)} />}
          actionControl={controlsAction} />
      </div>
    </div>
  );
}
