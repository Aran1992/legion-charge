import { UnitType, SkillType, type UnitStats, type SkillConfig, UNIT_BASE_STATS } from './types';

/** 我方单位 */
export class PlayerUnit {
  id: number;
  type: UnitType;
  x: number;
  y: number;
  stats: UnitStats;
  skill: SkillConfig;
  hp: number;
  alive: boolean;
  attackCooldown: number = 0;
  upgrades: string[] = [];

  constructor(id: number, type: UnitType, x: number, y: number) {
    const base = UNIT_BASE_STATS[type];
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.stats = { ...base };
    this.skill = { ...base.skill };
    this.hp = base.hp;
    this.alive = true;
  }

  /** 当前攻击力（含升级加成） */
  get attack(): number {
    return this.stats.attack;
  }

  get attackSpeed(): number {
    return this.stats.attackSpeed;
  }

  get range(): number {
    return this.stats.range;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }
}

/** 敌人类 */
export class Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  range: number;
  moveSpeed: number;
  isRanged: boolean;
  alive: boolean;
  attackCooldown: number = 0;

  constructor(
    id: number,
    x: number,
    y: number,
    params: {
      hp: number;
      attack: number;
      attackSpeed: number;
      range: number;
      moveSpeed: number;
      isRanged?: boolean;
    }
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.hp = params.hp;
    this.maxHp = params.hp;
    this.attack = params.attack;
    this.attackSpeed = params.attackSpeed;
    this.range = params.range ?? 0;
    this.moveSpeed = params.moveSpeed;
    this.isRanged = params.isRanged ?? false;
    this.alive = true;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }
}

/** 投射物 */
export class Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  alive: boolean = true;
  pierce: boolean = false;
  width: number = 6;
  height: number = 6;
  skillType: SkillType;
  /** 闪电链用：已弹跳的目标id */
  chainedTargets?: Set<number>;
  /** 龙卷风用：已创建时间 */
  age: number = 0;
  /** 激光用：持有者y，用于计算长度 */
  ownerY?: number;

  constructor(params: {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    lifetime: number;
    skillType?: SkillType;
    pierce?: boolean;
    width?: number;
    height?: number;
    ownerY?: number;
  }) {
    this.id = params.id;
    this.x = params.x;
    this.y = params.y;
    this.vx = params.vx;
    this.vy = params.vy;
    this.damage = params.damage;
    this.lifetime = params.lifetime;
    this.maxLifetime = params.lifetime;
    this.skillType = params.skillType ?? SkillType.Projectile;
    if (params.pierce) this.pierce = true;
    if (params.width) this.width = params.width;
    if (params.height) this.height = params.height;
    if (params.ownerY !== undefined) this.ownerY = params.ownerY;
  }

  update(dt: number): void {
    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);
    this.lifetime -= dt;
    this.age += dt;
    if (this.lifetime <= 0) this.alive = false;
  }
}

export { UnitType, SkillType, type SkillConfig, type UnitStats, UNIT_BASE_STATS, RECRUITABLE_UNITS } from './types';
