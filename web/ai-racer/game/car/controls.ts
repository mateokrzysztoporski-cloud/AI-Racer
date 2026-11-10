// Controls: keyboard. Arrows and WASD drive, other keys (Space, M) go to the game.

// what the car is told to do, the AI will give the same two numbers later
export type Controls = {
  gas: number; // 1 = gas, -1 = brake / reverse, 0 = nothing
  steer: number; // -1 = left, 1 = right, 0 = straight
};

export type Keyboard = {
  read: () => Controls;
  stop: () => void;
};

// Keyboard

const GAS_KEYS = ["ArrowUp", "KeyW"];
const BRAKE_KEYS = ["ArrowDown", "KeyS"];
const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];

export function listenToKeyboard(onPress: (key: string) => void): Keyboard {
  const pressed = new Set<string>(); // keys held down right now

   function onKeyDown(event: KeyboardEvent) {
    if (event.code === "Space" || event.code.startsWith("Arrow")) event.preventDefault(); // no page scrolling
    if (!event.repeat) onPress(event.code); // a single press, e.g. Space or M
    pressed.add(event.code);
  }

  function onKeyUp(event: KeyboardEvent) {
    pressed.delete(event.code);
  }

  // let go of everything when the window loses focus
  function onBlur() {
    pressed.clear();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  const isDown = (keys: string[]) => keys.some((key) => pressed.has(key));

  return {
    read: () => ({
      gas: (isDown(GAS_KEYS) ? 1 : 0) - (isDown(BRAKE_KEYS) ? 1 : 0),
      steer: (isDown(RIGHT_KEYS) ? 1 : 0) - (isDown(LEFT_KEYS) ? 1 : 0),
    }),
    // stop when the page closes
    stop: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      pressed.clear();
    },
  };
}