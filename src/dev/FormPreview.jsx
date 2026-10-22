import EntryFlow from "../pages/EntryFlow";
import { fixture } from "./fixture";
const config = {
  ...fixture,
  name: "ข้อมูลทดสอบ — ไม่ใช่โรงภาพยนตร์จริง",
  referenceStatus: "reviewed",
  seats: fixture.seats.map((seat) => ({
    ...seat,
    rowId: seat.rowId.replace("TEST-", ""),
  })),
};
const catalog = [
  {
    id: "synthetic",
    nameTh: "โรงภาพยนตร์ทดสอบ (ไม่ใช่พารากอน)",
    status: "available",
    auditoriums: [{ id: "imax", config }],
  },
];
export default function FormPreview() {
  return <EntryFlow catalog={catalog} prefix="/__dev/entry" synthetic />;
}
