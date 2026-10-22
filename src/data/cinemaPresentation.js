import { publicPath } from "../utils/publicPath";

// Display assets are separate from auditorium geometry and readiness.
export const homeBackdrop = {
  desktop: publicPath("/images/paragon-home-desktop.webp"),
  mobile: publicPath("/images/paragon-home-mobile.webp"),
};
export const cinemaPresentation = {
  paragon: {
    thumbnail: publicPath("/images/paragon-thumbnail.webp"),
    alt: "ภาพจากโรง Paragon จำลอง",
  },
};
