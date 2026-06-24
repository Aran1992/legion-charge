/** 游戏状态枚举 */
export enum GameState {
  Playing = 'playing',
  CardChoice = 'card_choice',
  Won = 'won',
  Lost = 'lost',
}

/** 方向向量 */
export interface Vec2 {
  x: number;
  y: number;
}
