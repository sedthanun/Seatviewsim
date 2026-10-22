import { paragonPrototype } from "../config/paragon";
// Official directory snapshot; never fetched by visitors' browsers.
export const directorySource = "https://www.majorcineplex.com/cinema/";
export const verifiedAt = "2026-10-10";
const branch = (
  id,
  nameTh,
  name,
  location,
  source,
  status = "coming-soon",
) => ({
  id,
  nameTh,
  name,
  brand: "Major Cineplex Group",
  location,
  status,
  image: null,
  features: ["IMAX"],
  referenceStatus: "missing",
  auditoriums: [{ id: "imax", name: "IMAX", config: null }],
  source: source || directorySource,
  directorySource,
  verifiedAt,
});
export const branches = [
  {
    ...branch(
      "paragon",
      "พารากอน ซีนีเพล็กซ์",
      "Paragon Cineplex",
      "Siam Paragon, Bangkok",
      "https://www.majorcineplex.com/cinema/imax-paragon/",
      "available",
    ),
    auditoriums: [
      {
        id: "imax",
        name: "IMAX",
        config: paragonPrototype,
        videoSrc: "/media/Infinite%20Worlds.mp4",
      },
    ],
  },
  branch(
    "ratchayothin",
    "เมเจอร์ รัชโยธิน",
    "Major Ratchayothin",
    "Bangkok",
    "https://www.majorcineplex.com/cinema/imax-ratchayothin/",
  ),
  branch(
    "esplanade-khae-rai",
    "เอสพลานาด ซีนีเพล็กซ์ งามวงศ์วาน–แคราย",
    "Esplanade Cineplex Ngamwongwan–Khae Rai",
    "Nonthaburi",
    "https://www.majorcineplex.com/cinema/esplanade-ngamwongwan-khae-rai/",
  ),
  branch(
    "icon-cineconic",
    "ไอคอน ซีเนคอนิค — ICONSIAM",
    "ICON CINECONIC",
    "ICONSIAM, Bangkok",
    "https://www.majorcineplex.com/cinema/ICON-CINECONIC/",
  ),
  branch(
    "quartier",
    "ควอเทียร์ ซีเนอาร์ต",
    "Quartier CineArt",
    "EmQuartier, Bangkok",
  ),
  branch(
    "westgate",
    "เวสต์เกต ซีนีเพล็กซ์",
    "Westgate Cineplex",
    "Central Westgate, Nonthaburi",
  ),
  branch(
    "mega-bangna",
    "เมกา ซีนีเพล็กซ์ — เมกาบางนา",
    "Mega Cineplex",
    "Mega Bangna, Samut Prakan",
  ),
  branch(
    "bangkapi",
    "บางกะปิ ซีนีเพล็กซ์",
    "Bangkapi Cineplex",
    "The Mall Lifestore Bangkapi, Bangkok",
  ),
  branch(
    "central-pinklao",
    "เมเจอร์ เซ็นทรัล ปิ่นเกล้า",
    "Major Central Pinklao",
    "Central Pinklao, Bangkok",
  ),
  branch(
    "central-chiangmai",
    "เมเจอร์ เซ็นทรัลเฟสติวัล เชียงใหม่",
    "Major Central Festival Chiang Mai",
    "Chiang Mai",
  ),
  {
    ...branch("rangsit", "เมเจอร์ รังสิต", "Major Rangsit", "รังสิต"),
    features: [],
    auditoriums: [],
    verifiedAt: null,
  },
];
export function canSimulate(branch, auditorium) {
  return (
    branch?.status === "available" &&
    ["reviewed", "prototype"].includes(auditorium?.config?.referenceStatus) &&
    Boolean(auditorium.config.seats?.length)
  );
}
