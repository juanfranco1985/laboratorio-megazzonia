export const touchState = { left: false, right: false, jump: false, power: false, switch: false, pause: false };

export function bindTouchControls() {
  document.querySelectorAll("[data-control]").forEach((button) => {
    const key = button.dataset.control;
    const set = (value) => { touchState[key] = value; };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      set(true);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => button.addEventListener(name, () => set(false)));
  });
}

export function firstGamepad() {
  return [...(navigator.getGamepads?.() || [])].find(Boolean) || null;
}
