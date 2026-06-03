/**
 * Maze micro-game template.
 * Navigate a procedurally generated maze from start to exit.
 * The player taps an adjacent cell (or the destination) to move.
 *
 * Maze is generated via depth-first search (recursive back-tracker).
 *
 * Difficulty scaling:
 *   EASY   – 5×5
 *   NORMAL – 7×7
 *   HARD   – 10×10
 *   EXPERT – 13×13
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Cell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface PlayerEntity extends IGameEntity {
  kind: 'player';
  row: number;
  col: number;
}

interface ExitEntity extends IGameEntity {
  kind: 'exit';
  row: number;
  col: number;
}

interface WallEntity extends IGameEntity {
  kind: 'wall';
  orientation: 'horizontal' | 'vertical';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_W = 320;
const HEADER = 60;

function getMazeSize(difficulty: Difficulty): number {
  const sizes: Record<number, number> = {
    [Difficulty.EASY]: 5,
    [Difficulty.NORMAL]: 7,
    [Difficulty.HARD]: 10,
    [Difficulty.EXPERT]: 13,
  };
  return sizes[difficulty as number] ?? 7;
}

// ---------------------------------------------------------------------------
// Maze generation (DFS / recursive back-tracker)
// ---------------------------------------------------------------------------

function generateMaze(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        row: r, col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
    }
  }

  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, rows, cols);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  return grid;
}

function getUnvisitedNeighbors(
  cell: Cell, grid: Cell[][], rows: number, cols: number,
): Cell[] {
  const { row, col } = cell;
  const n: Cell[] = [];
  if (row > 0 && !grid[row - 1][col].visited) n.push(grid[row - 1][col]);
  if (row < rows - 1 && !grid[row + 1][col].visited) n.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) n.push(grid[row][col - 1]);
  if (col < cols - 1 && !grid[row][col + 1].visited) n.push(grid[row][col + 1]);
  return n;
}

function removeWall(a: Cell, b: Cell): void {
  const dr = a.row - b.row;
  const dc = a.col - b.col;
  if (dr === 1)  { a.walls.top = false;    b.walls.bottom = false; }
  if (dr === -1) { a.walls.bottom = false; b.walls.top = false; }
  if (dc === 1)  { a.walls.left = false;   b.walls.right = false; }
  if (dc === -1) { a.walls.right = false;  b.walls.left = false; }
}

// ---------------------------------------------------------------------------
// MazeGame
// ---------------------------------------------------------------------------

export class MazeGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'Maze';

  private mazeSize = 7;
  private grid: Cell[][] = [];
  private playerRow = 0;
  private playerCol = 0;
  private exitRow = 0;
  private exitCol = 0;
  private moveCount = 0;
  private cellSize = 0;
  private offsetX = 0;
  private offsetY = 0;
  private solved = false;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.mazeSize = getMazeSize(config.difficulty);
    this.grid = generateMaze(this.mazeSize, this.mazeSize);

    this.cellSize = Math.floor(
      Math.min(CANVAS_W, 480 - HEADER) / this.mazeSize,
    );
    this.offsetX = Math.floor((CANVAS_W - this.mazeSize * this.cellSize) / 2);
    this.offsetY = HEADER;

    this.playerRow = 0;
    this.playerCol = 0;
    this.exitRow = this.mazeSize - 1;
    this.exitCol = this.mazeSize - 1;
    this.moveCount = 0;
    this.solved = false;

    return this.buildEntities();
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.solved) return game;

    // Determine which cell was tapped.
    const tapCol = Math.floor((input.position.x - this.offsetX) / this.cellSize);
    const tapRow = Math.floor((input.position.y - this.offsetY) / this.cellSize);

    if (tapRow < 0 || tapRow >= this.mazeSize || tapCol < 0 || tapCol >= this.mazeSize) {
      return game;
    }

    // Only allow moving to an adjacent cell with no wall between.
    if (this.canMove(this.playerRow, this.playerCol, tapRow, tapCol)) {
      this.playerRow = tapRow;
      this.playerCol = tapCol;
      this.moveCount++;

      if (this.playerRow === this.exitRow && this.playerCol === this.exitCol) {
        this.solved = true;
      }

      return {
        ...game,
        score: this.computeScore(game),
        entities: this.buildEntities(),
      };
    }

    return game;
  }

  // ---- Completion ----

  isComplete(_game: IMicroGame): boolean {
    return this.solved;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return 100;
  }

  // ---- Private helpers ----

  private canMove(fromR: number, fromC: number, toR: number, toC: number): boolean {
    const dr = toR - fromR;
    const dc = toC - fromC;

    // Must be exactly one step.
    if (Math.abs(dr) + Math.abs(dc) !== 1) return false;

    const cell = this.grid[fromR][fromC];
    if (dr === -1) return !cell.walls.top;
    if (dr === 1)  return !cell.walls.bottom;
    if (dc === -1) return !cell.walls.left;
    if (dc === 1)  return !cell.walls.right;

    return false;
  }

  private computeScore(game: IMicroGame): number {
    if (!this.solved) return 0;
    const optimalMoves = this.mazeSize * 2 - 2; // rough heuristic
    const movePenalty = Math.max(0, this.moveCount - optimalMoves) * 2;
    const timePenalty = Math.min(50, Math.floor(game.elapsed));
    return Math.max(0, 100 - movePenalty - timePenalty);
  }

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];
    const cs = this.cellSize;

    // Player entity.
    const player: PlayerEntity = {
      id: 'player',
      position: {
        x: this.offsetX + this.playerCol * cs + cs / 4,
        y: this.offsetY + this.playerRow * cs + cs / 4,
      },
      size: { x: cs / 2, y: cs / 2 },
      visible: true,
      update: () => {},
      kind: 'player',
      row: this.playerRow,
      col: this.playerCol,
    };
    entities.push(player);

    // Exit entity.
    const exit: ExitEntity = {
      id: 'exit',
      position: {
        x: this.offsetX + this.exitCol * cs + cs / 4,
        y: this.offsetY + this.exitRow * cs + cs / 4,
      },
      size: { x: cs / 2, y: cs / 2 },
      visible: true,
      update: () => {},
      kind: 'exit',
      row: this.exitRow,
      col: this.exitCol,
    };
    entities.push(exit);

    // Wall segments.
    const wallThickness = 2;

    for (let r = 0; r < this.mazeSize; r++) {
      for (let c = 0; c < this.mazeSize; c++) {
        const cell = this.grid[r][c];
        const x = this.offsetX + c * cs;
        const y = this.offsetY + r * cs;

        if (cell.walls.top) {
          entities.push({
            ...this.createEntity(x, y, cs, wallThickness),
          } as WallEntity);
        }
        if (cell.walls.left) {
          entities.push({
            ...this.createEntity(x, y, wallThickness, cs),
          } as WallEntity);
        }
        // Right border of last column.
        if (c === this.mazeSize - 1 && cell.walls.right) {
          entities.push({
            ...this.createEntity(x + cs, y, wallThickness, cs),
          } as WallEntity);
        }
        // Bottom border of last row.
        if (r === this.mazeSize - 1 && cell.walls.bottom) {
          entities.push({
            ...this.createEntity(x, y + cs, cs, wallThickness),
          } as WallEntity);
        }
      }
    }

    return entities;
  }
}
