import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("public/images", { recursive: true });
const svg = (body, w = 1600, h = 850) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
let room = `<defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#101927"/><stop offset="1" stop-color="#060a12"/></linearGradient><linearGradient id="screen" x2=".9" y2="1"><stop stop-color="#8ca8c8"/><stop offset=".4" stop-color="#496582"/><stop offset="1" stop-color="#202f46"/></linearGradient><radialGradient id="glow"><stop stop-color="#7199cb" stop-opacity=".26"/><stop offset="1" stop-color="#456891" stop-opacity="0"/></radialGradient><linearGradient id="seat" x2=".2" y2="1"><stop stop-color="#263348"/><stop offset=".3" stop-color="#151f31"/><stop offset="1" stop-color="#080e1a"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="1600" height="850" fill="#070b13"/><path d="M0 0H1600L1350 530H430Z" fill="url(#wall)"/><path d="M430 110L1350 75V505L430 520Z" fill="#0c1420"/><path d="M515 175L1335 130V476L515 492Z" fill="#98b4d5" opacity=".18" filter="url(#blur)"/><path d="M532 187L1327 145V461L532 484Z" fill="url(#screen)"/><path d="M532 187L1327 145" stroke="#94b1d2" opacity=".5"/><ellipse cx="1000" cy="410" rx="680" ry="400" fill="url(#glow)"/>`;
for (let i = 0; i < 9; i++)
  room += `<path d="M${100 + i * 170} 0L${550 + i * 88} 115" stroke="#2b3748" stroke-width="2" opacity=".4"/>`;
for (let i = 0; i < 6; i++)
  room += `<path d="M${1350 + i * 42} ${40 - i * 8}V${540 + i * 38}" stroke="#364459" stroke-width="3" opacity=".5"/>`;
for (let r = 0; r < 7; r++) {
  const y = 488 + r * 43,
    sw = 43 + r * 9,
    sh = 44 + r * 9;
  room += `<path d="M0 ${y + sh}Q850 ${y + sh - 50} 1600 ${y + sh}" fill="none" stroke="#101b2b" stroke-width="6"/>`;
  for (let c = -3; c < 33; c++) {
    const x = c * (sw + 9) - r * 39 + (c > 17 ? 28 + r * 10 : 0),
      curve = ((x - 880) / 880) ** 2 * 30;
    room += `<g transform="translate(${x} ${y + curve})"><rect x="-4" y="${sh * 0.55}" width="${sw + 8}" height="${sh * 0.45}" rx="5" fill="#09101c"/><rect width="${sw}" height="${sh}" rx="${8 + r}" fill="url(#seat)" stroke="#46556f" stroke-opacity="${0.2 + r * 0.035}" stroke-width="1.2"/><path d="M5 10Q${sw / 2} 2 ${sw - 5} 10" fill="none" stroke="#7287a7" opacity=".18"/></g>`;
  }
}
writeFileSync("public/images/auditorium.svg", svg(room));
const palettes = {
  paragon: ["#243c5a", "#bdd3ec", "PARAGON"],
  ratchayothin: ["#304259", "#d5e0eb", "MAJOR"],
  esplanade: ["#584130", "#e4c6a0", "ESPLANADE"],
  icon: ["#554632", "#d7bd81", "ICON CINECONIC"],
};
for (const [id, [base, light, title]] of Object.entries(palettes)) {
  let art = `<defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="#0c1018"/></linearGradient><linearGradient id="glass"><stop stop-color="#152538"/><stop offset=".5" stop-color="#253d51"/><stop offset="1" stop-color="#101922"/></linearGradient></defs><rect width="700" height="440" fill="url(#bg)"/><path d="M0 0H700L590 110H80Z" fill="#0b111c"/><path d="M0 440L90 305H620L700 440Z" fill="#19202b"/><path d="M0 60L95 100V320L0 440Z" fill="#141b25"/><path d="M700 40L610 100V310L700 440Z" fill="#10151e"/><rect x="95" y="100" width="515" height="220" fill="#080e17"/><text x="350" y="166" fill="${light}" font-family="Arial,sans-serif" font-size="${id === "icon" ? 29 : 35}" letter-spacing="8" text-anchor="middle">${title}</text><path d="M110 184H593" stroke="${light}" opacity=".6"/>`;
  for (let c = 0; c < 6; c++)
    art += `<rect x="${112 + c * 80}" y="208" width="65" height="110" fill="url(#glass)" stroke="#667385" stroke-opacity=".35"/><path d="M${119 + c * 80} 220V303" stroke="${light}" stroke-opacity=".18"/>`;
  for (let i = 0; i < 5; i++)
    art += `<path d="M${20 + i * 35} ${15 + i * 18}H${680 - i * 32}" stroke="${light}" stroke-width="2" opacity="${0.12 + i * 0.08}"/><path d="M${50 + i * 90} 440L${160 + i * 62} 325" stroke="${light}" opacity=".09"/>`;
  art += `<rect x="25" y="178" width="42" height="125" rx="2" fill="${base}" stroke="${light}" stroke-opacity=".3"/><rect x="635" y="178" width="42" height="125" rx="2" fill="${base}" stroke="${light}" stroke-opacity=".3"/><path d="M0 440H700" stroke="${light}" opacity=".3"/>`;
  writeFileSync(`public/images/${id}.svg`, svg(art, 700, 440));
}
