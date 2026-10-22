import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Color } from "three";
import { chairGeometry } from "./renderGeometry";
const fallbackAppearance = {
  back: { size: [0.65, 0.9, 0.18], offset: [0, 0.72, 0.26] },
  cushion: { size: [0.62, 0.18, 0.65], offset: [0, 0.48, 0] },
  arm: { size: [0.09, 0.15, 0.7], offset: [0.35, 0.65, 0] },
  base: { size: [0.4, 0.06, 0.4], offset: [0, 0.03, 0] },
  stem: { size: [0.12, 0.36, 0.12], offset: [0, 0.24, 0] },
};
function ChairBatch({ seats, appearance, materials, detailed, simple, color, colors }) {
  const colored = useRef(), frame = useRef();
  const geometry = useMemo(() => chairGeometry(appearance, materials, detailed, simple), [appearance, materials, detailed, simple]);
  useEffect(() => () => { geometry.colored.dispose(); geometry.frame.dispose(); }, [geometry]);
  useLayoutEffect(() => {
    const object = new Object3D(), tint = new Color();
    seats.forEach((seat, i) => {
      object.position.set(...seat.position); object.rotation.set(0, seat.orientation, 0); object.updateMatrix();
      colored.current.setMatrixAt(i, object.matrix); frame.current.setMatrixAt(i, object.matrix);
      colored.current.setColorAt(i, tint.set(colors?.[seat.category] ?? color));
    });
    for (const ref of [colored, frame]) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }
    colored.current.instanceColor.needsUpdate = true;
  }, [seats, colors, color]);
  if (!seats.length) return null;
  return <>
    <instancedMesh ref={colored} geometry={geometry.colored} args={[null, null, seats.length]}><meshBasicMaterial vertexColors userData={{ houseTint: "#ffffff" }} /></instancedMesh>
    <instancedMesh ref={frame} geometry={geometry.frame} args={[null, null, seats.length]}><meshBasicMaterial vertexColors userData={{ houseTint: "#ffffff" }} /></instancedMesh>
  </>;
}
export default memo(function SeatInstances({ seats, color, colors, appearance = fallbackAppearance, materials, simple, viewpoint }) {
  const batches = useMemo(() => {
    const near = [], far = [];
    for (const seat of seats) {
      const close = viewpoint && Math.hypot(...seat.position.map((v, i) => v - viewpoint[i])) < 7;
      (close ? near : far).push(seat);
    }
    return { near, far };
  }, [seats, viewpoint]);
  return <>
    {batches.near.length > 0 && <ChairBatch seats={batches.near} {...{color, colors, appearance, materials, simple}} detailed />}
    {batches.far.length > 0 && <ChairBatch seats={batches.far} {...{color, colors, appearance, materials, simple}} detailed={false} />}
  </>;
});
