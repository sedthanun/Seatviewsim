export const seatCode = (seat) => `${seat.rowId}${seat.number}`;
export const normalizeSeatCode = (value) => String(value).trim().toUpperCase();
export function findSeat(seats, value) {
  const code = normalizeSeatCode(value);
  const matches = seats.filter(
    (seat) => normalizeSeatCode(seatCode(seat)) === code,
  );
  return matches.length === 1 ? matches[0] : null;
}
// Compress only contiguous seat numbers within each row, preserving gaps.
export function seatRanges(seats) {
  const rows = [...new Set(seats.map((s) => s.rowId))];
  return rows
    .map((row) => {
      const numbers = [
        ...new Set(
          seats.filter((s) => s.rowId === row).map((s) => String(s.number)),
        ),
      ];
      if (!numbers.every((n) => /^(0|[1-9]\d*)$/.test(n)))
        return numbers.map((n) => `${row}${n}`).join(", ");
      const sorted = numbers.map(Number).sort((a, b) => a - b);
      const ranges = [];
      for (let i = 0; i < sorted.length; i++) {
        const start = sorted[i];
        let end = start;
        while (sorted[i + 1] === end + 1) end = sorted[++i];
        ranges.push(
          start === end ? `${row}${start}` : `${row}${start}–${row}${end}`,
        );
      }
      return ranges.join(", ");
    })
    .join(" · ");
}
