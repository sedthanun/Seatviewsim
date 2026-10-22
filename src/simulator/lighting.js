export const lightingTarget = (playing, error, inspection, dimLevel = 0.2) => playing && !error && !inspection ? dimLevel : 1;
export function transitionLighting(state, target, delta, duration = 1.2) {
  const changed = target !== state.target;
  const elapsed = Math.min(duration, (changed ? 0 : state.elapsed) + Math.max(0, delta));
  const start = changed ? state.value : state.start;
  const t = duration > 0 ? elapsed / duration : 1;
  const eased = t * t * (3 - 2 * t);
  return { start, target, elapsed, value: start + (target - start) * eased };
}
