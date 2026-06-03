import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface HoleEntity extends IGameEntity {
  holeIndex: number;
  hasMole: boolean;
  moleActive: boolean;
  moleTimer: number;
}

const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_SIZE = 70;
const HOLE_GAP = 16;
const BOARD_OFFSET_X = 30;
const BOARD_OFFSET_Y = 60;

interface DifficultyConfig {
  moleStayDuration: number;
  spawnInterval: number;
  totalMoles: number;
}

/**
 * Whack-a-Mole micro-game template.
 * Moles pop up from a 3x3 grid of holes; tap them before they hide.
 */
export class WhackAMoleGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'WhackAMole';

  private holes: { active: boolean; timer: number }[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 1.0;
  private moleStayDuration: number = 1.0;
  private totalMoles: number = 15;
  private molesSpawned: number = 0;
  private molesWhacked: number = 0;
  private molesMissed: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    const diffConfig = this.getDifficultyConfig(config.difficulty);
    this.spawnInterval = diffConfig.spawnInterval;
    this.moleStayDuration = diffConfig.moleStayDuration;
    this.totalMoles = diffConfig.totalMoles;

    this.holes = Array.from({ length: GRID_ROWS * GRID_COLS }, () => ({
      active: false,
      timer: 0,
    }));
    this.spawnTimer = 0;
    this.molesSpawned = 0;
    this.molesWhacked = 0;
    this.molesMissed = 0;

    return this.buildEntities();
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;
    let scoreDelta = 0;
    let anyChange = false;

    // Update existing mole timers
    for (let i = 0; i < this.holes.length; i++) {
      if (this.holes[i].active) {
        this.holes[i].timer -= dt;
        if (this.holes[i].timer <= 0) {
          this.holes[i].active = false;
          this.holes[i].timer = 0;
          this.molesMissed++;
          scoreDelta -= 5;
          anyChange = true;
        }
      }
    }

    // Spawn new moles
    if (this.molesSpawned < this.totalMoles) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer -= this.spawnInterval;
        this.spawnMole();
        anyChange = true;
      }
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: anyChange ? this.buildEntities() : game.entities,
      score: Math.max(0, game.score + scoreDelta),
    };

    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    // Find which hole was tapped
    const holeIndex = this.getHoleAtPosition(input.position.x, input.position.y);
    if (holeIndex < 0) {
      // Tapped empty area – miss penalty
      return { ...game, score: Math.max(0, game.score - 5) };
    }

    if (!this.holes[holeIndex].active) {
      // Tapped a hole with no mole – miss penalty
      return { ...game, score: Math.max(0, game.score - 5) };
    }

    // Whack the mole!
    this.holes[holeIndex].active = false;
    this.holes[holeIndex].timer = 0;
    this.molesWhacked++;

    return {
      ...game,
      score: game.score + 10,
      entities: this.buildEntities(),
    };
  }

  isComplete(_game: IMicroGame): boolean {
    // All moles have been spawned and all active moles have resolved
    return this.molesSpawned >= this.totalMoles &&
      this.holes.every(h => !h.active);
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.totalMoles * 10;
  }

  // ---- Mole spawning ----

  private spawnMole(): void {
    const inactiveIndices = this.holes
      .map((h, i) => (!h.active ? i : -1))
      .filter(i => i >= 0);

    if (inactiveIndices.length === 0) return;

    const idx = inactiveIndices[Math.floor(Math.random() * inactiveIndices.length)];
    this.holes[idx].active = true;
    this.holes[idx].timer = this.moleStayDuration;
    this.molesSpawned++;
  }

  // ---- Hit testing ----

  private getHoleAtPosition(x: number, y: number): number {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const hx = BOARD_OFFSET_X + c * (HOLE_SIZE + HOLE_GAP);
        const hy = BOARD_OFFSET_Y + r * (HOLE_SIZE + HOLE_GAP);
        if (
          x >= hx && x <= hx + HOLE_SIZE &&
          y >= hy && y <= hy + HOLE_SIZE
        ) {
          return r * GRID_COLS + c;
        }
      }
    }
    return -1;
  }

  // ---- Entity builder ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        entities.push({
          ...this.createEntity(
            BOARD_OFFSET_X + c * (HOLE_SIZE + HOLE_GAP),
            BOARD_OFFSET_Y + r * (HOLE_SIZE + HOLE_GAP),
            HOLE_SIZE,
            HOLE_SIZE,
          ),
          holeIndex: idx,
          hasMole: true,
          moleActive: this.holes[idx].active,
          moleTimer: this.holes[idx].timer,
        } as HoleEntity);
      }
    }

    return entities;
  }

  // ---- Difficulty ----

  private getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
    const configs: Record<number, DifficultyConfig> = {
      [Difficulty.EASY]: { moleStayDuration: 1.5, spawnInterval: 1.2, totalMoles: 10 },
      [Difficulty.NORMAL]: { moleStayDuration: 1.0, spawnInterval: 0.9, totalMoles: 15 },
      [Difficulty.HARD]: { moleStayDuration: 0.7, spawnInterval: 0.6, totalMoles: 20 },
      [Difficulty.EXPERT]: { moleStayDuration: 0.5, spawnInterval: 0.4, totalMoles: 25 },
    };
    return configs[difficulty] ?? configs[Difficulty.NORMAL];
  }
}
