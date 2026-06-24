/** 单位类型枚举 */
export enum UnitType {
  Hero = 'hero',
  Swordsman = 'swordsman',
  StormMage = 'storm_mage',
  WindShaman = 'wind_shaman',
  PrismArcher = 'prism_archer',
  FrostMage = 'frost_mage',
  Archer = 'archer',
}

/** 所有可招募的单位列表（排除主角） */
export const RECRUITABLE_UNITS: UnitType[] = [
  UnitType.Swordsman,
  UnitType.StormMage,
  UnitType.WindShaman,
  UnitType.PrismArcher,
  UnitType.FrostMage,
  UnitType.Archer,
];

/** 单位基础属性 */
export interface UnitStats {
  hp: number;
  attack: number;
  attackSpeed: number; // ms
  range: number; // px
  moveSpeed: number; // px/s
}

/** 单位技能类型 */
export enum SkillType {
  Projectile = 'projectile', // 单发飞弹
  MeleeSlash = 'melee_slash', // 近战挥砍
  ChainLightning = 'chain_lightning', // 闪电链
  Tornado = 'tornado', // 龙卷风
  Laser = 'laser', // 激光
  FrostNova = 'frost_nova', // 冰环
  MultiShot = 'multi_shot', // 多重箭
}

/** 技能配置 */
export interface SkillConfig {
  type: SkillType;
  param1?: number; // 弹跳次数/龙卷风持续时间/激光持续时间等
  param2?: number; // 伤害衰减/宽度/角度等
}

import type { PlayerUnit } from './index';

/** 升级项 */
export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  apply: (unit: PlayerUnit) => void;
  icon?: string;
}

/** 单位基础数据表 */
export const UNIT_BASE_STATS: Record<UnitType, UnitStats & { skill: SkillConfig }> = {
  [UnitType.Hero]: {
    hp: 100,
    attack: 15,
    attackSpeed: 800,
    range: 300,
    moveSpeed: 0,
    skill: { type: SkillType.Projectile },
  },
  [UnitType.Swordsman]: {
    hp: 80,
    attack: 25,
    attackSpeed: 1000,
    range: 60,
    moveSpeed: 150,
    skill: { type: SkillType.MeleeSlash },
  },
  [UnitType.StormMage]: {
    hp: 50,
    attack: 12,
    attackSpeed: 1500,
    range: 320,
    moveSpeed: 0,
    skill: { type: SkillType.ChainLightning, param1: 5, param2: 0.8 },
  },
  [UnitType.WindShaman]: {
    hp: 60,
    attack: 8,
    attackSpeed: 3000,
    range: 390,
    moveSpeed: 0,
    skill: { type: SkillType.Tornado, param1: 2000, param2: 60 },
  },
  [UnitType.PrismArcher]: {
    hp: 45,
    attack: 30,
    attackSpeed: 2000,
    range: 400,
    moveSpeed: 0,
    skill: { type: SkillType.Laser, param1: 800, param2: 10 },
  },
  [UnitType.FrostMage]: {
    hp: 55,
    attack: 18,
    attackSpeed: 2500,
    range: 180,
    moveSpeed: 0,
    skill: { type: SkillType.FrostNova, param1: 2000, param2: 1 },
  },
  [UnitType.Archer]: {
    hp: 40,
    attack: 10,
    attackSpeed: 500,
    range: 350,
    moveSpeed: 0,
    skill: { type: SkillType.MultiShot, param2: 1 },
  },
};
