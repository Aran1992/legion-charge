import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Game, GameState } from '../game';

/** UI 管理器 — 720×1440 固定坐标 */
export class UIManager {
  private uiContainer: Container;
  private cardLayer: Container = new Container();
  private overlayLayer: Container = new Container();

  constructor(_app: import('pixi.js').Application, _gameWidth: number, _gameHeight: number) {
    this.uiContainer = new Container();
    _app.stage.addChild(this.uiContainer);

    this.uiContainer.addChild(this.cardLayer);
    this.uiContainer.addChild(this.overlayLayer);
  }

  update(game: Game): void {
    this.updateHUD(game);
    this.updateCardChoice(game);
    this.updateOverlay(game);
  }

  private updateHUD(game: Game): void {
    // 清理 HUD 层（index 0）
    if (this.uiContainer.children.length > 0 && this.uiContainer.getChildAt(0) !== this.cardLayer) {
      this.uiContainer.removeChildAt(0);
    }
    const hud = new Graphics();

    // 顶部信息条背景
    hud.rect(0, 0, 720, 50).fill({ color: 0x000000, alpha: 0.5 });

    // 波数
    const waveText = new Text({
      text: `第 ${game.currentWaveNumber} / 20 波`,
      style: new TextStyle({ fontSize: 22, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' }),
    });
    waveText.x = 20;
    waveText.y = 12;
    hud.addChild(waveText);

    // 存活单位数
    const aliveCount = game.playerUnits.filter((u) => u.alive).length;
    const unitText = new Text({
      text: `单位: ${aliveCount}`,
      style: new TextStyle({ fontSize: 18, fill: 0x88ccff, fontFamily: 'Arial' }),
    });
    unitText.x = 650;
    unitText.y = 14;
    hud.addChild(unitText);

    this.uiContainer.addChildAt(hud, 0);

    // 底部各单位 HP 条
    const aliveUnits = game.playerUnits.filter((u) => u.alive);
    if (aliveUnits.length > 0) {
      const hpBar = new Graphics();
      const barY = 1410;
      const barGap = 8;
      const perWidth = (720 - barGap * (aliveUnits.length + 1)) / aliveUnits.length;

      for (let i = 0; i < aliveUnits.length; i++) {
        const u = aliveUnits[i];
        const pct = Math.max(0, u.hp / u.stats.hp);
        const bx = barGap + i * (perWidth + barGap);

        // 背景
        hpBar.rect(bx, barY, perWidth, 20).fill({ color: 0x333333 }).rect(bx, barY, perWidth, 20).stroke({ width: 1, color: 0x555555 });
        // HP
        hpBar.rect(bx + 1, barY + 1, (perWidth - 2) * pct, 18)
          .fill({ color: pct > 0.5 ? 0x33dd33 : pct > 0.25 ? 0xddaa00 : 0xdd3333 });
      }
      this.uiContainer.addChild(hpBar);
    }
  }

  private updateCardChoice(game: Game): void {
    this.cardLayer.removeChildren();

    if (game.stateMachine.state !== GameState.CardChoice) return;
    if (game.currentChoices.length === 0) return;

    // 遮罩
    const overlay = new Graphics();
    overlay.rect(0, 0, 720, 1440).fill({ color: 0x000000, alpha: 0.65 });
    this.cardLayer.addChild(overlay);

    // 标题
    const title = new Text({
      text: '✦ 选择你的强化 ✦',
      style: new TextStyle({ fontSize: 28, fill: 0xffdd44, fontFamily: 'Arial', fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.x = 360;
    title.y = 60;
    this.cardLayer.addChild(title);

    // 三张卡（竖排）
    const cardW = 560;
    const cardH = 130;
    const gap = 16;
    const totalH = 3 * cardH + 2 * gap;
    const startY = (1440 - totalH) / 2 - 40;

    for (let i = 0; i < game.currentChoices.length; i++) {
      const choice = game.currentChoices[i];
      const cx = (720 - cardW) / 2;
      const cy = startY + i * (cardH + gap);

      const bgColor = choice.type === 'unit' ? 0x2255aa : 0x228833;
      const card = new Graphics();
      card.roundRect(cx, cy, cardW, cardH, 12).fill({ color: bgColor, alpha: 0.9 });
      card.eventMode = 'static';
      card.cursor = 'pointer';

      const idx = i;
      card.on('pointerdown', () => game.selectChoice(idx));

      this.cardLayer.addChild(card);

      // 标签
      const tag = new Text({
        text: choice.type === 'unit' ? '✨ 新单位' : '⬆ 强化',
        style: new TextStyle({ fontSize: 16, fill: 0xffffff, fontFamily: 'Arial' }),
      });
      tag.x = cx + 20;
      tag.y = cy + 14;
      this.cardLayer.addChild(tag);

      // 名字
      const name = new Text({
        text: choice.label,
        style: new TextStyle({ fontSize: 26, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' }),
      });
      name.x = cx + 20;
      name.y = cy + 42;
      this.cardLayer.addChild(name);

      // 描述
      const desc = new Text({
        text: choice.description,
        style: new TextStyle({ fontSize: 16, fill: 0xccccff, fontFamily: 'Arial' }),
      });
      desc.x = cx + 20;
      desc.y = cy + 80;
      this.cardLayer.addChild(desc);

      // 选中边框（hover）
      card.on('pointerover', () => {
        card.tint = 0xddddff;
      });
      card.on('pointerout', () => {
        card.tint = 0xffffff;
      });
    }
  }

  private updateOverlay(game: Game): void {
    this.overlayLayer.removeChildren();

    if (game.stateMachine.state === GameState.Won) {
      this.showResult('🎉 胜利！', '成功击退了所有敌人！', 0x44ff66);
    } else if (game.stateMachine.state === GameState.Lost) {
      this.showResult('💀 失败', '所有单位已阵亡...', 0xff4444);
    }
  }

  private showResult(titleText: string, descText: string, color: number): void {
    const bg = new Graphics();
    bg.rect(0, 0, 720, 1440).fill({ color: 0x000000, alpha: 0.75 });
    this.overlayLayer.addChild(bg);

    const title = new Text({
      text: titleText,
      style: new TextStyle({ fontSize: 52, fill: color, fontFamily: 'Arial', fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0.5);
    title.x = 360;
    title.y = 650;
    this.overlayLayer.addChild(title);

    const desc = new Text({
      text: descText,
      style: new TextStyle({ fontSize: 24, fill: 0xcccccc, fontFamily: 'Arial' }),
    });
    desc.anchor.set(0.5, 0.5);
    desc.x = 360;
    desc.y = 750;
    this.overlayLayer.addChild(desc);
  }
}
