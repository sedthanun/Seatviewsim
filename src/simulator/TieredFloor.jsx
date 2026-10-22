import { memo, useEffect, useMemo } from "react";
import { floorGeometry, railingGeometry } from "./renderGeometry";
export default memo(function TieredFloor({ geometry: g, texture }) {
  const floor = useMemo(() => floorGeometry(g), [g]);
  const rails = useMemo(() => railingGeometry(g), [g]);
  useEffect(() => () => { floor.dispose(); rails.dispose(); }, [floor, rails]);
  return <>
    <mesh geometry={floor}><meshBasicMaterial color={g.materials?.carpet ?? "#20232c"} map={texture} vertexColors userData={{ houseTint: g.materials?.carpet ?? "#20232c" }} /></mesh>
    <mesh geometry={rails}><meshBasicMaterial color={g.materials?.railing ?? "#566174"} vertexColors userData={{ houseTint: g.materials?.railing ?? "#566174" }} /></mesh>
  </>;
});
