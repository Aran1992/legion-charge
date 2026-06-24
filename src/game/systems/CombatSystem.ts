import { PlayerUnit, Enemy, Projectile, SkillType } from '../entities';

/** 战斗系统：处理攻击、投射物、伤害 */
export class CombatSystem {
  projectiles: Projectile[] = [];
  private nextId = 1;
  private enemyCache: Enemy[] = [];

  /** 缓存敌人引用供近战使用 */
  setEnemies(enemies: Enemy[]): void {
    this.enemyCache = enemies;
  }

  /** 更新所有单位的攻击 */
  update(dt: number, units: PlayerUnit[], enemies: Enemy[], _gameWidth: number): Projectile[] {
    const newProjectiles: Projectile[] = [];
    this.enemyCache = enemies;

    for (const unit of units) {
      if (!unit.alive) continue;
      unit.attackCooldown -= dt;
      if (unit.attackCooldown > 0) continue;

      const target = this.findNearestEnemy(unit.x, unit.y, enemies, unit.range);
      if (!target) continue;

      unit.attackCooldown = unit.attackSpeed;
      const proj = this.createProjectile(unit, target);
      if (proj) newProjectiles.push(proj);
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (enemy.isRanged) {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown > 0) continue;
        const target = this.findNearestUnit(enemy.x, enemy.y, units);
        if (!target) continue;
        enemy.attackCooldown = enemy.attackSpeed;
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        const speed = 200;
        newProjectiles.push(
          new Projectile({
            id: this.nextId++,
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: enemy.attack,
            lifetime: 3000,
            skillType: SkillType.Projectile,
          })
        );
      }
    }

    return newProjectiles;
  }

  updateProjectiles(dt: number, units: PlayerUnit[], enemies: Enemy[]): void {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.update(dt);

      if (this.isPlayerProjectile(p)) {
        this.checkProjectileHitsEnemy(p, enemies, units);
      } else {
        this.checkProjectileHitsPlayer(p, units);
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  private isPlayerProjectile(p: Projectile): boolean {
    return p.vy < 0;
  }

  private checkProjectileHitsEnemy(
    proj: Projectile,
    enemies: Enemy[],
    _units: PlayerUnit[]
  ): void {
    if (proj.skillType === SkillType.ChainLightning) {
      this.handleChainLightning(proj, enemies);
      return;
    }
    if (proj.skillType === SkillType.Tornado) {
      this.handleTornado(proj, enemies);
      return;
    }
    if (proj.skillType === SkillType.Laser) {
      this.handleLaser(proj, enemies);
      return;
    }
    if (proj.skillType === SkillType.FrostNova) {
      this.handleFrostNova(proj, enemies);
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        enemy.takeDamage(proj.damage);
        if (proj.pierce) continue;
        proj.alive = false;
        break;
      }
    }
  }

  private checkProjectileHitsPlayer(proj: Projectile, units: PlayerUnit[]): void {
    if (!units) return;
    for (const unit of units) {
      if (!unit.alive) continue;
      const dx = proj.x - unit.x;
      const dy = proj.y - unit.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        unit.takeDamage(proj.damage);
        proj.alive = false;
        break;
      }
    }
  }

  private handleChainLightning(proj: Projectile, enemies: Enemy[]): void {
    if (!proj.chainedTargets) proj.chainedTargets = new Set();
    const alive = enemies.filter((e) => e.alive && !proj.chainedTargets!.has(e.id));
    if (alive.length === 0) {
      proj.alive = false;
      return;
    }
    const target = alive[0];
    target.takeDamage(proj.damage);
    proj.chainedTargets.add(target.id);
    proj.x = target.x;
    proj.y = target.y;

    const maxBounces = 5;
    if (proj.chainedTargets.size >= maxBounces) {
      proj.alive = false;
    }
  }

  private handleTornado(proj: Projectile, enemies: Enemy[]): void {
    const radius = proj.width;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        enemy.takeDamage(proj.damage);
      }
    }
  }

  private handleLaser(proj: Projectile, enemies: Enemy[]): void {
    const laserWidth = proj.width;
    const ownerY = proj.ownerY ?? proj.y;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (enemy.y >= ownerY) continue;
      if (enemy.y < -50) continue;
      const dx = Math.abs(enemy.x - proj.x);
      if (dx < laserWidth) {
        enemy.takeDamage(Math.round(proj.damage * 0.05));
      }
    }
  }

  private handleFrostNova(proj: Projectile, enemies: Enemy[]): void {
    const radius = proj.width;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        enemy.takeDamage(proj.damage);
        (enemy as any).freezeTimer = 2000;
      }
    }
    proj.alive = false;
  }

  createProjectile(unit: PlayerUnit, target: Enemy): Projectile | null {
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const speed = 400;

    switch (unit.skill.type) {
      case SkillType.Projectile:
        return new Projectile({
          id: this.nextId++,
          x: unit.x,
          y: unit.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: unit.attack,
          lifetime: 2000,
          skillType: SkillType.Projectile,
        });

      case SkillType.MeleeSlash: {
        for (const e of this.enemyCache) {
          if (!e.alive) continue;
          const dx = e.x - unit.x;
          const dy = e.y - unit.y;
          if (Math.sqrt(dx * dx + dy * dy) < unit.range + 10) {
            e.takeDamage(unit.attack);
          }
        }
        return null;
      }

      case SkillType.ChainLightning: {
        const p = new Projectile({
          id: this.nextId++,
          x: unit.x,
          y: unit.y,
          vx: 0,
          vy: 0,
          damage: unit.attack,
          lifetime: 500,
          skillType: SkillType.ChainLightning,
        });
        p.chainedTargets = new Set();
        if (target) {
          target.takeDamage(unit.attack);
          p.chainedTargets.add(target.id);
          p.x = target.x;
          p.y = target.y;
        }
        return p;
      }

      case SkillType.Tornado:
        return new Projectile({
          id: this.nextId++,
          x: unit.x,
          y: unit.y,
          vx: 0,
          vy: -speed * 0.5,
          damage: unit.attack,
          lifetime: unit.skill.param1 ?? 2000,
          width: unit.skill.param2 ?? 60,
          skillType: SkillType.Tornado,
          pierce: true,
        });

      case SkillType.Laser:
        return new Projectile({
          id: this.nextId++,
          x: unit.x,
          y: unit.y,
          vx: 0,
          vy: 0,
          damage: unit.attack,
          lifetime: unit.skill.param1 ?? 800,
          width: unit.skill.param2 ?? 10,
          height: unit.skill.param2 ?? 10,
          skillType: SkillType.Laser,
          pierce: true,
        });

      case SkillType.FrostNova:
        return new Projectile({
          id: this.nextId++,
          x: unit.x,
          y: unit.y,
          vx: 0,
          vy: 0,
          damage: unit.attack,
          lifetime: 100,
          width: unit.range,
          skillType: SkillType.FrostNova,
        });

      case SkillType.MultiShot: {
        const count = (unit.skill.param2 ?? 1) + 1;
        const spread = 0.3;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spread;
          const a = angle + offset;
          this.projectiles.push(
            new Projectile({
              id: this.nextId++,
              x: unit.x,
              y: unit.y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              damage: unit.attack,
              lifetime: 2000,
              skillType: SkillType.Projectile,
            })
          );
        }
        return null;
      }

      default:
        return null;
    }
  }

  private findNearestEnemy(
    x: number,
    y: number,
    enemies: Enemy[],
    range: number
  ): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = range;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  private findNearestUnit(
    x: number,
    y: number,
    units: PlayerUnit[]
  ): PlayerUnit | null {
    let nearest: PlayerUnit | null = null;
    let minDist = Infinity;
    for (const u of units) {
      if (!u.alive) continue;
      const dx = u.x - x;
      const dy = u.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = u;
      }
    }
    return nearest;
  }
}
