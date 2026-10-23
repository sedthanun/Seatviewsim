import { publicPath } from "../utils/publicPath";

// Display assets are separate from auditorium geometry and readiness.
export const homeBackdrop = {
  desktop: publicPath("/images/paragon-home-desktop.webp"),
  mobile: publicPath("/images/paragon-home-mobile.webp"),
};
export const cinemaPresentation = {
  paragon: {
    thumbnail: publicPath("/images/branches/paragon.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX พารากอน ซีนีเพล็กซ์",
  },
  ratchayothin: {
    thumbnail: publicPath("/images/branches/ratchayothin.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เมเจอร์ รัชโยธิน",
  },
  "esplanade-khae-rai": {
    thumbnail: publicPath("/images/branches/esplanade-khaerai.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เอสพลานาด งามวงศ์วาน–แคราย",
  },
  "icon-cineconic": {
    thumbnail: publicPath("/images/branches/icon-cineconic.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX ไอคอน ซีเนคอนิค",
  },
  quartier: {
    thumbnail: publicPath("/images/branches/quartier.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX ควอเทียร์ ซีนีอาร์ต",
  },
  westgate: {
    thumbnail: publicPath("/images/branches/westgate.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เวสต์เกต ซีนีเพล็กซ์",
  },
  "mega-bangna": {
    thumbnail: publicPath("/images/branches/mega-cineplex.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เมกา ซีนีเพล็กซ์",
  },
  bangkapi: {
    thumbnail: publicPath("/images/branches/bangkapi.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX บางกะปิ ซีนีเพล็กซ์",
  },
  "central-pinklao": {
    thumbnail: publicPath("/images/branches/pinklao.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เมเจอร์ เซ็นทรัล ปิ่นเกล้า",
  },
  "central-chiangmai": {
    thumbnail: publicPath("/images/branches/chiangmai.jpg"),
    alt: "ภาพโรงภาพยนตร์ IMAX เมเจอร์ เซ็นทรัลเฟสติวัล เชียงใหม่",
  },
};
