import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import { lightingTarget, transitionLighting } from "./lighting";
import { Color } from "three";

export function HouseLighting({ config, textures, media, simple, inspection }) {
  const group = useRef(), animated = useRef([]), fixedExits = useRef([]);
  const fixtures = useRef({ strips: 0, sconces: 0 });
  const dirty = useRef(true);
  const { gl, scene } = useThree();
  const e = config.environment, g = config.geometry, light = e.lighting;
  const state = useRef({ start: 1, value: 1, target: 1, elapsed: light.transitionSeconds });
  const target = lightingTarget(media.state.playing, media.state.error, inspection, light.dimLevel);
  const illuminated = useMemo(() => {
    const budget = simple ? light.mobileSconceLights : light.desktopSconceLights;
    const sconces = e.fixtures.filter((fixture) => fixture.sconce);
    return new Set(Array.from({ length: Math.min(budget, sconces.length) }, (_, i) => sconces[Math.floor((i + 0.5) * sconces.length / budget)].id));
  }, [simple, light, e.fixtures]);
  useLayoutEffect(() => {
    const objects = [];
    scene.traverse((object) => {
      if (object.isLight && object.userData.houseBase != null) objects.push({ object, base: object.userData.houseBase, key: "intensity" });
      if (object.isMesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material.userData.houseBase != null) objects.push({ object: material, base: material.userData.houseBase, key: "emissiveIntensity" });
          if (material.userData.houseTint) objects.push({ object: material, base: new Color(material.userData.houseTint), key: "color" });
        }
      }
    });
    animated.current = objects;
    fixedExits.current = [];
    fixtures.current = { strips: 0, sconces: 0 };
    scene.traverse((object) => {
      if (object.name.startsWith("exit-sign-")) fixedExits.current.push(object);
      if (object.isMesh && object.name.startsWith("wall-strip-")) fixtures.current.strips++;
      if (object.isMesh && object.name.startsWith("warm-sconce-")) fixtures.current.sconces++;
    });
    dirty.current = true;
    return () => { delete gl.domElement.dataset.houseLightLevel; delete gl.domElement.dataset.exitSigns; delete gl.domElement.dataset.wallStrips; delete gl.domElement.dataset.warmSconces; };
  }, [config, simple, inspection, scene, gl]);
  useFrame((_, delta) => {
    const next = transitionLighting(state.current, target, delta, light.transitionSeconds);
    const changed = next.value !== state.current.value;
    state.current = next;
    if (!changed && !dirty.current) return;
    dirty.current = false;
    for (const item of animated.current) {
      if (item.key === "color") item.object.color.copy(item.base).multiplyScalar(state.current.value);
      else item.object[item.key] = item.base * state.current.value;
    }
    // Expose rendered light state for browser acceptance checks, without an overlay.
    gl.domElement.dataset.houseLightLevel = state.current.value.toFixed(3);
    gl.domElement.dataset.exitSigns = String(fixedExits.current.filter((mesh) => mesh.material.visible && mesh.material.toneMapped === false).length);
    gl.domElement.dataset.wallStrips = String(fixtures.current.strips);
    gl.domElement.dataset.warmSconces = String(fixtures.current.sconces);
  });
  return <group ref={group} name="house-lighting">
    <ambientLight color="#f4e9df" intensity={light.ambient} userData={{ houseBase: light.ambient }} />
    <hemisphereLight args={["#879fff", "#2a1c15", light.hemisphere]} userData={{ houseBase: light.hemisphere }} />
    <directionalLight position={[0, g.height - 2, g.depth * 0.75]} color="#fff0d7" intensity={light.overhead} userData={{ houseBase: light.overhead }} />
    {!inspection && e.fixtures.map((fixture) => <group key={fixture.id} position={fixture.position} rotation={fixture.rotation}>
      <mesh position={[0, e.strips.bottom + fixture.stripHeight / 2, 0.025]}>
        <planeGeometry args={[e.strips.haloWidth, fixture.stripHeight + 0.25]} />
        <meshBasicMaterial map={textures.stripGlow} color={e.strips.haloColor} userData={{ houseTint: e.strips.haloColor }} transparent opacity={0.65} depthWrite={false} toneMapped={false} />
      </mesh>
      <Box name={`wall-strip-${fixture.id}`} args={[e.strips.width, fixture.stripHeight, 0.025]} position={[0, e.strips.bottom + fixture.stripHeight / 2, 0.045]}>
        <meshBasicMaterial color={e.strips.color} userData={{ houseTint: e.strips.color }} toneMapped={false} />
      </Box>
      {fixture.sconce && <group position={[0.45, 0, 0]}>
      <mesh name={`warm-sconce-${fixture.id}`} position={[0, e.sconces.heightAboveFloor, 0.18]} scale={[0.15, 0.27, 0.12]}>
        <sphereGeometry args={[1, 12, 10]} /><meshBasicMaterial color={e.sconces.color} userData={{ houseTint: e.sconces.color }} />
      </mesh>
      <Box args={[0.12, 0.23, 0.17]} position={[0, e.sconces.heightAboveFloor - 0.27, 0.08]}><meshBasicMaterial color="#725136" userData={{ houseTint: "#725136" }} /></Box>
      <mesh position={[0, e.sconces.heightAboveFloor, 0.12]}>
        <planeGeometry args={[1.7, 1.7]} /><meshBasicMaterial map={textures.glow} color={e.sconces.color} userData={{ houseTint: e.sconces.color }} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      {illuminated.has(fixture.id) && <pointLight position={[0, e.sconces.heightAboveFloor, 0.6]} color={e.sconces.color} intensity={e.sconces.intensity} distance={e.sconces.distance} decay={2} userData={{ houseBase: e.sconces.intensity }} />}
      </group>}
    </group>)}
  </group>;
}
export default function TheaterEnvironment({ config, textures, inspection }) {
  const e = config.environment, g = config.geometry;
  return <>
    {!inspection && <>
      {[-1, 1].map((side) => <group key={side}>
        <Box args={[g.architecture.wallThickness, g.height, g.depth]} position={[side * g.width / 2, g.height / 2, g.depth / 2]}>
          <meshBasicMaterial color={e.materials.wall} map={textures.wall} userData={{ houseTint: e.materials.wall }} />
        </Box>
        <mesh name={`blue-wall-wash-${side}`} position={[side * (g.architecture.innerWallX - 0.005), g.height / 2, g.depth / 2]} rotation={[0, -side * Math.PI / 2, 0]}>
          <planeGeometry args={[g.depth, g.height]} />
          <meshBasicMaterial color={e.wash.wallColor} map={textures.wall} alphaMap={textures.wash} transparent opacity={e.lighting.wallFill} depthWrite={false} userData={{ houseTint: e.wash.wallColor }} toneMapped={false} />
        </mesh>
      </group>)}
      <Box args={[g.width, 0.2, g.depth]} position={[0, g.height, g.depth / 2]}><meshBasicMaterial color={e.materials.ceiling} map={textures.ceiling} userData={{ houseTint: e.materials.ceiling }} /></Box>
      <mesh name="blue-ceiling-wash" position={[0, g.height - 0.105, g.depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[g.width, g.depth]} />
        <meshBasicMaterial color={e.wash.ceilingColor} map={textures.ceiling} alphaMap={textures.wash} transparent opacity={e.lighting.rearWallFill} depthWrite={false} userData={{ houseTint: e.wash.ceilingColor }} toneMapped={false} />
      </mesh>
      <Box args={[g.width, g.height, 0.2]} position={[0, g.height / 2, g.depth]}><meshBasicMaterial color={e.materials.wall} map={textures.wall} userData={{ houseTint: e.materials.wall }} /></Box>
    </>}
    {e.exits.map((exit) => <group key={exit.id} name={`exit-${exit.id}`} position={exit.position} rotation={exit.rotation}>
      <Box args={[exit.width + 0.16, exit.height + 0.08, 0.09]} position={[0, exit.height / 2, 0.02]}><meshBasicMaterial color="#59515a" userData={{ houseTint: "#59515a" }} /></Box>
      <Box args={[exit.width, exit.height, 0.06]} position={[0, exit.height / 2, 0.085]}><meshBasicMaterial color="#141926" userData={{ houseTint: "#141926" }} /></Box>
      <Box args={[0.035, 0.18, 0.06]} position={[exit.width * 0.35, 1, 0.14]}><meshBasicMaterial color="#b5b3a9" userData={{ houseTint: "#b5b3a9" }} /></Box>
      <mesh name={`exit-sign-${exit.id}`} position={[0, exit.height + 0.23, 0.12]}>
        <planeGeometry args={[exit.signWidth, exit.signHeight]} /><meshBasicMaterial map={textures.exit} toneMapped={false} />
      </mesh>
      <mesh position={[0, exit.height + 0.18, 0.115]}>
        <planeGeometry args={[1.3, 0.8]} /><meshBasicMaterial map={textures.glow} color="#43ec83" transparent opacity={Math.min(0.5, exit.lightIntensity / 10)} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>)}
  </>;
}

