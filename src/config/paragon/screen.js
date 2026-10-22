// User-reported physical dimensions. Position and curvature await evidence.
export const screenDimensions = { width: 26.3, height: 19.8 };
export const physicalAspectRatio = screenDimensions.width / screenDimensions.height;
export const reportedVideoAspectRatio = 1.43;
// User-reported IMAX Commercial Laser capability. Placement/crop are prototype assumptions.
export const projection = {
  system: "IMAX Commercial Laser (CoLa)",
  aspectRatio: 1.90,
  width: 25,
  offset: [0, 0], // Local screen coordinates, meters from its center; +Y points up.
  tallContentMode: "crop",
};
export const activeProjection = {
  width: projection.width,
  height: projection.width / projection.aspectRatio,
};

// User confirmed physical dimensions take precedence; 1.43:1 describes the video.
// Mounting height and curvature are provisional for the prototype.
export const screen = {
  ...screenDimensions,
  position: [0, 10.5, 0],
  rotation: [0, 0, 0],
};
