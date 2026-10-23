# NEXT-02 Cinema JSON Migration Design

**Goal:** ย้ายข้อมูล Paragon จาก JavaScript constants ไปเป็น Cinema Data v1 JSON ต่อสาขา โดยคงพฤติกรรม runtime เดิม และสร้าง boundary ที่รองรับการเพิ่มสาขาในอนาคต

## Scope

งานนี้ครอบคลุมเฉพาะ NEXT-02 ตาม Development Log:

- ใช้ `src/data/cinemas/paragon.json` เป็น source input หลัก
- สร้าง loader และ runtime adapter สำหรับ Cinema Data v1
- เชื่อม branch registry และโหลดข้อมูลแบบ lazy เฉพาะสาขาที่เลือก
- ปรับ loading/error guard ของ EntryFlow
- เชื่อม Calibration preview กับ builder ใหม่ โดยไม่เปลี่ยน Calibration trial v1
- ตรวจ parity กับ frozen pre-migration baseline แล้วเลิกใช้ constants ที่ซ้ำ

ไม่รวม media dropdown/Countdown, การเพิ่มสาขาที่สอง, การแก้ discrepancy 421/426 หรือการยืนยันความแม่นยำกับโรงจริง

## Architecture

Cinema JSON เป็น source-of-truth ของข้อมูลสาขาและ auditorium ส่วน renderer ยังคงใช้ runtime shape เดิมผ่าน adapter ชั้นกลาง การแยกสองชั้นนี้ทำให้ schema/data เปลี่ยนได้โดยไม่บังคับให้ renderer รู้จักรูปแบบ JSON โดยตรง

Registry จะเก็บรายการสาขาและ loader reference เท่านั้น ไม่เก็บ seat, geometry, camera หรือ environment constants ซ้ำ Loader จะ dynamic import JSON, ตรวจ `branchId` กับ registry และเรียก `validateCinema`; ข้อมูลที่ไม่ผ่าน validation จะถูกส่งกลับเป็น typed loading error และไม่เริ่ม simulator

Adapter จะ derive runtime `seats`, row geometry, platforms, stairs, screen, camera, environment, EXIT และ media จาก inputs ใน JSON ตาม recipe v1 เดิม โดยไม่บันทึก derived values ซ้ำใน JSON

## Data Flow

```text
branch registry
  -> lazy JSON loader
  -> parse + validateCinema(expectedBranchId)
  -> Cinema Data v1
  -> buildCinemaRuntime()
  -> existing seat map / simulator / camera / environment
```

สำหรับ `coming-soon` หรือข้อมูลที่โหลด/ตรวจไม่ผ่าน flow จะหยุดก่อนสร้าง runtime scene และแสดงข้อผิดพลาดที่ผู้ใช้เข้าใจได้ ห้ามใช้ Paragon เป็น fallback

## Component Boundaries

- `src/data/cinemas/*.json`: source inputs ต่อสาขา หนึ่งไฟล์ต่อหนึ่งสาขาและหนึ่ง auditorium
- `src/data/cinemaRegistry.js`: branch-to-loader mapping และ metadata ที่จำเป็นต่อการค้นหา/โหลด
- `src/config/loadCinema.js`: parsing, validation, branch identity check และ error result
- `src/config/buildCinemaRuntime.js`: adapter จาก Cinema Data v1 ไปยัง runtime shape เดิม
- `src/data/branches.js`: directory metadata, availability และ public presentation data เท่านั้น
- `src/pages/EntryFlow.jsx`: loading/error lifecycle และการ guard ก่อนเข้า simulator
- `src/config/paragon/*`: เปลี่ยนจาก source constants เป็นสูตร/recipe ที่รับ data inputs; ไม่เก็บข้อมูลเฉพาะ Paragon ซ้ำ

ชื่อไฟล์และ interface จริงต้องสอดคล้องกับ pattern ที่พบใน codebase ระหว่าง implementation plan; หากมีไฟล์เดิมทำหน้าที่เดียวกัน ให้ปรับไฟล์นั้นแทนการสร้าง abstraction ซ้ำ

## Compatibility Requirements

- Runtime seat IDs, normalized seat codes, categories และ VP pairs ต้องตรง baseline
- ตำแหน่ง seats/eyes, rows, platforms, stairs, screen, projection/UV, camera, environment และ EXIT ต้องเท่าภายใน tolerance `1e-6`
- คง URL seat routing, browser Back, focus restoration และ direct-entry guards
- คง Calibration trial v1 import/export และ DEV-only exclusion
- Paragon ยังคงสถานะ `available` + `prototype`, reported capacity 421 และ configured capacity 426

## Error Handling

แยกข้อผิดพลาดเป็นสามกลุ่ม:

1. JSON import/parse failure: แสดงสถานะโหลดข้อมูลไม่สำเร็จ
2. Schema/relationship validation failure: แสดงข้อมูลสาขาไม่ถูกต้องพร้อม diagnostic ที่ได้จาก validator
3. Valid แต่เปิดใช้งานไม่ได้ เช่น `coming-soon` หรือไม่มีที่นั่ง: แสดงสถานะยังไม่พร้อมใช้งาน

ทุกกลุ่มต้องป้องกันการเริ่ม WebGL/video และต้องไม่ fallback ไปข้อมูลของสาขาอื่น

## Testing and Acceptance

- Unit tests สำหรับ loader, registry identity, invalid/missing/coming-soon guards และ adapter
- Parity tests เทียบ `tests/baselines/paragon-v1.json` สำหรับข้อมูลทั้งโรง, seats, eyes, camera, floor/screen/projection/UV และ EXIT
- รัน `npm test`, `npm run build`, `npm run test:production`
- รัน browser tests ที่เกี่ยวข้องกับ home selection, loading, direct URL, seat flow และ calibration
- เพิ่ม fixture ของผังที่ต่างจาก Paragon เพื่อยืนยันว่า adapter ไม่สร้าง rectangular grid แบบตายตัว
- ห้าม regenerate baseline เพื่อกลบ regression; การเปลี่ยน baseline ต้องเป็น intentional change ที่ตรวจสอบแยกต่างหาก

## Future Branch Contract

การเพิ่มสาขาใหม่ในภายหลังต้องทำโดยเพิ่ม `src/data/cinemas/<branchId>.json` และ registry entry เท่านั้นเมื่อใช้ layout/environment recipe ที่รองรับอยู่แล้ว Renderer และหน้า simulator ไม่ควรมีเงื่อนไขเฉพาะชื่อสาขา หาก recipe ใหม่จำเป็นต้องใช้ schema/adapter ใหม่ ให้เพิ่มเป็นการเปลี่ยน contract ที่ระบุชัดเจน

## Decisions and Non-goals

- ไม่รวมข้อมูลหลายสาขาไว้ใน JSON array เดียว
- ไม่เก็บ derived seat positions หรือ runtime geometry ซ้ำใน source JSON
- ไม่โหลดไฟล์จาก network runtime; registry เป็น static build-time import map
- ไม่สร้างข้อมูลปลอมให้สาขา Coming Soon
- ไม่เปลี่ยน schema ของ Calibration trial v1 ให้เป็น Cinema Data v1
