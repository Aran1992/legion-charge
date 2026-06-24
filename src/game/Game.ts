import { PlayerUnit, Enemy, UnitType } from './entities';
import { GameState, StateMachine } from '../core';
import { CombatSystem } from './systems/CombatSystem';
import { MovementSystem } from './systems/MovementSystem';
import { WaveSystem } from './systems/WaveSystem';
import { generateWaveConfigs } from './waves';
import { generateCardChoices, type CardChoice } from './cards';

export type { CardChoice } from './cards';

/** 主游戏逻辑 */
export class Game {
  readonly stateMachine = new StateMachine();
  readonly gameWidth: number;
  readonly gameHeight: number;

  playerUnits: PlayerUnit[] = [];
  enemies: Enemy[] = [];

  currentWaveNumber: number = 0;
  waveCompleted: boolean = false;

  /** 当前三选一选项 */
  currentChoices: CardChoice[] = [];

  readonly combat: CombatSystem;
  private movement: MovementSystem;
  private wave: WaveSystem;

  private nextUnitId = 1;

  /** 已使用的单位类型（不会再次出现） */
  private usedUnitTypes = new Set<UnitType>([UnitType.Hero]);
  /** 已使用的升级 */
  private usedUpgrades = new Set<string>();

  /** 场景滚动偏移 */
  scrollOffset: number = 0;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.combat = new CombatSystem();
    this.movement = new MovementSystem();
    this.wave = new WaveSystem(generateWaveConfigs());

    this.initPlayer();

    // 状态切换回调
    this.stateMachine.on(GameState.CardChoice, () => {
      this.generateChoices();
    });
  }

  /** 初始化主角 */
  private initPlayer(): void {
    const hero = new PlayerUnit(
      this.nextUnitId++,
      UnitType.Hero,
      this.gameWidth / 2,
      this.gameHeight * 0.65
    );
    this.playerUnits.push(hero);
    this.usedUnitTypes.add(UnitType.Hero);
  }

  /** 开始游戏 */
  start(): void {
    this.wave.start();
    this.currentWaveNumber = 1;
    this.stateMachine.setState(GameState.Playing);
  }

  /** 主更新循环 */
  update(dt: number): void {
    if (this.stateMachine.state !== GameState.Playing) return;

    // 1. 场景滚动
    this.scrollOffset += 60 * (dt / 1000);

    // 2. 波次更新
    const newEnemies = this.wave.update(dt, this.enemies, this.gameWidth);
    this.enemies.push(...newEnemies);

    // 3. 移除越界敌人
    this.enemies = this.enemies.filter(
      (e) => e.alive && e.y < this.gameHeight + 100
    );

    // 4. 移动
    this.movement.update(dt, this.playerUnits, this.enemies, this.gameWidth, this.gameHeight);

    // 5. 战斗 & 投射物更新
    this.combat.update(dt, this.playerUnits, this.enemies, this.gameWidth);
    this.combat.updateProjectiles(dt, this.playerUnits, this.enemies);

    // 7. 敌人近战伤害
    this.handleEnemyMeleeDamage(dt);

    // 8. 清理死亡敌人
    this.enemies = this.enemies.filter((e) => e.alive);
    this.playerUnits = this.playerUnits.filter((u) => u.alive);

    // 9. 检查波次完成
    this.checkWaveComplete();

    // 10. 检查胜负
    this.checkGameOver();
  }

  /** 选择三选一卡片 */
  selectChoice(index: number): void {
    if (index < 0 || index >= this.currentChoices.length) return;
    const choice = this.currentChoices[index];

    if (choice.type === 'unit') {
      this.spawnUnit(choice.value as UnitType);
    } else {
      choice.apply();
      this.usedUpgrades.add(choice.value);
    }

    // 进入下一波
    this.currentChoices = [];
    this.wave.nextWave();
    this.currentWaveNumber = this.wave.waveIndex + 1;
    this.stateMachine.setState(GameState.Playing);
  }

  /** 生成新单位 */
  private spawnUnit(type: UnitType): void {
    const x = this.gameWidth * (0.2 + Math.random() * 0.6);
    const y = this.gameHeight * (0.55 + Math.random() * 0.25);
    const unit = new PlayerUnit(this.nextUnitId++, type, x, y);
    this.playerUnits.push(unit);
    this.usedUnitTypes.add(type);
  }

  /** 生成三选一选项 */
  private generateChoices(): void {
    this.currentChoices = generateCardChoices(
      this.playerUnits,
      this.usedUnitTypes,
      this.usedUpgrades,
      () => this.nextUnitId++
    );

    // 对于 unit 类型的卡，替换 apply 为真实逻辑
    for (const choice of this.currentChoices) {
      if (choice.type === 'unit') {
        choice.apply = () => {
          this.spawnUnit(choice.value as UnitType);
        };
      }
    }
  }

  /** 检查波次是否完成 */
  private checkWaveComplete(): void {
    const allSpawned = this.wave.currentWave
      ? this.wave.enemiesSpawned >= this.wave.currentWave.enemyCount
      : false;
    const aliveEnemies = this.enemies.filter((e) => e.alive).length;

    if (allSpawned && aliveEnemies === 0 && !this.waveCompleted && this.wave.waveIndex >= 0) {
      this.waveCompleted = true;
      if (this.wave.isFinished) {
        this.stateMachine.setState(GameState.Won);
      } else {
        this.stateMachine.setState(GameState.CardChoice);
      }
    }
  }

  /** 检查游戏结束 */
  private checkGameOver(): void {
    const aliveUnits = this.playerUnits.filter((u) => u.alive).length;
    if (aliveUnits === 0) {
      this.stateMachine.setState(GameState.Lost);
    }
  }

  /** 敌人近战碰触伤害 */
  private handleEnemyMeleeDamage(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.isRanged) continue;
      if ((enemy as any).freezeTimer > 0) continue;

      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown > 0) continue;

      for (const unit of this.playerUnits) {
        if (!unit.alive) continue;
        const dx = enemy.x - unit.x;
        const dy = enemy.y - unit.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          unit.takeDamage(enemy.attack);
          enemy.attackCooldown = enemy.attackSpeed;
          break;
        }
      }
    }
  }
}
