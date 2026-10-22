import { expect, it } from "vitest";
import { appendSeatId, resolveSeatSelection, homeSelectionQuery, experienceSelectionQuery, MAX_SELECTED_SEATS } from "../src/simulator/seatSelection";

const seats = Array.from({ length: 8 }, (_, i) => ({ id: `A-${i + 1}`, rowId: "A", number: String(i + 1) }));
const parse = (query, home = false) => resolveSeatSelection(new URLSearchParams(query), seats, { home });

it("adds six seats in selection order and rejects a seventh without dropping the selection", () => {
  let ids = [];
  for (const seat of seats.slice(0, MAX_SELECTED_SEATS)) ids = appendSeatId(ids, seat.id).ids;
  expect(ids).toEqual(seats.slice(0, 6).map((seat) => seat.id));
  expect(appendSeatId(ids, seats[6].id)).toMatchObject({ ids, error: expect.stringContaining("6") });
  expect(appendSeatId(ids, seats[0].id)).toMatchObject({ ids, duplicate: true, error: "" });
});
it("re-adding a removed seat appends it to the end", () => {
  expect(appendSeatId(["A-3", "A-1"].filter((id) => id !== "A-3"), "A-3").ids).toEqual(["A-1", "A-3"]);
});
it("preserves legacy homepage codes and immersive IDs", () => {
  expect(parse("seat=+a2+", true)).toMatchObject({ ids: ["A-2"], draft: "", activeId: "A-2", error: "" });
  expect(parse("seat=A-2")).toMatchObject({ ids: ["A-2"], activeId: "A-2", error: "" });
  expect(homeSelectionQuery("paragon", [seats[1]]).toString()).toBe("branch=paragon&seat=A2");
  expect(experienceSelectionQuery([seats[1]]).toString()).toBe("seat=A-2");
});
it("keeps invalid uncommitted legacy homepage text for correction", () => {
  expect(parse("seat=A99", true)).toMatchObject({ ids: [], draft: "A99", error: "" });
  expect(parse("", true)).toMatchObject({ ids: [], error: "" });
  expect(parse("").error).not.toBe("");
});
it("deduplicates stable IDs without reordering them and defaults to the first seat", () => {
  expect(parse("seats=A-3&seats=A-1&seats=A-3")).toMatchObject({ ids: ["A-3", "A-1"], activeId: "A-3", error: "" });
});
it("round-trips all selected seats and the active seat through both route formats", () => {
  const selected = [seats[3], seats[0], seats[2]];
  expect(parse(homeSelectionQuery("paragon", selected), true).ids).toEqual(["A-4", "A-1", "A-3"]);
  expect(parse(experienceSelectionQuery(selected, "A-1"))).toMatchObject({ ids: ["A-4", "A-1", "A-3"], activeId: "A-1", error: "" });
});
it.each(["seats=A-1&seats=foreign", "seat=A-8&seats=A-1&seats=A-2", "seats=", "seat=missing"])("rejects invalid immersive selection %s", (query) => {
  expect(parse(query)).toMatchObject({ ids: [], activeId: null, error: expect.any(String) });
  expect(parse(query).error).not.toBe("");
});
it("rejects over-limit URLs before rendering even when all IDs exist", () => {
  expect(parse(seats.slice(0, 7).map((seat) => `seats=${seat.id}`).join("&")).error).toContain("6");
});
