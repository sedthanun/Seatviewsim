import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import { VideoTexture, SRGBColorSpace } from "three";
import { projectVideo, projectionBounds } from "./math";
import { applyVideoProjection } from "./videoTexture";
import TieredFloor from "./TieredFloor";
import SeatInstances from "./SeatInstances";
import TheaterEnvironment, { HouseLighting } from "./TheaterEnvironment";
import { useProceduralTextures } from "./proceduralTextures";
import RenderBudget from "./RenderBudget";
function VideoScreen({ screen, projection, media }) {
  const image = useRef();
  const { gl, invalidate } = useThree();
  const texture = useMemo(() => {
    const texture = new VideoTexture(media.video);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [media.video, media.source]);
  useEffect(() => () => texture.dispose(), [texture]);
  const frame = useMemo(() => projectionBounds(screen, projection), [screen, projection]);
  const layout = useMemo(() => projectVideo(screen, projection, media.state.width, media.state.height),
    [screen, projection, media.state.width, media.state.height]);
  useLayoutEffect(() => {
    applyVideoProjection(texture, layout);
    // Acceptance checks read the mesh/texture actually committed by the renderer.
    const mesh = image.current;
    gl.domElement.dataset.screenProjection = JSON.stringify({
      frame,
      image: mesh ? {
        size: [mesh.geometry.parameters.width, mesh.geometry.parameters.height],
        position: mesh.position.toArray(),
        uv: { repeat: texture.repeat.toArray(), offset: texture.offset.toArray() },
        flipY: texture.flipY,
      } : null,
    });
    invalidate();
    return () => { delete gl.domElement.dataset.screenProjection; };
  }, [frame, layout, texture, gl, invalidate]);
  return <group position={screen.position} rotation={screen.rotation}>
    <Box args={[screen.width + 0.3, screen.height + 0.3, 0.15]}><meshBasicMaterial color="#050608" /></Box>
    {layout && <mesh ref={image} name="projected-video" position={[...layout.position, 0.09]}><planeGeometry args={layout.size} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>}
  </group>;
}
function Auditorium({ config, media, simple, inspection = false, viewpoint, onQualityChange }) {
  const g = config.geometry;
  const textures = useProceduralTextures(Boolean(config.environment));
  return <>
    <RenderBudget onQualityChange={onQualityChange} />
    <color attach="background" args={["#05070b"]} />
    {config.environment ? <HouseLighting config={config} textures={textures} media={media} simple={simple} inspection={inspection} /> : <>
      <ambientLight intensity={inspection ? 1.1 : 0.28} />
      <hemisphereLight args={["#9bb5dd", "#08080b", inspection ? 0.9 : 0.35]} />
    </>}
    <pointLight position={[0, config.screen.position[1], 2]} intensity={simple ? 70 : 120} distance={32} color="#a6caff" />
    <Box args={[g.width, 0.2, g.depth]} position={[0, -0.1, g.depth / 2]}><meshBasicMaterial color={config.environment?.materials.carpet ?? "#15171c"} map={textures?.carpet} userData={{ houseTint: config.environment?.materials.carpet ?? "#15171c" }} /></Box>
    {g.platforms ? <TieredFloor geometry={g} texture={textures?.carpet} /> : g.rows.map((row, i) => <Box key={i}
      args={[g.width, Math.max(0.08, row.elevation), row.depth]}
      position={[0, row.elevation / 2 - (row.elevation === 0 ? 0.04 : 0), row.z]}>
      <meshLambertMaterial color="#191c22" />
    </Box>)}
    {config.environment ? <TheaterEnvironment config={config} textures={textures} inspection={inspection} /> : !inspection && <>
      {[-1, 1].map((side) => <group key={side}>
        <Box args={[0.2, g.height, g.depth]} position={[side * g.width / 2, g.height / 2, g.depth / 2]}><meshLambertMaterial color="#202530" /></Box>
        {g.rows.map((row, i) => <Box key={i} args={[0.06, 0.035, 1]} position={[side * (g.width / 2 - 0.15), row.elevation + 0.1, row.z]}>
          <meshBasicMaterial color="#718bb6" />
        </Box>)}
      </group>)}
      <Box args={[g.width, 0.2, g.depth]} position={[0, g.height, g.depth / 2]}><meshLambertMaterial color="#101218" /></Box>
      <Box args={[g.width, g.height, 0.2]} position={[0, g.height / 2, g.depth]}><meshLambertMaterial color="#171b22" /></Box>
    </>}
    <SeatInstances seats={config.seats} color={g.seatColor} colors={g.seatColors} appearance={g.seatAppearance} materials={config.environment?.materials} simple={simple} viewpoint={viewpoint} />
    <VideoScreen screen={config.screen} projection={config.projection} media={media} />
  </>;
}
// Timeline/volume updates belong to the HTML controls, not the static auditorium.
export default memo(Auditorium, (a, b) => a.config === b.config && a.simple === b.simple && a.inspection === b.inspection && a.viewpoint === b.viewpoint && a.onQualityChange === b.onQualityChange &&
  a.media.video === b.media.video && a.media.source === b.media.source &&
  a.media.state.width === b.media.state.width && a.media.state.height === b.media.state.height &&
  a.media.state.playing === b.media.state.playing && a.media.state.error === b.media.state.error);

