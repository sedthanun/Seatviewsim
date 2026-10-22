# Cinema Data v1 — คู่มือข้อมูลสาขา

NEXT-01: schema, validator, ตัวอย่าง และ baseline พร้อมใช้แล้ว ตัวอย่าง JSON **ยังไม่เชื่อม registry หรือหน้าเว็บ** ระบบสาธารณะยังใช้ JavaScript ของ Paragon เดิม NEXT-02 จะย้าย loader และสร้าง adapter สำหรับฉากครบทั้งโรง

## ไฟล์และการเรียกใช้

- `src/data/schemas/cinema.schema.json`: JSON Schema draft-07
- `src/config/validateCinema.js`: Ajv 8 และการตรวจความสัมพันธ์
- `src/config/resolveCinemaSeating.js`: ขยายข้อมูลรายแถวเป็น rows/seats สำหรับตรวจและเทียบ ไม่ใช่ renderer adapter
- `src/data/cinemas/paragon.json`: ตัวอย่างที่ผ่าน พร้อมคำเตือน 421/426
- `tests/baselines/paragon-v1.json`: baseline frozen ของ runtime config ทั้งชุด สายตาทุกที่นั่ง และ projection/UV สามสัดส่วน

```js
import { validateCinema } from "../config/validateCinema";
import { resolveCinemaSeating } from "../config/resolveCinemaSeating";

// จัดการ SyntaxError แยกต่างหาก ตัวตรวจรับ parsed object เท่านั้น
const data = JSON.parse(text);
const result = validateCinema(data, { expectedBranchId: "paragon" });
// { valid, canSimulate, errors, warnings, configuredSeatCount }
if (result.valid && result.canSimulate) {
  const { rows, seats } = resolveCinemaSeating(data.auditorium);
}
```

errors/warnings มี `{path,code,message}`; path เป็น JSON Pointer ข้อความภาษาไทย ตัวตรวจไม่แก้ข้อมูล ไม่เติม defaults ไม่แปลงชนิด ไม่ลบฟิลด์ที่ไม่รู้จัก และไม่โหลดสื่อ valid หมายถึงผ่านข้อกำหนดซอฟต์แวร์ ไม่ยืนยันความแม่นยำเทียบโรงจริง ข้อมูลผิดโครงสร้างหยุดก่อนตรวจความสัมพันธ์และ configuredSeatCount เป็น 0

## โครงสร้างและสถานะ

ชื่อไฟล์ตาม branchId เช่น paragon.json; expectedBranchId มาจากทะเบียนที่ผู้เรียกเชื่อถือ หนึ่งไฟล์มี auditorium object เดียว ไม่ใช้ array

ระดับบนต้องมี schemaVersion=1, branchId, nameTh, name, brand, location, features, status, source, verifiedAt, auditorium, evidence, estimates, unresolved source/verifiedAt ใช้ null เมื่อไม่ทราบ วันที่เป็น YYYY-MM-DD และต้องเป็นวันที่จริง รหัสสาขา/ประเภท/คู่/คลิปใช้ตัวพิมพ์เล็ก ตัวเลข และขีดคั่น เช่น `esplanade-khae-rai`

| สถานะ | ข้อมูล | ผล |
| --- | --- | --- |
| coming-soon | auditorium.id/name/referenceStatus=missing; ส่วนอื่นเว้นได้ | valid ได้ แต่ canSimulate=false |
| available + prototype | ข้อมูลจำลองครบ; ระบุค่าประมาณและความคลาดเคลื่อน | เปิดได้เมื่อผ่านตัวตรวจ |
| available + reviewed | ข้อมูลครบและจำนวนรายงานไม่คลาดเคลื่อน | ต้องตรวจหลักฐานจริงเพิ่มเติมก่อนใช้สถานะนี้ |

สถานะหลักฐานมีที่เดียวที่ auditorium.referenceStatus หาก Coming Soon แนบส่วนข้อมูลเพิ่มเติม ส่วนนั้นต้องครบตาม schema และผ่านตัวตรวจด้วย

```json
{
  "schemaVersion": 1,
  "branchId": "future-branch",
  "nameTh": "สาขาใหม่",
  "name": "Future Branch",
  "brand": "Major Cineplex Group",
  "location": "ยังไม่ยืนยัน",
  "features": [],
  "status": "coming-soon",
  "source": null,
  "verifiedAt": null,
  "auditorium": { "id": "imax", "name": "IMAX", "referenceStatus": "missing" },
  "evidence": [], "estimates": [], "unresolved": []
}
```

เมื่อ available ต้องมี units=meters, axes=x-right-y-up-z-rear, capacity, screen, layout, seating, camera, appearance, environment, media ส่วน projection เว้นได้

- จุดกำเนิด: พื้นใต้กึ่งกลางจอ; +X ขวาเมื่อมองจอ, +Y ขึ้น, +Z ท้ายโรง เก้าอี้ yaw=0 หัน −Z
- ระยะเป็นเมตร; screen.rotation เป็น Euler XYZ และ yaw เป็นเรเดียน; camera.fov แนวตั้งและ yawLimit/pitchLimit เป็นองศา
- ตำแหน่งเก้าอี้อยู่ที่พื้น eyeOffset เป็น local coordinates หมุนตาม yaw ก่อนบวกตำแหน่งเก้าอี้
- capacity.reported เป็นจำนวนรายงานหรือ null; configured ต้องเท่าที่นั่งจริงไม่นับ null เมื่อจำนวนต่างกันต้องมี discrepancy ที่ไม่ว่าง Prototype ผ่านพร้อม warning ส่วน reviewed ไม่ผ่าน
- screen มี width/height/position/rotation; position คือกึ่งกลางจอ ไม่เก็บ aspect ratio ที่คำนวณจากขนาดซ้ำ
- projection มี system/aspectRatio/width/offset/tallContentMode=crop; offset=[x,y] จากกลางจอในระนาบจอ height=width/aspectRatio และกรอบต้องอยู่ในจอ เว้น projection เพื่อใช้ contain เดิม
- camera.target เป็น {kind:screen-center} หรือ {kind:explicit,position:[x,y,z]} แบบ screen-center ไม่เก็บเป้าหมายซ้ำกับจอ

## ผังแถว พื้น และเก้าอี้

layout.kind=tiered-rows; layout.rows เรียงหน้าไปหลัง ไม่ตีความจากชื่อแถว แถวแรกมี distanceFromScreen เท่านั้น แถวต่อมามี distanceFromPrevious เท่านั้น ระยะบวกตามแกน Z จากระนาบจอที่ Z=0 ซึ่งเป็นข้อตกลงของสูตร v1

layout.elevation เลือกต้นทางเดียว:

```json
{ "mode": "slope", "frontElevation": 0.25, "degrees": 22.5 }
```

```json
{ "mode": "rise", "frontElevation": 0.25, "rise": 0.4, "run": 1.15 }
```

```json
{ "mode": "custom", "levels": [0.25, 0.7, 1.1] }
```

slope: y=frontElevation+(z-firstZ)*tan(degrees); rise: gradient=rise/run และรวมช่องทางเดินเพิ่มด้วย; custom: ระดับครบทุกแถวและไม่ลดลงไปท้ายโรง ยอมให้เท่ากันสำหรับพื้นราบ ไม่เก็บค่าที่ derive แล้วซ้ำเป็น input

layout.curvature หน่วย 1/เมตร ใช้ seatZ=rowZ+curvature*x*x ระดับพื้นภายในแถวคงที่ frontOffset/backOffset เป็นระยะมีเครื่องหมายจาก centerline ไปขอบพื้น และต้อง front<back พื้นแถวต้องไม่ทับกัน แถวที่มีแถวถัดไปต้องมี stairRunToNext ซึ่งไม่เกินช่วงขอบหน้าของสองแถว แถวสุดท้ายไม่มีฟิลด์นี้

layout.architecture เก็บ sideClearance, wallThickness, platformMargin, centralAisle, rearClearance, railRadius, minDepth, minHeight, screenTopClearance, rearHeadroom, maxStepRise หน่วยเมตรและบวก platformMargin<sideClearance และ railRadius<platformMargin

recipe ขอบเขตสำหรับ NEXT-02: outerSeat=max(abs(ขอบ X ทุกชิ้นของเก้าอี้)), innerWallX=outerSeat+sideClearance, platformEdge=outerSeat+platformMargin; width=2*innerWallX+wallThickness, sideAisleWidth=innerWallX-platformEdge; depth=max(minDepth, ขอบพื้นโค้งหลังสุด+rearClearance); height=max(minHeight, ขอบจอบน+screenTopClearance, ระดับแถวหลัง+rearHeadroom)

แต่ละแถวเลือก platforms:

- split: ช่วง [-platformEdge,-centralAisle/2] และ [centralAisle/2,platformEdge]
- full: ช่วง [-platformEdge,platformEdge] สำหรับ VP ที่พื้นต่อเนื่องข้ามกลางโรง
- รายการ {left,right}: ขอบพื้นเฉพาะหน่วยเมตร แต่ละช่วง left<right และไม่ทับกัน

layout.aisles มี ID ไม่ซ้ำ: kind=central ใช้ x=0/ความกว้าง architecture.centralAisle; kind=side พร้อม side=-1/1 ต่อจาก platformEdge ไปผนังด้านใน; kind=fixed พร้อม x/width ระบุทางเดินเฉพาะ พื้น split ต้องมี central หนึ่งรายการ ทางเดินกลางและทางเดินข้างแต่ละฝั่งห้ามซ้ำ ช่อง numbers=null ไม่สร้างทางเดินหรือช่องพื้นอัตโนมัติ

seating.categories เป็น dictionary รหัสประเภทไป {name,color} สี #RRGGBB ไม่ใช้สีสถานะการจองแทนสีเบาะจริง seating.rows มีหนึ่งรายการต่อแถวพร้อม rowId/blocks/pairs ตัวอย่างบล็อกที่มีช่องขาด (excerpt):

```json
{
  "rowId": "A",
  "blocks": [
    { "startX": -1.5, "seatPitch": 1, "numbers": ["1", null, "3"], "category": "normal", "yaw": 0 }
  ],
  "pairs": []
}
```

numbers เป็นข้อความเรียงตามตำแหน่ง X จากซ้ายไปขวา จะเป็น ["03","02","01"] ก็ได้ slot i มี X=startX+i*seatPitch null ไม่มีเก้าอี้แต่กินระยะ slot จึงไม่เลื่อนตำแหน่งถัดไป แต่ละแถวต้องมีเก้าอี้จริงอย่างน้อยหนึ่งตัว

คู่เป็น {id:"vp-pair-1",numbers:["1","2"]} อ้างเก้าอี้สองตัวในแถวเดียวกัน รหัสคู่ไม่ซ้ำทั้งโรง ที่นั่งหนึ่งตัวอยู่ได้เพียงหนึ่งคู่ ยังนับเป็นสอง ID/ตำแหน่งสายตา ไม่สร้างโต๊ะ

seatOverrides เป็นรายการ {seatId,position?,yaw?,eyeOffset?} ต้องมีอย่างน้อยหนึ่งค่าที่แก้และอ้างที่นั่งที่ประกาศแล้ว ห้ามซ้ำ seatId position ใช้แทนพิกัดคำนวณทั้งสามแกน yaw/eyeOffset ที่ไม่ระบุใช้ค่าบล็อก/กล้อง ห้ามพิกัดที่นั่งตรงกันและ eyeOffset.y ต้องบวก เก็บเฉพาะ inputs ไม่เก็บ derived seats ซ้ำในไฟล์

ID ใช้ `${rowId}-${number}`; รหัสกรอกใช้ `${rowId}${number}` และ trim/uppercase ต้องไม่ชนกัน เช่น A1+2 กับ A+12 ข้อมูลแถว/เลขใช้ตัวอักษรอังกฤษหรือตัวเลขไม่ว่างและเก็บศูนย์นำหน้าได้

## บรรยากาศ สื่อ และหลักฐาน

appearance มี rounded/cupHolders/baseColor และ parts ที่มี size/offset: back/cushion/arm/base เป็นขั้นต่ำ; backInset/upholstery/headrest/stem เป็นส่วนเสริม ขนาดบวก offset มีเครื่องหมาย arm ใช้ offset ด้านขวาแล้ว mirror X อีกฝั่ง

environment.kind=row-relative เป็น recipe ตาม renderer เดิม มี materials/wash/strips/sconces/exits/lighting ตาม schema จำนวนไฟอำพันไม่เกินชุดไฟต่อฝั่ง exits.sides ระบุ -1/1 ไม่ซ้ำ หรือ [] เมื่อไม่มีประตูใน recipe นี้ แบบโรงที่ต้องใช้ environment ต่างจาก recipe นี้ให้เพิ่มชนิดพร้อม schema/adapter ภายหลัง ไม่คัดลอกบรรยากาศ Paragon มาใช้เงียบ ๆ

media.clips มี id/name/status/src/evidenceIds ready ต้องมี src; pending ต้อง src=null สำหรับ available defaultVideoId ต้องอ้าง ready clip ภายในสาขา Coming Soon ใช้ null ได้ ตัวตรวจไม่อ่าน/ดาวน์โหลดไฟล์ และไม่มี dropdown ใหม่ในรอบนี้

- evidence: id/type/url หรือ filename/description/supports; type=operator,user,photo,design-guide,asset,document; supports เป็น JSON Pointer ไปฟิลด์หรือกลุ่มที่แหล่งข้อมูลรองรับ
- estimates: path/rationale/evidenceIds; ระบุค่าประมาณและเหตุผล evidenceIds=[] เมื่อไม่มีแหล่งรองรับ
- unresolved: id/message/paths/evidenceIds; ระบุสิ่งที่ยังต้องหาคำตอบ
- รหัสหลักฐานและประเด็นค้างไม่ซ้ำ ทุก pointer ชี้ฟิลด์จริง ทุก evidenceId อ้างหลักฐานที่ประกาศ filename ใช้ชื่อรูปหรือเอกสาร ไม่คัดลอกรูป/ข้อมูลการจองเข้า public

Paragon คง Prototype, 426/รายงาน421, L→K→…→A→VP, K เริ่ม2, L เริ่ม4, VP 11คู่/22เก้าอี้ และไม่มีโต๊ะ Preshow เป็นชื่อ UI ของ Infinite Worlds ไม่ยืนยันว่าเป็นสื่อทางการ Countdown เป็น pending

## ตรวจและย้ายต่อ

รัน npm test, npm run build, npm run test:production ชุด Cinema เทียบทุกตำแหน่งของ example และ runtime JavaScript ทั้งชุด/สายตา/UV กับ baseline ภายใน 1e-6 รหัส/หมวด/ลำดับ/shape ต้องตรง

baseline ไม่สร้างใหม่ใน tests เมื่อเปลี่ยนโดยตั้งใจและตรวจความเปลี่ยนแปลงแล้วใช้ `node scripts/capture-cinema-baseline.mjs` ห้ามอัปเดต snapshot เพื่อกลบ regression

NEXT-02 สร้าง adapter ฉากครบจาก inputs เทียบ geometry/platforms/stairs/environment/EXIT กับ baseline แล้วเชื่อม registry/loader รักษา Calibration trial v1, URL และ guard เดิม ก่อนเลิกใช้ constants ซ้ำ การยืนยันความแม่นยำเทียบโรงจริงเป็นคนละงาน
