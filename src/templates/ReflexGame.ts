/**
 * Reflex micro-game template.
 * Pure reaction-time test: wait for a visual signal ("TAP!") then tap
 * as fast as possible. Multiple rounds; score is derived from average
 * reaction time.
 *
 * Difficulty scaling:
 *   EASY   – 5 rounds, longer wait window (up to 4 s)
 *   NORMAL – 7 rounds
 *   HARD   – 8 rounds, shorter random interval
 *   EXPERT – 10 rounds, very short intervals, early-tap penalty
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RoundPhase = 'waiting' | 'ready' | 'tapped' | 'tooEarly';

interface RoundResult {
  reactionMs: number;  // 0 if too early
  tooEarly: boolean;
}

interface ReflexEntity extends IGameEntity {
  kind: 'signal';
  phase: RoundPhase;
  round: number;
  totalRounds: number;
}

// ---------------------------------------------------------------------------
// Difficulty parameters
// ---------------------------------------------------------------------------

interface ReflexParams {
  totalRounds: number;
  minDelay: number;  // seconds before signal
  maxDelay: number;
}

function getReflexParams(difficulty: Difficulty): ReflexParams {
  const d = difficulty as number;
  const params: Record<number, ReflexParams> = {
    [Difficulty.EASY]:   { totalRounds: 5,  minDelay: 1.0, maxDelay: 4.0 },
    [Difficulty.NORMAL]: { totalRounds: 7,  minDelay: 0.8, maxDelay: 3.5 },
    [Difficulty.HARD]:   { totalRounds: 8,  minDelay: 0.5, maxDelay: 3.0 },
    [Difficulty.EXPERT]: { totalRounds: 10, minDelay: 0.3, maxDelay: 2.5 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// ReflexGame
// ---------------------------------------------------------------------------

export class ReflexGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'Reflex';

  private params!: ReflexParams;

  // Per-round state
  private currentRound = 0;
  private phase: RoundPhase = 'waiting';
  private signalTime = 0;       // timestamp when "TAP!" shown
  private delayTimer = 0;       // counts up to the random delay
  private targetDelay = 0;      // randomised delay for current round
  private results: RoundResult[] = [];
  private allDone = false;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getReflexParams(config.difficulty);
    this.currentRound = 0;
    this.phase = 'waiting';
    this.signalTime = 0;
    this.delayTimer = 0;
    this.targetDelay = 0;
    this.results = [];
    this.allDone = false;

    this.startRound();

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    if (this.phase === 'waiting') {
      this.delayTimer += dt;
      if (this.delayTimer >= this.targetDelay) {
        this.phase = 'ready';
        this.signalTime = Date.now();
      }
    }

    const updated: IMicroGame = {
      ...game,
      elapsed: game.elapsed + dt,
      entities: this.buildEntities(),
    };

    if (this.isComplete(updated)) {
      return { ...updated, state: GameState.COMPLETED, score: this.computeScore() };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.allDone) return game;

    if (this.phase === 'waiting') {
      // Tapped too early!
      this.results.push({ reactionMs: 0, tooEarly: true });
      this.advanceRound();
      return {
        ...game,
        entities: this.buildEntities(),
      };
    }

    if (this.phase === 'ready') {
      const reactionMs = Date.now() - this.signalTime;
      this.results.push({ reactionMs, tooEarly: false });
      this.advanceRound();
      return {
        ...game,
        score: this.computeScore(),
        entities: this.buildEntities(),
      };
    }

    return game;
  }

  // ---- Completion ----

  isComplete(_game: IMicroGame): boolean {
    return this.allDone;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return 1000;
  }

  // ---- Private helpers ----

  private startRound(): void {
    this.phase = 'waiting';
    this.delayTimer = 0;
    this.targetDelay =
      this.params.minDelay +
      Math.random() * (this.params.maxDelay - this.params.minDelay);
  }

  private advanceRound(): void {
    this.currentRound++;
    if (this.currentRound >= this.params.totalRounds) {
      this.allDone = true;
      this.phase = 'tapped';
    } else {
      this.startRound();
    }
  }

  private computeScore(): number {
    const validResults = this.results.filter(r => !r.tooEarly);
    if (validResults.length === 0) return 0;

    const avgMs = validResults.reduce((s, r) => s + r.reactionMs, 0) / validResults.length;

    // Score formula: inversely proportional to reaction time.
    // 200 ms → ~1000, 500 ms → ~400, 1000 ms → ~200.
    const multiplier = 200000; // tuning constant
    const baseScore = Math.round(multiplier / Math.max(avgMs, 1));

    // Penalise early taps.
    const earlyTaps = this.results.filter(r => r.tooEarly).length;
    const penalty = earlyTaps * 50;

    return Math.max(0, baseScore - penalty);
  }

  private buildEntities(): IGameEntity[] {
    const entities: ReflexEntity[] = [
      {
        ...this.createEntity(10, 100, 300, 200),
        kind: 'signal',
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.params.totalRounds,
      },
    ];

    // Show result indicators for completed rounds.
    for (let i = 0; i < this.results.length; i++) {
      entities.push({
        ...this.createEntity(10 + i * 32, 340, 28, 28),
        kind: 'signal',
        phase: this.results[i].tooEarly ? 'tooEarly' : 'tapped',
        round: i,
        totalRounds: this.params.totalRounds,
      });
    }

    return entities;
  }
}
