import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
  GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface BreathCircle extends IGameEntity {
  phase: 'inhale' | 'hold' | 'exhale' | 'rest';
  phaseProgress: number; // 0 to 1
  cycleCount: number;
}

/**
 * Breathing exercise micro-game template.
 * Players follow visual breathing cues for relaxation.
 * Score is based on following the rhythm accurately.
 */
export class BreathingGame extends BaseGameTemplate {
  readonly type = GameType.HEALING;
  readonly name = 'Breathing';

  private readonly PHASE_DURATIONS: Record<string, Record<number, number>> = {
    inhale: { [Difficulty.EASY]: 4, [Difficulty.NORMAL]: 4, [Difficulty.HARD]: 5, [Difficulty.EXPERT]: 6 },
    hold:   { [Difficulty.EASY]: 2, [Difficulty.NORMAL]: 4, [Difficulty.HARD]: 4, [Difficulty.EXPERT]: 6 },
    exhale: { [Difficulty.EASY]: 4, [Difficulty.NORMAL]: 4, [Difficulty.HARD]: 5, [Difficulty.EXPERT]: 6 },
    rest:   { [Difficulty.EASY]: 2, [Difficulty.NORMAL]: 2, [Difficulty.HARD]: 2, [Difficulty.EXPERT]: 2 },
  };

  private targetCycles: number = 0;
  private isHolding: boolean = false;
  private holdAccuracy: number[] = [];

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.targetCycles = this.getTargetCycles(config.difficulty);
    this.isHolding = false;
    this.holdAccuracy = [];

    const breathCircle: BreathCircle = {
      ...this.createEntity(140, 150, 80, 80),
      phase: 'inhale',
      phaseProgress: 0,
      cycleCount: 0,
    };

    return [breathCircle];
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;
    const entities = game.entities as BreathCircle[];
    const circle = entities[0];

    if (!circle) return game;

    const phaseDuration = this.getPhaseDuration(circle.phase, game.config.difficulty);
    const newProgress = circle.phaseProgress + dt / phaseDuration;

    let updatedCircle: BreathCircle;

    if (newProgress >= 1) {
      // Move to next phase
      const phases: Array<'inhale' | 'hold' | 'exhale' | 'rest'> = ['inhale', 'hold', 'exhale', 'rest'];
      const currentIdx = phases.indexOf(circle.phase);
      const nextPhase = phases[(currentIdx + 1) % phases.length];
      const newCycleCount = nextPhase === 'inhale' ? circle.cycleCount + 1 : circle.cycleCount;

      // If holding phase, record accuracy
      if (circle.phase === 'hold') {
        this.holdAccuracy.push(this.isHolding ? 1 : 0);
      }

      updatedCircle = {
        ...circle,
        phase: nextPhase,
        phaseProgress: 0,
        cycleCount: newCycleCount,
      };
    } else {
      updatedCircle = { ...circle, phaseProgress: newProgress };
    }

    // Calculate score based on hold accuracy
    const avgAccuracy = this.holdAccuracy.length > 0
      ? this.holdAccuracy.reduce((a, b) => a + b, 0) / this.holdAccuracy.length
      : 1;
    const newScore = Math.round(avgAccuracy * updatedCircle.cycleCount * 100);

    return {
      ...game,
      elapsed: newElapsed,
      score: newScore,
      state: updatedCircle.cycleCount >= this.targetCycles
        ? GameState.COMPLETED
        : game.state,
      entities: [updatedCircle],
    };
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type === 'hold' || input.type === 'tap') {
      const circle = game.entities[0] as BreathCircle;
      if (circle && circle.phase === 'hold') {
        this.isHolding = true;
      }
    }
    if (input.type === 'release') {
      this.isHolding = false;
    }
    return game;
  }

  handleInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (game.state === GameState.IDLE) {
      return this.processInput({ ...game, state: GameState.PLAYING }, input);
    }
    if (game.state === GameState.PLAYING) {
      return this.processInput(game, input);
    }
    return game;
  }

  isComplete(game: IMicroGame): boolean {
    const circle = game.entities[0] as BreathCircle;
    return circle?.cycleCount >= this.targetCycles;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.targetCycles * 100;
  }

  private getTargetCycles(difficulty: Difficulty): number {
    const cycles: Record<number, number> = {
      [Difficulty.EASY]: 3,
      [Difficulty.NORMAL]: 4,
      [Difficulty.HARD]: 5,
      [Difficulty.EXPERT]: 7,
    };
    return cycles[difficulty] ?? 4;
  }

  private getPhaseDuration(phase: string, difficulty: Difficulty): number {
    const phaseMap = this.PHASE_DURATIONS[phase];
    return phaseMap?.[difficulty] ?? 4;
  }
}
