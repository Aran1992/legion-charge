import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Game, GameState } from '../game';

/** UI 管理器：HUD、三选一界面、胜负画面 */
export class UIManager {
  private uiContainer: Container;
  private gameWidth: number;
  private gameHeight: number;
  private scale: number;

  private hudLayer: Container = new Container();
  private cardLayer: Container = new Container();
  private overlayLayer: Container = new Container();

  constructor(_app: Application, gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scale = window.innerWidth / gameWidth;

    this.uiContainer = new Container();
    this.uiContainer.scale.set(this.scale);
    _app.stage.addChild(this.uiContainer);

    this.uiContainer.addChild(this.hudLayer);
    this.uiContainer.addChild(this.cardLayer);
    this.uiContainer.addChild(this.overlayLayer);
  }

  update(game: Game): void {
    this.updateHUD(game);
    this.updateCardChoice(game);
    this.updateOverlay(game);
  }

  private updateHUD(game: Game): void {
    this.hudLayer.removeChildren();

    // 波数
    const waveText = new Text({
      text: `第 ${game.currentWaveNumber} / 20 波`,
      style: new TextStyle({
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }),
    });

    if (game.stateMachine.state === GameState.Playing) {
      waveText.x = 10;
      waveText.y = 10;
      this.hudLayer.addChild(waveText);
    }

    // 单位 HP 总览（在底部）
    const aliveUnits = game.playerUnits.filter((u) => u.alive);
    const hpStartX = 10;
    const hpStartY = this.gameHeight - 30;

    for (let i = 0; i < aliveUnits.length; i++) {
      const u = aliveUnits[i];
      const barWidth = (this.gameWidth - 20) / Math.min(aliveUnits.length, 7);
      const barX = hpStartX + i * barWidth;
      const hpRatio = u.hp / u.stats.hp;

      const bar = new Graphics();
      bar.rect(barX, hpStartY, barWidth - 2, 8)
        .fill({ color: hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffff44 : 0xff4444 });
      this.hudLayer.addChild(bar);
    }
  }

  private updateCardChoice(game: Game): void {
    this.cardLayer.removeChildren();

    if (game.stateMachine.state !== GameState.CardChoice) return;
    if (game.currentChoices.length === 0) return;

    // 半透明背景遮罩
    const overlay = new Graphics();
    overlay.rect(0, 0, this.gameWidth, this.gameHeight)
      .fill({ color: 0x000000, alpha: 0.6 });
    this.cardLayer.addChild(overlay);

    // 标题
    const title = new Text({
      text: '选择你的强化',
      style: new TextStyle({
        fontSize: 22,
        fill: 0xffdd44,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = this.gameWidth / 2;
    title.y = this.gameHeight * 0.08;
    this.cardLayer.addChild(title);

    // 三张卡牌（竖排）
    const cardWidth = this.gameWidth * 0.8;
    const cardHeight = 80;
    const cardSpacing = 10;
    const totalHeight = game.currentChoices.length * (cardHeight + cardSpacing);
    const startY = (this.gameHeight - totalHeight) / 2;

    for (let i = 0; i < game.currentChoices.length; i++) {
      const choice = game.currentChoices[i];
      const cardX = (this.gameWidth - cardWidth) / 2;
      const cardY = startY + i * (cardHeight + cardSpacing);

      // 卡牌背景
      const bgColor = choice.type === 'unit' ? 0x4488ff : 0x44bb44;
      const card = new Graphics();
      card.roundRect(cardX, cardY, cardWidth, cardHeight, 8)
        .fill({ color: bgColor, alpha: 0.85 });
      card.eventMode = 'static';
      card.cursor = 'pointer';

      const clickIndex = i;
      card.on('pointerdown', () => {
        game.selectChoice(clickIndex);
      });

      this.cardLayer.addChild(card);

      // 标签
      const labelText = choice.type === 'unit' ? '✨ 新单位' : '⬆ 升级';
      const label = new Text({
        text: labelText,
        style: new TextStyle({
          fontSize: 12,
          fill: 0xffffff,
          fontFamily: 'Arial',
        }),
      });
      label.x = cardX + 10;
      label.y = cardY + 8;
      this.cardLayer.addChild(label);

      // 名称
      const name = new Text({
        text: choice.label,
        style: new TextStyle({
          fontSize: 18,
          fill: 0xffffff,
          fontFamily: 'Arial',
          fontWeight: 'bold',
        }),
      });
      name.x = cardX + 10;
      name.y = cardY + 28;
      this.cardLayer.addChild(name);

      // 描述
      const desc = new Text({
        text: choice.description,
        style: new TextStyle({
          fontSize: 12,
          fill: 0xddddff,
          fontFamily: 'Arial',
        }),
      });
      desc.x = cardX + 10;
      desc.y = cardY + 52;
      this.cardLayer.addChild(desc);
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
    const overlay = new Graphics();
    overlay.rect(0, 0, this.gameWidth, this.gameHeight)
      .fill({ color: 0x000000, alpha: 0.7 });
    this.overlayLayer.addChild(overlay);

    const title = new Text({
      text: titleText,
      style: new TextStyle({
        fontSize: 36,
        fill: color,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }),
    });
    title.anchor.set(0.5, 0.5);
    title.x = this.gameWidth / 2;
    title.y = this.gameHeight * 0.4;
    this.overlayLayer.addChild(title);

    const desc = new Text({
      text: descText,
      style: new TextStyle({
        fontSize: 16,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      }),
    });
    desc.anchor.set(0.5, 0.5);
    desc.x = this.gameWidth / 2;
    desc.y = this.gameHeight * 0.5;
    this.overlayLayer.addChild(desc);
  }
}
