const modes = [
  { id: "pre-show", label: "Pre-Show" },
  { id: "countdown", label: "Countdown" },
];

export default function VideoModeSelector({ value, onChange, disabled = false, options = null, ariaLabel = "รูปแบบวิดีโอ (ตัวอย่างปุ่ม)" }) {
  const choices = options ?? modes;
  return (
    <label className="simulation-video-field">
      <span>วิดีโอ</span>
      <select className="simulation-video-mode" aria-label={ariaLabel} title={options ? undefined : "ตัวอย่างปุ่ม ยังไม่เปลี่ยนวิดีโอ"}
        disabled={disabled} value={value} onChange={disabled ? undefined : (event) => onChange(event.target.value)}>
        {choices.map((choice) => <option key={choice.id} value={choice.id} disabled={choice.status !== undefined && (choice.status !== "ready" || !choice.src)}>
          {choice.name ?? choice.label}{choice.status !== undefined && (choice.status !== "ready" || !choice.src) ? " — ยังไม่มีไฟล์" : ""}
        </option>)}
      </select>
    </label>
  );
}
