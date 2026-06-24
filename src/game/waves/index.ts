

/** 波次配置 */
export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  enemyType: EnemyTypeConfig;
  spawnInterval: number; // ms
}

/** 敌人类型配置 */
interface EnemyTypeConfig {
  id: string;
  hp: number;
  attack: number;
  attackSpeed: number;
  range: number;
  moveSpeed: number;
  isRanged?: boolean;
}

/** 基准敌人模板 */
const ENEMY_TEMPLATES: Record<string, EnemyTypeConfig> = {
  slime: { id: 'slime', hp: 15, attack: 3, attackSpeed: 1500, range: 0, moveSpeed: 60 },
  bat: { id: 'bat', hp: 10, attack: 2, attackSpeed: 1200, range: 0, moveSpeed: 120 },
  goblin: { id: 'goblin', hp: 30, attack: 6, attackSpeed: 1000, range: 0, moveSpeed: 80 },
  goblin_archer: { id: 'goblin_archer', hp: 20, attack: 8, attackSpeed: 1500, range: 250, moveSpeed: 50, isRanged: true },
  skeleton: { id: 'skeleton', hp: 40, attack: 5, attackSpeed: 800, range: 0, moveSpeed: 100 },
  mage: { id: 'mage', hp: 30, attack: 12, attackSpeed: 2000, range: 300, moveSpeed: 40, isRanged: true },
};

/** 生成 20 波配置 */
export function generateWaveConfigs(): WaveConfig[] {
  const waves: WaveConfig[] = [];

  for (let w = 1; w <= 20; w++) {
    let config: { template: EnemyTypeConfig; count: number };

    if (w <= 3) {
      config = { template: ENEMY_TEMPLATES.slime, count: 4 + w * 2 };
    } else if (w <= 6) {
      config = {
        template: w % 2 === 0 ? ENEMY_TEMPLATES.bat : ENEMY_TEMPLATES.slime,
        count: 8 + (w - 3) * 4,
      };
    } else if (w <= 9) {
      config = {
        template: w % 3 === 0 ? ENEMY_TEMPLATES.bat : ENEMY_TEMPLATES.goblin,
        count: 15 + (w - 6) * 5,
      };
    } else if (w <= 12) {
      config = {
        template: w % 2 === 0 ? ENEMY_TEMPLATES.goblin_archer : ENEMY_TEMPLATES.goblin,
        count: 25 + (w - 9) * 8,
      };
    } else if (w <= 15) {
      config = {
        template: w % 3 === 0 ? ENEMY_TEMPLATES.mage : ENEMY_TEMPLATES.skeleton,
        count: 40 + (w - 12) * 10,
      };
    } else if (w <= 18) {
      config = {
        template: w % 4 === 0 ? ENEMY_TEMPLATES.mage : ENEMY_TEMPLATES.skeleton,
        count: 60 + (w - 15) * 20,
      };
    } else if (w === 19) {
      config = { template: ENEMY_TEMPLATES.skeleton, count: 120 };
    } else {
      config = { template: ENEMY_TEMPLATES.skeleton, count: 200 };
    }

    const scale = 1 + w * 0.08;
    const scaledTemplate: EnemyTypeConfig = {
      ...config.template,
      hp: Math.round(config.template.hp * scale),
      attack: Math.round(config.template.attack * scale),
    };

    waves.push({
      waveNumber: w,
      enemyCount: config.count,
      enemyType: scaledTemplate,
      spawnInterval: Math.max(300, 1200 - w * 40),
    });
  }

  return waves;
}
