import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Game } from '../game';

/** 场景渲染器 — 720×1440 固定坐标 */
export class SceneRenderer {
  private gameContainer: Container;

  constructor(_app: Application, gameWidth: number, gameHeight: number) {
    this.gameContainer = new Container();
    _app.stage.addChild(this.gameContainer);

    // 场景边界框
    const border = new Graphics();
    border.rect(0, 0, gameWidth, gameHeight).stroke({ width: 2, color: 0x333355 });
    this.gameContainer.addChild(border);

    // 留空给每帧绘制的元素
  }

  update(game: Game, _dt: number): void {
    // 清空容器，每帧重绘
    while (this.gameContainer.children.length > 1) {
      this.gameContainer.removeChildAt(this.gameContainer.children.length - 1);
    }

    this.drawBackground(game);
    this.drawEnemies(game);
    this.drawProjectiles(game);
    this.drawUnits(game);
  }

  private drawBackground(game: Game): void {
    const g = new Graphics();
    const w = 720;
    const h = 1440;

    // 深色背景
    g.rect(0, 0, w, h).fill({ color: 0x0d0d1a });

    // 滚动网格
    const gridSize = 60;
    const offset = game.scrollOffset % gridSize;
    g.setStrokeStyle({ width: 1, color: 0x1a1a33, alpha: 0.4 });
    for (let y = -gridSize + offset; y < h + gridSize; y += gridSize) {
      g.moveTo(0, y);
      g.lineTo(w, y);
    }
    g.stroke();

    this.gameContainer.addChild(g);
  }

  private drawEnemies(game: Game): void {
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      if (enemy.y < -60 || enemy.y > 1500) continue;

      const g = new Graphics();
      const size = enemy.isRanged ? 16 : 22;

      // 身体
      g.circle(0, 0, size)
        .fill({ color: enemy.isRanged ? 0xdd3333 : 0xcc4444 })
        .circle(0, 0, size)
        .stroke({ width: 2, color: 0x882222 });

      // 冻结效果
      if ((enemy as any).freezeTimer > 0) {
        g.circle(0, 0, size + 6)
          .fill({ color: 0x66aaff, alpha: 0.25 });
      }

      // HP 条
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      const barW = size * 2.5;
      g.rect(-barW / 2, -size - 10, barW * pct, 4)
        .fill({ color: pct > 0.5 ? 0x33dd33 : pct > 0.25 ? 0xddaa00 : 0xdd3333 });

      g.x = enemy.x;
      g.y = enemy.y;
      this.gameContainer.addChild(g);
    }
  }

  private drawUnits(game: Game): void {
    const colors: Record<string, number> = {
      hero: 0x44ccff,
      swordsman: 0xff8844,
      storm_mage: 0xaa44ff,
      wind_shaman: 0x44ffaa,
      prism_archer: 0xdddd44,
      frost_mage: 0x88ddff,
      archer: 0x66ff66,
    };
    const labels: Record<string, string> = {
      hero: '主',
      swordsman: '剑',
      storm_mage: '雷',
      wind_shaman: '风',
      prism_archer: '光',
      frost_mage: '冰',
      archer: '弓',
    };

    for (const unit of game.playerUnits) {
      if (!unit.alive) continue;

      const g = new Graphics();
      const color = colors[unit.type] ?? 0xffffff;
      const size = 20;

      // 光晕
      g.circle(0, 0, size + 8).fill({ color, alpha: 0.1 });
      // 身体
      g.circle(0, 0, size).fill({ color }).circle(0, 0, size).stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

      // HP 条
      const pct = Math.max(0, unit.hp / unit.stats.hp);
      const barW = size * 2.5;
      g.rect(-barW / 2, -size - 12, barW * pct, 4)
        .fill({ color: pct > 0.5 ? 0x33dd33 : pct > 0.25 ? 0xddaa00 : 0xdd3333 });

      // 范围指示（极淡）
      g.circle(0, 0, unit.range).fill({ color, alpha: 0.03 });

      g.x = unit.x;
      g.y = unit.y;
      this.gameContainer.addChild(g);

      // 标签
      const lbl = new Text({
        text: labels[unit.type] ?? '?',
        style: new TextStyle({ fontSize: 12, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' }),
      });
      lbl.anchor.set(0.5, 0);
      lbl.y = -size - 18;
      g.addChild(lbl);
    }
  }

  private drawProjectiles(game: Game): void {
    for (const p of game.projectiles) {
      if (!p.alive) continue;

      const g = new Graphics();

      switch (p.skillType) {
        case 'chain_lightning':
          g.circle(0, 0, 10).fill({ color: 0xaa88ff }).circle(0, 0, 6).fill({ color: 0xffffff, alpha: 0.6 });
          break;
        case 'tornado':
          g.circle(0, 0, p.width).fill({ color: 0x44ffaa, alpha: 0.3 });
          g.circle(0, 0, p.width * 0.6).fill({ color: 0x88ffcc, alpha: 0.5 });
          break;
        case 'laser':
          // 激光从发射点向上延伸
          g.rect(-p.width, -(p.ownerY ?? p.y), p.width * 2, p.ownerY ?? p.y)
            .fill({ color: 0xffff44, alpha: 0.15 });
          g.rect(-p.width * 0.3, -(p.ownerY ?? p.y), p.width * 0.6, p.ownerY ?? p.y)
            .fill({ color: 0xffffff, alpha: 0.3 });
          break;
        case 'frost_nova':
          g.circle(0, 0, p.width).fill({ color: 0x88ccff, alpha: 0.25 });
          g.circle(0, 0, p.width * 0.6).fill({ color: 0xccddff, alpha: 0.2 });
          break;
        default:
          g.circle(0, 0, 6).fill({ color: 0xffee55 }).circle(0, 0, 3).fill({ color: 0xffffff, alpha: 0.7 });
          break;
      }

      g.x = p.x;
      g.y = p.y;
      this.gameContainer.addChild(g);
    }
  }
}
