import { expect, it } from "vitest";
import { findSeat, seatRanges } from "../src/simulator/seatCodes";
import { branches } from "../src/data/branches";
const seats = [1, 2, 4]
  .map((number) => ({ id: `a-${number}`, rowId: "A", number: String(number) }))
  .concat([{ id: "b-1", rowId: "B", number: "1" }]);
it("matches a real seat after trimming and case normalization", () => {
  expect(findSeat(seats, " a2 ")?.id).toBe("a-2");
  expect(findSeat(seats, "A3")).toBeNull();
  expect(findSeat(seats, "")).toBeNull();
});
it("does not invent seats inside gaps or uniform row ranges", () => {
  expect(seatRanges(seats)).toBe("A1–A2, A4 · B1");
  expect(
    seatRanges([
      { rowId: "A", number: "01" },
      { rowId: "A", number: "03" },
    ]),
  ).toBe("A01, A03");
});
it("does not choose between ambiguous seat codes", () => {
  expect(
    findSeat(
      [
        { id: "one", rowId: "A", number: "12" },
        { id: "two", rowId: "A1", number: "2" },
      ],
      "A12",
    ),
  ).toBeNull();
});
it("lists eleven unique branches with ten pending simulations", () => {
  expect(branches).toHaveLength(11);
  expect(new Set(branches.map((b) => b.id)).size).toBe(11);
  expect(branches.filter((b) => b.status === "coming-soon")).toHaveLength(10);
  const verified = branches.filter((b) => b.verifiedAt);
  expect(verified).toHaveLength(10);
  expect(
    verified.every(
      (b) =>
        b.nameTh &&
        b.source &&
        b.verifiedAt === "2026-10-10" &&
        b.features.includes("IMAX"),
    ),
  ).toBe(true);
  expect(branches.find((b) => b.id === "rangsit")).toMatchObject({
    nameTh: "เมเจอร์ รังสิต",
    status: "coming-soon",
    verifiedAt: null,
    features: [],
    auditoriums: [],
  });
});
