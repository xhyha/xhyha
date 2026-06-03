/**
 * Dots and Boxes micro-game template.
 * Classic pencil-and-paper game on a grid of dots.
 * Tap between two adjacent dots to draw a line; completing the fourth
 * side of a box scores a point. Player ('P') versus a simple AI ('A').
 *
 * Difficulty scaling:
 *   EASY   – 3×3 grid of boxes, random AI
 *   NORMAL – 4×4 grid of boxes, smart AI (blocks & takes boxes)
 *   HARD   – 5×5 grid of boxes, strategic AI (chain-seeking)
 *   EXPERT – 6×6 grid of boxes, advanced strategic AI
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LineOwner = '' | 'P' | 'A';
type BoxOwner = '' | 'P' | 'A';

interface DotEntity extends IGameEntity {
  kind: 'dot';
  row: number;
  col: number;
}

interface LineEntity extends IGameEntity {
  kind: 'line';
  /** 'h' for horizontal, 'v' for vertical */
  orientation: 'h' | 'v';
  /** Top-left dot of the line */
  row: number;
  col: number;
  owner: LineOwner;
}

interface BoxEntity extends IGameEntity {
  kind: 'box';
  row: number;
  col: number;
  owner: BoxOwner;
  sidesComplete: number;
}

interface GridParams {
  rows: number; // number of boxes vertically
  cols: number; // number of boxes horizontally
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOT_SIZE = 10;
const LINE_THICKNESS = 6;
const BOARD_PADDING_X = 20;
const BOARD_PADDING_Y = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGridParams(difficulty: Difficulty): GridParams {
  const d = difficulty as number;
  const params: Record<number, GridParams> = {
    [Difficulty.EASY]:   { rows: 3, cols: 3 },
    [Difficulty.NORMAL]: { rows: 4, cols: 4 },
    [Difficulty.HARD]:   { rows: 5, cols: 5 },
    [Difficulty.EXPERT]: { rows: 6, cols: 6 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

/** Index into the horizontal-line array: hLines[row][col] means the line
 *  between dot (row, col) and dot (row, col+1).  Size: (rows+1) × cols. */
/** Index into the vertical-line array: vLines[row][col] means the line
 *  between dot (row, col) and dot (row+1, col).  Size: rows × (cols+1). */

function computeCellSize(params: GridParams): number {
  const availableWidth = 300 - 2 * BOARD_PADDING_X;
  const availableHeight = 400 - BOARD_PADDING_Y;
  const maxCellW = Math.floor((availableWidth - DOT_SIZE) / params.cols);
  const maxCellH = Math.floor((availableHeight - DOT_SIZE) / params.rows);
  return Math.min(maxCellW, maxCellH, 60);
}

// ---------------------------------------------------------------------------
// DotsAndBoxesGame
// ---------------------------------------------------------------------------

export class DotsAndBoxesGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'DotsAndBoxes';

  private params!: GridParams;
  private cellSize = 40;

  // hLines[r][c]: horizontal line between dot(r,c) and dot(r,c+1)
  // dimensions: (rows+1) × cols
  private hLines: LineOwner[][] = [];

  // vLines[r][c]: vertical line between dot(r,c) and dot(r+1,c)
  // dimensions: rows × (cols+1)
  private vLines: LineOwner[][] = [];

  // boxes[r][c]: box whose top-left dot is (r,c)
  private boxes: BoxOwner[][] = [];

  private playerScore = 0;
  private aiScore = 0;
  private isPlayerTurn = true;
  private gameOver = false;
  private totalBoxes = 0;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getGridParams(config.difficulty);
    this.cellSize = computeCellSize(this.params);

    const { rows, cols } = this.params;

    this.hLines = Array.from({ length: rows + 1 }, () => Array<LineOwner>(cols).fill(''));
    this.vLines = Array.from({ length: rows }, () => Array<LineOwner>(cols + 1).fill(''));
    this.boxes = Array.from({ length: rows }, () => Array<BoxOwner>(cols).fill(''));

    this.playerScore = 0;
    this.aiScore = 0;
    this.isPlayerTurn = true;
    this.gameOver = false;
    this.totalBoxes = rows * cols;

    return this.buildEntities();
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.gameOver || !this.isPlayerTurn) return game;

    const line = this.findLineAt(input.position.x, input.position.y);
    if (!line) return game;

    const drawn = this.drawLine(line.orientation, line.row, line.col, 'P');
    if (!drawn) return game;

    const completed = this.checkAndClaimBoxes('P');

    if (!completed) {
      this.isPlayerTurn = false;
    }

    // Check if game over
    this.checkGameOver();

    // If it's AI's turn, schedule AI move (handled via update)
    return {
      ...game,
      score: this.playerScore * 10 + (this.gameOver ? 50 : 0),
      entities: this.buildEntities(),
    };
  }

  // ---- Update (for AI moves) ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== 'PLAYING') return game;

    const newElapsed = game.elapsed + dt;
    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: this.buildEntities(),
    };

    // AI turn: make a move
    if (!this.isPlayerTurn && !this.gameOver) {
      this.aiTurn(game.config.difficulty);
      this.isPlayerTurn = true;
      this.checkGameOver();

      updated = {
        ...updated,
        score: this.playerScore * 10 + (this.gameOver ? 50 : 0),
        entities: this.buildEntities(),
      };
    }

    if (this.isComplete(updated)) {
      updated = { ...updated, state: 'COMPLETED' as any };
    }

    // Check time limit
    if (newElapsed >= game.config.maxDuration) {
      this.gameOver = true;
      updated = { ...updated, state: 'COMPLETED' as any };
    }

    return updated;
  }

  // ---- Completion ----

  isComplete(_game: IMicroGame): boolean {
    return this.gameOver;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.totalBoxes * 10 + 50; // boxes * 10 + completion bonus
  }

  // ---- Private helpers ----

  private findLineAt(
    px: number, py: number,
  ): { orientation: 'h' | 'v'; row: number; col: number } | null {
    const { rows, cols } = this.params;
    const cs = this.cellSize;
    const ox = BOARD_PADDING_X;
    const oy = BOARD_PADDING_Y;

    // Check horizontal lines: between dot(r,c) and dot(r,c+1)
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = ox + c * cs + DOT_SIZE;
        const ly = oy + r * cs + DOT_SIZE / 2 - LINE_THICKNESS / 2;
        const lw = cs - DOT_SIZE;
        const lh = LINE_THICKNESS + 8; // generous tap target
        if (px >= lx && px <= lx + lw && py >= ly && py <= ly + lh) {
          if (this.hLines[r][c] === '') {
            return { orientation: 'h', row: r, col: c };
          }
        }
      }
    }

    // Check vertical lines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const lx = ox + c * cs + DOT_SIZE / 2 - LINE_THICKNESS / 2;
        const ly = oy + r * cs + DOT_SIZE;
        const lw = LINE_THICKNESS + 8;
        const lh = cs - DOT_SIZE;
        if (px >= lx && px <= lx + lw && py >= ly && py <= ly + lh) {
          if (this.vLines[r][c] === '') {
            return { orientation: 'v', row: r, col: c };
          }
        }
      }
    }

    return null;
  }

  private drawLine(
    orientation: 'h' | 'v', row: number, col: number, owner: LineOwner,
  ): boolean {
    if (orientation === 'h') {
      if (this.hLines[row][col] !== '') return false;
      this.hLines[row][col] = owner;
    } else {
      if (this.vLines[row][col] !== '') return false;
      this.vLines[row][col] = owner;
    }
    return true;
  }

  /** Count sides of a box that are drawn. */
  private countSides(r: number, c: number): number {
    let count = 0;
    if (this.hLines[r][c] !== '') count++;     // top
    if (this.hLines[r + 1][c] !== '') count++; // bottom
    if (this.vLines[r][c] !== '') count++;     // left
    if (this.vLines[r][c + 1] !== '') count++; // right
    return count;
  }

  /** Check all boxes; claim any that just became complete. Returns true if any claimed. */
  private checkAndClaimBoxes(owner: LineOwner): boolean {
    let claimed = false;
    const { rows, cols } = this.params;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.boxes[r][c] !== '') continue;
        if (this.countSides(r, c) >= 4) {
          this.boxes[r][c] = owner as BoxOwner;
          if (owner === 'P') this.playerScore++;
          else this.aiScore++;
          claimed = true;
        }
      }
    }
    return claimed;
  }

  private checkGameOver(): void {
    const { rows, cols } = this.params;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.boxes[r][c] === '') return;
      }
    }
    this.gameOver = true;
  }

  // ---- AI ----

  private aiTurn(difficulty: Difficulty): void {
    const d = difficulty as number;

    if (d >= Difficulty.EXPERT) {
      this.aiStrategicMove(true);
    } else if (d >= Difficulty.HARD) {
      this.aiStrategicMove(false);
    } else if (d >= Difficulty.NORMAL) {
      this.aiSmartMove();
    } else {
      this.aiRandomMove();
    }

    // Check if AI completed boxes and gets another turn
    let completed = this.checkAndClaimBoxes('A');
    while (completed && !this.gameOver) {
      // AI gets another turn after completing a box
      if (d >= Difficulty.EXPERT) {
        this.aiStrategicMove(true);
      } else if (d >= Difficulty.HARD) {
        this.aiStrategicMove(false);
      } else if (d >= Difficulty.NORMAL) {
        this.aiSmartMove();
      } else {
        this.aiRandomMove();
      }
      completed = this.checkAndClaimBoxes('A');
      this.checkGameOver();
    }
  }

  /** Get all available (empty) lines. */
  private getAvailableLines(): { orientation: 'h' | 'v'; row: number; col: number }[] {
    const { rows, cols } = this.params;
    const lines: { orientation: 'h' | 'v'; row: number; col: number }[] = [];

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.hLines[r][c] === '') lines.push({ orientation: 'h', row: r, col: c });
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (this.vLines[r][c] === '') lines.push({ orientation: 'v', row: r, col: c });
      }
    }
    return lines;
  }

  private aiRandomMove(): void {
    const available = this.getAvailableLines();
    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    this.drawLine(pick.orientation, pick.row, pick.col, 'A');
  }

  /** Smart AI: completes 3-side boxes, avoids giving boxes. */
  private aiSmartMove(): void {
    const { rows, cols } = this.params;

    // First: complete any box with 3 sides
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.boxes[r][c] !== '') continue;
        if (this.countSides(r, c) === 3) {
          const line = this.findMissingLine(r, c);
          if (line) {
            this.drawLine(line.orientation, line.row, line.col, 'A');
            return;
          }
        }
      }
    }

    // Then: avoid giving boxes (pick lines that don't create 3-side boxes)
    const safe = this.getSafeLines();
    if (safe.length > 0) {
      const pick = safe[Math.floor(Math.random() * safe.length)];
      this.drawLine(pick.orientation, pick.row, pick.col, 'A');
      return;
    }

    // Fallback: random
    this.aiRandomMove();
  }

  /** Strategic AI: seeks chain captures and avoids giving chains. */
  private aiStrategicMove(advanced: boolean): void {
    const { rows, cols } = this.params;

    // First: complete any box with 3 sides
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.boxes[r][c] !== '') continue;
        if (this.countSides(r, c) === 3) {
          const line = this.findMissingLine(r, c);
          if (line) {
            this.drawLine(line.orientation, line.row, line.col, 'A');
            return;
          }
        }
      }
    }

    // Try safe lines first
    const safe = this.getSafeLines();
    if (safe.length > 0) {
      if (advanced) {
        // Prefer lines that are adjacent to boxes with fewer sides (less risky)
        safe.sort((a, b) => {
          const riskA = this.lineRisk(a);
          const riskB = this.lineRisk(b);
          return riskA - riskB;
        });
      }
      const pick = safe[0];
      this.drawLine(pick.orientation, pick.row, pick.col, 'A');
      return;
    }

    // All moves give away boxes; pick the one that gives away the fewest
    const available = this.getAvailableLines();
    if (available.length === 0) return;

    let bestLine = available[0];
    let bestCost = Infinity;
    for (const line of available) {
      const cost = this.countNewThreeSides(line);
      if (cost < bestCost) {
        bestCost = cost;
        bestLine = line;
      }
    }
    this.drawLine(bestLine.orientation, bestLine.row, bestLine.col, 'A');
  }

  /** Find the missing line of a box that has 3 sides. */
  private findMissingLine(
    r: number, c: number,
  ): { orientation: 'h' | 'v'; row: number; col: number } | null {
    if (this.hLines[r][c] === '') return { orientation: 'h', row: r, col: c };
    if (this.hLines[r + 1][c] === '') return { orientation: 'h', row: r + 1, col: c };
    if (this.vLines[r][c] === '') return { orientation: 'v', row: r, col: c };
    if (this.vLines[r][c + 1] === '') return { orientation: 'v', row: r, col: c + 1 };
    return null;
  }

  /** Get lines that don't create a 3-side box. */
  private getSafeLines(): { orientation: 'h' | 'v'; row: number; col: number }[] {
    const available = this.getAvailableLines();
    return available.filter(line => this.countNewThreeSides(line) === 0);
  }

  /** Count how many boxes would get to 3+ sides if this line were drawn. */
  private countNewThreeSides(line: { orientation: 'h' | 'v'; row: number; col: number }): number {
    const { rows, cols } = this.params;
    let count = 0;

    // Collect affected boxes (those adjacent to this line)
    const affectedBoxes: [number, number][] = [];
    if (line.orientation === 'h') {
      if (line.row > 0) affectedBoxes.push([line.row - 1, line.col]);
      if (line.row < rows) affectedBoxes.push([line.row, line.col]);
    } else {
      if (line.col > 0) affectedBoxes.push([line.row, line.col - 1]);
      if (line.col < cols) affectedBoxes.push([line.row, line.col]);
    }

    for (const [br, bc] of affectedBoxes) {
      if (br < 0 || br >= rows || bc < 0 || bc >= cols) continue;
      if (this.boxes[br][bc] !== '') continue;
      // Count sides including the hypothetical new line → current + 1
      if (this.countSides(br, bc) + 1 >= 3) count++;
    }

    return count;
  }

  /** Risk heuristic for a line: sum of sides of adjacent boxes. */
  private lineRisk(line: { orientation: 'h' | 'v'; row: number; col: number }): number {
    const { rows, cols } = this.params;
    let risk = 0;
    const affectedBoxes: [number, number][] = [];
    if (line.orientation === 'h') {
      if (line.row > 0) affectedBoxes.push([line.row - 1, line.col]);
      if (line.row < rows) affectedBoxes.push([line.row, line.col]);
    } else {
      if (line.col > 0) affectedBoxes.push([line.row, line.col - 1]);
      if (line.col < cols) affectedBoxes.push([line.row, line.col]);
    }
    for (const [br, bc] of affectedBoxes) {
      if (br < 0 || br >= rows || bc < 0 || bc >= cols) continue;
      if (this.boxes[br][bc] !== '') continue;
      risk += this.countSides(br, bc);
    }
    return risk;
  }

  // ---- Entity building ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];
    const { rows, cols } = this.params;
    const cs = this.cellSize;
    const ox = BOARD_PADDING_X;
    const oy = BOARD_PADDING_Y;

    // Dot entities at grid intersections
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        entities.push({
          ...this.createEntity(ox + c * cs, oy + r * cs, DOT_SIZE, DOT_SIZE),
          kind: 'dot',
          row: r,
          col: c,
        } as DotEntity);
      }
    }

    // Horizontal line entities
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const owner = this.hLines[r][c];
        entities.push({
          ...this.createEntity(
            ox + c * cs + DOT_SIZE,
            oy + r * cs + DOT_SIZE / 2 - LINE_THICKNESS / 2,
            cs - DOT_SIZE,
            LINE_THICKNESS,
          ),
          kind: 'line',
          orientation: 'h',
          row: r,
          col: c,
          owner,
        } as LineEntity);
      }
    }

    // Vertical line entities
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const owner = this.vLines[r][c];
        entities.push({
          ...this.createEntity(
            ox + c * cs + DOT_SIZE / 2 - LINE_THICKNESS / 2,
            oy + r * cs + DOT_SIZE,
            LINE_THICKNESS,
            cs - DOT_SIZE,
          ),
          kind: 'line',
          orientation: 'v',
          row: r,
          col: c,
          owner,
        } as LineEntity);
      }
    }

    // Box entities (for rendering fill)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        entities.push({
          ...this.createEntity(
            ox + c * cs + DOT_SIZE / 2,
            oy + r * cs + DOT_SIZE / 2,
            cs - DOT_SIZE / 2,
            cs - DOT_SIZE / 2,
          ),
          kind: 'box',
          row: r,
          col: c,
          owner: this.boxes[r][c],
          sidesComplete: this.countSides(r, c),
        } as BoxEntity);
      }
    }

    return entities;
  }
}
