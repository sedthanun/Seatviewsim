export const rowOrder = [..."LKJIHGFEDCBA", "VP"];
export const calibrationDefaults = Object.freeze({
  mode: "slope", slope: 22.5, rowPitch: 1.15, rise: 0.4763455967,
  eyeHeight: 1.15, frontDistance: 10, frontElevation: 0.25,
  screenBottom: 0.6, crossAisle: 1.2, vpDistance: 2.8,
  curvature: 0.003, customElevations: null,
});
export const designSource = "https://whc.unesco.org/uploads/nominations/1131.pdf#page=475";
const limits = {
  slope: [1, 40], rowPitch: [0.9, 2.5], rise: [0.05, 1.5],
  eyeHeight: [0.7, 1.6], frontDistance: [5, 25], frontElevation: [0.05, 5],
  screenBottom: [0.05, 8], crossAisle: [0.5, 4], vpDistance: [1.15, 5],
  curvature: [0, 0.006],
};
export function validateCalibration(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["ข้อมูลปรับเทียบไม่ถูกต้อง"];
  if (!["slope", "rise", "custom"].includes(value.mode)) errors.push("โหมดปรับเทียบไม่ถูกต้อง");
  for (const [key, [min, max]] of Object.entries(limits)) {
    const inactive = (key === "slope" && value.mode !== "slope") || (key === "rise" && value.mode !== "rise");
    if (!Number.isFinite(value[key]) || (!inactive && (value[key] < min || value[key] > max)))
      errors.push(`${key} ต้องอยู่ระหว่าง ${min}–${max}`);
  }
  if (value.vpDistance < value.rowPitch) errors.push("ระยะ A–VP ต้องไม่น้อยกว่าระยะแถว");
  if (value.mode === "custom") {
    const levels = value.customElevations;
    if (!Array.isArray(levels) || levels.length !== rowOrder.length ||
      levels.some((y, i) => !Number.isFinite(y) || y <= 0 || y > 30 || (i > 0 && y <= levels[i - 1])))
      errors.push("ระดับพื้นต้องมีครบ 13 แถว มากกว่าศูนย์ และเพิ่มขึ้นไปด้านหลัง");
    else if (levels[0] !== value.frontElevation) errors.push("ระดับแถว L ต้องตรงกับระดับพื้นแถวหน้า");
  }
  return errors;
}
export function normalizeCalibration(value) {
  const errors = validateCalibration(value);
  if (errors.length) throw new Error(errors.join(" · "));
  const run = 11 * value.rowPitch + value.crossAisle + value.vpDistance;
  const slope = value.mode === "custom" ? Math.atan((value.customElevations.at(-1) - value.customElevations[0]) / run) * 180 / Math.PI : value.mode === "rise" ? Math.atan(value.rise / value.rowPitch) * 180 / Math.PI : value.slope;
  return { ...Object.fromEntries(Object.keys(calibrationDefaults).map((key) => [key, value[key]])),
    slope, rise: value.mode === "rise" ? value.rise : Math.tan(slope * Math.PI / 180) * value.rowPitch,
    customElevations: value.mode === "custom" ? [...value.customElevations] : null };
}
export function serializeCalibration(value) {
  return JSON.stringify({ version: 1, auditorium: "paragon-imax", calibration: normalizeCalibration(value) }, null, 2);
}
export function parseCalibration(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || data.auditorium !== "paragon-imax") throw new Error("รองรับ Calibration JSON รุ่น 1 ของพารากอนเท่านั้น");
  return normalizeCalibration(data.calibration);
}
