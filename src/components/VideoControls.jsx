import { Play, Pause, Volume2, VolumeX, Crosshair } from "lucide-react";
import SeatNavigator from "./SeatNavigator";
import VideoModeSelector from "./VideoModeSelector";
const time = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export default function VideoControls({ media, onReset, beforeTimeline = <SeatNavigator disabled />, actionControl, videoOptions = [], videoId = "", onVideoChange }) {
  const { video, state, play } = media;
  const selector = actionControl ?? (videoOptions.length > 0
    ? <VideoModeSelector options={videoOptions} value={videoId} ariaLabel="เลือกวิดีโอ" onChange={onVideoChange} />
    : <VideoModeSelector value="pre-show" disabled />);
  return (
    <div className="simulation-player" role="group" aria-label="ควบคุมวิดีโอ">
      <div className="simulation-status" role="status">
        {state.error || (state.loading ? "กำลังโหลดวิดีโอ…" : "")}
      </div>
      {beforeTimeline}
      <div className="simulation-timeline">
        <span>{time(state.time)}</span>
        <input
          aria-label="ตำแหน่งวิดีโอ"
          type="range"
          min="0"
          max={state.duration || 1}
          step="0.1"
          value={Math.min(state.time, state.duration || 1)}
          disabled={!state.duration}
          onChange={(e) => {
            video.currentTime = Number(e.target.value);
          }}
        />
        <span>{time(state.duration)}</span>
      </div>
      <div className="simulation-actions">
        <div className="simulation-playback-actions">
          <button
            className="simulation-icon simulation-play"
            aria-label={state.playing ? "หยุดชั่วคราว" : "เล่น"}
            onClick={() => (state.playing ? video.pause() : play())}
          >
            {state.playing ? <Pause /> : <Play />}
          </button>
          <button
            className="simulation-icon"
            aria-label={state.muted ? "เปิดเสียง" : "ปิดเสียง"}
            onClick={() => {
              video.muted = !video.muted;
            }}
          >
            {state.muted ? <VolumeX /> : <Volume2 />}
          </button>
          <input
            className="simulation-volume"
            aria-label="ระดับเสียง"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.volume}
            onChange={(e) => {
              video.volume = Number(e.target.value);
              video.muted = false;
            }}
          />
        </div>
        <div className="simulation-view-actions">
          <button className="simulation-reset" onClick={onReset}>
            <Crosshair size={16} aria-hidden="true" /> หันกลับหาจอ
          </button>
          {selector}
        </div>
      </div>
      <p className="simulation-look-note">ลากเพื่อมองรอบตัว · แตะหน้าจอเพื่อแสดงการควบคุม · ใช้ปุ่มลูกศรบนคีย์บอร์ด</p>
    </div>
  );
}
