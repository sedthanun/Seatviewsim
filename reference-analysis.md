# Reference analysis — Paragon IMAX

Updated: 13 October 2026.

## Supplied references

The user chose **references first** and has now supplied a booking-plan screenshot (`C:/Users/Dell/Downloads/SeatParagon.jpg`), an auditorium photograph (`C:/Users/Dell/AppData/Local/Temp/codex-clipboard-3efec576-ad11-4288-911d-9f39bdf6b8c7.png`), screen specifications, and row-numbering clarifications. These images were inspected in the conversation. They have not been copied into public assets. The supplied screenshot contains unrelated booking/contact information; only its seating-plan and category information is relevant to reconstruction. The user then explicitly requested a working prototype from the available plan, so Paragon is now open with estimated geometry and an unresolved seat-count discrepancy.

## User-confirmed seating information

- Stated capacity: 421 individual seats, not yet reconciled against the complete numbering.
- Corrected row range: A through L (the earlier A-only statement was superseded), plus VP1–VP22.
- Back-to-front order toward the screen: VP, A, B, C, D, E, F, G, H, I, J, K, L. The user confirmed VP is last/rearmost and A is immediately ahead; the alphabetical progression follows the supplied A–L range.
- K begins at K2, and L begins at L4. Do not generate K1 or L1–L3.
- VP is paired: VP1/VP2, VP3/VP4, continuing through VP21/VP22. Preserve individual seat IDs and eye positions within each pair (22 seats, 11 pairs).
- The side on which numbering begins when facing the screen is still unknown. Exact ending numbers and any additional omissions remain unconfirmed.
- Conditional count: if A–J each contain 1–34, K contains 2–34, and L contains 4–34, then 340 + 33 + 31 + 22 = 426 seats. This is five more than the stated 421. The prototype exposes all 426 stated-range IDs until the five missing places can be identified; it does not claim a verified capacity.
- Row labels and numbers are not legible in the supplied overview; the written user clarifications are the source for numbering. The overview must still be reconciled with the stated row inventory before deriving category assignments.

## Confirmed facts and provenance

- The requested target is the IMAX auditorium at Paragon Cineplex, Siam Paragon, Bangkok.
- The operator lists [IMAX Laser Paragon Cineplex](https://www.majorcineplex.com/cinema/imax-paragon/) at Siam Paragon. This confirms the venue/format, not a physical screen aspect ratio or seating layout.
- Directory names were checked against [Major Ratchayothin](https://www.majorcineplex.com/cinema/major-ratchayothin/), [Esplanade Ngamwongwan–Khae Rai](https://www.majorcineplex.com/cinema/esplanade-ngamwongwan-khae-rai/), and [ICON CINECONIC](https://www.majorcineplex.com/cinema/ICON-CINECONIC/).
- The [official cinema directory](https://www.majorcineplex.com/cinema/) explicitly lists ten IMAX venues: Paragon, Ratchayothin, Esplanade Ngamwongwan–Khae Rai, ICON CINECONIC, Quartier, Westgate, Mega Bangna, Bangkapi, Central Pinklao and Central Festival Chiang Mai (checked 10 October 2026). Each is in the dropdown. This confirms formats only; it supplies no seat coordinates or auditorium dimensions.

## User measurements

- User-reported physical screen dimensions: 26.3 × 19.8 m, implying approximately 1.328:1. The earlier description also said 1.43:1; the later supplied reconstruction request and approved plan explicitly keep 26.3 × 19.8 m / 1.328:1 for the physical screen. The 1.43:1 footage remains independent of those dimensions.
- User-reported active projection width: approximately 25 m. On 13 October 2026 the user confirmed IMAX Commercial Laser (CoLa), a 1.90:1 projection frame rather than full-height 1.43:1 playback. Height is derived as 25 / 1.90 = 13.1578947 m, replacing the earlier rounded 13.15 m. The physical screen remains 26.3 × 19.8 m.
- User-reported system: IMAX Commercial Laser (CoLa) 4K projection and 12-channel sound. These are supplied specifications, not independently measured scene properties or an audio-simulation requirement. The [operator's Paragon page](https://www.majorcineplex.com/cinema/paragon-cineplex/) confirms IMAX with Laser; it does not independently establish the CoLa model or projection placement.
- User placed `public/media/Infinite Worlds.mp4` as the intended Paragon video. Local media inspection found H.264 1546 × 1080 pixels (1.4315:1), 24 fps, about 65 seconds, with AAC stereo audio. Its dimensions substantiate the video's 1.43:1 description; they do not measure the physical screen.
- The former fit-to-physical-screen behavior occupied 26.3 × approximately 18.37 m and is superseded by the confirmed CoLa simulation. The centered 25 × 13.1578947 m projection frame leaves 0.65 m on each side and 3.3210526 m above/below on the physical screen. The 1546 × 1080 file is cropped symmetrically through texture UVs to a visible source height of 813.6842105 pixels (133.1578947 removed from each end), without stretching or rewriting the MP4. Centered placement and centered cropping are approved prototype assumptions, not measured placement or verified theatrical-release framing.
- Mounting height, screen curvature, room bounds, seat-to-screen distances, row spacing, tier rises and seat dimensions are still unknown.

## Photograph estimates

- The booking screenshot shows Normal, Honeymoon and Opera Chair categories, a central aisle, and a cross-aisle separating front and rear seating sections. Gray occupied/unavailable icons must not be interpreted as permanent missing seats without evidence.
- The auditorium photo supports curved rows, tiered floor elevations, red front seats, warmer gold/tan-looking seat surfaces farther back, dark wall/ceiling surfaces, railings, and blue vertical wall lighting. Apparent material colors are affected by the strong blue lighting; category colors in the booking UI are not real upholstery colors.
- Two additional 1335 × 888 AVIF photographs were supplied: `d4ebd6_f7aefb9fdd304f16abd996a2f669578e~mv2.avif` and `d4ebd6_1385df7020974a278d9f49b6683e18b8~mv2.avif`, in the user's Downloads folder. They show curved rows, red forward upholstery, tan/gold rear upholstery with dark backs, stepped side aisles and railings. Their K9 CineBlog watermark and venue label are visible. They were inspected through temporary PNG previews and have not been included in public assets.
- No metric slope was inferred directly from any oblique photograph. Camera location, lens parameters and image perspective are unknown; these photographs support structure and broad materials, not an exact Paragon rake measurement.
- Homepage illustrations are decorative original artwork, never modeling evidence.

## Required evidence for Paragon integration

1. Reconcile row ending numbers/omissions with 421 seats, and establish whether low seat numbers are on the left or right when facing the screen.
2. Establish category boundaries and exact aisle/pair placement from a readable plan or written row-by-row details. Do not force the overview into a uniform grid.
3. Determine the actual screen mounting height/curvature and active projection area's placement; the approved prototype now uses 26.3 × 19.8 m for the physical screen.
4. Supply available room/seat measurements or photographic scale anchors, ideally a view with its known row/seat. Remaining metric estimates must be configurable and labeled with rationale and uncertainty.

Supplied references take priority over external sources. Record each future source with its filename/date, the observations it supports, and uncertainty. Separate booking-session seat availability from permanent seat layout.

## Implementation assumptions

- World units are meters: +Y up, +X viewer's right while facing the screen, +Z toward the rear. Origin is floor level below screen center. Seat yaw is radians around +Y; local forward is -Z.
- Seat position is the floor-level seat anchor. Eye offset is local to the seat; rotate the offset by yaw before adding world position. The default seated eye height is 1.15 m, an ergonomic estimate, not a Paragon measurement.
- Camera FOV is 65 degrees vertically, with relative yaw/pitch limits of 75/40 degrees. These are software viewing defaults and do not claim calibrated visual equivalence to a human eye or photograph.
- The synthetic development fixture has invented TEST-A through TEST-D rows, a 12 × 7 m screen, and simplified seats. It tests software behavior only. It is excluded from production and is never referenced by the Paragon registry.
- Lighting approximates pre-show and playback states with screen-adjacent illumination, tall cyan strips, a separate blue wash over black acoustic foam sheets, and rear amber sconces. It is not photometric reconstruction, video-driven global illumination, or calibrated color reproduction.
- Prototype room width is derived from the outer chair parts and the user-selected estimated minimum 3 m clearance on each side: 34.09 m between wall centers with 0.20 m wall thickness (33.89 m interior width). Depth is at least 29 m and extends 2 m beyond the furthest curved floor edge; height starts at 23 m and expands for screen/row clearance. The screen is 26.3 × 19.8 m with estimated bottom edge 0.60 m above the origin (center 10.50 m).
- The shared model uses L→K→…→A→VP front-to-rear order, first centerline Z=10 m, first platform Y=0.25 m, ordinary horizontal row pitch 1.15 m, additional F/E gap 1.20 m, A/VP centerline separation 2.80 m and default centerline rake 22.5°. Rise is `horizontalRun × tan(rake)` including gaps; ordinary rise is approximately 0.476 m and VP platform elevation approximately 7.147 m. Curved platform tops stay level across each row; rake is defined between row centerlines, not between every curved seat anchor.
- Platforms follow the shared quadratic curvature `z = centerZ + 0.003*x*x`; their horizontal domains do not overlap. The central aisle is 1.36 m wide; side aisles extend from platform edges at ±14.20 m to inner walls at ±16.945 m, giving 2.745 m width. Intervening landings keep the preceding platform level. Aisle stairs bridge to the next platform with individual rises at most 0.18 m. Wider gaps have longer landings and stairs concentrated near the next row; local stair angles can therefore exceed the overall seating rake. Stair dimensions are prototype choices, not building-code certification. The VP paired row has a continuous platform across the center pair; the central aisle terminates at its front edge.
- Seats use 0.78 m horizontal spacing, configurable shared appearance dimensions, pedestal bases resting at the seat floor anchor, gentle row curvature and zero yaw (all chairs face world −Z). The low-number side is provisionally the viewer's left. A–E retain honeymoon category IDs but use tan/gold upholstery and dark back inserts; F–L use red upholstery; VP is paired tan/gold with no tables. Exact category boundaries, numbered positions and upholstery colors under neutral lighting remain unverified.
- Browser playback first uses the configured CoLa 1.90:1 frame. Actual metadata drives centered top/bottom UV cropping for taller footage; 1.90:1 uses the full source; wider footage such as 2.39:1 fits at full width with unused space above/below. No black-bar detection or per-shot reframing is inferred from the video. Auditoriums without projection configuration retain their legacy contain fit.

## Accuracy status

**This is a functional prototype, not a dimensionally accurate or fully verified seat map.** The five-seat count gap, exact category assignments, numbering direction and geometric estimates remain open.

## IMAX design guidance and calibration provenance

- Primary reference: [IMAX Design Facts, Theatre Geometry, sheet 1510, issued 1991-02-07, reproduced on PDF page 475](https://whc.unesco.org/uploads/nominations/1131.pdf#page=475) in UNESCO's Royal Exhibition Building and Carlton Gardens nomination document. The original scanned drawing was visually inspected. It identifies seating platform rakes of 20°–25° and a front-center-eye distance of 0.36–0.40 times screen chord width. It labels itself general information and reference only, subject to change, and calls for consultation with IMAX Design Department.
- 22.5° is the selected midpoint of that historical range; 10 m is approximately 0.38 × 26.3 m. Neither is a survey of Paragon, a claim of compliance with a current IMAX specification, or an assertion that every other proportion in the sheet was reconstructed. Previous prototype rake was approximately 10.19° (0.23 m / 1.28 m).
- The developer-only `/__dev/paragon/calibration` previews slope, fixed-rise or per-row custom levels using the same builder as the public scene. Eye height regenerates local offsets; screen bottom also updates the camera target. Side/top inspection removes occluding walls/ceiling and adds centerline/eye guides.
- Calibration JSON v1 stores the mode and parameters for `paragon-imax`, not the entire auditorium or media. Imported values are validated before use and affect only the developer preview. Download/import/reset does not modify public defaults or any project files; a reload restores defaults. The calibration UI and route are excluded from production.

## Reference-inspired materials, fixtures and EXIT (11 October 2026)

- The second AVIF photograph (`d4ebd6_1385df7020974a278d9f49b6683e18b8~mv2.avif`) is the primary appearance reference: golden rear upholstery, red forward upholstery, dark seat backs/arms, curved padded profiles, circular cup holders, VP side tables, dark mottled carpet, blue patterned wall panels and warm amber/orange sconces. These are visual observations, not material specifications or surveyed dimensions.
- The user explicitly confirmed an EXIT on each side wall at the frontmost row near the screen. Both locations are implemented relative to the shared L-row front boundary and an estimated 1.80 m-deep curved landing. Door bottoms use the same elevation as that landing; inward normals face the room. The 1.20 × 2.20 m doors and 0.75 × 0.28 m green/white signs are provisional dimensions, not measured from the photo. Doors are static 3D architecture, not booking or navigation controls.
- The original six short decorative panel/sconce sets per side were an initial approximation. The 13 October revision replaces them with six tall cyan strips and two rear sconces per side, as described below. The photographs do not establish the complete real fixture count.
- Seats retain their IDs, categories, base contacts and estimated dimensions. Rounded shared geometry, a gold/red headrest rim, dark back inserts, arms and circular cup inserts improve shape readability. The initially added VP tables were subsequently removed at the user's request; the current 22-seat VP row contains no tables.
- Carpet, wall weave, blue decorative pattern and EXIT text are original procedural canvas textures. No reference photograph, watermark, venue logo or external texture asset is copied into the build.
- The user chose to dim during video playback. House illumination, wall blue fill, decorative-panel emission and warm sconces ease to 20% within 1.20 seconds during successful playback, and restore to full level on pause/end/error/blocked autoplay. Green EXIT signs/lights and screen-adjacent illumination remain independent. This is an artistic approximation, not calibrated light output in lux.
- Calibration side/top views use bright inspection lighting and omit occluding walls/fixtures; the seated view follows actual playback state. Material/fixture/lighting parameters live in `src/config/paragon/environment.js`; calibration JSON v1 remains geometry-only. Mobile uses simpler nearby rounded geometry and zero supplemental sconce point lights instead of two on desktop; all visible strips and rear sconces remain present. Pixel ratio adapts between 0.55 and 1. No bloom or shadow pass was added.

## Rendering approximation for playback performance (11 October 2026)

- Fixed floor/rail geometry is merged; nearby chairs retain rounded silhouettes and cup holders, while chairs more than 7 m from the fixed eye position retain simpler rounded backs/headrests without cup details. This is a rendering choice, not new auditorium evidence. All 426 seat IDs and positions, floor contacts, rake and screen proportions are retained.

## Blue-lit reference and side clearance revision (13 October 2026)

- New primary appearance reference: user-supplied `C:/Users/Dell/Downloads/557603128_1212139634281126_6891239328485045704_n.jpg` (1440 × 1080). It shows tall cyan side-wall strips, red forward seats, tan/gold rear seats, dark back surfaces, charcoal carpet and a side railing. The user clarified that the wall consists of black acoustic foam sheets: the apparent blue is illumination, not material color, and the surface is not a triangular tile pattern. The photograph is a visual reference only and is not copied into public assets.
- The user selected a minimum 3 m distance from the outer armrest edge to each inner side wall. This is a reconstruction choice, not a metric measurement from the oblique photograph. The opposite wall and fixture arrangement are mirrored as an explicit approximation.
- `seatFootprint` projects the bounds of all chair parts, including mirrored armrests and the new dark rear inset. The outer X edge is ±13.945 m; adding 3 m gives inner walls at ±16.945 m. Adding half of the 0.20 m wall thickness gives wall centers at ±17.045 m (`geometry.width = 34.09`). The 0.255 m platform margin gives platform edges ±14.20 m, rails at ±14.175 m and side stairs/landings 2.745 m wide. L's left clearance is 5.34 m, K's is 3.78 m, and VP's is 4.41 m on both sides; full rows have 3 m on both sides.
- Room depth derives from the furthest curved platform/stair/landing edge plus a 2 m rear margin (default about 30.461 m). The whole front landing reaches the inner walls and supports the two front EXIT doors. Calibration row spacing/curvature changes regenerate these surfaces without changing seat IDs or architecture estimates; Calibration JSON remains version 1.
- Six cyan strips per side extend from 0.35 m above the nearest row floor to 0.60 m below room height. Each is 0.045 m wide with an original 0.85 m-wide translucent halo. Only the rearmost two fixtures per side carry amber sconces. Wall/ceiling material colors are neutral black (#181818/#141414); grayscale textures represent large foam sheets with faint seams, pores and shallow irregular creases. Separate blue wash meshes preserve the distinction between material and illumination while retaining inexpensive MeshBasic rendering; ambient/point lights alone do not illuminate those materials. The wash dims with playback and is an artistic approximation, not physical light transport.
- Chairs retain their original physical widths and floor anchors, with a rounded colored back perimeter and dark inset. Distant backs/headrests remain rounded using a simpler profile; their meshes stay below 180 triangles per chair, with nearby details below 600. VP stays table-free even though tables are visible in the reference photograph.
- Developer top view shows cyan inner-wall boundaries and dashed clearance spans; metrics and the row table expose computed left/right distances. Public UI, video mapping, eye positions, zero yaw and the 22.5° rake remain as before.
- Static directional vertex shading and original translucent light-halo textures approximate the appearance without per-pixel PBR lighting. Playback transitions tint house materials to the configured level; EXIT and video remain independent. This does not simulate physically accurate light transport or calibrated fabric reflectance.
- Adaptive canvas resolution and the high-performance GPU hint address rendering load without transcoding, stretching or cropping the user's video. UI text remains at browser resolution. See VALIDATION.md for the short local performance sample and its hardware limitations.
