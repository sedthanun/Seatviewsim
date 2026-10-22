import { defaultParagon } from "./layout";
// Five omissions needed to reconcile 426 stated IDs with the reported 421 are unknown.
export const seats = defaultParagon.seats;
export const seatingEstimate = { capacityFromIds: seats.length, reportedCapacity: 421 };
