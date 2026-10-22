import { ArrowLeft, ArrowRight } from "lucide-react";

export default function SeatNavigator({ seatCodes = [], activeIndex = 0, onChange, disabled = false }) {
  return (
    <div className="simulation-seat-navigation" role="group" aria-label="เปลี่ยนที่นั่ง">
      <button type="button" disabled={disabled || activeIndex === 0} onClick={disabled ? undefined : () => onChange(activeIndex - 1)}>
        <ArrowLeft size={15} aria-hidden="true" />
        <span>ที่นั่งก่อนหน้า</span>
      </button>
      <button type="button" disabled={disabled || activeIndex === seatCodes.length - 1} onClick={disabled ? undefined : () => onChange(activeIndex + 1)}>
        <span>ที่นั่งถัดไป</span>
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
