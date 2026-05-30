import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface TargetEntity extends IGameEntity {
  spawnTime: number;   // when the target should be hit
  hitWindow: number;   // timing tolerance in seconds
  hit: boolean;
  missed: boolean;
}

/**
 * Rhythm tap micro-game template.
 * Targets appear at positions, player must tap them in rhythm.
 */
export class RhythmTapGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'RhythmTap';

  private hitCount: number = 0;
  private missCount: number = 0;
  private comboCount: number = 0;
  private maxCombo: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.hitCount = 0;
    this.missCount = 0;
    this.comboCount = 0;
    this.maxCombo = 0;

    const targetCount = this.getTargetCount(config.difficulty);
    const hitWindow = this.getHitWindow(config.difficulty);
    const entities: TargetEntity[] = [];

    for (let i = 0; i < targetCount; i++) {
      const spawnTime = 1 + i * 1.2; // targets every 1.2 seconds
      entities.push({
        ...this.createEntity(
          50 + Math.random() * 250,
          50 + Math.random() * 350,
          50,
          50
        ),
        spawnTime,
        hitWindow,
        hit: false,
        missed: false,
      });
    }

    return entities;
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    let updated = super.update(game, dt);

    // Check for missed targets
    const entities = updated.entities as TargetEntity[];
    let changed = false;
    for (const entity of entities) {
      if (!entity.hit && !entity.missed) {
        const timeSinceSpawn = updated.elapsed - entity.spawnTime;
        if (timeSinceSpawn > entity.hitWindow * 2) {
          entity.missed = true;
          this.missCount++;
          this.comboCount = 0;
          changed = true;
        }
      }
    }

    if (changed) {
      updated = { ...updated, entities: [...entities] };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const entities = game.entities as TargetEntity[];

    // Find the earliest unhit target near the tap position
    let bestTarget: TargetEntity | null = null;
    let bestDistance = Infinity;

    for (const entity of entities) {
      if (entity.hit || entity.missed) continue;

      const dx = input.position.x - (entity.position.x + entity.size.x / 2);
      const dy = input.position.y - (entity.position.y + entity.size.y / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < entity.size.x && dist < bestDistance) {
        const timingDiff = Math.abs(game.elapsed - entity.spawnTime);
        if (timingDiff <= entity.hitWindow) {
          bestTarget = entity;
          bestDistance = dist;
        }
      }
    }

    if (bestTarget) {
      bestTarget.hit = true;
      this.hitCount++;
      this.comboCount++;
      this.maxCombo = Math.max(this.maxCombo, this.comboCount);

      const comboBonus = Math.min(this.comboCount, 10);
      const scorePerHit = 50 + comboBonus * 5;

      return { ...game, score: game.score + scorePerHit, entities: [...entities] };
    }

    return game;
  }

  isComplete(game: IMicroGame): boolean {
    const entities = game.entities as TargetEntity[];
    return entities.every(e => e.hit || e.missed);
  }

  protected getMaxScore(game: IMicroGame): number {
    const targetCount = game.entities.length;
    return targetCount * 100; // max possible if all perfect
  }

  private getTargetCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 8,
      [Difficulty.NORMAL]: 12,
      [Difficulty.HARD]: 16,
      [Difficulty.EXPERT]: 20,
    };
    return counts[difficulty] ?? 12;
  }

  private getHitWindow(difficulty: Difficulty): number {
    const windows: Record<number, number> = {
      [Difficulty.EASY]: 0.8,
      [Difficulty.NORMAL]: 0.5,
      [Difficulty.HARD]: 0.35,
      [Difficulty.EXPERT]: 0.25,
    };
    return windows[difficulty] ?? 0.5;
  }
}
