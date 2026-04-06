import { Game }             from './game.js';
import { InputManager }     from './input.js';
import { CharSelectScreen } from './charselect.js';

const canvas = document.getElementById('game-canvas');
const input  = new InputManager();

let charSelect = new CharSelectScreen(canvas);
let game       = null;

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (game) {
    // ── Gameplay ──
    game.update(input, dt);
    game.draw();
  } else {
    // ── Character select ──
    charSelect.update(input);
    charSelect.draw();

    if (charSelect.isDone) {
      game = new Game(canvas, charSelect.selectedChar);
    }
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
