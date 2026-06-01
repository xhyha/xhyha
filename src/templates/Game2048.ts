import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface TileEntity extends IGameEntity {
  value: number;
  row: number;
  col: number;
}

const GRID_SIZE = 4;
const TILE_SIZE = 70;
const TILE_GAP = 6;
const BOARD_OFFSET_X = 20;
const BOARD_OFFSET_Y = 80;

/**
 * 2048 micro-game template.
 * Slide tiles on a 4x4 grid; matching tiles merge and double in value.
 * Tap edges of the board to choose slide direction.
 */
export class Game2048 extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'Game2048';

  private grid: number[][] = [];
  private targetTile: number = 512;
  private gameOver: boolean = false;
  private won: boolean = false;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    this.targetTile = this.getTargetTile(config.difficulty);
    this.gameOver = false;
    this.won = false;

    this.addRandomTile();
    this.addRandomTile();

    return this.buildEntities();
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.gameOver || this.won) return game;

    const direction = this.getDirectionFromTap(input.position.x, input.position.y);
    if (!direction) return game;

    const result = this.slideGrid(direction);
    if (!result.moved) return game;

    this.addRandomTile();

    if (this.hasReachedTarget()) {
      this.won = true;
    } else if (this.isGridStuck()) {
      this.gameOver = true;
    }

    return {
      ...game,
      score: game.score + result.mergeScore,
      entities: this.buildEntities(),
    };
  }

  isComplete(game: IMicroGame): boolean {
    return this.won || this.gameOver;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.targetTile * 10;
  }

  // ---- Direction detection ----

  private getDirectionFromTap(x: number, y: number): string | null {
    const boardCenterX = BOARD_OFFSET_X + (GRID_SIZE * (TILE_SIZE + TILE_GAP)) / 2;
    const boardCenterY = BOARD_OFFSET_Y + (GRID_SIZE * (TILE_SIZE + TILE_GAP)) / 2;

    const dx = x - boardCenterX;
    const dy = y - boardCenterY;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return null;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  // ---- Grid sliding logic ----

  private slideGrid(direction: string): { moved: boolean; mergeScore: number } {
    let totalScore = 0;
    let moved = false;

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const row = [...this.grid[r]];
        const { result, score } = this.slideLine(row, direction === 'right');
        if (this.arraysDiffer(this.grid[r], result)) moved = true;
        this.grid[r] = result;
        totalScore += score;
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = this.grid.map(row => row[c]);
        const { result, score } = this.slideLine(col, direction === 'down');
        if (col.some((v, i) => v !== result[i])) moved = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          this.grid[r][c] = result[r];
        }
        totalScore += score;
      }
    }

    return { moved, mergeScore: totalScore };
  }

  private slideLine(line: number[], reverse: boolean): { result: number[]; score: number } {
    let arr = line.filter(v => v !== 0);
    if (reverse) arr.reverse();

    let score = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr.splice(i + 1, 1);
      }
    }

    if (reverse) arr.reverse();
    while (arr.length < GRID_SIZE) {
      if (reverse) {
        arr.unshift(0);
      } else {
        arr.push(0);
      }
    }

    return { result: arr, score };
  }

  // ---- Tile spawning ----

  private addRandomTile(): void {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    this.grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  }

  // ---- Win / lose checks ----

  private hasReachedTarget(): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] >= this.targetTile) return true;
      }
    }
    return false;
  }

  private isGridStuck(): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = this.grid[r][c];
        if (c < GRID_SIZE - 1 && val === this.grid[r][c + 1]) return false;
        if (r < GRID_SIZE - 1 && val === this.grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  // ---- Entity builders ----

  private buildEntities(): IGameEntity[] {
    const entities: TileEntity[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c] !== 0) {
          entities.push({
            ...this.createEntity(
              BOARD_OFFSET_X + c * (TILE_SIZE + TILE_GAP),
              BOARD_OFFSET_Y + r * (TILE_SIZE + TILE_GAP),
              TILE_SIZE,
              TILE_SIZE,
            ),
            value: this.grid[r][c],
            row: r,
            col: c,
          });
        }
      }
    }
    return entities;
  }

  // ---- Helpers ----

  private arraysDiffer(a: number[], b: number[]): boolean {
    return a.some((v, i) => v !== b[i]);
  }

  private getTargetTile(difficulty: Difficulty): number {
    const targets: Record<number, number> = {
      [Difficulty.EASY]: 256,
      [Difficulty.NORMAL]: 512,
      [Difficulty.HARD]: 1024,
      [Difficulty.EXPERT]: 2048,
    };
    return targets[difficulty] ?? 512;
  }
}
