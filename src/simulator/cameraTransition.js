import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { eyePosition } from "./math";

export const SEAT_TRANSITION_SECONDS = 1;

export function createSeatTransition(camera, seat, settings) {
  const toPosition = new Vector3(...eyePosition(seat, settings.eyeHeight));
  const toQuaternion = new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(toPosition, new Vector3(...settings.target), camera.up),
  );
  return { fromPosition: camera.position.clone(), fromQuaternion: camera.quaternion.clone(), toPosition, toQuaternion };
}

export function applySeatTransition(camera, transition, elapsed) {
  const progress = MathUtils.smoothstep(elapsed, 0, SEAT_TRANSITION_SECONDS);
  camera.position.lerpVectors(transition.fromPosition, transition.toPosition, progress);
  camera.quaternion.slerpQuaternions(transition.fromQuaternion, transition.toQuaternion, progress);
  return elapsed >= SEAT_TRANSITION_SECONDS;
}
