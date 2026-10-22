---
document_id: imax-seat-simulator-development-log
document_version: 12
updated_at: 2026-10-13
language: th
project_version: 0.1.0
project_status: functional-prototype
source_of_truth: inspected-local-source-and-user-decisions
scope: auditorium-refinement-and-roadmap
open_priority_issue: none
seat_alignment_status: fixed-and-visually-verified
vp_tables_status: removed-per-user-request
projection_status: implemented-and-verified
json_migration_status: planned-not-implemented
cinema_schema_status: v1-implemented-example-not-connected
video_selection_status: planned-not-implemented
branch_file_contract: one-json-file-per-branch-one-auditorium-per-branch
---

# IMAX Seat View Simulator — Development Log

เอกสารส่งต่องานสำหรับนักพัฒนาและ AI อัปเดต 13 ตุลาคม 2026 จากโค้ดใน workspace และข้อกำหนดที่ผู้ใช้ยืนยัน ใช้แยกสิ่งที่ทำแล้ว สิ่งที่เป็นค่าประมาณ และแผนงานที่ยังไม่ได้ลงมือทำ

**สถานะตอนนี้:** Paragon เป็น Prototype ที่เลือกที่นั่งและดูวิดีโอบนจอ 3D ได้จริง ข้อมูลโรงยังเป็น JavaScript และยังไม่มีตัวเลือกวิดีโอ แก้ทิศเก้าอี้ทั้งหมดให้หันตรงไปทางจอ และเอาโต๊ะในแถว VP ออกแล้ว ใช้ชื่อ IMAX Seat View Simulator และ Prompt สำหรับข้อความหลัก ใช้ Google Sans สำหรับข้อความขนาดเล็กและหมายเหตุตามผู้ใช้ ล่าสุดปรับภาพผ่านกรอบ CoLa 1.90:1 กลางจอและครอปบนล่างผ่าน UV แล้วตาม DL-020

**ข้อกำหนดโครงสร้างที่คงไว้:** JSON หนึ่งไฟล์ต่อหนึ่งสาขา แต่ละสาขามีโรงฉายเดียวแน่นอน แผนด้านล่างจึงใช้ `paragon.json` ไม่แยกไฟล์ตาม auditorium และไม่ออกแบบให้หนึ่งสาขามีหลายโรง

**หน้าแรกล่าสุด (DL-022):** ภาพนิ่ง Paragon เต็มจอและ Carousel เลือกโรงแบบเกม เลือกที่นั่งได้จาก Combobox หรือ Dialog ผังโรง มี pan/zoom และคืนโฟกัสตามวิธีเลือก เก็บ ID เป็น array แต่รอบนี้เลือกได้หนึ่งที่นั่ง Coming Soon เลือกดูได้แต่ยังเข้า Simulation ไม่ได้

**ข้อกำหนดการฉายล่าสุดของผู้ใช้ (13 ตุลาคม 2026):** พารากอนใช้ IMAX Commercial Laser (CoLa) และกรอบฉาย 1.90:1 ไม่ใช่ภาพ 1.43:1 เต็มความสูงจอ คงจอ 26.3 × 19.8 ม. และความกว้างภาพ 25 ม.; derive สูง 25/1.90, วางกลางจอและครอปบนล่างกึ่งกลาง ภาพกว้างกว่า 1.90 ใช้ภาพครบโดย fit เต็มความกว้าง ตำแหน่งกลางจอและเฟรมครอปเป็นค่าจำลองที่ยังไม่ได้ยืนยันจากโรงจริง

## 00 · ความคืบหน้าและงานที่ต้องทำต่อ

**ความคืบหน้าตามรายการงาน: 71% · เสร็จ 12 จาก 17 งานหลัก · เหลือ 5 งาน** (อัปเดต 13 ตุลาคม 2026)

คำนวณด้วย `round(งานที่ทำเสร็จ ÷ งานทั้งหมด × 100)` จาก checklist ในหัวข้อนี้เท่านั้น แต่ละงานมีน้ำหนักเท่ากันและนับเมื่อผ่าน Definition of done แล้ว งานที่ยังไม่เสร็จนับเป็น 0 ไม่ใช่เปอร์เซ็นต์เวลาทำงาน ความแม่นยำของโรง หรือความพร้อมใช้งานทั้ง 11 สาขา เมื่อเพิ่มขอบเขตงาน เปอร์เซ็นต์อาจลดลงได้

### งานหลักที่ทำเสร็จแล้ว

- [x] DONE-01 · โครงสร้าง React/Vite และ renderer กลาง — DL-001
- [x] DONE-02 · ฟอร์มภาษาไทย ชื่อเว็บ ฟอนต์ และเครดิตข้อมูล — DL-002, DL-014–017
- [x] DONE-03 · ทะเบียน 11 สาขาและ guard ของ Coming Soon — DL-003
- [x] DONE-04 · Paragon Prototype และรหัสที่นั่ง 426 ตำแหน่งตามช่วงที่ยืนยัน — DL-004; ความต่าง 421/426 อยู่ใน DATA-01
- [x] DONE-05 · Seat Combobox การค้นหาและคีย์บอร์ด — DL-005
- [x] DONE-06 · Simulation วิดีโอ controls และ URL/exit/focus lifecycle — DL-006
- [x] DONE-07 · Shared row geometry และเครื่องมือ Calibration — DL-007
- [x] DONE-08 · วัสดุ แสง EXIT ทิศเก้าอี้ตรง และเอาโต๊ะ VP ออก — DL-008, DL-012–013, DL-019
- [x] DONE-09 · ลดภาระ render และบันทึกผล performance/validation — DL-009, หัวข้อ 08
- [x] DONE-10 · Development Log, หลักฐาน และ roadmap ส่งต่องาน — DL-010, DL-018
- [x] DONE-11 · บันทึก CoLa และคำนวณกรอบฉาย/ครอป 1.90:1 ร่วมกับ Calibration — DL-020
- [x] NEXT-01 · Cinema schema v1 + validator และ parity baseline — DL-021

### งานที่ต้องทำต่อ

- [ ] NEXT-02 · ย้าย Paragon ไป JSON หนึ่งไฟล์ต่อสาขา — NEXT-01 เสร็จแล้ว เริ่มได้
- [ ] NEXT-03 · Media catalog ตัวเลือกวิดีโอ และ video query ใน URL — รอ NEXT-02
- [ ] NEXT-04 · เพิ่ม IMAX Countdown และทดสอบสองคลิป — รอ NEXT-03 และไฟล์ที่อนุญาตให้ใช้
- [ ] NEXT-05 · เพิ่มสาขาที่สองจากข้อมูลโรงจริง — รอ NEXT-02 และข้อมูลอ้างอิงสาขานั้น
- [ ] DATA-01 · ยืนยันจำนวน 421/426 ทิศเลขที่นั่ง category และ calibrate มิติจริง — รอหลักฐานเพิ่ม ทำคู่ขนานได้

**เริ่มงานถัดไป:** NEXT-02 สร้าง full renderer adapter และ loader จาก Cinema JSON v1 โดยเทียบกับ tests/baselines/paragon-v1.json; schema/validator/example และ baseline พร้อมแล้วตาม DL-021 คู่มืออยู่ที่ [Cinema Data v1](CINEMA-DATA-V1.md)

## 01 · ภาพรวมและขอบเขต

เว็บจำลองมุมมองผู้ชมจากที่นั่งจริงที่เลือก โดยคงตำแหน่งกล้องไว้ที่ระดับสายตา และแสดงวิดีโอเป็น Three.js VideoTexture บนจอภายในโรง ไม่ใช่วิดีโอ HTML ซ้อนบนภาพโรง

| หัวข้อ | สถานะปัจจุบัน |
| --- | --- |
| Stack | React 19, JSX, Vite 6, Tailwind CSS 4, Three.js, Fiber 9, Drei 10, React Router 7 |
| หน้าแรก | ภาพนิ่ง Paragon WebP เต็มจอ เมนูกลางจอและ Carousel 11 สาขา; Coming Soon เลือกดูได้แต่เข้าไม่ได้ |
| สาขา | 11 สาขา: Paragon ใช้งาน Prototype ได้ อีก 10 สาขา Coming Soon |
| ที่นั่ง | Combobox หรือ Dialog ผังโรงจากข้อมูลฉากเดียวกัน; เก็บ selectedSeatIds แบบ array แต่จำกัด 1 ที่นั่ง |
| Simulation | เต็มพื้นที่แท็บด้วย 100dvh ไม่เรียก Browser Fullscreen |
| วิดีโอ | Infinite Worlds.mp4 เล่นอัตโนมัติแบบปิดเสียง รักษาสัดส่วน |
| Calibration | หน้าเครื่องมือเฉพาะ development มี import/export JSON v1 |
| Backend | ไม่มีบัญชี ไม่มีจองตั๋ว ไม่มีอัปโหลดไฟล์ |
| เป้าหมายถัดไป | JSON ต่อสาขา และเลือก IMAX Preshow / IMAX Countdown |

## 02 · ประสบการณ์ที่ทำงานแล้ว

1. เปิดหน้าแรก เลือกสาขาจาก Carousel โดย Paragon เป็นค่าเริ่มต้น; Coming Soon ดูได้แต่ปิดตัวเลือกที่นั่ง
2. พิมพ์หรือเลือกที่นั่ง เช่น A2, L4 หรือ VP6 ใน Combobox หรือเปิดผังโรงแล้วกดยืนยัน; ยกเลิก/Escape คงค่าเดิม
3. ตรวจรหัสกับที่นั่งใน configuration ก่อนเข้าสู่ฉาก และตรวจซ้ำจาก URL
4. กด Enter Simulation เพื่อเข้าสู่ฉากเต็มแท็บ เริ่มมองไปยังจอจากสายตาของที่นั่งนั้น
5. วิดีโอเริ่มเล่นแบบปิดเสียง มีเล่น/หยุด เสียง ระดับเสียง แถบเวลา และหันกลับหาจอ
6. กลับหน้าแรกด้วยปุ่ม Escape หรือ Browser Back โดยคงสาขา/ที่นั่งและคืนโฟกัสให้ Combobox หรือปุ่มเปิดผังตามวิธีเลือก

Combobox กรองตามต้นรหัส ไม่สนตัวพิมพ์เล็ก–ใหญ่ ตัดช่องว่างรอบรหัส จัดกลุ่ม VP แล้ว A–L เรียงเลขจริง A2 มาก่อน A20–A29 รองรับลูกศร Enter Escape และ Tab รายการสูงไม่เกิน 240 px

Simulation มีรหัสที่นั่งขนาด 32 px บน desktop / 26 px บนมือถือ ปุ่มกลับและที่นั่งแสดงตลอด ตัวควบคุมด้านล่างซ่อนหลังไม่มีการใช้งาน 3.5 วินาที และกลับมาเมื่อใช้เมาส์ สัมผัส คีย์บอร์ด หรือโฟกัส มีข้อความไทยเมื่อ autoplay ถูกบล็อกหรือไฟล์เล่นไม่ได้ ไม่มี Change Video หรือช่องเลือกไฟล์

## 03 · ทะเบียนสาขาปัจจุบัน

| Branch ID | ชื่อสาขา | การใช้งาน |
| --- | --- | --- |
| paragon | พารากอน ซีนีเพล็กซ์ | Available · Prototype |
| ratchayothin | เมเจอร์ รัชโยธิน | Coming Soon |
| esplanade-khae-rai | เอสพลานาด ซีนีเพล็กซ์ งามวงศ์วาน–แคราย | Coming Soon |
| icon-cineconic | ไอคอน ซีเนคอนิค — ICONSIAM | Coming Soon |
| quartier | ควอเทียร์ ซีเนอาร์ต | Coming Soon |
| westgate | เวสต์เกต ซีนีเพล็กซ์ | Coming Soon |
| mega-bangna | เมกา ซีนีเพล็กซ์ — เมกาบางนา | Coming Soon |
| bangkapi | บางกะปิ ซีนีเพล็กซ์ | Coming Soon |
| central-pinklao | เมเจอร์ เซ็นทรัล ปิ่นเกล้า | Coming Soon |
| central-chiangmai | เมเจอร์ เซ็นทรัลเฟสติวัล เชียงใหม่ | Coming Soon |
| rangsit | เมเจอร์ รังสิต | Coming Soon · ยังไม่ยืนยันข้อมูลโรง |

สิบรายการแรกมีวันที่ตรวจสอบในทะเบียนเป็น 2026-10-10 และลิงก์ Major Cineplex ส่วน Rangsit เพิ่มตามผู้ใช้ มี `features: []`, `auditoriums: []`, `verifiedAt: null` เอกสารนี้บันทึก snapshot เดิม ไม่ได้ตรวจรายชื่อออนไลน์ใหม่

สถานะมี IMAX กับสถานะ Simulator พร้อมใช้งานเป็นคนละเรื่อง ปัจจุบัน Paragon มี `branch.status: available` และ `auditorium.config.referenceStatus: prototype` แต่ค่า `branch.referenceStatus` ยังสืบทอด `missing` จาก factory ห้ามใช้ฟิลด์นั้นเพียงตัวเดียวเพื่อสรุปความพร้อม การย้าย JSON ต้องทำให้ที่มาของสถานะชัดเจนขึ้น

## 04 · แผนที่โค้ดสำหรับแก้งาน

| ไฟล์/พื้นที่ | หน้าที่ | เมื่อจะเปลี่ยนอะไร |
| --- | --- | --- |
| src/data/branches.js | รายชื่อ แหล่งอ้างอิง config/videoSrc และ canSimulate | เพิ่มสาขา/ปรับสถานะ |
| src/App.jsx | Public EntryFlow และ routes เฉพาะ DEV | เพิ่มหรือปิดหน้า |
| src/pages/Home.jsx | ฟอร์มสาขา/ที่นั่ง | เพิ่มตัวเลือกวิดีโอในอนาคต |
| src/pages/EntryFlow.jsx | URL, validation, lazy experience, return/focus | ส่ง video ID และโหลด JSON |
| src/components/SeatCombobox.jsx | การค้นหา/เลือกที่นั่งด้วยเมาส์และคีย์บอร์ด | UI ที่นั่ง |
| src/components/SeatMap.jsx, SeatMapDialog.jsx | ผังจาก X/Z, pan/zoom, draft/confirm/cancel และ focus trap | ผังหน้าแรกและหน้าทดสอบ |
| src/components/CinemaCarousel.jsx, src/data/cinemaPresentation.js | Carousel, Thumbnail และภาพพื้นหลังคงที่ | เปลี่ยนภาพหรือเพิ่ม metadata แสดงผล |
| src/config/paragon/layout.js | buildParagonConfig และข้อมูลแถวร่วม | ตำแหน่ง พื้น บันได กล้อง |
| src/config/paragon/calibration.js | defaults, validation, slope/rise/custom, JSON v1 | ปรับระดับพื้น/เครื่องมือ |
| src/config/paragon/screen.js | ขนาดจอจริงและสัดส่วนภาพแยกกัน | ขนาด/ตำแหน่งจอ |
| src/config/paragon/environment.js | วัสดุ แผงไฟ และ EXIT | รายละเอียดโรงและแสง |
| src/config/paragon/seating.js, geometry.js | Export ข้อมูลที่ derive จาก defaultParagon | ไม่ใช่ข้อมูลอีกชุดที่สร้างเอง |
| src/config/camera.js | Eye height, FOV, yaw/pitch defaults | ค่า ergonomic |
| src/simulator/Experience.jsx | Canvas, media lifecycle, glass UI, exit | เชื่อมวิดีโอ/คุณภาพ render |
| src/simulator/SeatedCamera.jsx, math.js | คำนวณสายตา มุมมอง และ fitVideo | Perspective/สัดส่วน |
| src/simulator/Auditorium.jsx | ประกอบโรงและ VideoTexture | Renderer กลาง |
| src/simulator/renderGeometry.js, SeatInstances.jsx, TieredFloor.jsx | Geometry ที่รวม mesh/instancing/รายละเอียดตามระยะ | ประสิทธิภาพโมเดล |
| src/simulator/TheaterEnvironment.jsx, lighting.js, proceduralTextures.js | แสงเปลี่ยนตาม playback และ textures สร้างด้วยโค้ด | บรรยากาศ/EXIT |
| src/simulator/RenderBudget.jsx | DPR อัตโนมัติ | เครื่องช้า/มือถือ |
| src/simulator/useVideo.js, src/components/VideoControls.jsx | วิดีโอและปุ่มควบคุม | เปลี่ยน source อย่างปลอดภัย |
| src/dev/Calibration.jsx | Preview ปรับเทียบแยกจาก public | ตรวจ geometry |
| tests/, scripts/check-production.mjs | Unit/browser/production checks | ยืนยันหลังเปลี่ยน |

ข้อมูลปัจจุบันไหลตาม `branches → paragonPrototype → buildParagonConfig → config.seats/geometry/screen/camera/environment → Home/Experience` ทุกหน้าต้องใช้ seat records ชุดเดียวกัน ห้ามสร้างผังใน UI แยกจากตำแหน่ง 3D

## 05 · Routes และ data contracts

| URL | พฤติกรรมปัจจุบัน |
| --- | --- |
| / | หน้าแรก |
| /?branch=paragon&seat=VP6 | เก็บสาขาและรหัสแสดงผลในฟอร์ม |
| /cinemas/paragon | EntryFlow แสดงฟอร์มสำหรับสาขา |
| /cinemas/paragon/imax/seats | Public แสดงฟอร์ม ไม่เปิด SeatMap เก่า |
| /cinemas/paragon/imax/experience?seat=VP-6 | Direct entry ใช้ stable seat ID |
| /__dev/paragon/calibration | Calibration เฉพาะ DEV |
| /__dev/simulator/seats | SeatMap สังเคราะห์เฉพาะ DEV |
| /__dev/entry/ | ฟอร์มทดสอบสังเคราะห์เฉพาะ DEV |

DEV routes และ fixtures ถูกตัดออกจาก production; path เหล่านี้ใน build กลับไปหน้าแรก Direct link ของสาขาที่ปิดหรือ seat ID ผิดไม่เปิดฉาก จำเป็นต้องตั้ง static host ให้ fallback URL มาที่ index.html เช่น public/_redirects ที่มีอยู่

Seat contract ปัจจุบัน: `id`, `rowId`, `number` เป็น string, `category`, `position: [x,y,z]` ที่พื้น, `orientation` เป็น yaw radians และ `eyeOffset: [x,y,z]` ใน local space รหัสแสดงผลเป็น VP6 แต่ stable ID เป็น VP-6 ให้รักษาทั้งสองรูปแบบไว้

โลกใช้เมตร +Y ขึ้น +X ไปทางขวาของผู้ชมที่หันหาจอ +Z ไปหลังโรง จุดกำเนิดอยู่บนพื้นใต้กึ่งกลางจอ กล้อง = พื้นที่นั่ง + local eye offset ที่หมุนตาม yaw แล้ว เริ่มเล็ง screen target ไม่มีการเดินทะลุที่นั่ง/ผนัง

`canSimulate` ปัจจุบันเปิดเมื่อ branch available, config referenceStatus เป็น prototype/reviewed และมี seats ไม่ได้ตรวจความถูกต้องครบทุกมิติ จึงต้องเพิ่ม data validation ระหว่างย้าย JSON

## 06 · Paragon: หลักฐาน ค่าประมาณ และหนี้ข้อมูล

| รายการ | ค่า | ระดับหลักฐาน |
| --- | --- | --- |
| Physical screen | 26.3 × 19.8 m ≈ 1.328:1 | ผู้ใช้ให้และยืนยันใช้ขนาดนี้ |
| เครื่องฉาย / กรอบฉาย | IMAX Commercial Laser (CoLa), 1.90:1; กว้าง 25 m × สูง 25/1.90 = 13.1579 m | ผู้ใช้ยืนยัน 13 ต.ค. 2026; วางกลางจอและครอปกึ่งกลางเป็นค่าจำลอง |
| จำนวนที่นั่งที่แจ้ง | 421 | ผู้ใช้ให้; ยังไม่ตรงกับรหัส |
| จำนวนรหัส Prototype | 426 | คำนวณจากช่วงที่นั่งที่ยืนยัน |
| ลำดับหน้าไปหลัง | L → K → … → A → VP | ผู้ใช้ยืนยัน VP หลังสุด A ถัดมา |
| หมายเลข | A–J: 1–34, K: 2–34, L: 4–34, VP: 1–22 | ผู้ใช้ให้; VP เป็น 11 คู่ |
| ความชัน | 22.5° ระหว่างศูนย์กลางแถว | Baseline จากแนวทาง IMAX ปี 1991 ไม่ใช่มุมวัดจริง |
| ระยะแถว | 1.15 m; rise ปกติ ≈ 0.476 m | ค่าประมาณ configurable |
| แถว L | Z=10 m, พื้น Y=0.25 m | ค่าประมาณ configurable |
| ช่อง F/E, A/VP | ช่องเพิ่ม 1.20 m, ระยะ 2.80 m | ค่าประมาณ configurable |
| ขอบจอล่าง | 0.60 m | ค่าประมาณ configurable |
| สายตา/FOV | 1.15 m / 65° vertical | ค่าเริ่มต้น ergonomic |
| มองรอบตัว | yaw ±75°, pitch ±40° | Software defaults |
| EXIT | ซ้ายและขวาข้างแถวหน้าใกล้จอ | ตำแหน่งผู้ใช้ยืนยัน; ขนาดประมาณ |

หลักฐานภาพ: SeatParagon.jpg, ภาพแนบโรงสีน้ำเงิน และ AVIF สองภาพใน Downloads ที่บันทึกชื่อเต็มไว้ใน reference-analysis.md ภาพสนับสนุนแถวโค้ง เก้าอี้แดงด้านหน้า/ทองด้านหลัง พนักเข้ม พรมเข้ม ราวจับ แผงไฟน้ำเงิน และโคมส้ม ไม่ใช้ภาพเฉียงวัดองศาจริงโดยตรง และไม่คัดภาพอ้างอิง/ลายน้ำไปเป็น public assets

วัสดุ/ไฟเป็นการประมาณเชิงภาพ มีหก panel/sconce ต่อฝั่ง และ EXIT สองตำแหน่ง; โต๊ะ VP ถูกเอาออกตามคำยืนยันของผู้ใช้เมื่อ 11 ตุลาคม 2026 เมื่อเล่นลด house tint/ไฟตกแต่งเหลือ 20% ใน 1.2 วินาที หยุด จบ ผิดพลาด หรือ autoplay ถูกบล็อกกลับสว่าง EXIT และผิววิดีโอแยกจากการหรี่

**ยังไม่ปิดประเด็น:** รหัสที่นั่งเกินจำนวนจริงห้าตำแหน่ง ทิศทางเลขที่นั่ง ขอบเขต category ที่แม่นยำ ความสูง/ความโค้งจอ ระยะและระดับพื้นจริง ห้ามลบห้ารหัสโดยเดา และห้ามเปลี่ยนสถานะเป็น reviewed เพียงเพราะทดสอบซอฟต์แวร์ผ่าน

แหล่งแนวทางความชันที่บันทึกไว้: [IMAX Design Facts — Theatre Geometry ปี 1991 หน้า PDF 475](https://whc.unesco.org/uploads/nominations/1131.pdf#page=475) ช่วง 20–25° เป็นข้อมูลเก่าเพื่อใช้อ้างอิง ไม่ใช่มาตรฐานล่าสุดหรือการรับรองพารากอน

## 07 · Development Log ตามลำดับงาน

ลำดับนี้สรุปจากการสนทนาและสถานะไฟล์ ไม่ใช่ Git commit history และไม่สร้างวันที่/commit SHA ของงานย้อนหลัง

| Log ID | การเปลี่ยนแปลง | ผลลัพธ์/เหตุผล |
| --- | --- | --- |
| DL-001 | Foundation และแยก component/config | React/Vite, branch registry, renderer กลาง, references-first |
| DL-002 | หน้าแรกเรียบง่ายภาษาไทย | แทน landing/cards ด้วยฟอร์ม gradient น้ำเงิน Google Sans |
| DL-003 | ขยาย directory | สิบรายการจาก snapshot Major + Rangsit ตามผู้ใช้ รวม 11 |
| DL-004 | เปิด Paragon Prototype หลังได้รับข้อมูล | ช่วง A–L/VP และคลิป Infinite Worlds; เก็บช่องว่าง 421/426 ไว้ |
| DL-005 | ช่องที่นั่งเป็น Combobox | ค้นหาและเลือกจาก seat records โดยไม่แสดงช่วงรหัสยาว |
| DL-006 | Simulation เต็มแท็บและ UI กระจก | ยกเลิก Fullscreen/Change Video, ที่นั่งเด่น, exit/focus lifecycle |
| DL-007 | Shared row geometry และ Calibration | Rake 22.5°, curved tiers, steps/landings, camera ตามพื้น, JSON v1 DEV |
| DL-008 | วัสดุ แผงไฟ โต๊ะ VP และ EXIT | Appearance จากภาพ; dim/play/pause; EXIT แยกคงสว่าง |
| DL-009 | แก้วิดีโอกระตุก | Batch geometry, distance detail, baked shading, memo, adaptive DPR |
| DL-010 | เอกสารส่งต่อและ roadmap นี้ | Markdown ต้นฉบับ + HTML สร้างจากต้นฉบับ; JSON/video choice ยัง planned |
| DL-011 | บันทึกปัญหาแนว/การเอียงเก้าอี้จากภาพผู้ใช้ วันที่ 2026-10-11 | เปิด ISSUE-PARAGON-001 ในตอนนั้น; แก้ใน DL-012 |
| DL-012 | 2026-10-11 · แก้ทิศเก้าอี้ Paragon ทุกแถว | เปลี่ยน atan2(x, seatZ) เป็น orientation: 0; 426 ตัวใน 13 แถวหันตรงทาง −Z โดยคงตำแหน่งเดิม |
| DL-013 | 2026-10-11 · เอาโต๊ะ VP ออกตามผู้ใช้ | ลบโต๊ะ 12 ตัวและส่วน render; แถว VP เหลือเก้าอี้ 22 ตัวใน 11 คู่ ตำแหน่งเดิม |
| DL-014 | 2026-10-11 · เปลี่ยนชื่อและฟอนต์ตามผู้ใช้ | IMAX Seat View Simulator บนหน้าแรก/ชื่อแท็บ/เอกสาร; Prompt ทั้งเว็บไซต์และ Calibration; package name เป็น imax-seat-view-simulator |
| DL-015 | 2026-10-11 · ฟอนต์ข้อความเล็กและหมายเหตุ | Google Sans สำหรับ labels/หมายเหตุ/status/timeline; Prompt สำหรับหัวข้อ ข้อความหลัก และรหัสที่นั่ง |
| DL-016 | 2026-10-11 · เพิ่มคำอธิบายใต้ชื่อเว็บและปรับ Site Title | เพิ่ม “เลือกที่นั่ง แล้วสัมผัสมุมมองก่อนเข้าโรง” ด้วย Google Sans; ชื่อแท็บเป็น Seat View Simulator โดยหัวข้อบนหน้าเว็บยังมี IMAX |
| DL-017 | 2026-10-12 · เพิ่มเครดิตข้อมูล | “ขอบคุณข้อมูลจาก K9 Cineblog” ใต้กล่องฟอร์ม จัดกึ่งกลาง Google Sans 12px สีเทาอมฟ้า เป็นข้อความธรรมดา ไม่มีลิงก์ตามผู้ใช้ |
| DL-018 | 2026-10-12 · เพิ่มเปอร์เซ็นต์ความคืบหน้าและงานถัดไปใน log | Checklist 10/16 งานหลัก = 63%; HTML คำนวณ progress และรายการงานค้างจาก Markdown พร้อมลิงก์ไปเกณฑ์ปิดงาน |
| DL-019 | 2026-10-13 · โรงตามภาพและระยะข้าง 3 ม. | ผนัง/เพดานเป็นแผ่นโฟมซับเสียงดำ แสงน้ำเงินแยกจากวัสดุ ไฟเส้นสูง 6 เส้น/ฝั่ง สโคนซ์ท้าย 2 ตัว/ฝั่ง บันไดข้างเต็มช่องถึงผนัง; คงที่นั่งเดิมและ VP ไม่มีโต๊ะ |
| DL-020 | 2026-10-13 · IMAX CoLa และภาพ 1.90:1 | คงจอ 26.3 × 19.8 ม.; derive กรอบ 25 × 13.1579 ม. กลางจอ, ครอปบนล่างผ่าน UV, fit ภาพกว้าง, ตรวจคอนฟิกและอัปเดต Calibration/roadmap |
| DL-021 | 2026-10-13 · Cinema Data v1 / NEXT-01 | Draft-07 + Ajv 8, relational validator, row-block Paragon example, frozen baseline และคู่มือ; ยังไม่เชื่อม JSON เข้า runtime |
| DL-022 | 2026-10-13 · หน้าเลือกโรงแบบเกม | ภาพนิ่ง Paragon WebP, Carousel 11 สาขา, Coming Soon ดูได้, Dialog ผังโรงพร้อม pan/zoom และ state array จำกัด 1 ที่นั่ง; URL/renderer เดิม |

### DL-009 · Performance baseline ล่าสุด

VP12 ที่ viewport 1440 × 900 ลด draw calls จาก 138 เหลือ 28 และ triangles จาก 951,810 เหลือ 74,690 หรือประมาณ 80% / 92% ตามลำดับ รวมพื้น/ราวและชิ้นส่วนเก้าอี้ก่อน instancing รายละเอียดเต็มใกล้สายตาในระยะ 7 m ส่วนไกลลด cup details และความมน โดยไม่เปลี่ยนที่นั่งหรือมุมกล้อง

ใช้ static vertex shading/texture halo แทน per-pixel PBR ที่แพง แยก timeline/volume updates ไม่ให้ re-render ทั้งโรง ขอ high-performance GPU ปิด antialias/bloom/shadows และปรับ DPR 0.55–1 ตาม frame rate หลัง warmup ทั้ง UI และ source video ไม่ถูกลดสัดส่วน

Chrome ใช้ RTX 3050 Laptop GPU ในช่วงทดสอบ 8 วินาทีหลัง warmup ได้ประมาณ 120 FPS, p95 frame interval 8.5 ms, 193 video frames และรายงาน dropped frames=0 ส่วน SwiftShader ที่บังคับ render ด้วย CPU ได้ประมาณ 17.8 FPS ที่ DPR 0.55 ตัวเลขนี้เป็น sample ของเครื่องนี้ ไม่รับประกันผลบนเครื่องอื่นหรือ sustained playback

## 08 · สถานะการตรวจสอบ

### DL-022 · หน้าแรก Carousel และผังที่นั่ง

ใช้ภาพ Paragon ภาพเดียวทุกสาขาตามผู้ใช้ จับจาก renderer จริงที่หยุดวิดีโอและเปิดไฟโรง โดยใช้กล้องกลางท้ายโรงและไม่ติด UI ส่งออก WebP desktop/mobile/thumbnail ผ่าน `node scripts/capture-home-art.mjs`; route `/__dev/paragon/still` ถูกตัดจาก production ไม่มี WebGL หรือโหลดวิดีโอบนหน้าแรก สาขาที่ยังไม่มีภาพใช้ Placeholder พร้อมชื่อ/Coming Soon

Carousel ไม่ autoplay/วนกลับ รองรับคลิก ปัด และคีย์ลูกศร/Home/End เปลี่ยนสาขาแล้วล้างที่นั่ง/ข้อผิดพลาด Coming Soon เลือกดูได้ แต่ Combobox/ผัง/Enter ถูกปิด ผังใช้ seat records เดียวกับฉาก รักษาความโค้ง ช่องทางเดิน คู่ VP และรหัส K2/L4 มี pan/zoom และชื่อแถวที่ยังเห็นขณะเลื่อน เลือกค่าร่างก่อนยืนยัน ยกเลิก/Escape ไม่เปลี่ยนค่าที่บันทึก; Dialog กัก Tab และคืนโฟกัสให้ปุ่มเปิดผัง

`selectedSeatIds: string[]` จำกัดหนึ่งรายการใน public UI แยกข้อความ Combobox และค่าร่าง Dialog คง URL `?seat=<stable-id>` เดิม บันทึกวิธีเลือกใน router state เพื่อคืนโฟกัสหลังปุ่มกลับ/Escape/Browser Back งานนี้ไม่ย้าย Cinema JSON ไม่เปิดสาขาเพิ่ม และยังไม่มี UI เลือกหลายที่นั่งหรือสลับมุมมองใน Simulator

ผลตรวจ: unit tests 95 ผ่าน, browser suite 28 ผ่าน, production build และ production smoke ผ่าน เพิ่ม 5 browser scenarios สำหรับ Carousel/Coming Soon, ผัง/ช่องว่าง/ยืนยัน/ยกเลิก/focus trap, exit/Escape/Back, touch swipe/pan/zoom/viewport เตี้ย และภาพเสีย/reduced motion หลังปรับขนาดเส้นจอในผังตรวจ desktop/mobile ซ้ำอีก 2 รายการผ่าน ตรวจภาพ 1440px/390px และเก็บหลักฐาน `docs/evidence/home-{desktop,mobile}-2026-10-13.png` กับ `home-seat-map-{desktop,mobile}-2026-10-13.png` ปัญหา Vitest/Vite EPERM และ Calibration download canceled เกิดจาก sandbox; approved runs ผ่านโดยไม่แก้ Calibration/geometry

### DL-021 · Cinema Data v1 และ baseline ก่อนย้าย

13 ตุลาคม 2026: สร้าง schema หนึ่งสาขา/หนึ่ง auditorium, validateCinema ที่ไม่แก้ input และส่ง diagnostics ภาษาไทย, resolveCinemaSeating สำหรับตรวจตำแหน่งจากรายแถว และตัวอย่าง src/data/cinemas/paragon.json ที่ยังไม่เชื่อมทะเบียน เก็บ 426 IDs พร้อมช่องเริ่ม K/L, 11 คู่ VP/22 ที่นั่ง, ไม่มีโต๊ะ และ capacity warning 421/426; reviewed ที่จำนวนคลาดเคลื่อนไม่ผ่าน Coming Soon ใช้ metadata-only ได้แต่เปิดจำลองไม่ได้

baseline frozen อยู่ใน tests/baselines/paragon-v1.json เก็บ runtime config เดิมทั้งชุดรวม geometry/architecture/materials/environment/EXIT, camera, ตำแหน่งเก้าอี้และสายตาทุกตัว และ projection/UV ของ 1546×1080, 1.90 และ 2.39 การทดสอบไม่สร้าง baseline ใหม่; คำสั่ง capture แยกสำหรับการปรับโดยตั้งใจเท่านั้น

ตรวจผ่าน npm test ทั้ง 95 กรณี (Cinema เพิ่ม 34), npm run build และ npm run test:production ซึ่งตรวจ supplied-video autoplay, CoLa frame/UV, การกลับพร้อม VP6, guarded URL และการตัด Calibration/fixtures จาก production เทียบ source rows/seats ของ example กับ baseline ภายใน 1e-6 เมตร และตรวจ runtime scene เดิมครบ ชุด Cinema ครอบคลุมผังแถวไม่เท่ากัน ช่อง null คู่ที่นั่ง overrides, duplicate/unknown references, malformed/nonfinite data, รุ่นที่ไม่รองรับ และการแยก Calibration trial

ข้อจำกัด: resolver ยังไม่สร้างฉากครบจาก JSON และ validator ไม่อ่านไฟล์สื่อหรือยืนยันหลักฐานจริง ไม่มีการย้าย public loader, UI, URL หรือเปิดสาขาใหม่ NEXT-01 ปิดเป็นงานที่ 12/17 = 71%; งานถัดไป NEXT-02 คู่มือกรอกข้อมูลอยู่ที่ [CINEMA-DATA-V1.md](CINEMA-DATA-V1.md)

### DL-020 · IMAX CoLa และกรอบฉาย 1.90:1

13 ตุลาคม 2026: บันทึกระบบ IMAX Commercial Laser (CoLa) และกรอบฉาย 1.90:1 ตามข้อมูลผู้ใช้ [Major](https://www.majorcineplex.com/cinema/paragon-cineplex/) ยืนยันได้ว่าเป็น IMAX with Laser แต่ไม่ได้ยืนยันรุ่น CoLa/ตำแหน่งภาพ ขนาดจอจริงยังเป็น 26.3 × 19.8 ม. ≈ 1.328:1 แยกจากชื่อจอ 1.43:1 และอัตราส่วนไฟล์วิดีโอ

`config.projection` เก็บ system, aspectRatio=1.90, width=25, offset=[0,0] เมตรใน local X/Y และ tallContentMode=crop จาก screen.js ผ่าน shared builder; math.js มี projectionBounds/projectVideo และตรวจขอบเขตกับจอ กรอบสูง 25/1.90 = 13.1578947 ม. เว้นซ้ายขวาข้างละ 0.65 ม. บนล่างข้างละ 3.3210526 ม. การย้าย/หมุนจอยังคงใช้ transform ของจอจริง

VideoScreen ใช้ขนาด metadata จริง: ต่ำกว่า 1.90 ครอปบนล่างกึ่งกลางด้วย VideoTexture repeat/offset, เท่ากับ 1.90 ใช้ภาพครบ, กว้างกว่า 1.90 fit เต็มความกว้างและเว้นบนล่าง คลิป 1546 × 1080 เหลือความสูง 813.6842105 พิกเซล ตัดข้างละ 133.1578947 พิกเซล ไม่ยืดหรือแก้ไฟล์ MP4 ก่อน metadata พร้อมไม่มี image mesh; config ไม่ถูกต้องแสดง error ก่อนสร้าง Canvas คืน UV เต็มเมื่อเปลี่ยนเป็นภาพกว้าง และ dispose texture เมื่อ source เปลี่ยน/ออกจากฉาก ไม่คำนวณใหม่จาก timeline/volume

Calibration แสดงขนาด/offset แบบอ่านอย่างเดียวและใช้ renderer เดียวกับ public; JSON trial ยังเป็น geometry-only v1 ฉากไม่มี projection ใช้ contain แบบเดิม การวางกลางจอและครอปกึ่งกลางเป็นสมมติฐานที่ผู้ใช้เลือก ไม่ได้ยืนยันตำแหน่งติดตั้งหรือเฟรมฉบับโรง ไม่ตรวจแถบดำที่ฝังในคลิปหรืออัตราส่วนเนื้อหาของแต่ละช็อตอัตโนมัติ ข้อมูลโรงยังเป็น JavaScript และไม่มี video picker เพิ่ม

ผลตรวจ: unit tests 61 ผ่าน (เพิ่ม 26 กรณี projection), browser suite 23 ผ่าน (เพิ่ม 6 กรณี projection), production build และ production smoke ผ่าน รวมกรอบ/UV ของ built site ตรวจภาพ desktop/mobile, Calibration และภาพทดสอบสีแดงบน/สีน้ำเงินล่างแล้วว่าไม่กลับด้าน ไม่มีผล FPS ใหม่ ภาพหลักฐาน: [Desktop](evidence/paragon-cola-desktop-2026-10-13.png), [Mobile](evidence/paragon-cola-mobile-2026-10-13.png), [ภาพกว้าง/ทิศทาง](evidence/paragon-cola-wide-orientation-2026-10-13.png), [Calibration mobile](evidence/paragon-cola-calibration-mobile-2026-10-13.png)

เพิ่ม DONE-11 หลังผ่านเกณฑ์ ทำให้ checklist เป็น 11/17 = 65% งานค้างเดิมยังมี 6 งาน แผน Cinema JSON เพิ่ม auditorium.projection และ media catalog ใช้นโยบายการฉายจากโรงร่วมกัน ขั้น NEXT-01 ต้องเก็บ parity baseline รวม projection/UV หลัง DL-020

### DL-019 · โรงตามภาพและระยะข้างที่นั่ง

13 ตุลาคม 2026: ใช้ภาพ `557603128_1212139634281126_6891239328485045704_n.jpg` เป็นหลัก ผู้ใช้เลือกปรับทั้งบรรยากาศและระยะขั้นต่ำขอบที่วางแขนถึงผิวผนัง 3 ม. และยืนยันว่าผนังเป็นแผ่นโฟมซับเสียงสีดำ สีน้ำเงินมาจากแสง ไม่ใช่สีวัสดุหรือลายกระเบื้อง จึงใช้วัสดุดำและ texture เทากลางที่มีรอยต่อ/รูพรุน/รอยย่นละเอียด แยก blue light wash และ halo ของไฟเส้นออกต่างหาก

เพิ่ม `src/config/paragon/architecture.js` คำนวณขอบจากทุกชิ้นเก้าอี้และแขนสองข้าง ขอบนอก ±13.945 ม. ผิวผนัง ±16.945 ม. ความหนาผนัง 0.20 ม. ความกว้างคอนฟิก 34.09 ม. ขอบแพลตฟอร์ม ±14.20 ม. บันได/พื้นพักข้างกว้าง 2.745 ม. ต่อถึงผนังและ VP ราววางด้านในขอบแพลตฟอร์ม ความลึกขยายตามขอบพื้นโค้ง + 2 ม. ระยะ L ฝั่งซ้าย 5.34 ม., K 3.78 ม., VP 4.41 ม./ฝั่ง เป็นผลจากผังเดิม ทุกระยะเป็น estimate ไม่ใช่การวัดจากภาพ

ไฟไซแอน 6 เส้น/ฝั่ง สูงจากพื้นแถวใกล้เคียง +0.35 ม. ถึงต่ำกว่าเพดาน 0.60 ม.; ไฟอำพันเฉพาะ 2 ตำแหน่งท้าย/ฝั่ง คงหรี่ไฟ 20% ใน 1.2 วินาทีและ EXIT อิสระ ปรับขอบพนัก/หัวพิงมนและส่วนหลังดำ รายละเอียดไกลยังคงพนักมนแต่ต่ำกว่า 180 triangles/เก้าอี้ ใกล้ต่ำกว่า 600 ใช้ instancing/merged meshes ต่อ คง 426 IDs/coordinates, yaw=0, จอ 26.3 × 19.8 ม., ระดับพื้น/ความชัน และ Calibration JSON v1 หน้า Calibration เพิ่มเส้นผนังและระยะซ้าย/ขวารายแถว

Unit tests 35 ผ่าน และ browser suite 17 กรณีผ่าน; การตรวจ environment/calibration เพิ่มหลังแก้วัสดุอยู่ใน VALIDATION.md ภาพตรวจอยู่ใน `output/playwright/` รวมมุมบน ผนังซ้าย/ขวา และมือถือ ตัวเลข FPS ของ DL-009 เป็น baseline เดิม ไม่ใช่ผลวัดฉากใหม่ อัปเดต README/reference-analysis/asset credits ให้ VP ไม่มีโต๊ะ ไม่มี JSON migration หรือ video dropdown เพิ่มในงานนี้

### DL-018 · ความคืบหน้าและงานถัดไป

12 ตุลาคม 2026: สร้าง HTML จาก Markdown สำเร็จ สรุป 10/16 งานหลักเป็น 63% และแสดงงานค้างทั้ง 6 รายการ ตรวจภาพ desktop 1440 × 1000 และมือถือ 390 × 844; progress ใช้ HTML progress element และ checklist มีข้อความสถานะสำหรับ screen reader ตัวสร้าง HTML ตรวจว่าตัวเลขสรุปใน Markdown ตรงกับ checklist และหยุดพร้อมข้อความแก้ไขเมื่อไม่ตรง งานเอกสารนี้ไม่ได้รันชุดทดสอบ Simulator ใหม่

### DL-015 · ข้อความเล็กและหมายเหตุ

11 ตุลาคม 2026: เพิ่ม Google Sans ควบคู่กับ Prompt และตัวแปร --font-small สำหรับหมายเหตุ ป้ายกำกับเล็ก ข้อความแจ้งสถานะ placeholder และเวลาในแถบวิดีโอ รวมข้อความเล็กใน Calibration และเอกสาร HTML; ข้อความหลักและหัวข้อยังใช้ Prompt

Production build ผ่าน ตรวจ browser ว่าหัวข้อ/ช่องเลือก/ค่าที่นั่งใช้ Prompt และหมายเหตุ/label/placeholder ใช้ Google Sans; ทั้งสองฟอนต์โหลดจริง ตรวจภาพมือถือขนาด 375 × 812 แล้วแสดงผลครบ

### DL-014 · เปลี่ยนชื่อและฟอนต์

11 ตุลาคม 2026: เปลี่ยนชื่อหน้าแรก ชื่อแท็บ README และเอกสารเป็น IMAX Seat View Simulator; เปลี่ยน package name เป็น imax-seat-view-simulator และใช้ Prompt จาก Google Fonts น้ำหนัก 400/500/600/700/800 ทั้งเว็บ หน้า Calibration ใช้ตัวแปรฟอนต์ร่วมกับหน้าอื่น อัปเดตเครดิตฟอนต์และชื่อใน browser/production checks เดิม

Production build ผ่าน และ browser checks เดิมสำหรับหน้าแรก/guards กับ combobox/mobile ผ่าน 2 รายการ ตรวจภาพหน้าแรกขนาด 1440 × 900 และ 375 × 812 แล้วไม่มี horizontal overflow; browser ยืนยันว่า Prompt โหลดจริง ไม่ได้รัน unit tests หรือ browser suite เต็มในงานเปลี่ยนชื่อและฟอนต์นี้

Baseline จากงานแก้ประสิทธิภาพก่อนจัดทำเอกสารนี้: unit tests 31 ผ่าน, browser scenarios 17 ผ่าน, production build และ production smoke check ผ่าน ไม่ได้อ้างว่าเป็นการทดสอบใหม่ในงานเอกสาร

| กลุ่ม | สิ่งที่ครอบคลุม |
| --- | --- |
| Unit | Seat IDs/ranges, video fit, eye position, calibration modes/JSON, floor contact, steps, EXIT placement และแถว VP 22 ที่นั่งโดยไม่มีโต๊ะ, lighting, geometry bounds/budgets |
| Browser | Entry/combobox, guards, autoplay/error, controls, Escape/Back/focus, desktop/mobile, Calibration, dim/restore/EXIT |
| Production | DEV tools/fixtures ไม่อยู่ใน build, guarded URLs, supplied autoplay, retained VP6 |
| Visual | Paused/playing, side EXIT, calibration, desktop/mobile screenshots |

ข้อจำกัด: browser flow tests ใช้ Chrome software WebGL มือถือเป็น viewport emulation ยังไม่มีผลจาก touch device จริง Safari/Firefox และ sustained GPU benchmark การทดสอบด้านซอฟต์แวร์ไม่ยืนยันความถูกต้องเชิงมิติของโรง

### ISSUE-PARAGON-001 · เก้าอี้เอียงเข้าหาศูนย์กลางจอ — RESOLVED

**แก้และตรวจภาพ: 11 ตุลาคม 2026 (Asia/Bangkok)** ผู้ใช้ระบุให้เก้าอี้ทุกตัวหันตรงในทิศเดียวกัน ตั้งฉากกับระนาบจอ และคงผังเดิมไว้

ต้นเหตุอยู่ใน src/config/paragon/layout.js: buildParagonConfig ใช้ Math.atan2(x, seatZ) คำนวณ yaw แยกตามตำแหน่งแต่ละตัว ส่วน src/simulator/SeatInstances.jsx นำค่านั้นไปใช้กับ instance matrix ทั้งเบาะและโครงเก้าอี้

ตรวจ src/simulator/renderGeometry.js และภาพเก้าอี้จริงในฉากแล้ว พนักอยู่ด้าน local +Z ด้านหน้าเป็น −Z ซึ่งตรงกับทิศไปยังจอที่ world Z=0 จึงเปลี่ยนเฉพาะ orientation เป็น 0 ไม่มีการสร้างผังใหม่ เปรียบเทียบ configuration ก่อนและหลังโดยละ orientation แล้วข้อมูลส่วนอื่นเท่ากันทั้งหมด ทั้งตำแหน่ง 426 ที่นั่ง, 13 แถว, ความโค้ง, ทางเดิน, โซนสี, ระดับพื้น, ความลาดชัน และการตั้งค่ากล้อง

กล้อง src/simulator/SeatedCamera.jsx ยังใช้ camera.lookAt ไปยัง screen target แยกจากมุมเก้าอี้ ตรวจ POV ครบ 13 แถว รวมที่นั่งริม L4, A34 และ VP22; กล้อง VP6 มีทิศตรงกับ screen target (dot product ประมาณ 1) ตรวจ instance matrices ของเก้าอี้ครบ 426 ตัวในภาพมุมสูง พบ rotation เดียวกันทั้งหมด

### DL-013 · เอาโต๊ะ VP ออก

ผู้ใช้ยืนยันว่าแถวสุดท้ายไม่มีโต๊ะ จึงลบการสร้างโต๊ะ 12 ตัวใน src/config/paragon/environment.js, วัสดุโต๊ะ และ mesh โต๊ะ/ขาโต๊ะ/ที่วางแก้วบนโต๊ะใน src/simulator/TheaterEnvironment.jsx ปรับ buildEnvironment และจุดเรียกใช้ให้ไม่รับ seats ที่เลิกใช้แล้ว แถว VP ยังคง VP-1 ถึง VP-22 จัด 11 คู่ ณ ตำแหน่งเดิม ไม่เปลี่ยนที่วางแก้วของเก้าอี้

แก้ expectation เดิมใน tests/environment.test.js ให้ตรวจ VP 22 ที่นั่งและไม่มีข้อมูลโต๊ะ ตรวจภาพมุมสูงหลังแก้แล้วไม่มีสี่เหลี่ยมเล็กคั่นคู่เก้าอี้

### ผลตรวจของงาน DL-012 / DL-013

| รอบงาน | ผลที่ตรวจจริง |
| --- | --- |
| DL-012 · orientation | Unit tests 31 ผ่าน; browser tests 17 ผ่าน; production build ผ่าน; ตรวจ top view และ POV ทั้ง 13 แถว |
| DL-013 · ลบโต๊ะ | Unit tests 31 ผ่านอีกครั้ง; ตรวจ top view หลังลบโต๊ะ; ไม่ได้รัน browser suite หรือ production build ซ้ำหลังลบโต๊ะ |
| ข้อจำกัด | ไม่ได้วัดประสิทธิภาพใหม่หรือรัน production smoke check ใหม่ในสองรอบนี้; ขนาดโรงและยอดแจ้ง 421 เทียบกับ 426 รหัสยังเป็นหนี้ข้อมูลเดิม |

หลักฐานเก็บสำเนาใน docs/evidence เพื่อไม่พึ่งไฟล์ output ที่ ignored:

- [มุมสูงก่อนแก้ทิศเก้าอี้](evidence/paragon-orientation-before-top-2026-10-11.png)
- [มุมสูงหลังแก้ทิศเก้าอี้ ก่อนลบโต๊ะ](evidence/paragon-orientation-after-top-2026-10-11.png)
- [ภาพ POV ทั้ง 13 แถว](evidence/paragon-orientation-pov-all-rows-2026-10-11.png)
- [มุมสูงล่าสุดหลังลบโต๊ะ VP](evidence/paragon-vp-without-tables-top-2026-10-11.png)

ใช้ configuration หลัง DL-013 เป็น baseline สำหรับแผนย้าย JSON สถานะ RESOLVED นี้หมายถึงข้อกำหนดทิศเก้าอี้ที่ตรวจแล้ว ไม่ได้ยืนยันว่ามิติทั้งหมดของโรงตรงสถานที่จริง

## 09 · Roadmap A — JSON หนึ่งไฟล์ต่อหนึ่งสาขา

**สถานะ: NEXT-01 เสร็จ; การย้าย runtime ยัง Planned** Schema, validator, Paragon example และ baseline มีแล้วตาม DL-021 แต่ public ยังโหลด JavaScript เดิม ใช้สัญญาตามผู้ใช้หนึ่งสาขามีหนึ่งโรงฉาย ชื่อไฟล์ตาม branch ID เช่น paragon.json

### โครงสร้างไฟล์ที่เสนอ

```text
src/data/branches.js                 # metadata/index + config loader ต่อ branch
src/data/cinemas/paragon.json        # สาขาพารากอน + โรงฉายเดียว
src/data/cinemas/ratchayothin.json    # เพิ่มเมื่อมีข้อมูล; placeholder ก็ต้อง missing
src/data/schemas/cinema.schema.json  # schemaVersion 1 ของข้อมูลสาขา
src/config/buildCinemaConfig.js      # JSON → runtime contract เดิม
src/config/validateCinema.js         # validate ก่อนเปิด simulation
```

schema, validateCinema และ paragon.json มีแล้ว แต่ example ยังไม่เชื่อม registry; buildCinemaConfig/loader และตัวอย่างสาขาที่สองยังเป็นแผน NEXT-02 ให้ใช้ dynamic import จาก mapping branch ID ไปไฟล์ที่อนุญาตในทะเบียน ไม่ประกอบ path จาก URL โดยตรง ไม่มีการ fetch Major ระหว่างเปิดหน้า รายละเอียดสัญญาที่สร้างจริงอยู่ใน CINEMA-DATA-V1.md และ schema; ตารางข้างล่างเป็นแผนเดิมก่อนตกลง v1

JSON เป็นเจ้าของ metadata ของสาขาที่ migrate แล้ว ถ้าหน้าแรกต้องการ index เบาโดยไม่โหลด geometry ทั้งหมด ให้ generate index จาก JSON ในขั้น build แทนคัดชื่อ/status/referenceStatus ซ้ำด้วยมือ สำหรับ adapter ระยะแรกจะห่อ auditorium เดียวเป็น array ความยาวหนึ่งให้ runtime เดิมได้ แต่ไม่เพิ่มหลายโรงในไฟล์สาขา และไม่เปลี่ยน URL เดิม

### สัญญาข้อมูลที่เสนอ

| Field | หน้าที่/กฎ |
| --- | --- |
| schemaVersion | เลขรุ่น schema ของสาขา เริ่ม 1; ปฏิเสธรุ่นที่ไม่รองรับ |
| branchId / nameTh / name / source / verifiedAt | ระบุตัวสาขาและ provenance; ตรงกับทะเบียน |
| status / referenceStatus | ความพร้อม demo แยกจาก missing/prototype/reviewed |
| auditorium | Object เดียว ไม่ใช่ array; เก็บ id เดิม เช่น imax เพื่อไม่เปลี่ยน URL |
| auditorium.units / axes | meters และ coordinate convention เดิม |
| auditorium.capacity | reported=421, configured=426 และคำอธิบายความคลาดเคลื่อน |
| auditorium.screen | Physical dimensions/transform แยก active projection และ video aspect |
| auditorium.projection | system, aspectRatio=1.90, width=25, offset=[0,0] เมตรจากกลางจอ และ tallContentMode=crop; derive height และ validate ให้อยู่ในจอ |
| auditorium.layout | kind + geometry inputs; renderer ไม่ควรเดาว่าโรงอื่นผังเหมือน Paragon |
| auditorium.rows / seating | แถว หมายเลข/ช่องว่าง/category/คู่ และตำแหน่งเฉพาะที่มีหลักฐาน |
| auditorium.camera | Eye height, FOV, limits, target policy |
| auditorium.appearance / environment | Seat sizes/colors, materials, panels, EXIT, lighting; ไม่มีโต๊ะ VP |
| auditorium.media | Clip catalog, defaultVideoId และ provenance |
| evidence / estimates / unresolved | ที่มา หน่วย สถานะ confirmed/estimated และประเด็นที่ต้องยืนยัน |

ข้อมูล JSON ต้องเป็น plain data เท่านั้น ไม่มี functions, imports, Three objects หรือ expressions Builder รับ parameters/rows/explicit seat placements แล้ว derive runtime `seats`, `geometry`, `screen`, `camera`, `environment` เหมือนเดิม การ export JSON ของ resolved config ใช้เปรียบเทียบ snapshot ได้ แต่ไม่ควรเก็บ derived positions ซ้ำกับ inputs แล้วแก้คนละชุด

สำหรับ Paragon ให้คงแนวคิด layout recipe แต่ย้าย constants ที่ผูกกับโรง เช่น จำนวนที่นั่งแต่ละแถว ระยะคู่/aisle/category/ขอบเขตพื้น ออกเป็น data สนับสนุน explicit placements สำหรับผังผิดรูป แถวไม่เท่ากัน และโรงอื่น ห้ามสร้าง rectangular grid แทนผังจริงเพียงเพื่อผ่าน schema

Calibration ต้องยัง override inputs ของ preview เท่านั้น ถ้าโหมด slope เป็นต้นทางไม่เก็บ rise ที่ขัดกัน ถ้า custom เป็นต้นทาง validate ระดับตามหลังเพิ่มขึ้น Calibration JSON v1 เดิมเป็นไฟล์ trial geometry; **ไม่ใช่ Cinema JSON schemaVersion 1** แม้เลขรุ่นเท่ากันและต้องไม่ใช้ parser ร่วมโดยไม่ตรวจชนิดเอกสาร

### ลำดับย้ายและจุดยอมรับ

1. เก็บ baseline runtime config หลัง DL-020 (ISSUE-PARAGON-001 แก้และตรวจภาพแล้ว; ไม่มีโต๊ะ VP; CoLa ใช้งานแล้ว) และ golden assertions ของ 426 IDs, category, pair, camera, floor/screen/projection/UV/EXIT เพื่อเทียบก่อนและหลังย้าย
2. นิยาม Cinema schema v1, evidence metadata และ validator; branchId ไม่ซ้ำ auditorium เป็น object เดียว และค่าระยะต้อง finite/valid
3. ย้าย source inputs ของ Paragon ไป paragon.json สร้าง adapter ให้ผลเท่าเดิม แล้วให้ registry lazy-load JSON เฉพาะสาขาที่เลือก
4. ปรับ EntryFlow รองรับ loading/error ที่ชัดเจน สาขาที่ยัง missing หรือไฟล์เสียเปิดฉากไม่ได้ ห้าม fallback เป็น Paragon
5. เชื่อม Calibration กับ builder ใหม่ รักษา import/export trial v1 และ production DEV exclusion
6. รัน comparison tests และ public/browser/production checks แล้วเลิกใช้ source constants เดิมที่ซ้ำ ไม่ทิ้งสองแหล่งความจริง

Acceptance: รหัส/ตำแหน่ง/กล้องยังเท่า baseline ภายใน tolerance 1e-6 m; 421/426 ยังบันทึกครบ; URL เดิมใช้ได้; เพิ่ม branch fixture ที่ผังต่างกันแล้ว renderer เดิมทำงาน; invalid/missing data ถูกปิด; JSON ต่อสาขามีหนึ่ง auditorium เท่านั้น

ไม่ต้องสร้างข้อมูลโรงหรือวิดีโอปลอมให้ Coming Soon ก่อนมี references การเพิ่ม placeholder ต้องระบุ missing และไม่สร้าง seats ที่ผู้ใช้เลือกเข้าได้

## 10 · Roadmap B — เลือก IMAX Preshow / IMAX Countdown

**สถานะ: Planned / ยังไม่ได้ทำ** ผู้ใช้ต้องการสองตัวเลือก โดย IMAX Preshow ใช้ไฟล์ปัจจุบัน Infinite Worlds.mp4 ส่วน IMAX Countdown ยังไม่มีไฟล์ใน public/media ณ ตอนตรวจ workspace ห้ามอ้างว่า Countdown พร้อมแล้วหรือดาวน์โหลดแทนโดยไม่มีแหล่งที่อนุญาต

### Media catalog ที่เสนอ

ตัวอย่าง excerpt ของข้อมูลอนาคต ไม่ใช่ JSON configuration ที่โหลดได้ทั้งโรง และค่า src=null ของ Countdown เป็นการระบุ pending โดยชัดเจน ชื่อ Preshow เป็นชื่อสำหรับ UI ตามผู้ใช้ ไม่ได้ยืนยันว่า Infinite Worlds เป็นสื่อทางการของ IMAX

```json
{
  "defaultVideoId": "imax-preshow",
  "videos": [
    {
      "id": "imax-preshow",
      "label": "IMAX Preshow",
      "status": "available",
      "src": "/media/Infinite%20Worlds.mp4",
      "provenance": "user-provided"
    },
    {
      "id": "imax-countdown",
      "label": "IMAX Countdown",
      "status": "pending-asset",
      "src": null,
      "provenance": "awaiting-authorized-user-asset"
    }
  ]
}
```

### User flow และ lifecycle ที่เสนอ

นโยบาย crop/fit มาจาก `auditorium.projection` ชุดเดียว โดยใช้ขนาด metadata ของแต่ละคลิป ไม่เก็บนโยบาย contain ซ้ำใน media catalog; โรงที่ไม่มี projection ใช้ contain แบบเดิม กรอบ CoLa ของพารากอนยังเป็น 25 × 13.1579 ม. ไม่ขึ้นกับคลิปที่เลือก

1. เพิ่ม dropdown “เลือกวิดีโอ” ในฟอร์มก่อน Enter Simulation ค่าเริ่มต้น IMAX Preshow ทำให้ UI เข้ากับ dropdown สาขา/Combobox เดิม
2. Countdown จะแสดงเลือกได้เมื่อไฟล์ที่ได้รับอนุญาตถูกเพิ่มและทดสอบแล้ว ระหว่างรอให้ disabled พร้อมบอกว่ายังไม่มีไฟล์
3. เพิ่ม query `video=imax-preshow` หรือ `video=imax-countdown` ส่ง ID ไม่ส่ง URL; URL เก่าที่ไม่มี video ใช้ default ของสาขา
4. Resolve video จาก catalog ของสาขาปัจจุบันเท่านั้น ID ผิด/pending ไม่โหลด source ภายนอก; กลับฟอร์มพร้อมข้อความให้เลือกใหม่
5. ส่ง resolved src ให้ useVideo/VideoTexture เดิม เมื่อออกหยุดและปล่อย media; กลับหรือ Browser Back คงสาขา/ที่นั่ง/วิดีโอ และคืนโฟกัสที่นั่ง
6. ถ้าจะเพิ่มการสลับคลิประหว่างชมในอนาคต ให้เลือกจาก catalog เท่านั้น ไม่คืน Change Video/file picker ที่ผู้ใช้ขอเอาออก

Source change ต้อง pause/release ของเก่า reset loading/time/duration/error โหลด metadata ใหม่ dispose VideoTexture ของ source เก่า และรักษา camera/seat ไม่ย้ายกล้อง Autoplay ยัง muted จัดการ play rejection แบบเดิม ไม่สมมติว่าคลิป Countdown เป็น 1.43:1; ใช้ metadata ของคลิปนั้นกับ auditorium.projection: ต่ำกว่า 1.90 ครอปบนล่างกึ่งกลาง, เท่ากับ 1.90 ใช้ภาพครบ, กว้างกว่า 1.90 fit เต็มความกว้างและเว้นบนล่าง ไม่ยืดภาพ และคืน UV repeat/offset เต็มเมื่อไม่ต้องครอป; โรงไม่มี projection ใช้ contain ตามเดิม

ไฟล์วิดีโอเพิ่มขนาด static deployment ปัจจุบัน Infinite Worlds ประมาณ 26.8 MB เก็บ provenance/codec/duration/aspect ที่ตรวจได้และคำนึงถึงการเสิร์ฟ byte ranges/cache ตอนเผยแพร่ ไม่จำเป็นต้องเปลี่ยนเป็น streaming service ในเฟสนี้

### Acceptance ของตัวเลือกวิดีโอ

- ทั้งสองคลิปมีไฟล์จริงและที่มาอนุญาตก่อนประกาศพร้อม; ชื่อ/ID ไม่ซ้ำและ default มีอยู่
- กดเลือก/Enter/direct URL เปิดคลิปตรงกับ ID; URL เก่าใช้ Preshow; invalid ID และ Coming Soon ถูก guard
- Metadata ของแต่ละคลิปกำหนด fit; ไม่มีการยืด/crop แม้ aspect ต่างกัน
- Autoplay muted, play/pause/mute/volume/seek, blocked autoplay, media error, ended และ dim/restore ทำงานกับทั้งสองคลิป
- Back/Escape/Browser Back คงทั้ง seat/branch/video, หยุด media เก่า ไม่มีเสียงซ้อนหรือ texture leak
- Browser tests และ performance sample แยกแต่ละ source ที่ front/middle/rear และ desktop/mobile

## 11 · ลำดับงานถัดไปที่แนะนำ

| Priority | Work ID | งาน | สถานะ | Dependency | Definition of done |
| --- | --- | --- | --- | --- | --- |
| เสร็จแล้ว | ISSUE-PARAGON-001 | ทุกเก้าอี้หันตรงทาง −Z; โต๊ะ VP ถูกเอาออกใน DL-013 | เสร็จแล้ว | คำยืนยันผู้ใช้ + ตรวจ mesh/instance matrices | ภาพก่อน–หลัง, POV 13 แถว และผลทดสอบบันทึกในหัวข้อ 08 |
| เสร็จแล้ว | NEXT-01 | Cinema schema v1 + parity baseline | เสร็จ · DL-021 | ISSUE-PARAGON-001 แก้และตรวจแล้ว | Schema/validator/example/baseline พร้อม; แยก trial JSON ได้ |
| 1 | NEXT-02 | ย้าย Paragon ไป JSON ต่อสาขา | ยังไม่เริ่ม · เริ่มได้ | NEXT-01 เสร็จแล้ว | Paragon behavior/coordinates เท่าเดิม, guards ผ่าน |
| 3 | NEXT-03 | Media catalog + dropdown + video query | ยังไม่เริ่ม | NEXT-02 | Preshow เลือก/คงค่าได้; Countdown pending ชัดเจน |
| 4 | NEXT-04 | ใส่ไฟล์ Countdown และทดสอบ | รอไฟล์และงานก่อนหน้า | NEXT-03 + Authorized Countdown asset | สองคลิปเล่นจริง สัดส่วนและ lifecycle ผ่าน |
| 5 | NEXT-05 | เพิ่มสาขาที่สองจาก references | รอข้อมูลและงานก่อนหน้า | NEXT-02 + ข้อมูลสาขานั้น | JSON ใหม่ใช้ renderer เดิม ไม่มีสมมติผัง Paragon |
| คู่ขนาน | DATA-01 | แก้ช่องว่าง 421/426 และ calibrate | รอหลักฐานเพิ่ม | หลักฐานเพิ่ม | แก้ตามหลักฐาน ไม่เดาที่นั่งที่หาย |

Roadmap เป็นรายการพร้อมลงมือในงานถัดไป การสร้าง log นี้ไม่ได้ทำ JSON migration หรือ video dropdown แล้ว และไม่ได้เปิด Coming Soon ให้ใช้งาน

## 12 · คู่มือเพิ่มสาขาหลังย้าย JSON

1. รวบรวมผัง readable, เลขแถว/ที่นั่ง/ช่องว่าง/คู่/category, รูปโรง ขนาดจอ และหลักฐานสเกล บันทึกแหล่งที่มาพร้อม unknowns
2. สร้าง src/data/cinemas/<branch-id>.json ของสาขานั้นและ auditorium เดียว ใช้ units/axes/schema เดียวกัน แต่ตำแหน่งและ geometry ของโรงนั้นเอง
3. เพิ่ม metadata และ import loader ใน registry โดยคงสถานะ missing/coming-soon จนผ่าน validation ห้ามทำ playable fixture เป็นข้อมูลจริง
4. ตรวจยอดและรหัส against references; camera/front/middle/rear/side; floor contacts; screen/video aspect; exits ตามหลักฐาน
5. เพิ่ม media ของสาขาหรือ catalog ที่อนุญาต ตรวจ codec/provenance แล้วทดสอบ UI/URL/exit/performance
6. เปิด prototype เมื่อมีข้อมูลพอและติดป้ายประมาณ; reviewed ต้องผ่านการเทียบ references ไม่ใช่แค่ unit tests

One-file-per-branch เป็นข้อกำหนดที่ผู้ใช้ยืนยันใน log นี้ ถ้าความต้องการเปลี่ยนในอนาคตให้ทำ explicit schema migration ไม่เพิ่ม array หลายโรงโดยเงียบ ๆ

## 13 · AI handoff และวิธีบำรุง log

เริ่มงานใหม่โดยอ่านเอกสารนี้ แล้วอ่านไฟล์จริงที่เกี่ยวข้องเพราะโค้ดอาจใหม่กว่า snapshot ตรวจสถานะ planned/implemented ก่อนกล่าวอ้าง และอ่าน reference-analysis.md เมื่อแตะ geometry/ข้อมูลโรง

**เริ่มจาก NEXT-02:** ใช้ Cinema schema/validator/example ตาม DL-021 และเทียบ baseline frozen ก่อนเชื่อม loader/renderer; DATA-01 ยังรอหลักฐานเพิ่ม

- รักษาภาษาไทย Prompt สำหรับข้อความหลัก และ Google Sans สำหรับข้อความเล็ก/หมายเหตุ โทนน้ำเงินและ viewport UI; ห้ามคืน Fullscreen หรือ file picker โดยไม่ได้รับคำขอ
- รักษา stable IDs และ URL/focus lifecycle; seat map/Combo/camera ต้องใช้ข้อมูลเดียวกัน
- ห้ามเรียกค่า estimate ว่าเป็นการวัดจริง ห้ามบังคับยอด 421 ด้วยการลบสุ่ม และไม่เปลี่ยน fixtures ให้เป็นสาขาจริง
- วาง data กับ renderer แยกกัน; source schemaVersion และ Calibration version เป็นคนละ contract
- รักษา performance baseline และทดสอบเมื่อเปลี่ยน geometry/materials/media; อย่าอ้าง FPS โดยไม่มี viewport/GPU/ระยะเวลาทดสอบ
- ขยาย log ด้วย Log ID ใหม่ พร้อมวันที่ ขอบเขต ไฟล์ เหตุผล การตรวจสอบ ข้อจำกัด และ dependency; ไม่สร้าง commit SHA ที่ไม่เคยมี

คำสั่งตรวจงานปัจจุบัน:

```sh
npm install
npm run dev
npm test
npm run test:browser
npm run build
npm run test:production
```

Node 22 + npm สมัยใหม่แนะนำ browser tests ใช้ Chrome ที่ติดตั้งในเครื่อง; output screenshots/profiling อยู่ใน output/ ที่ ignored ไม่ใช่ asset สำหรับเผยแพร่

Markdown ไฟล์นี้เป็นต้นฉบับของ HTML เมื่อปิดงานให้เปลี่ยน `[ ]` เป็น `[x]` ในหัวข้อ 00 หลังผ่านเกณฑ์ในหัวข้อ 11 พร้อมปรับสถานะ roadmap, Log ID และวันที่ ถ้าเพิ่มงานหลักให้เพิ่ม checklist ที่นี่และอัปเดตตัวเลขสรุปใน Markdown ตามสูตรเดียวกัน HTML คำนวณเปอร์เซ็นต์ จำนวนงาน และงานค้างจาก checklist นี้อัตโนมัติทุกครั้งที่สร้างใหม่ ไม่คำนวณจากจำนวน Log ID:

```sh
node scripts/build-development-log.mjs
```

HTML อ่านได้โดยไม่ต้องรัน React หรือ build แอป และเนื้อหาทั้งหมดอยู่ใน semantic HTML ไม่ต้อง execute JavaScript เพื่อให้ AI อ่านได้ งาน log นี้ไม่ได้เผยแพร่ Simulator หรือเอกสารขึ้น Sites

## 14 · เอกสารประกอบ

- [README — Setup และ architecture](../README.md)
- [Reference analysis — หลักฐานและ assumptions](../reference-analysis.md)
- [Validation — ผลตรวจและข้อจำกัด](../VALIDATION.md)
- [Asset credits — Provenance](../ASSET-CREDITS.md)
- [Development Log ฉบับ Markdown](DEVELOPMENT-LOG.md)

แหล่งข้อมูลใน log นี้คือไฟล์ข้างต้น โค้ดและผลตรวจล่าสุดวันที่ 13 ตุลาคม 2026 ค่าหรือเส้นทางใต้หัวข้อ Roadmap มีไว้เป็นแบบเสนอเท่านั้น
