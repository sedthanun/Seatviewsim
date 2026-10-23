
// Directory metadata only. Cinema source documents are loaded by cinemaRegistry.
export const directorySource = "https://www.majorcineplex.com/cinema/";
export const verifiedAt = "2026-10-10";

const branch = (id, nameTh, name, location, source, status = "coming-soon") => ({
  id,
  nameTh,
  name,
  brand: "Major Cineplex Group",
  location,
  status,
  image: null,
  features: ["IMAX"],
  referenceStatus: "missing",
  auditoriums: [{ id: "imax", name: "IMAX" }],
  source: source || directorySource,
  directorySource,
  verifiedAt,
});

export const branches = [
  {
    ...branch("paragon", "พารากอน ซีนีเพล็กซ์", "Paragon Cineplex", "Siam Paragon, Bangkok", "https://www.majorcineplex.com/cinema/imax-paragon/", "available"),
    referenceStatus: "prototype",
    auditoriums: [{ id: "imax", name: "Paragon Cineplex · IMAX Laser — Prototype" }],
  },
  branch("ratchayothin", "เมเจอร์ รัชโยธิน", "Major Ratchayothin", "Bangkok", "https://www.majorcineplex.com/cinema/imax-ratchayothin/"),
  branch("esplanade-khae-rai", "เอสพลานาด ซีนีเพล็กซ์ งามวงศ์วาน–แคราย", "Esplanade Cineplex Ngamwongwan–Khae Rai", "Nonthaburi", "https://www.majorcineplex.com/cinema/esplanade-ngamwongwan-khae-rai/"),
  branch("icon-cineconic", "ไอคอน ซีเนคอนิค — ICONSIAM", "ICON CINECONIC", "ICONSIAM, Bangkok", "https://www.majorcineplex.com/cinema/ICON-CINECONIC/"),
  branch("quartier", "ควอเทียร์ ซีนีอาร์ต", "Quartier CineArt", "EmQuartier, Bangkok"),
  branch("westgate", "เวสต์เกต ซีนีเพล็กซ์", "Westgate Cineplex", "Central Westgate, Nonthaburi"),
  branch("mega-bangna", "เมกา ซีนีเพล็กซ์ — เมกาบางนา", "Mega Cineplex", "Mega Bangna, Samut Prakan"),
  branch("bangkapi", "บางกะปิ ซีนีเพล็กซ์", "Bangkapi Cineplex", "The Mall Lifestore Bangkapi, Bangkok"),
  branch("central-pinklao", "เมเจอร์ เซ็นทรัล ปิ่นเกล้า", "Major Central Pinklao", "Central Pinklao, Bangkok"),
  branch("central-chiangmai", "เมเจอร์ เซ็นทรัลเฟสติวัล เชียงใหม่", "Major Central Festival Chiang Mai", "Chiang Mai"),
  { ...branch("rangsit", "เมเจอร์ รังสิต", "Major Rangsit", "รังสิต"), features: [], auditoriums: [], verifiedAt: null },
];

export function canSimulate(branch, auditorium) {
  const config = auditorium?.config ?? auditorium;
  return branch?.status === "available" &&
    ["reviewed", "prototype"].includes(config?.referenceStatus ?? auditorium?.referenceStatus) &&
    Boolean(config?.seats?.length);
}
