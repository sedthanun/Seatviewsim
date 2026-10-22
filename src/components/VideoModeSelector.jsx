const modes = [
  { id: "pre-show", label: "Pre-Show" },
  { id: "countdown", label: "Countdown" },
];

export default function VideoModeSelector({ value, onChange, disabled = false }) {
  return (
    <label className="simulation-video-field">
      <span>วิดีโอ</span>
      <select className="simulation-video-mode" aria-label="รูปแบบวิดีโอ (ตัวอย่างปุ่ม)" title="ตัวอย่างปุ่ม ยังไม่เปลี่ยนวิดีโอ"
        disabled={disabled} value={value} onChange={disabled ? undefined : (event) => onChange(event.target.value)}>
        {modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
      </select>
    </label>
  );
}
