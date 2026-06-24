import { GameState } from './types';

/**
 * 简易有限状态机
 * 管理游戏状态切换（Playing → CardChoice → Playing … → Won/Lost）
 */
export class StateMachine {
  private _state: GameState = GameState.Playing;
  private listeners: Map<GameState, Array<() => void>> = new Map();

  get state(): GameState {
    return this._state;
  }

  setState(newState: GameState): void {
    if (this._state === newState) return;
    this._state = newState;
    const cbs = this.listeners.get(newState);
    if (cbs) cbs.forEach((cb) => cb());
  }

  on(state: GameState, cb: () => void): void {
    if (!this.listeners.has(state)) this.listeners.set(state, []);
    this.listeners.get(state)!.push(cb);
  }
}
