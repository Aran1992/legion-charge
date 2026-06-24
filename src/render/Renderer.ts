import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Game } from '../game';

/** 场景渲染器 */
export class SceneRenderer {
  private gameContainer: Container;
  private bgLayer: Graphics;
  private unitLayer: Container;
  private projectileLayer: Container;
  private enemyLayer: Container;

  private gameWidth: number;
  private gameHeight: number;
  private scale: number;

  constructor(_app: Application, gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    // 计算缩放
    this.scale = window.innerWidth / gameWidth;

    this.gameContainer = new Container();
    this.gameContainer.scale.set(this.scale);
    this.gameContainer.x = 0;
    this.gameContainer.y = (window.innerHeight - gameHeight * this.scale) / 2;
    _app.stage.addChild(this.gameContainer);

    // 背景层
    this.bgLayer = new Graphics();
    this.gameContainer.addChild(this.bgLayer);

    // 敌人层
    this.enemyLayer = new Container();
    this.gameContainer.addChild(this.enemyLayer);

    // 投射物层
    this.projectileLayer = new Container();
    this.gameContainer.addChild(this.projectileLayer);

    // 我方单位层
    this.unitLayer = new Container();
    this.gameContainer.addChild(this.unitLayer);

    // 窗口resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.scale = window.innerWidth / this.gameWidth;
    this.gameContainer.scale.set(this.scale);
    this.gameContainer.y =
      (window.innerHeight - this.gameHeight * this.scale) / 2;
  }

  update(game: Game, _dt: number): void {
    this.drawBackground(game);
    this.drawEnemies(game);
    this.drawProjectiles(game);
    this.drawUnits(game);
  }

  private drawBackground(game: Game): void {
    this.bgLayer.clear();
    const w = this.gameWidth;
    const h = this.gameHeight;

    // 深色背景 + 滚动网格线
    this.bgLayer.rect(0, 0, w, h).fill({ color: 0x1a1a2e });

    // 地面/网格
    const gridSize = 40;
    const offset = game.scrollOffset % gridSize;
    this.bgLayer.setStrokeStyle({ width: 1, color: 0x2a2a4e, alpha: 0.3 });
    for (let y = -gridSize + offset; y < h + gridSize; y += gridSize) {
      this.bgLayer.moveTo(0, y);
      this.bgLayer.lineTo(w, y);
    }
    for (let x = 0; x < w; x += gridSize) {
      this.bgLayer.moveTo(x, 0);
      this.bgLayer.lineTo(x, h);
    }
    this.bgLayer.stroke();
  }

  private drawEnemies(game: Game): void {
    this.enemyLayer.removeChildren();

    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      if (enemy.y < -50 || enemy.y > this.gameHeight + 50) continue;

      const g = new Graphics();
      const size = enemy.isRanged ? 12 : 16;

      // 敌人身体
      g.circle(0, 0, size)
        .fill({ color: enemy.isRanged ? 0xff4444 : 0xff6666 });

      // 冻结效果
      if ((enemy as any).freezeTimer > 0) {
        g.circle(0, 0, size + 4)
          .fill({ color: 0x88ccff, alpha: 0.3 });
      }

      // HP 条
      const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
      g.rect(-size, -size - 8, size * 2 * hpRatio, 3)
        .fill({ color: hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffff44 : 0xff4444 });

      g.x = enemy.x;
      g.y = enemy.y;
      this.enemyLayer.addChild(g);
    }
  }

  private drawUnits(game: Game): void {
    this.unitLayer.removeChildren();

    for (const unit of game.playerUnits) {
      if (!unit.alive) continue;

      const g = new Graphics();
      const size = 14;

      // 单位颜色映射
      const colors: Record<string, number> = {
        hero: 0x44ddff,
        swordsman: 0xff8844,
        storm_mage: 0xaa44ff,
        wind_shaman: 0x44ffaa,
        prism_archer: 0xffff44,
        frost_mage: 0x88ddff,
        archer: 0x88ff44,
      };

      const color = colors[unit.type] ?? 0xffffff;

      // 身体
      g.circle(0, 0, size).fill({ color });

      // 外圈（范围指示 - 淡色）
      g.circle(0, 0, unit.range)
        .fill({ color, alpha: 0.05 });

      // HP 条
      const hpRatio = unit.hp / unit.stats.hp;
      g.rect(-size, -size - 10, size * 2 * hpRatio, 3)
        .fill({ color: hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffff44 : 0xff4444 });

      g.x = unit.x;
      g.y = unit.y;
      this.unitLayer.addChild(g);

      // 单位类型标签
      const label = new Text({
        text: this.getUnitLabel(unit.type),
        style: new TextStyle({
          fontSize: 9,
          fill: 0xffffff,
          fontFamily: 'Arial',
        }),
      });
      label.anchor.set(0.5, 1);
      label.y = -size - 14;
      g.addChild(label);
    }
  }

  private drawProjectiles(game: Game): void {
    this.projectileLayer.removeChildren();

    for (const p of game.projectiles) {
      if (!p.alive) continue;

      const g = new Graphics();

      switch (p.skillType) {
        case 'chain_lightning':
          g.circle(0, 0, 8)
            .fill({ color: 0xaa88ff });
          break;
        case 'tornado':
          g.circle(0, 0, p.width)
            .fill({ color: 0x44ffaa, alpha: 0.4 });
          g.circle(0, 0, p.width * 0.6)
            .fill({ color: 0x88ffcc, alpha: 0.6 });
          break;
        case 'laser':
          g.rect(0, -p.height, 0, -(p.ownerY ?? p.y))
            .fill({ color: 0xffff44, alpha: 0.3 });
          g.rect(0, -3, 0, -(p.ownerY ?? p.y))
            .fill({ color: 0xffffff, alpha: 0.5 });
          break;
        case 'frost_nova':
          g.circle(0, 0, p.width)
            .fill({ color: 0x88ccff, alpha: 0.3 });
          break;
        default:
          g.circle(0, 0, 4)
            .fill({ color: 0xffff88 });
          break;
      }

      g.x = p.x;
      g.y = p.y;
      this.projectileLayer.addChild(g);
    }
  }

  private getUnitLabel(type: string): string {
    const labels: Record<string, string> = {
      hero: '主',
      swordsman: '剑',
      storm_mage: '雷',
      wind_shaman: '风',
      prism_archer: '光',
      frost_mage: '冰',
      archer: '弓',
    };
    return labels[type] ?? '?';
  }
}
