/**
 * Tile Slide micro-game template.
 * Classic sliding puzzle (15-puzzle family): numbered tiles on a grid with
 * one empty space. Tap a tile adjacent to the empty space to slide it.
 * Goal: arrange tiles in numerical order.
 *
 * Difficulty scaling:
 *   EASY   – 3×3 grid (8-puzzle)
 *   NORMAL – 4×4 grid (15-puzzle)
 *   HARD   – 5×5 grid (24-puzzle)
 *   EXPERT – 6×6 grid (35-puzzle)
 *
 * Score starts at maxScore and decreases with each move and elapsed time.
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TileEntity extends IGameEntity {
  kind: 'tile';
  value: number;        // 0 = empty
  gridRow: number;
  gridCol: number;
}

interface GridParams {
  size: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TILE_GAP = 4;
const BOARD_PADDING_X = 20;
const BOARD_PADDING_Y = 80;
const MAX_BOARD_WIDTH = 290;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGridParams(difficulty: Difficulty): GridParams {
  const d = difficulty as number;
  const params: Record<number, GridParams> = {
    [Difficulty.EASY]:   { size: 3 },
    [Difficulty.NORMAL]: { size: 4 },
    [Difficulty.HARD]:   { size: 5 },
    [Difficulty.EXPERT]: { size: 6 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

function computeTileSize(gridSize: number): number {
  return Math.floor((MAX_BOARD_WIDTH - (gridSize - 1) * TILE_GAP) / gridSize);
}

/**
 * Generate a solvable shuffled state by performing random moves from solved.
 * This guarantees solvability.
 */
function generateShuffled(gridSize: number, numMoves: number): number[][] {
  const n = gridSize;
  // Start solved: [[1,2,3],[4,5,6],[7,8,0], ...]
  const grid: number[][] = [];
  let val = 1;
  for (let r = 0; r < n; r++) {
    grid[r] = [];
    for (let c = 0; c < n; c++) {
      grid[r][c] = val++;
    }
  }
  grid[n - 1][n - 1] = 0; // empty

  let emptyR = n - 1;
  let emptyC = n - 1;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let lastDir = -1;

  for (let m = 0; m < numMoves; m++) {
    const validMoves: { dr: number; dc: number; idx: number }[] = [];
    for (let i = 0; i < 4; i++) {
      // Avoid undoing the last move
      if (lastDir >= 0 && ((i === 0 && lastDir === 1) || (i === 1 && lastDir === 0) ||
          (i === 2 && lastDir === 3) || (i === 3 && lastDir === 2))) {
        continue;
      }
      const nr = emptyR + dirs[i][0];
      const nc = emptyC + dirs[i][1];
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        validMoves.push({ dr: dirs[i][0], dc: dirs[i][1], idx: i });
      }
    }
    const pick = validMoves[Math.floor(Math.random() * validMoves.length)];
    const nr = emptyR + pick.dr;
    const nc = emptyC + pick.dc;
    grid[emptyR][emptyC] = grid[nr][nc];
    grid[nr][nc] = 0;
    emptyR = nr;
    emptyC = nc;
    lastDir = pick.idx;
  }

  return grid;
}

// ---------------------------------------------------------------------------
// TileSlideGame
// ---------------------------------------------------------------------------

export class TileSlideGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'TileSlide';

  private params!: GridParams;
  private tileSize = 60;
  private grid: number[][] = [];
  private emptyRow = 0;
  private emptyCol = 0;
  private moveCount = 0;
  private solved = false;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getGridParams(config.difficulty);
    this.tileSize = computeTileSize(this.params.size);

    const n = this.params.size;
    // Number of shuffle moves scales with difficulty
    const shuffleMoves: Record<number, number> = {
      [Difficulty.EASY]: 30,
      [Difficulty.NORMAL]: 80,
      [Difficulty.HARD]: 150,
      [Difficulty.EXPERT]: 250,
    };
    const moves = shuffleMoves[config.difficulty] ?? 80;

    this.grid = generateShuffled(n, moves);
    this.moveCount = 0;
    this.solved = false;

    // Find empty position
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.grid[r][c] === 0) {
          this.emptyRow = r;
          this.emptyCol = c;
        }
      }
    }

    return this.buildEntities();
  }

  // ---- Update (for time-based score decay) ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;
    const updatedEntities = game.entities.map(e => {
      e.update(dt);
      return e;
    });

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: updatedEntities,
      score: this.computeScore(newElapsed),
    };

    // Check time limit
    if (newElapsed >= game.config.maxDuration) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    // Check completion condition
    if (this.isComplete(updated)) {
      this.solved = true;
      updated = { ...updated, state: GameState.COMPLETED, score: this.computeScore(newElapsed) };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.solved) return game;

    // Find which tile was tapped
    const tile = this.findTileAt(input.position.x, input.position.y);
    if (!tile) return game;

    const { row, col } = tile;

    // Check if adjacent to empty space
    const isAdjacent =
      (Math.abs(row - this.emptyRow) === 1 && col === this.emptyCol) ||
      (Math.abs(col - this.emptyCol) === 1 && row === this.emptyRow);

    if (!isAdjacent) return game;

    // Slide tile into empty space
    this.grid[this.emptyRow][this.emptyCol] = this.grid[row][col];
    this.grid[row][col] = 0;
    this.emptyRow = row;
    this.emptyCol = col;
    this.moveCount++;

    return {
      ...game,
      score: this.computeScore(game.elapsed),
      entities: this.buildEntities(),
    };
  }

  // ---- Completion ----

  isComplete(_game: IMicroGame): boolean {
    if (this.solved) return true;
    const n = this.params.size;
    let expected = 1;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r === n - 1 && c === n - 1) {
          if (this.grid[r][c] !== 0) return false;
        } else {
          if (this.grid[r][c] !== expected) return false;
        }
        expected++;
      }
    }
    this.solved = true;
    return true;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return 1000;
  }

  // ---- Private helpers ----

  private computeScore(elapsed: number): number {
    const maxScore = 1000;
    // Penalty: -3 per move, -2 per second
    const movePenalty = this.moveCount * 3;
    const timePenalty = Math.floor(elapsed) * 2;
    return Math.max(0, maxScore - movePenalty - timePenalty);
  }

  private findTileAt(
    px: number, py: number,
  ): { row: number; col: number } | null {
    const n = this.params.size;
    const ts = this.tileSize;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.grid[r][c] === 0) continue;
        const x = BOARD_PADDING_X + c * (ts + TILE_GAP);
        const y = BOARD_PADDING_Y + r * (ts + TILE_GAP);
        if (px >= x && px <= x + ts && py >= y && py <= y + ts) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private buildEntities(): IGameEntity[] {
    const entities: TileEntity[] = [];
    const n = this.params.size;
    const ts = this.tileSize;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const value = this.grid[r][c];
        entities.push({
          ...this.createEntity(
            BOARD_PADDING_X + c * (ts + TILE_GAP),
            BOARD_PADDING_Y + r * (ts + TILE_GAP),
            ts,
            ts,
          ),
          kind: 'tile',
          value,
          gridRow: r,
          gridCol: c,
        });
      }
    }

    return entities;
  }
}
