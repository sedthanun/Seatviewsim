import { expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { applySeatTransition, createSeatTransition } from "../src/simulator/cameraTransition";
import { eyePosition } from "../src/simulator/math";

const settings = { eyeHeight: 1.15, target: [0, 5, 0] };
const seat = { position: [4, 2, 15], orientation: .2, eyeOffset: [.1, 1.15, 0] };
function setup() {
  const camera = new PerspectiveCamera();
  camera.position.set(-3, 1, 8);
  camera.lookAt(5, 2, 4);
  return { camera, transition: createSeatTransition(camera, seat, settings) };
}
it("starts at the actual current pose without mutating it when choosing a target", () => {
  const { camera, transition } = setup();
  const before = camera.position.clone(), quaternion = camera.quaternion.clone();
  expect(applySeatTransition(camera, transition, 0)).toBe(false);
  expect(camera.position.distanceTo(before)).toBe(0);
  expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(1e-7);
});
it("interpolates both position and rotation, easing at the start and end", () => {
  const { camera, transition } = setup();
  const distance = transition.fromPosition.distanceTo(transition.toPosition);
  applySeatTransition(camera, transition, .1);
  expect(camera.position.distanceTo(transition.fromPosition) / distance).toBeLessThan(.1);
  applySeatTransition(camera, transition, .5);
  expect(camera.position.distanceTo(transition.fromPosition) / distance).toBeCloseTo(.5);
  expect(camera.quaternion.angleTo(transition.toQuaternion)).toBeGreaterThan(0);
  applySeatTransition(camera, transition, .9);
  expect(camera.position.distanceTo(transition.toPosition) / distance).toBeLessThan(.1);
});
it("finishes at the seat eye position facing the screen after one second", () => {
  const { camera, transition } = setup();
  expect(applySeatTransition(camera, transition, 1)).toBe(true);
  expect(camera.position.toArray()).toEqual(eyePosition(seat, settings.eyeHeight));
  const direction = new Vector3(...settings.target).sub(camera.position).normalize();
  expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-7);
  expect(applySeatTransition(camera, transition, 4)).toBe(true);
  expect(camera.position.toArray()).toEqual(eyePosition(seat, settings.eyeHeight));
});
it("retargets from an in-flight pose without snapping back to the previous seat", () => {
  const { camera, transition } = setup();
  applySeatTransition(camera, transition, .4);
  const pose = camera.position.clone(), quaternion = camera.quaternion.clone();
  const next = createSeatTransition(camera, { ...seat, position: [-8, 4, 20] }, settings);
  applySeatTransition(camera, next, 0);
  expect(camera.position.distanceTo(pose)).toBe(0);
  expect(camera.quaternion.angleTo(quaternion)).toBeLessThan(1e-7);
  applySeatTransition(camera, next, 1);
  expect(camera.position.distanceTo(next.toPosition)).toBeLessThan(1e-7);
});
