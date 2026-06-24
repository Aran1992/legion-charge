import { PlayerUnit, UnitType, RECRUITABLE_UNITS } from '../entities';

/** 三选一的一张卡 */
export interface CardChoice {
  type: 'unit' | 'upgrade';
  label: string;
  description: string;
  /** 新单位则填 unit type，升级则填 upgrade id */
  value: string;
  apply: () => void;
}

/** 升级定义 */
interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  /** 该升级适用于哪些单位类型，空 = 通用 */
  appliesTo: UnitType[];
}

/** 所有可用的升级项 */
const UPGRADES: UpgradeDef[] = [
  { id: 'dmg_20', name: '攻击强化', description: '伤害 +20%', appliesTo: [] },
  { id: 'dmg_35', name: '攻击增幅', description: '伤害 +35%', appliesTo: [] },
  { id: 'atkspd_20', name: '快速打击', description: '攻速 +20%', appliesTo: [] },
  { id: 'atkspd_30', name: '疾风连击', description: '攻速 +30%', appliesTo: [] },
  { id: 'chain_bounce', name: '连锁反弹', description: '闪电链弹跳 +2', appliesTo: [UnitType.StormMage] },
  { id: 'chain_nopenalty', name: '无耗闪电', description: '闪电链不衰减伤害', appliesTo: [UnitType.StormMage] },
  { id: 'tornado_range', name: '狂风扩散', description: '龙卷风范围 +40%', appliesTo: [UnitType.WindShaman] },
  { id: 'tornado_duration', name: '持久风暴', description: '龙卷风持续时间 +1.5s', appliesTo: [UnitType.WindShaman] },
  { id: 'laser_duration', name: '光棱延长', description: '激光持续时间 +0.5s', appliesTo: [UnitType.PrismArcher] },
  { id: 'laser_width', name: '光棱扩束', description: '激光宽度 +50%', appliesTo: [UnitType.PrismArcher] },
  { id: 'frost_time', name: '极寒延长', description: '冻结时间 +1s', appliesTo: [UnitType.FrostMage] },
  { id: 'frost_range', name: '冰环扩散', description: '冰环范围 +30%', appliesTo: [UnitType.FrostMage] },
  { id: 'sword_dmg', name: '剑气纵横', description: '剑士伤害 +40%', appliesTo: [UnitType.Swordsman] },
  { id: 'sword_vamp', name: '嗜血斩击', description: '剑士吸血 10%', appliesTo: [UnitType.Swordsman] },
  { id: 'archer_crit', name: '精准射击', description: '弓箭手暴击率 +20%', appliesTo: [UnitType.Archer] },
  { id: 'archer_multi', name: '多重射击', description: '弓箭手多重箭 +2', appliesTo: [UnitType.Archer] },
];

/** 根据场上单位生成三选一选项 */
export function generateCardChoices(
  activeUnits: PlayerUnit[],
  usedUnitTypes: Set<UnitType>,
  usedUpgrades: Set<string>,
  _nextUnitId: () => number
): CardChoice[] {
  const pool: CardChoice[] = [];

  // 1. 新单位池
  const availableUnits = RECRUITABLE_UNITS.filter((u) => !usedUnitTypes.has(u));
  for (const ut of availableUnits) {
    const nameMap: Record<string, string> = {
      [UnitType.Swordsman]: '剑士',
      [UnitType.StormMage]: '闪电法师',
      [UnitType.WindShaman]: '风术士',
      [UnitType.PrismArcher]: '光棱射手',
      [UnitType.FrostMage]: '冰霜法师',
      [UnitType.Archer]: '弓箭手',
    };
    pool.push({
      type: 'unit',
      label: nameMap[ut] ?? ut,
      description: `招募${nameMap[ut] ?? ut}`,
      value: ut,
      apply: () => {
        // 在 game 层处理单位创建
      },
    });
  }

  // 2. 升级池
  for (const unit of activeUnits) {
    for (const ug of UPGRADES) {
      const upgradeKey = `${unit.id}_${ug.id}`;
      if (usedUpgrades.has(upgradeKey)) continue;
      if (ug.appliesTo.length > 0 && !ug.appliesTo.includes(unit.type)) continue;

      pool.push({
        type: 'upgrade',
        label: ug.name,
        description: `${ug.description}（${unit.type}）`,
        value: upgradeKey,
        apply: () => {
          applyUpgrade(unit, ug.id);
        },
      });
    }
  }

  // 3. 如果不足3项，用通用升级补
  while (pool.length < 3) {
    const dupe = UPGRADES[Math.floor(Math.random() * UPGRADES.length)];
    if (activeUnits.length > 0) {
      const target = activeUnits[Math.floor(Math.random() * activeUnits.length)];
      pool.push({
        type: 'upgrade',
        label: dupe.name,
        description: `${dupe.description}（通用）`,
        value: `${target.id}_${dupe.id}_dup`,
        apply: () => {
          applyUpgrade(target, dupe.id);
        },
      });
    }
  }

  // 4. 随机选3张
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/** 应用升级到指定单位 */
function applyUpgrade(unit: PlayerUnit, upgradeId: string): void {
  if (unit.upgrades.includes(upgradeId)) return;
  unit.upgrades.push(upgradeId);

  switch (upgradeId) {
    case 'dmg_20':
      unit.stats.attack = Math.round(unit.stats.attack * 1.2);
      break;
    case 'dmg_35':
      unit.stats.attack = Math.round(unit.stats.attack * 1.35);
      break;
    case 'atkspd_20':
      unit.stats.attackSpeed = Math.round(unit.stats.attackSpeed / 1.2);
      break;
    case 'atkspd_30':
      unit.stats.attackSpeed = Math.round(unit.stats.attackSpeed / 1.3);
      break;
    case 'chain_bounce':
      unit.skill.param1 = (unit.skill.param1 ?? 5) + 2;
      break;
    case 'chain_nopenalty':
      unit.skill.param2 = 1; // 无衰减
      break;
    case 'tornado_range':
      unit.skill.param2 = (unit.skill.param2 ?? 60) * 1.4;
      break;
    case 'tornado_duration':
      unit.skill.param1 = (unit.skill.param1 ?? 2000) + 1500;
      break;
    case 'laser_duration':
      unit.skill.param1 = (unit.skill.param1 ?? 800) + 500;
      break;
    case 'laser_width':
      unit.skill.param2 = (unit.skill.param2 ?? 10) * 1.5;
      break;
    case 'frost_time':
      unit.skill.param1 = (unit.skill.param1 ?? 2000) + 1000;
      break;
    case 'frost_range':
      unit.stats.range = Math.round(unit.stats.range * 1.3);
      break;
    case 'sword_dmg':
      unit.stats.attack = Math.round(unit.stats.attack * 1.4);
      break;
    case 'sword_vamp':
      // 吸血通过 combat system 处理
      break;
    case 'archer_crit':
      // 暴击通过 combat system 处理
      break;
    case 'archer_multi':
      unit.skill.param2 = (unit.skill.param2 ?? 1) + 2;
      break;
  }
}

export { UPGRADES };
