import Ajv from "ajv";
import schema from "../data/schemas/cinema.schema.json";
import { normalizeSeatCode, seatCode } from "../simulator/seatCodes";
import { validateProjection } from "../simulator/math";
import { resolveCinemaSeating } from "./resolveCinemaSeating";

const checkStructure = new Ajv({ strict: true, strictNumbers: true, allErrors: true,
  coerceTypes: false, useDefaults: false, removeAdditional: false }).compile(schema);
const escapePointer = value => String(value).replace(/~/g, "~0").replace(/\//g, "~1");
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function pointerExists(document, pointer) {
  if (!pointer.startsWith("/") || /~(?![01])/.test(pointer)) return false;
  let current = document;
  for (const token of pointer.slice(1).split("/")) {
    const key = token.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!current || typeof current !== "object" || !own(current, key)) return false;
    current = current[key];
  }
  return true;
}

// Also guard direct JS calls: JSON.stringify would hide NaN/Infinity and drop functions.
function checkPlainData(value, path, add, ancestors = new Set()) {
  if (typeof value === "number" && !Number.isFinite(value)) add(path, "NON_FINITE", "ตัวเลขต้องเป็นค่าจำกัด");
  else if (value !== null && typeof value === "object") {
    if (ancestors.has(value)) { add(path, "NOT_JSON", "ข้อมูลต้องไม่มีการอ้างอิงวนกลับ"); return; }
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
      add(path, "NOT_JSON", "รองรับเฉพาะข้อมูล JSON ธรรมดา"); return;
    }
    ancestors.add(value);
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) checkPlainData(value[index], `${path}/${index}`, add, ancestors);
    } else {
      for (const [key, child] of Object.entries(value)) checkPlainData(child, `${path}/${escapePointer(key)}`, add, ancestors);
    }
    ancestors.delete(value);
  } else if (!["string", "number", "boolean"].includes(typeof value) && value !== null) {
    add(path, "NOT_JSON", "รองรับเฉพาะข้อมูล JSON ธรรมดา");
  }
}

/** Validate a parsed Cinema v1 object without modifying it. Does not parse text or load media. */
export function validateCinema(data, { expectedBranchId } = {}) {
  const errors = [], warnings = [];
  let configuredSeatCount = 0;
  const add = (path, code, message) => errors.push({ path, code, message });
  const warn = (path, code, message) => warnings.push({ path, code, message });
  const result = () => ({ valid: errors.length === 0,
    canSimulate: errors.length === 0 && data?.status === "available" && configuredSeatCount > 0,
    errors, warnings, configuredSeatCount });
  checkPlainData(data, "", add);
  if (errors.length) return result();
  if (!checkStructure(data)) {
    for (const error of checkStructure.errors) {
      const key = error.params.missingProperty ?? error.params.additionalProperty;
      const path = error.instancePath + (key == null ? "" : `/${escapePointer(key)}`);
      const messages = {
        required: "ขาดข้อมูลที่จำเป็น", additionalProperties: "พบฟิลด์ที่รูปแบบนี้ไม่รองรับ",
        type: "ชนิดข้อมูลไม่ถูกต้อง", const: "ค่าข้อมูลหรือรุ่นเอกสารไม่รองรับ", enum: "ค่าที่เลือกไม่รองรับ",
        minItems: "รายการมีข้อมูลไม่ครบ", maxItems: "รายการมีข้อมูลมากเกินไป", uniqueItems: "รายการต้องไม่ซ้ำ",
        pattern: "ข้อความไม่ตรงรูปแบบที่กำหนด", oneOf: "ต้องเลือกข้อมูลเพียงรูปแบบเดียว", anyOf: "ข้อมูลไม่ครบตามรูปแบบที่รองรับ",
      };
      add(path, `SCHEMA_${error.keyword.toUpperCase()}`, messages[error.keyword] ?? "ข้อมูลไม่ผ่านข้อกำหนดของรูปแบบ");
    }
    return result();
  }
  if (expectedBranchId !== undefined && data.branchId !== expectedBranchId)
    add("/branchId", "BRANCH_MISMATCH", "รหัสสาขาไม่ตรงกับไฟล์หรือทะเบียนที่เรียกใช้");
  if (data.verifiedAt !== null) {
    const date = new Date(`${data.verifiedAt}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.verifiedAt)
      add("/verifiedAt", "INVALID_DATE", "วันที่ตรวจสอบไม่ใช่วันที่ในปฏิทิน");
  }

  const evidence = new Set();
  const addUnique = (set, value, path, code, message) => {
    if (set.has(value)) add(path, code, message);
    set.add(value);
  };
  data.evidence.forEach((entry, index) => {
    addUnique(evidence, entry.id, `/evidence/${index}/id`, "DUPLICATE_EVIDENCE", "รหัสหลักฐานต้องไม่ซ้ำ");
    entry.supports.forEach((path, i) => {
      if (!pointerExists(data, path)) add(`/evidence/${index}/supports/${i}`, "UNKNOWN_PATH", "หลักฐานอ้างฟิลด์ที่ไม่มีในเอกสาร");
    });
  });
  const checkReferences = (ids, path) => ids.forEach((id, index) => {
    if (!evidence.has(id)) add(`${path}/${index}`, "UNKNOWN_EVIDENCE", "ไม่พบรหัสหลักฐานที่อ้างอิง");
  });
  data.estimates.forEach((entry, index) => {
    if (!pointerExists(data, entry.path)) add(`/estimates/${index}/path`, "UNKNOWN_PATH", "ค่าประมาณอ้างฟิลด์ที่ไม่มีในเอกสาร");
    checkReferences(entry.evidenceIds, `/estimates/${index}/evidenceIds`);
  });
  const unresolvedIds = new Set();
  data.unresolved.forEach((entry, index) => {
    addUnique(unresolvedIds, entry.id, `/unresolved/${index}/id`, "DUPLICATE_ISSUE", "รหัสประเด็นค้างต้องไม่ซ้ำ");
    entry.paths.forEach((path, i) => {
      if (!pointerExists(data, path)) add(`/unresolved/${index}/paths/${i}`, "UNKNOWN_PATH", "ประเด็นค้างอ้างฟิลด์ที่ไม่มีในเอกสาร");
    });
    checkReferences(entry.evidenceIds, `/unresolved/${index}/evidenceIds`);
  });
  const a = data.auditorium;
  const root = "/auditorium";
  if (a.screen) validateProjection(a.screen, a.projection).forEach(() =>
    add(`${root}/projection`, "INVALID_PROJECTION", "กรอบฉายต้องมีขนาดถูกต้องและอยู่ภายในจอจริง"));
  else if (a.projection) add(`${root}/screen`, "SCREEN_REQUIRED", "ต้องมีจอจริงก่อนกำหนดกรอบฉาย");
  if (a.environment && a.environment.sconces.countPerSide > a.environment.strips.countPerSide)
    add(`${root}/environment/sconces/countPerSide`, "INVALID_FIXTURE_COUNT", "จำนวนไฟอำพันต้องไม่เกินตำแหน่งชุดไฟต่อฝั่ง");
  if (a.media) {
    const clipIds = new Set();
    a.media.clips.forEach((clip, index) => {
      addUnique(clipIds, clip.id, `${root}/media/clips/${index}/id`, "DUPLICATE_CLIP", "รหัสคลิปต้องไม่ซ้ำ");
      checkReferences(clip.evidenceIds, `${root}/media/clips/${index}/evidenceIds`);
    });
    const clip = a.media.clips.find(value => value.id === a.media.defaultVideoId);
    if ((a.media.defaultVideoId !== null && (!clip || clip.status !== "ready")) || (data.status === "available" && !clip))
      add(`${root}/media/defaultVideoId`, "INVALID_DEFAULT_VIDEO", "คลิปเริ่มต้นต้องอ้างคลิปที่พร้อมใช้ของสาขานี้");
  }

  const rowIds = new Set();
  if (a.layout) {
    a.layout.rows.forEach((row, index) => {
      const path = `${root}/layout/rows/${index}`;
      addUnique(rowIds, row.id, `${path}/id`, "DUPLICATE_ROW", "รหัสแถวต้องไม่ซ้ำ");
      if (index === 0 ? !own(row, "distanceFromScreen") || own(row, "distanceFromPrevious")
        : !own(row, "distanceFromPrevious") || own(row, "distanceFromScreen"))
        add(path, "INVALID_ROW_DISTANCE", "แถวแรกใช้ระยะจากจอ ส่วนแถวถัดไปใช้ระยะจากแถวก่อนหน้าเพียงค่าเดียว");
      if (row.frontOffset >= row.backOffset)
        add(path, "INVALID_FLOOR_BOUNDS", "ขอบพื้นหน้าต้องอยู่ก่อนขอบพื้นหลัง");
      if (index < a.layout.rows.length - 1 && !own(row, "stairRunToNext"))
        add(`${path}/stairRunToNext`, "STAIR_RUN_REQUIRED", "ต้องกำหนดระยะบันไดเชื่อมไปแถวถัดไป");
      if (index === a.layout.rows.length - 1 && own(row, "stairRunToNext"))
        add(`${path}/stairRunToNext`, "UNUSED_STAIR_RUN", "แถวสุดท้ายไม่มีบันไดเชื่อมไปแถวถัดไป");
      if (Array.isArray(row.platforms)) {
        row.platforms.forEach((band, i) => {
          if (band.left >= band.right) add(`${path}/platforms/${i}`, "INVALID_FLOOR_BOUNDS", "ขอบพื้นซ้ายต้องน้อยกว่าขอบขวา");
          if (row.platforms.some((other, j) => j < i && Math.min(band.right, other.right) > Math.max(band.left, other.left)))
            add(`${path}/platforms/${i}`, "OVERLAPPING_PLATFORMS", "ช่วงพื้นในแถวเดียวกันต้องไม่ทับกัน");
        });
      }
    });
    const level = a.layout.elevation;
    if (level.mode === "custom" && (level.levels.length !== a.layout.rows.length || level.levels.some((value, index) => index > 0 && value < level.levels[index - 1])))
      add(`${root}/layout/elevation/levels`, "INVALID_LEVELS", "ระดับพื้นต้องครบทุกแถวและไม่ลดลงไปท้ายโรง");
    const architecture = a.layout.architecture;
    if (architecture.platformMargin >= architecture.sideClearance || architecture.railRadius >= architecture.platformMargin)
      add(`${root}/layout/architecture`, "INVALID_ARCHITECTURE", "ขอบพื้นและราวต้องอยู่ภายในช่องว่างข้างเก้าอี้");
    const aisleIds = new Set(), sides = new Set();
    let centralCount = 0;
    a.layout.aisles.forEach((aisle, index) => {
      addUnique(aisleIds, aisle.id, `${root}/layout/aisles/${index}/id`, "DUPLICATE_AISLE", "รหัสทางเดินต้องไม่ซ้ำ");
      if (aisle.kind === "central") centralCount++;
      if (aisle.kind === "side") addUnique(sides, aisle.side, `${root}/layout/aisles/${index}/side`, "DUPLICATE_AISLE_SIDE", "ทางเดินข้างแต่ละฝั่งต้องไม่ซ้ำ");
    });
    if (centralCount > 1 || (a.layout.rows.some(row => row.platforms === "split") && centralCount !== 1))
      add(`${root}/layout/aisles`, "INVALID_CENTRAL_AISLE", "พื้นแบบ split ต้องมีทางเดินกลางหนึ่งรายการ และห้ามทางเดินกลางซ้ำ");
  }

  const ids = new Set(), codes = new Set(), seatingRows = new Set(), pairs = new Set(), pairedSeats = new Set();
  if (a.seating) {
    if (!a.layout) add(`${root}/layout`, "LAYOUT_REQUIRED", "ต้องมีผังแถวก่อนกำหนดที่นั่ง");
    a.seating.rows.forEach((row, index) => {
      const path = `${root}/seating/rows/${index}`;
      addUnique(seatingRows, row.rowId, `${path}/rowId`, "DUPLICATE_SEATING_ROW", "ข้อมูลที่นั่งแต่ละแถวต้องมีรายการเดียว");
      if (!rowIds.has(row.rowId)) add(`${path}/rowId`, "UNKNOWN_ROW", "ไม่พบแถวที่อ้างในผัง");
      const numbers = new Set();
      row.blocks.forEach((block, i) => {
        if (!own(a.seating.categories, block.category)) add(`${path}/blocks/${i}/category`, "UNKNOWN_CATEGORY", "ไม่พบประเภทที่นั่งที่อ้างอิง");
        block.numbers.forEach((number, slot) => {
          if (number === null) return;
          configuredSeatCount++;
          const at = `${path}/blocks/${i}/numbers/${slot}`;
          addUnique(numbers, number, at, "DUPLICATE_NUMBER", "เลขที่นั่งในแถวต้องไม่ซ้ำ");
          addUnique(ids, `${row.rowId}-${number}`, at, "DUPLICATE_SEAT_ID", "รหัสที่นั่งต้องไม่ซ้ำ");
          addUnique(codes, normalizeSeatCode(`${row.rowId}${number}`), at, "DUPLICATE_SEAT_CODE", "รหัสแสดงผลหลังปรับตัวพิมพ์ต้องไม่ซ้ำ");
        });
      });
      if (!numbers.size) add(`${path}/blocks`, "EMPTY_SEATING_ROW", "แถวต้องมีเก้าอี้จริงอย่างน้อยหนึ่งที่นั่ง");
      row.pairs.forEach((pair, i) => {
        addUnique(pairs, pair.id, `${path}/pairs/${i}/id`, "DUPLICATE_PAIR", "รหัสคู่ที่นั่งต้องไม่ซ้ำทั้งโรง");
        pair.numbers.forEach((number, j) => {
          if (!numbers.has(number)) add(`${path}/pairs/${i}/numbers/${j}`, "UNKNOWN_PAIR_SEAT", "คู่ที่นั่งต้องอ้างที่นั่งจริงในแถวเดียวกัน");
          addUnique(pairedSeats, normalizeSeatCode(`${row.rowId}${number}`), `${path}/pairs/${i}/numbers/${j}`, "SEAT_IN_MULTIPLE_PAIRS", "ที่นั่งหนึ่งตัวอยู่ได้เพียงหนึ่งคู่");
        });
      });
    });
    for (const id of rowIds) if (!seatingRows.has(id)) add(`${root}/seating/rows`, "ROW_SEATING_REQUIRED", "ต้องมีข้อมูลที่นั่งครบทุกแถวในผัง");
    const overrides = new Set();
    a.seating.seatOverrides.forEach((value, index) => {
      addUnique(overrides, value.seatId, `${root}/seating/seatOverrides/${index}/seatId`, "DUPLICATE_OVERRIDE", "พิกัดเฉพาะแต่ละที่นั่งต้องมีรายการเดียว");
      if (!ids.has(value.seatId)) add(`${root}/seating/seatOverrides/${index}/seatId`, "UNKNOWN_OVERRIDE_SEAT", "พิกัดเฉพาะต้องอ้างที่นั่งที่ประกาศแล้ว");
    });
    if (!a.camera) add(`${root}/camera`, "CAMERA_REQUIRED", "ต้องมีกล้องเพื่อคำนวณตำแหน่งสายตา");
  }

  if (a.capacity && a.seating) {
    if (a.capacity.configured !== configuredSeatCount)
      add(`${root}/capacity/configured`, "CONFIGURED_COUNT_MISMATCH", "จำนวนที่กำหนดต้องเท่ากับเก้าอี้จริง ไม่นับช่อง null");
    if (a.capacity.reported !== null && a.capacity.reported !== configuredSeatCount) {
      if (!a.capacity.discrepancy?.trim()) add(`${root}/capacity/discrepancy`, "CAPACITY_EXPLANATION_REQUIRED", "ต้องอธิบายจำนวนที่นั่งที่ไม่ตรงกับจำนวนรายงาน");
      else if (a.referenceStatus === "reviewed") add(`${root}/capacity`, "REVIEWED_CAPACITY_MISMATCH", "โรงที่ตรวจแล้วต้องแก้ความคลาดเคลื่อนจำนวนที่นั่งให้ครบ");
      else warn(`${root}/capacity`, "CAPACITY_DISCREPANCY", `จำนวนรายงาน ${a.capacity.reported} ต่างจากจำนวนที่กำหนด ${configuredSeatCount}: ${a.capacity.discrepancy}`);
    }
  }
  if (a.layout && a.seating && a.camera && errors.length === 0) {
    const expanded = resolveCinemaSeating(a);
    checkPlainData(expanded, `${root}/resolved`, add);
    // These are software consistency checks, not a certification of the actual auditorium.
    expanded.rows.forEach((row, index) => {
      if (row.front >= row.back) add(`${root}/layout/rows/${index}`, "DEGENERATE_FLOOR", "ขอบพื้นที่คำนวณต้องมีระยะจริง");
      const next = expanded.rows[index + 1];
      if (next && (next.z <= row.z || next.front < row.back - 1e-6))
        add(`${root}/layout/rows/${index}`, "OVERLAPPING_ROWS", "แถวต้องเรียงจากหน้าไปหลังและพื้นแถวต้องไม่ทับกัน");
      if (next && a.layout.rows[index].stairRunToNext > next.front - row.front + 1e-6)
        add(`${root}/layout/rows/${index}/stairRunToNext`, "STAIR_RUN_TOO_LONG", "ระยะบันไดต้องอยู่ภายในช่วงเปลี่ยนแถว");
    });
    const positions = new Set();
    expanded.seats.forEach((seat, index) => {
      const key = seat.position.join(",");
      addUnique(positions, key, `${root}/seating`, "COINCIDENT_SEATS", `ที่นั่ง ${seatCode(seat)} มีพิกัดซ้ำกับที่นั่งอื่น`);
      if (seat.eyeOffset[1] <= 0) add(`${root}/seating`, "INVALID_EYE_OFFSET", `ระดับสายตาที่นั่ง ${seatCode(seat)} ต้องอยู่เหนือพื้น`);
    });
  }
  return result();
}
