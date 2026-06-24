import { PlayerUnit, Enemy, Projectile, SkillType } from '../entities';

/** 战斗系统：处理攻击、投射物、伤害 */
export class CombatSystem {
  projectiles: Projectile[] = [];
  private nextId = 1;
  private enemyCache: Enemy[] = [];

  setEnemies(enemies: Enemy[]): void {
    this.enemyCache = enemies;
  }

  /** 更新所有单位的攻击。新建的投射物直接加入 this.projectiles */
  update(dt: number, units: PlayerUnit[], enemies: Enemy[], _gameWidth: number): void {
    this.enemyCache = enemies;

    for (const unit of units) {
      if (!unit.alive) continue;
      unit.attackCooldown -= dt;
      if (unit.attackCooldown > 0) continue;

      const target = this.findNearestEnemy(unit.x, unit.y, enemies, unit.range);
      if (!target) continue;

      unit.attackCooldown = unit.attackSpeed;
      this.createProjectile(unit, target);
    }

    // 远程敌人攻击
    for (const enemy of enemies) {
      if (!enemy.alive || !enemy.isRanged) continue;
      (enemy as any).attackCooldown ??= 0;
      (enemy as any).attackCooldown -= dt;
      if ((enemy as any).attackCooldown > 0) continue;

      const target = this.findNearestUnit(enemy.x, enemy.y, units);
      if (!target) continue;
      (enemy as any).attackCooldown = enemy.attackSpeed;

      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      this.projectiles.push(
        new Projectile({
          id: this.nextId++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 200,
          vy: Math.sin(angle) * 200,
          damage: enemy.attack,
          lifetime: 3000,
          skillType: SkillType.Projectile,
        })
      );
    }
  }

  /** 更新所有投射物位置 & 碰撞 */
  updateProjectiles(dt: number, units: PlayerUnit[], enemies: Enemy[]): void {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.update(dt);

      if (this.isPlayerProjectile(p)) {
        this.checkProjectileHitsEnemy(p, enemies);
      } else {
        this.checkProjectileHitsPlayer(p, units);
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  private isPlayerProjectile(p: Projectile): boolean {
    return p.vy < 0;
  }

  private checkProjectileHitsEnemy(proj: Projectile, enemies: Enemy[]): void {
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
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        enemy.takeDamage(proj.damage);
        (enemy as any).lastHitAt = performance.now();
        if (!proj.pierce) {
          proj.alive = false;
        }
        break;
      }
    }
  }

  private checkProjectileHitsPlayer(proj: Projectile, units: PlayerUnit[]): void {
    for (const unit of units) {
      if (!unit.alive) continue;
      const dx = proj.x - unit.x;
      const dy = proj.y - unit.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) {
        unit.takeDamage(proj.damage);
        proj.alive = false;
        break;
      }
    }
  }

  private handleChainLightning(proj: Projectile, enemies: Enemy[]): void {
    if (!proj.chainedTargets) proj.chainedTargets = new Set();
    const alive = enemies.filter((e) => e.alive && !proj.chainedTargets!.has(e.id));
    if (alive.length === 0) { proj.alive = false; return; }
    const target = alive[0];
    target.takeDamage(proj.damage);
    proj.chainedTargets.add(target.id);
    proj.x = target.x;
    proj.y = target.y;

    const maxBounces = 5;
    if (proj.chainedTargets.size >= maxBounces) proj.alive = false;
  }

  private handleTornado(proj: Projectile, enemies: Enemy[]): void {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (Math.abs(proj.x - e.x) < proj.width && Math.abs(proj.y - e.y) < proj.width) {
        e.takeDamage(proj.damage);
      }
    }
  }

  private handleLaser(proj: Projectile, enemies: Enemy[]): void {
    const oy = proj.ownerY ?? proj.y;
    const halfW = proj.width;
    for (const e of enemies) {
      if (!e.alive || e.y >= oy) continue;
      if (Math.abs(e.x - proj.x) < halfW) {
        e.takeDamage(Math.round(proj.damage * 0.05));
      }
    }
  }

  private handleFrostNova(proj: Projectile, enemies: Enemy[]): void {
    const r = proj.width;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - proj.x, dy = e.y - proj.y;
      if (Math.sqrt(dx * dx + dy * dy) < r) {
        e.takeDamage(proj.damage);
        (e as any).freezeTimer = 2000;
      }
    }
    proj.alive = false;
  }

  /** 创建投射物并直接加入 this.projectiles */
  createProjectile(unit: PlayerUnit, target: Enemy): void {
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const speed = 500;

    switch (unit.skill.type) {
      case SkillType.Projectile:
        this.projectiles.push(new Projectile({
          id: this.nextId++, x: unit.x, y: unit.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          damage: unit.attack, lifetime: 2500, skillType: SkillType.Projectile,
        }));
        return;

      case SkillType.MeleeSlash:
        for (const e of this.enemyCache) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - unit.x, e.y - unit.y) < unit.range + 20) {
            e.takeDamage(unit.attack);
          }
        }
        return;

      case SkillType.ChainLightning: {
        const p = new Projectile({
          id: this.nextId++, x: unit.x, y: unit.y,
          vx: 0, vy: 0, damage: unit.attack, lifetime: 600,
          skillType: SkillType.ChainLightning,
        });
        p.chainedTargets = new Set();
        if (target) {
          target.takeDamage(unit.attack);
          p.chainedTargets.add(target.id);
          p.x = target.x; p.y = target.y;
        }
        this.projectiles.push(p);
        return;
      }

      case SkillType.Tornado:
        this.projectiles.push(new Projectile({
          id: this.nextId++, x: unit.x, y: unit.y,
          vx: 0, vy: -speed * 0.6, damage: unit.attack,
          lifetime: unit.skill.param1 ?? 2000,
          width: unit.skill.param2 ?? 70, skillType: SkillType.Tornado, pierce: true,
        }));
        return;

      case SkillType.Laser:
        this.projectiles.push(new Projectile({
          id: this.nextId++, x: unit.x, y: unit.y,
          vx: 0, vy: 0, damage: unit.attack,
          lifetime: unit.skill.param1 ?? 800,
          width: unit.skill.param2 ?? 12, height: unit.skill.param2 ?? 12,
          skillType: SkillType.Laser, pierce: true, ownerY: unit.y,
        }));
        return;

      case SkillType.FrostNova:
        this.projectiles.push(new Projectile({
          id: this.nextId++, x: unit.x, y: unit.y,
          vx: 0, vy: 0, damage: unit.attack, lifetime: 100,
          width: unit.range, skillType: SkillType.FrostNova,
        }));
        return;

      case SkillType.MultiShot: {
        const count = (unit.skill.param2 ?? 1) + 1;
        for (let i = 0; i < count; i++) {
          const a = angle + (i - (count - 1) / 2) * 0.3;
          this.projectiles.push(new Projectile({
            id: this.nextId++, x: unit.x, y: unit.y,
            vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            damage: unit.attack, lifetime: 2000, skillType: SkillType.Projectile,
          }));
        }
        return;
      }
    }
  }

  private findNearestEnemy(x: number, y: number, enemies: Enemy[], range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = range;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  private findNearestUnit(x: number, y: number, units: PlayerUnit[]): PlayerUnit | null {
    let best: PlayerUnit | null = null;
    let bestDist = Infinity;
    for (const u of units) {
      if (!u.alive) continue;
      const d = Math.hypot(u.x - x, u.y - y);
      if (d < bestDist) { bestDist = d; best = u; }
    }
    return best;
  }
}
