import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, MathUtils } from "three";
import { clamp } from "./math";
import { applySeatTransition, createSeatTransition, SEAT_TRANSITION_SECONDS } from "./cameraTransition";

function finish(camera, state) {
  state.transition = null;
  state.yaw = 0;
  state.pitch = 0;
  state.base.setFromQuaternion(camera.quaternion, "YXZ");
}

// Development diagnostics sample the actual renderer camera for acceptance tests.
function publish(canvas, camera, state) {
  if (import.meta.env.DEV) canvas.dataset.seatCamera = JSON.stringify({
    seatId: state.seatId,
    position: camera.position.toArray(),
    quaternion: camera.quaternion.toArray(),
    transitioning: Boolean(state.transition),
  });
}

export default function SeatedCamera({ seat, settings, reset }) {
  const { camera, gl, invalidate } = useThree();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const controls = useRef({
    initialized: false, yaw: 0, pitch: 0, last: null, transition: null,
    base: new Euler(0, 0, 0, "YXZ"), reducedMotion: false, seatId: null,
  });

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      const state = controls.current;
      state.reducedMotion = media.matches;
      if (media.matches && state.transition) {
        applySeatTransition(camera, state.transition, SEAT_TRANSITION_SECONDS);
        finish(camera, state);
        invalidate();
        publish(gl.domElement, camera, state);
      }
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [camera, gl, invalidate]);

  useEffect(() => {
    const state = controls.current;
    state.seatId = seat.id;
    state.last = null;
    state.yaw = 0;
    state.pitch = 0;
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
    const transition = createSeatTransition(camera, seat, settings);
    const alreadyThere = camera.position.distanceTo(transition.toPosition) < 1e-8 && camera.quaternion.angleTo(transition.toQuaternion) < 1e-6;
    if (!state.initialized || state.reducedMotion || alreadyThere) {
      applySeatTransition(camera, transition, SEAT_TRANSITION_SECONDS);
      finish(camera, state);
    } else state.transition = { ...transition, startedAt: performance.now() };
    state.initialized = true;
    invalidate();
    publish(gl.domElement, camera, state);
  }, [camera, gl, invalidate, seat, settings]);

  // Reset the direction only; never restart or snap an in-flight seat movement.
  useEffect(() => {
    const state = controls.current;
    state.yaw = 0;
    state.pitch = 0;
    if (!state.transition) {
      camera.lookAt(...settingsRef.current.target);
      state.base.setFromQuaternion(camera.quaternion, "YXZ");
      invalidate();
      publish(gl.domElement, camera, state);
    }
  }, [camera, gl, invalidate, reset]);

  useFrame(() => {
    const state = controls.current;
    if (!state.transition) return;
    const elapsed = (performance.now() - state.transition.startedAt) / 1000;
    if (applySeatTransition(camera, state.transition, elapsed)) finish(camera, state);
    invalidate();
    publish(gl.domElement, camera, state);
  });

  useEffect(() => {
    const state = controls.current;
    const canvas = gl.domElement;
    function applyLook() {
      const current = settingsRef.current;
      state.yaw = clamp(state.yaw, -current.yawLimit, current.yawLimit);
      state.pitch = clamp(state.pitch, -current.pitchLimit, current.pitchLimit);
      camera.rotation.set(
        clamp(state.base.x + MathUtils.degToRad(state.pitch), -Math.PI / 2 + .01, Math.PI / 2 - .01),
        state.base.y + MathUtils.degToRad(state.yaw), 0, "YXZ",
      );
      invalidate();
      publish(canvas, camera, state);
    }
    function down(event) {
      if (event.button !== 0) return;
      canvas.focus();
      if (state.transition) return;
      state.last = [event.clientX, event.clientY];
      canvas.setPointerCapture(event.pointerId);
    }
    function move(event) {
      if (!state.last || state.transition) return;
      state.yaw -= (event.clientX - state.last[0]) * .15;
      state.pitch -= (event.clientY - state.last[1]) * .15;
      state.last = [event.clientX, event.clientY];
      applyLook();
    }
    function up() { state.last = null; }
    function key(event) {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      if (state.transition) return;
      state.yaw += event.key === "ArrowLeft" ? 3 : event.key === "ArrowRight" ? -3 : 0;
      state.pitch += event.key === "ArrowUp" ? 3 : event.key === "ArrowDown" ? -3 : 0;
      applyLook();
    }
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "มุมมองโรงภาพยนตร์ ลากหรือใช้ปุ่มลูกศรเพื่อมองรอบตัว");
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("keydown", key);
      state.last = null;
      state.transition = null;
      state.initialized = false;
      delete canvas.dataset.seatCamera;
    };
  }, [camera, gl, invalidate]);
  return null;
}
