import { Application } from 'pixi.js';
import { Game } from '@game/Game';
import { SceneRenderer } from '@render/Renderer';
import { UIManager } from '@ui/UIManager';

// 固定竖屏尺寸 720×1440 (1:2 比例)
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1440;

(async () => {
  const app = new Application();

  await app.init({
    background: 0x1a1a2e,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas as HTMLCanvasElement);

  // 竖屏比例缩放，居中显示
  const fitCanvas = () => {
    const canvas = app.canvas as HTMLCanvasElement;
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(window.innerWidth - GAME_WIDTH * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - GAME_HEIGHT * scale) / 2}px`;
  };
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  const game = new Game(GAME_WIDTH, GAME_HEIGHT);
  const renderer = new SceneRenderer(app, GAME_WIDTH, GAME_HEIGHT);
  const ui = new UIManager(app, GAME_WIDTH, GAME_HEIGHT);

  // 开始游戏
  game.start();

  // 主循环
  let lastTime = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(now - lastTime, 50); // cap at 50ms
    lastTime = now;
    game.update(dt);
    renderer.update(game, dt);
    ui.update(game);
  });
})();
