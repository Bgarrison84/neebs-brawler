import { Game }         from './game.js';
import { InputManager } from './input.js';

const canvas = document.getElementById('game-canvas');
const input  = new InputManager();
const game   = new Game(canvas);

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = now;

  game.update(input, dt);
  game.draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
