/**
 * Reaction Dual micro-game template.
 * The player must handle two simultaneous tasks on split screen.
 * Left side: tap when a circle turns green (color reaction).
 * Right side: tap when a displayed number matches a target number.
 *
 * Difficulty scaling:
 *   EASY   – slow changes (2.5 s), forgiving timing (1.5 s window)
 *   NORMAL – moderate changes (2.0 s), 1.0 s window
 *   HARD   – fast changes (1.5 s), 0.7 s window
 *   EXPERT – very fast changes (1.0 s), 0.5 s window
 *
 * Score: correct responses × 10, −5 for wrong responses.
 * Game ends: timer expires or too many wrong answers (5+).
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CircleState = 'red' | 'green';

interface DualParams {
  changeInterval: number;  // seconds between state changes
  responseWindow: number;  // seconds player has to react
  maxWrongAnswers: number;
}

interface CircleEntity extends IGameEntity {
  kind: 'circle';
  side: 'left';
  state: CircleState;
}

interface NumberEntity extends IGameEntity {
  kind: 'number';
  side: 'right';
  currentNumber: number;
  targetNumber: number;
  isMatch: boolean;
}

interface StatusEntity extends IGameEntity {
  kind: 'status';
  correct: number;
  wrong: number;
}

// ---------------------------------------------------------------------------
// Difficulty params
// ---------------------------------------------------------------------------

function getDualParams(difficulty: Difficulty): DualParams {
  const d = difficulty as number;
  const params: Record<number, DualParams> = {
    [Difficulty.EASY]:   { changeInterval: 2.5, responseWindow: 1.5, maxWrongAnswers: 7 },
    [Difficulty.NORMAL]: { changeInterval: 2.0, responseWindow: 1.0, maxWrongAnswers: 5 },
    [Difficulty.HARD]:   { changeInterval: 1.5, responseWindow: 0.7, maxWrongAnswers: 4 },
    [Difficulty.EXPERT]: { changeInterval: 1.0, responseWindow: 0.5, maxWrongAnswers: 3 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// ReactionDualGame
// ---------------------------------------------------------------------------

export class ReactionDualGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'ReactionDual';

  private params!: DualParams;

  // Left side state (circle color reaction)
  private circleState: CircleState = 'red';
  private circleTimer = 0;
  private circleActive = false;  // true while green and within window

  // Right side state (number matching)
  private currentNumber = 0;
  private targetNumber = 0;
  private numberTimer = 0;
  private numberActive = false;  // true while current matches target
  private numbers: number[] = [];

  // Scoring
  private correctResponses = 0;
  private wrongResponses = 0;

  private finished = false;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getDualParams(config.difficulty);

    this.circleState = 'red';
    this.circleTimer = 0;
    this.circleActive = false;

    this.currentNumber = 0;
    this.targetNumber = 0;
    this.numberTimer = 0;
    this.numberActive = false;

    this.correctResponses = 0;
    this.wrongResponses = 0;
    this.finished = false;

    // Generate target and initial number
    this.targetNumber = this.randomInt(1, 9);
    this.numbers = this.generateNumbers(this.targetNumber);
    this.currentNumber = this.numbers[0];
    this.advanceNumberState();

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;
    if (this.finished) return game;

    const newElapsed = game.elapsed + dt;

    // Update circle side
    this.circleTimer += dt;
    if (this.circleActive) {
      // Check if response window expired (missed a green)
      if (this.circleTimer >= this.params.responseWindow) {
        this.circleActive = false;
        this.circleState = 'red';
        // Missed = wrong
        this.wrongResponses++;
        this.circleTimer = 0;
        this.scheduleNextGreen();
      }
    } else {
      if (this.circleTimer >= this.params.changeInterval) {
        // Turn green
        this.circleState = 'green';
        this.circleActive = true;
        this.circleTimer = 0;
      }
    }

    // Update number side
    this.numberTimer += dt;
    if (this.numberActive) {
      if (this.numberTimer >= this.params.responseWindow) {
        this.numberActive = false;
        // Missed a match = wrong
        this.wrongResponses++;
        this.advanceNumber();
        this.numberTimer = 0;
      }
    } else {
      if (this.numberTimer >= this.params.changeInterval) {
        this.advanceNumber();
        this.numberTimer = 0;
      }
    }

    // Check too many wrong
    if (this.wrongResponses >= this.params.maxWrongAnswers) {
      this.finished = true;
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      score: this.computeScore(),
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
    if (this.finished) return game;

    const px = input.position.x;

    // Determine which side was tapped (left half or right half)
    if (px < 160) {
      // Left side: circle reaction
      return this.handleCircleTap(game);
    } else {
      // Right side: number matching
      return this.handleNumberTap(game);
    }
  }

  // ---- Completion ----

  isComplete(game: IMicroGame): boolean {
    return this.finished;
  }

  protected getMaxScore(game: IMicroGame): number {
    return 500; // theoretical max
  }

  // ---- Private helpers ----

  private handleCircleTap(game: IMicroGame): IMicroGame {
    if (this.circleActive) {
      // Correct! Tapped while green
      this.correctResponses++;
      this.circleActive = false;
      this.circleState = 'red';
      this.circleTimer = 0;
      this.scheduleNextGreen();
    } else {
      // Wrong: tapped while red
      this.wrongResponses++;
    }

    if (this.wrongResponses >= this.params.maxWrongAnswers) {
      this.finished = true;
    }

    return {
      ...game,
      score: this.computeScore(),
      entities: this.buildEntities(),
    };
  }

  private handleNumberTap(game: IMicroGame): IMicroGame {
    if (this.numberActive) {
      // Correct! Tapped when numbers matched
      this.correctResponses++;
      this.numberActive = false;
      this.advanceNumber();
      this.numberTimer = 0;
    } else {
      // Wrong: tapped when numbers didn't match
      this.wrongResponses++;
    }

    if (this.wrongResponses >= this.params.maxWrongAnswers) {
      this.finished = true;
    }

    return {
      ...game,
      score: this.computeScore(),
      entities: this.buildEntities(),
    };
  }

  private computeScore(): number {
    return Math.max(0, this.correctResponses * 10 - this.wrongResponses * 5);
  }

  private scheduleNextGreen(): void {
    this.circleTimer = -Math.random() * 0.5; // slight randomization
  }

  private generateNumbers(target: number): number[] {
    const nums: number[] = [];
    for (let i = 0; i < 200; i++) {
      // ~25% chance of matching target
      if (Math.random() < 0.25) {
        nums.push(target);
      } else {
        let n: number;
        do {
          n = this.randomInt(1, 9);
        } while (n === target);
        nums.push(n);
      }
    }
    return nums;
  }

  private numberIndex = 0;

  private advanceNumber(): void {
    this.numberIndex++;
    if (this.numberIndex >= this.numbers.length) {
      this.numberIndex = 0;
    }
    this.currentNumber = this.numbers[this.numberIndex];
    this.advanceNumberState();
  }

  private advanceNumberState(): void {
    if (this.currentNumber === this.targetNumber) {
      this.numberActive = true;
    } else {
      this.numberActive = false;
    }
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---- Entity building ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    // Left side: circle
    entities.push({
      ...this.createEntity(20, 120, 120, 120),
      kind: 'circle',
      side: 'left',
      state: this.circleState,
    } as CircleEntity);

    // Divider line
    entities.push(this.createEntity(157, 60, 6, 350));

    // Right side: number display
    entities.push({
      ...this.createEntity(185, 120, 120, 60),
      kind: 'number',
      side: 'right',
      currentNumber: this.currentNumber,
      targetNumber: this.targetNumber,
      isMatch: this.currentNumber === this.targetNumber,
    } as NumberEntity);

    // Right side: target number label
    entities.push({
      ...this.createEntity(185, 60, 120, 40),
      kind: 'number',
      side: 'right',
      currentNumber: this.targetNumber,
      targetNumber: this.targetNumber,
      isMatch: false,
    } as NumberEntity);

    // Status entity
    entities.push({
      ...this.createEntity(10, 430, 300, 20),
      kind: 'status',
      correct: this.correctResponses,
      wrong: this.wrongResponses,
    } as StatusEntity);

    return entities;
  }
}
