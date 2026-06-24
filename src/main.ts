import { Application } from 'pixi.js';
import { Game } from '@game/Game';
import { SceneRenderer } from '@render/Renderer';
import { UIManager } from '@ui/UIManager';

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas as HTMLCanvasElement);

  // 固定游戏逻辑宽度 390px，高度自适应
  const gameWidth = 390;
  const gameHeight = (window.innerHeight / window.innerWidth) * gameWidth;

  const ui = new UIManager(app, gameWidth, gameHeight);
  const renderer = new SceneRenderer(app, gameWidth, gameHeight);
  const game = new Game(gameWidth, gameHeight);

  // 主循环
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime * (1000 / 60); // 标准化为 ms
    game.update(dt);
    renderer.update(game, dt);
    ui.update(game);
  });
})();
