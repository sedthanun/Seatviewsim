import { findSeat, seatCode } from "./seatCodes";

export const MAX_SELECTED_SEATS = 6;
export const selectionLimitMessage = `เลือกได้สูงสุด ${MAX_SELECTED_SEATS} ที่นั่ง กรุณาลบที่นั่งเดิมก่อนเพิ่ม`;

export function appendSeatId(ids, id) {
  if (ids.includes(id)) return { ids, duplicate: true, error: "" };
  if (ids.length >= MAX_SELECTED_SEATS) return { ids, error: selectionLimitMessage };
  return { ids: [...ids, id], error: "" };
}

// New links use stable IDs; legacy homepage links use display codes.
export function resolveSeatSelection(params, seats, { home = false } = {}) {
  const repeated = params.getAll("seats");
  const active = params.get("seat");
  const invalid = { ids: [], activeId: null, draft: "", error: "ไม่พบที่นั่งที่ระบุ กรุณาเลือกที่นั่งอีกครั้ง" };
  if (repeated.length) {
    const ids = [...new Set(repeated)];
    if (ids.length > MAX_SELECTED_SEATS) return { ...invalid, error: selectionLimitMessage };
    if (ids.some((id) => !seats.some((seat) => seat.id === id)) || (active !== null && !ids.includes(active))) return invalid;
    return { ids, activeId: active ?? ids[0], draft: "", error: "" };
  }
  if (active !== null) {
    const seat = home ? findSeat(seats, active) : seats.find((seat) => seat.id === active);
    if (seat) return { ids: [seat.id], activeId: seat.id, draft: "", error: "" };
    if (home) return { ids: [], activeId: null, draft: active, error: "" };
  }
  return home ? { ids: [], activeId: null, draft: "", error: "" } : invalid;
}

export function homeSelectionQuery(branchId, seats, videoId = null) {
  const params = new URLSearchParams({ branch: branchId });
  if (seats.length === 1) params.set("seat", seatCode(seats[0]));
  else seats.forEach((seat) => params.append("seats", seat.id));
  if (videoId) params.set("video", videoId);
  return params;
}

export function experienceSelectionQuery(seats, activeId = seats[0]?.id, videoId = null) {
  const params = new URLSearchParams({ seat: activeId });
  if (seats.length > 1) seats.forEach((seat) => params.append("seats", seat.id));
  if (videoId) params.set("video", videoId);
  return params;
}
