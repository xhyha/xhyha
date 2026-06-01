/**
 * Pattern Memory micro-game template.
 * A grid of colored cells flashes a pattern; the player must recreate
 * the pattern from memory. Each round the pattern gets longer (starts at 3).
 *
 * Difficulty scaling:
 *   EASY   – 3×3 grid, 2.5 s display time, pattern grows by 1
 *   NORMAL – 4×4 grid, 2.0 s display time, pattern grows by 1
 *   HARD   – 4×4 grid, 1.2 s display time, pattern grows by 2
 *   EXPERT – 5×5 grid, 0.8 s display time, pattern grows by 2
 *
 * Score: rounds completed × 15
 * isComplete: player makes a mistake or max rounds reached (10).
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'showing' | 'input' | 'feedback' | 'done';

interface CellEntity extends IGameEntity {
  kind: 'cell';
  gridRow: number;
  gridCol: number;
  lit: boolean;
  playerMarked: boolean;
  correct: boolean;
}

interface InfoEntity extends IGameEntity {
  kind: 'info';
  round: number;
  phase: Phase;
}

interface PatternParams {
  gridSize: number;
  displayTime: number;       // seconds to show the pattern
  patternGrowth: number;     // how many cells pattern grows each round
  initialPatternSize: number;
  maxRounds: number;
}

// ---------------------------------------------------------------------------
// Difficulty params
// ---------------------------------------------------------------------------

function getPatternParams(difficulty: Difficulty): PatternParams {
  const d = difficulty as number;
  const params: Record<number, PatternParams> = {
    [Difficulty.EASY]:   { gridSize: 3, displayTime: 2.5, patternGrowth: 1, initialPatternSize: 3, maxRounds: 10 },
    [Difficulty.NORMAL]: { gridSize: 4, displayTime: 2.0, patternGrowth: 1, initialPatternSize: 3, maxRounds: 10 },
    [Difficulty.HARD]:   { gridSize: 4, displayTime: 1.2, patternGrowth: 2, initialPatternSize: 4, maxRounds: 10 },
    [Difficulty.EXPERT]: { gridSize: 5, displayTime: 0.8, patternGrowth: 2, initialPatternSize: 4, maxRounds: 10 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// PatternMemoryGame
// ---------------------------------------------------------------------------

export class PatternMemoryGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'PatternMemory';

  private params!: PatternParams;
  private cellSize = 60;
  private boardPaddingX = 20;
  private boardPaddingY = 80;

  // Game state
  private phase: Phase = 'showing';
  private currentRound = 0;
  private pattern: { row: number; col: number }[] = [];
  private patternSet: Set<string> = new Set();
  private playerInput: { row: number; col: number }[] = [];
  private showTimer = 0;
  private feedbackTimer = 0;
  private roundScore = 0;
  private totalScore = 0;
  private finished = false;
  private lastRoundCorrect = true;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getPatternParams(config.difficulty);

    const maxBoardWidth = 300 - 2 * this.boardPaddingX;
    this.cellSize = Math.floor(
      (maxBoardWidth - (this.params.gridSize - 1) * 4) / this.params.gridSize,
    );

    this.phase = 'showing';
    this.currentRound = 0;
    this.totalScore = 0;
    this.finished = false;
    this.lastRoundCorrect = true;

    this.startRound();

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;
    if (this.finished) return game;

    const newElapsed = game.elapsed + dt;

    if (this.phase === 'showing') {
      this.showTimer += dt;
      if (this.showTimer >= this.params.displayTime) {
        this.phase = 'input';
        this.playerInput = [];
      }
    }

    if (this.phase === 'feedback') {
      this.feedbackTimer += dt;
      if (this.feedbackTimer >= 0.8) {
        if (this.lastRoundCorrect) {
          this.currentRound++;
          if (this.currentRound >= this.params.maxRounds) {
            this.finished = true;
          } else {
            this.startRound();
          }
        } else {
          this.finished = true;
        }
      }
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      score: this.totalScore,
      entities: this.buildEntities(),
    };

    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    if (newElapsed >= game.config.maxDuration) {
      this.finished = true;
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.phase !== 'input') return game;
    if (this.finished) return game;

    const cell = this.findCellAt(input.position.x, input.position.y);
    if (!cell) return game;

    // Check if already tapped
    if (this.playerInput.some(p => p.row === cell.row && p.col === cell.col)) {
      return game;
    }

    this.playerInput.push({ row: cell.row, col: cell.col });

    // Check if this cell is in the pattern
    const key = `${cell.row},${cell.col}`;
    if (!this.patternSet.has(key)) {
      // Wrong cell!
      this.lastRoundCorrect = false;
      this.phase = 'feedback';
      this.feedbackTimer = 0;
      return {
        ...game,
        entities: this.buildEntities(),
      };
    }

    // Correct so far. Check if pattern is fully reproduced.
    if (this.playerInput.length === this.pattern.length) {
      this.lastRoundCorrect = true;
      this.roundScore = this.currentRound * 5 + 15;
      this.totalScore += this.roundScore;
      this.phase = 'feedback';
      this.feedbackTimer = 0;
      return {
        ...game,
        score: this.totalScore,
        entities: this.buildEntities(),
      };
    }

    return {
      ...game,
      entities: this.buildEntities(),
    };
  }

  // ---- Completion ----

  isComplete(game: IMicroGame): boolean {
    return this.finished;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.params.maxRounds * 15;
  }

  // ---- Private helpers ----

  private startRound(): void {
    const n = this.params.gridSize;
    const patternSize = this.params.initialPatternSize +
      this.currentRound * this.params.patternGrowth;

    // Clamp pattern size to grid capacity
    const maxCells = Math.floor(n * n * 0.6);
    const size = Math.min(patternSize, maxCells);

    // Generate random pattern
    this.pattern = [];
    const used = new Set<string>();

    while (this.pattern.length < size) {
      const row = Math.floor(Math.random() * n);
      const col = Math.floor(Math.random() * n);
      const key = `${row},${col}`;
      if (!used.has(key)) {
        used.add(key);
        this.pattern.push({ row, col });
      }
    }

    this.patternSet = used;
    this.playerInput = [];
    this.phase = 'showing';
    this.showTimer = 0;
  }

  private findCellAt(px: number, py: number): { row: number; col: number } | null {
    const n = this.params.gridSize;
    const cs = this.cellSize;
    const gap = 4;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = this.boardPaddingX + c * (cs + gap);
        const y = this.boardPaddingY + r * (cs + gap);
        if (px >= x && px <= x + cs && py >= y && py <= y + cs) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  // ---- Entity building ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];
    const n = this.params.gridSize;
    const cs = this.cellSize;
    const gap = 4;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const key = `${r},${c}`;
        const isLit = this.phase === 'showing' && this.patternSet.has(key);
        const isPlayerMarked = this.playerInput.some(p => p.row === r && p.col === c);
        const isCorrect = this.patternSet.has(key);

        entities.push({
          ...this.createEntity(
            this.boardPaddingX + c * (cs + gap),
            this.boardPaddingY + r * (cs + gap),
            cs,
            cs,
          ),
          kind: 'cell',
          gridRow: r,
          gridCol: c,
          lit: isLit,
          playerMarked: isPlayerMarked,
          correct: isCorrect,
        } as CellEntity);
      }
    }

    // Info entity
    entities.push({
      ...this.createEntity(10, 10, 300, 50),
      kind: 'info',
      round: this.currentRound,
      phase: this.phase,
    } as InfoEntity);

    return entities;
  }
}
