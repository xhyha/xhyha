/**
 * Balloon Pop Math micro-game template.
 * Balloons float upward, each bearing a number. A target equation is shown
 * at the top (e.g., "3 + 4 = ?"). The player must tap the balloon whose
 * number is the correct answer before it escapes off screen.
 *
 * Difficulty scaling:
 *   EASY   – slow balloons (50 px/s), simple single-digit addition, long spawn
 *   NORMAL – moderate speed (70 px/s), addition & subtraction
 *   HARD   – fast balloons (90 px/s), addition, subtraction & multiplication
 *   EXPERT – very fast (110 px/s), all operations including division
 *
 * Score: correct answers × 15, −10 for wrong tap.
 * isComplete: timer expires (maxDuration).
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MathProblem {
  display: string;  // e.g., "3 + 4 = ?"
  answer: number;   // 7
}

interface BalloonEntity extends IGameEntity {
  kind: 'balloon';
  value: number;
  isCorrect: boolean;
  speed: number;
  popped: boolean;
  escaped: boolean;
}

interface EquationEntity extends IGameEntity {
  kind: 'equation';
  display: string;
}

interface ScoreEntity extends IGameEntity {
  kind: 'score';
  correct: number;
  wrong: number;
}

interface BalloonParams {
  speed: number;
  spawnInterval: number;
  numOptions: number;  // how many balloons per question
}

// ---------------------------------------------------------------------------
// Difficulty params
// ---------------------------------------------------------------------------

function getBalloonParams(difficulty: Difficulty): BalloonParams {
  const d = difficulty as number;
  const params: Record<number, BalloonParams> = {
    [Difficulty.EASY]:   { speed: 50, spawnInterval: 3.0, numOptions: 3 },
    [Difficulty.NORMAL]: { speed: 70, spawnInterval: 2.5, numOptions: 4 },
    [Difficulty.HARD]:   { speed: 90, spawnInterval: 2.0, numOptions: 4 },
    [Difficulty.EXPERT]: { speed: 110, spawnInterval: 1.5, numOptions: 5 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

type Operation = '+' | '-' | '×' | '÷';

function generateProblem(difficulty: Difficulty): MathProblem {
  const d = difficulty as number;
  const operations: Operation[] = ['+', '-'];
  if (d >= Difficulty.HARD) operations.push('×');
  if (d >= Difficulty.EXPERT) operations.push('÷');

  const op = operations[Math.floor(Math.random() * operations.length)];

  let a: number, b: number, answer: number;
  const maxNum = d >= Difficulty.HARD ? 12 : 9;

  switch (op) {
    case '+':
      a = randomInt(1, maxNum);
      b = randomInt(1, maxNum);
      answer = a + b;
      break;
    case '-':
      a = randomInt(1, maxNum);
      b = randomInt(1, a); // ensure non-negative result
      answer = a - b;
      break;
    case '×':
      a = randomInt(2, Math.min(maxNum, 12));
      b = randomInt(2, Math.min(maxNum, 12));
      answer = a * b;
      break;
    case '÷':
      b = randomInt(2, Math.min(maxNum, 10));
      answer = randomInt(1, Math.min(maxNum, 10));
      a = b * answer; // ensures clean division
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return {
    display: `${a} ${op} ${b} = ?`,
    answer,
  };
}

function generateDistractors(correct: number, count: number, difficulty: Difficulty): number[] {
  const distractors = new Set<number>();
  const range = difficulty >= Difficulty.HARD ? 20 : 10;

  let attempts = 0;
  while (distractors.size < count && attempts < 100) {
    // Generate plausible distractors near the correct answer
    const offset = randomInt(-range, range);
    const val = correct + offset;
    if (val !== correct && val >= 0) {
      distractors.add(val);
    }
    attempts++;
  }

  // Fill remaining with random numbers if needed
  while (distractors.size < count) {
    distractors.add(randomInt(0, correct + range));
  }

  return Array.from(distractors).slice(0, count);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// BalloonPopGame
// ---------------------------------------------------------------------------

export class BalloonPopGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'BalloonPop';

  private params!: BalloonParams;

  // Current problem state
  private problem: MathProblem | null = null;
  private balloons: BalloonEntity[] = [];
  private correctCount = 0;
  private wrongCount = 0;
  private spawnTimer = 0;
  private waitingForNext = false;
  private nextTimer = 0;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getBalloonParams(config.difficulty);
    this.balloons = [];
    this.correctCount = 0;
    this.wrongCount = 0;
    this.spawnTimer = 0;
    this.waitingForNext = false;
    this.nextTimer = 0;

    this.spawnProblem(config.difficulty);

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;

    // Move balloons upward
    for (const balloon of this.balloons) {
      if (!balloon.popped && !balloon.escaped) {
        balloon.position = {
          x: balloon.position.x,
          y: balloon.position.y - balloon.speed * dt,
        };
        if (balloon.position.y + balloon.size.y < 0) {
          balloon.escaped = true;
        }
      }
    }

    // If correct balloon escaped, spawn next problem
    const correctEscaped = this.balloons.some(b => b.isCorrect && b.escaped);
    if (correctEscaped && !this.waitingForNext) {
      this.waitingForNext = true;
      this.nextTimer = 0;
    }

    // Handle inter-problem delay
    if (this.waitingForNext) {
      this.nextTimer += dt;
      if (this.nextTimer >= 0.5) {
        this.waitingForNext = false;
        this.balloons = [];
        this.spawnProblem(game.config.difficulty);
      }
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      score: this.correctCount * 15 - this.wrongCount * 10,
      entities: this.buildEntities(),
    };

    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    if (newElapsed >= game.config.maxDuration) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    // Find tapped balloon
    for (const balloon of this.balloons) {
      if (balloon.popped || balloon.escaped) continue;

      const cx = balloon.position.x + balloon.size.x / 2;
      const cy = balloon.position.y + balloon.size.y / 2;
      const dx = input.position.x - cx;
      const dy = input.position.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.max(balloon.size.x, balloon.size.y) / 2;

      if (dist <= radius) {
        if (balloon.isCorrect) {
          balloon.popped = true;
          this.correctCount++;
          // All correct balloons popped; spawn next after delay
          this.waitingForNext = true;
          this.nextTimer = 0;
        } else {
          balloon.popped = true;
          this.wrongCount++;
        }

        return {
          ...game,
          score: this.correctCount * 15 - this.wrongCount * 10,
          entities: this.buildEntities(),
        };
      }
    }

    return game;
  }

  // ---- Completion ----

  isComplete(game: IMicroGame): boolean {
    return false; // Only ends by timer (maxDuration)
  }

  protected getMaxScore(game: IMicroGame): number {
    // Estimate: maxDuration / spawnInterval * 15
    return Math.floor((game.config.maxDuration / 2.0) * 15);
  }

  // ---- Private helpers ----

  private spawnProblem(difficulty: Difficulty): void {
    this.problem = generateProblem(difficulty);
    const answer = this.problem.answer;

    // Generate distractor values
    const numDistractors = this.params.numOptions - 1;
    const distractorValues = generateDistractors(answer, numDistractors, difficulty);

    // Create all balloon values (correct + distractors) and shuffle
    const allValues = shuffleArray([answer, ...distractorValues]);

    // Create balloon entities spread across screen width
    const balloonWidth = 50;
    const balloonHeight = 60;
    const screenWidth = 300;
    const spacing = Math.floor(screenWidth / (allValues.length + 1));

    this.balloons = allValues.map((value, i) => ({
      ...this.createEntity(
        spacing * (i + 1) - balloonWidth / 2,
        400 + Math.random() * 40, // slight vertical variation
        balloonWidth,
        balloonHeight,
      ),
      kind: 'balloon' as const,
      value,
      isCorrect: value === answer,
      speed: this.params.speed + (Math.random() - 0.5) * 20,
      popped: false,
      escaped: false,
    }));
  }

  // ---- Entity building ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    // Equation display
    if (this.problem) {
      entities.push({
        ...this.createEntity(10, 20, 280, 30),
        kind: 'equation',
        display: this.problem.display,
      } as EquationEntity);
    }

    // Balloon entities
    for (const balloon of this.balloons) {
      entities.push(balloon);
    }

    // Score display
    entities.push({
      ...this.createEntity(10, 430, 280, 20),
      kind: 'score',
      correct: this.correctCount,
      wrong: this.wrongCount,
    } as ScoreEntity);

    return entities;
  }
}
