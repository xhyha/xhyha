/**
 * TicTacToe micro-game template.
 * 3×3 grid tic-tac-toe versus a simple AI opponent.
 * Tap an empty cell to place X; the AI responds with O.
 *
 * Difficulty scaling:
 *   EASY   – AI picks a random empty cell
 *   NORMAL – AI blocks immediate wins, otherwise random
 *   HARD   – AI uses minimax with occasional random moves
 *   EXPERT – AI plays a perfect minimax strategy
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CellValue = '' | 'X' | 'O';

interface TicTacToeEntity extends IGameEntity {
  row: number;
  col: number;
  value: CellValue;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID = 3;
const CELL_SIZE = 90;
const CELL_GAP = 6;
const BOARD_X = 30;
const BOARD_Y = 80;

const LINES: [number, number, number, number, number, number][] = [
  // rows
  [0, 0, 0, 1, 0, 2],
  [1, 0, 1, 1, 1, 2],
  [2, 0, 2, 1, 2, 2],
  // cols
  [0, 0, 1, 0, 2, 0],
  [0, 1, 1, 1, 2, 1],
  [0, 2, 1, 2, 2, 2],
  // diags
  [0, 0, 1, 1, 2, 2],
  [0, 2, 1, 1, 2, 0],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cloneBoard(board: CellValue[][]): CellValue[][] {
  return board.map(row => [...row]);
}

function checkWinner(board: CellValue[][]): CellValue {
  for (const [r1, c1, r2, c2, r3, c3] of LINES) {
    const v = board[r1][c1];
    if (v && v === board[r2][c2] && v === board[r3][c3]) return v;
  }
  return '';
}

function isFull(board: CellValue[][]): boolean {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (board[r][c] === '') return false;
    }
  }
  return true;
}

function emptyCells(board: CellValue[][]): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (board[r][c] === '') cells.push({ r, c });
    }
  }
  return cells;
}

// Minimax -----------------------------------------------------------

function minimax(
  board: CellValue[][],
  isMaximising: boolean,
): number {
  const winner = checkWinner(board);
  if (winner === 'O') return 10;   // AI wins
  if (winner === 'X') return -10;  // Player wins
  if (isFull(board)) return 0;     // Draw

  const cells = emptyCells(board);

  if (isMaximising) {
    let best = -Infinity;
    for (const { r, c } of cells) {
      board[r][c] = 'O';
      best = Math.max(best, minimax(board, false));
      board[r][c] = '';
    }
    return best;
  } else {
    let best = Infinity;
    for (const { r, c } of cells) {
      board[r][c] = 'X';
      best = Math.min(best, minimax(board, true));
      board[r][c] = '';
    }
    return best;
  }
}

function bestMove(board: CellValue[][]): { r: number; c: number } | null {
  let bestVal = -Infinity;
  let move: { r: number; c: number } | null = null;
  for (const { r, c } of emptyCells(board)) {
    board[r][c] = 'O';
    const val = minimax(board, false);
    board[r][c] = '';
    if (val > bestVal) {
      bestVal = val;
      move = { r, c };
    }
  }
  return move;
}

function blockingMove(board: CellValue[][]): { r: number; c: number } | null {
  // Check if player is about to win → block.
  for (const { r, c } of emptyCells(board)) {
    board[r][c] = 'X';
    if (checkWinner(board) === 'X') {
      board[r][c] = '';
      return { r, c };
    }
    board[r][c] = '';
  }
  return null;
}

function randomMove(board: CellValue[][]): { r: number; c: number } | null {
  const cells = emptyCells(board);
  if (cells.length === 0) return null;
  return cells[Math.floor(Math.random() * cells.length)];
}

// ---------------------------------------------------------------------------
// TicTacToeGame
// ---------------------------------------------------------------------------

export class TicTacToeGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'TicTacToe';

  private board: CellValue[][] = [];
  private winner: CellValue = '';
  private moveCount = 0;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.board = Array.from({ length: GRID }, () => Array<CellValue>(GRID).fill(''));
    this.winner = '';
    this.moveCount = 0;
    return this.buildEntities();
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.winner || isFull(this.board)) return game;

    // Determine which cell was tapped.
    const col = Math.floor((input.position.x - BOARD_X) / (CELL_SIZE + CELL_GAP));
    const row = Math.floor((input.position.y - BOARD_Y) / (CELL_SIZE + CELL_GAP));

    if (row < 0 || row >= GRID || col < 0 || col >= GRID) return game;
    if (this.board[row][col] !== '') return game;

    // Player places X.
    this.board[row][col] = 'X';
    this.moveCount++;

    if (checkWinner(this.board) === 'X') {
      this.winner = 'X';
      return this.applyScore(game);
    }
    if (isFull(this.board)) {
      return this.applyScore(game);
    }

    // AI places O.
    this.aiMove(game.config.difficulty);
    this.moveCount++;

    if (checkWinner(this.board) === 'O') {
      this.winner = 'O';
    }

    return this.applyScore(game);
  }

  // ---- Completion ----

  isComplete(game: IMicroGame): boolean {
    return this.winner !== '' || isFull(this.board);
  }

  protected getMaxScore(game: IMicroGame): number {
    return 150; // 100 win bonus + up to ~50 time bonus
  }

  // ---- Private helpers ----

  private aiMove(difficulty: Difficulty): void {
    const d = difficulty as number;

    if (d >= Difficulty.EXPERT) {
      // Perfect play
      const m = bestMove(this.board);
      if (m) this.board[m.r][m.c] = 'O';
      return;
    }

    if (d >= Difficulty.HARD) {
      // 80 % minimax, 20 % random
      if (Math.random() < 0.8) {
        const m = bestMove(this.board);
        if (m) { this.board[m.r][m.c] = 'O'; return; }
      }
      const m = randomMove(this.board);
      if (m) this.board[m.r][m.c] = 'O';
      return;
    }

    if (d >= Difficulty.NORMAL) {
      // Block if needed, otherwise random
      const block = blockingMove(this.board);
      if (block) { this.board[block.r][block.c] = 'O'; return; }
      const m = randomMove(this.board);
      if (m) this.board[m.r][m.c] = 'O';
      return;
    }

    // EASY – random
    const m = randomMove(this.board);
    if (m) this.board[m.r][m.c] = 'O';
  }

  private computeScore(game: IMicroGame): number {
    if (this.winner === 'X') {
      // Win: 100 + bonus for fewer moves (faster win)
      const movesUsed = this.moveCount;
      const bonus = Math.max(0, 50 - (movesUsed - 3) * 10);
      return 100 + bonus;
    }
    if (this.winner === 'O') {
      return 0;
    }
    // Draw
    return 50;
  }

  private applyScore(game: IMicroGame): IMicroGame {
    return {
      ...game,
      score: this.computeScore(game),
      entities: this.buildEntities(),
    };
  }

  private buildEntities(): IGameEntity[] {
    const entities: TicTacToeEntity[] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        entities.push({
          ...this.createEntity(
            BOARD_X + c * (CELL_SIZE + CELL_GAP),
            BOARD_Y + r * (CELL_SIZE + CELL_GAP),
            CELL_SIZE,
            CELL_SIZE,
          ),
          row: r,
          col: c,
          value: this.board[r][c],
        });
      }
    }
    return entities;
  }
}
