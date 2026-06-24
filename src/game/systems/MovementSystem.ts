import { Enemy, PlayerUnit } from '../entities';

/** 移动系统：处理单位移动 */
export class MovementSystem {
  update(
    dt: number,
    playerUnits: PlayerUnit[],
    enemies: Enemy[],
    _gameWidth: number,
    _gameHeight: number
  ): void {
    // 敌人向下移动
    for (const e of enemies) {
      if (!e.alive) continue;

      // 冻结状态：不移动
      if ((e as any).freezeTimer > 0) {
        (e as any).freezeTimer -= dt;
        continue;
      }

      e.y += e.moveSpeed * (dt / 1000);
    }

    // 近战单位追踪最近的敌人
    for (const unit of playerUnits) {
      if (!unit.alive || unit.stats.moveSpeed <= 0) continue;
      const target = this.findNearestEnemy(unit.x, unit.y, enemies, 400);
      if (target) {
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > unit.range * 0.7) {
          unit.x += (dx / dist) * unit.stats.moveSpeed * (dt / 1000);
          unit.y += (dy / dist) * unit.stats.moveSpeed * (dt / 1000);
        }
      }
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
}
