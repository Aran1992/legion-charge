import { Enemy } from '../entities';
import { WaveConfig } from '../waves';

/** 波次系统：管理敌人生成和波次进度 */
export class WaveSystem {
  currentWave: WaveConfig | null = null;
  waveIndex: number = 0;
  enemiesSpawned: number = 0;
  spawnTimer: number = 0;
  waveInterval: number = 2000; // 波间等待
  waveIntervalTimer: number = 0;
  allWaveCompleted: boolean = false;

  private configs: WaveConfig[] = [];
  private nextEnemyId = 1;

  constructor(configs: WaveConfig[]) {
    this.configs = configs;
  }

  /** 开始第一波 */
  start(): void {
    this.waveIndex = 0;
    this.startWave(0);
  }

  /** 是否所有波次已结束 */
  get isFinished(): boolean {
    return this.waveIndex >= this.configs.length && this.allWaveCompleted;
  }

  /** 更新生成逻辑 */
  update(
    dt: number,
    enemies: Enemy[],
    gameWidth: number
  ): Enemy[] {
    const newEnemies: Enemy[] = [];

    // 在当前波之间等待
    if (this.waveIntervalTimer > 0) {
      this.waveIntervalTimer -= dt;
      return newEnemies;
    }

    if (!this.currentWave) return newEnemies;

    // 检查当前波是否全部生成完毕且敌人全部消灭
    const aliveEnemies = enemies.filter((e) => e.alive).length;
    const allSpawned = this.enemiesSpawned >= this.currentWave.enemyCount;
    const allCleared = aliveEnemies === 0;

    if (allCleared && allSpawned && !this.allWaveCompleted) {
      // 当前波结束
      this.waveIntervalTimer = this.waveInterval;
      this.allWaveCompleted = true;
      return newEnemies;
    }

    if (allSpawned) return newEnemies; // 等待清场

    // 生成敌人
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.currentWave.spawnInterval;
      const x = Math.random() * (gameWidth - 40) + 20;
      const enemy = new Enemy(this.nextEnemyId++, x, -40, {
        hp: this.currentWave.enemyType.hp,
        attack: this.currentWave.enemyType.attack,
        attackSpeed: this.currentWave.enemyType.attackSpeed,
        range: this.currentWave.enemyType.range,
        moveSpeed: this.currentWave.enemyType.moveSpeed,
        isRanged: this.currentWave.enemyType.isRanged,
      });
      newEnemies.push(enemy);
      this.enemiesSpawned++;
    }

    return newEnemies;
  }

  /** 手动调用：告知波次已完成（玩家选完卡后进入下一波） */
  nextWave(): void {
    this.allWaveCompleted = false;
    this.waveIndex++;
    this.startWave(this.waveIndex);
  }

  /** 通知波次已结束（供外部调用） */
  completeCurrentWave(): void {
    this.allWaveCompleted = true;
  }

  private startWave(index: number): void {
    if (index >= this.configs.length) return;
    this.currentWave = this.configs[index];
    this.enemiesSpawned = 0;
    this.spawnTimer = 500; // 波首延迟
  }
}
