import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
  GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface DotEntity extends IGameEntity {
  order: number;       // The order this dot should be connected
  connected: boolean;  // Whether the player has connected this dot
}

/**
 * Drawing micro-game template.
 * Players connect numbered dots in order to complete a pattern.
 * Tests creativity and spatial awareness.
 */
export class DrawingGame extends BaseGameTemplate {
  readonly type = GameType.CREATE;
  readonly name = 'Drawing';

  private currentOrder: number = 0;
  private totalDots: number = 0;
  private mistakeCount: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.currentOrder = 0;
    this.mistakeCount = 0;

    const dotCount = this.getDotCount(config.difficulty);
    this.totalDots = dotCount;

    const entities: DotEntity[] = [];
    const dotSize = 40;
    const canvasWidth = 300;
    const canvasHeight = 400;
    const margin = 30;

    // Generate dot positions in a pattern (spiral-ish arrangement)
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 3; // spiral
      const radius = 30 + (i / dotCount) * (Math.min(canvasWidth, canvasHeight) / 2 - margin);
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2 + 30;

      const x = centerX + Math.cos(angle) * radius - dotSize / 2;
      const y = centerY + Math.sin(angle) * radius - dotSize / 2;

      entities.push({
        ...this.createEntity(
          Math.max(margin, Math.min(canvasWidth - dotSize, x)),
          Math.max(margin, Math.min(canvasHeight - dotSize, y)),
          dotSize,
          dotSize
        ),
        order: i,
        connected: false,
      });
    }

    return entities;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const tappedDot = this.findDotAt(game, input.position.x, input.position.y);
    if (!tappedDot) return game;

    const dot = tappedDot as DotEntity;
    if (dot.connected) return game;

    // Check if player tapped the correct next dot
    if (dot.order === this.currentOrder) {
      // Correct!
      const entities = [...game.entities] as DotEntity[];
      const idx = entities.findIndex(e => e.id === dot.id);
      if (idx < 0) return game;

      entities[idx] = { ...entities[idx], connected: true };
      this.currentOrder++;

      // Score based on order position + accuracy bonus
      const accuracyBonus = Math.max(0, 20 - this.mistakeCount * 5);
      const scorePerDot = 30 + accuracyBonus;

      return {
        ...game,
        entities,
        score: game.score + scorePerDot,
      };
    } else {
      // Wrong dot - penalty
      this.mistakeCount++;
      return { ...game, score: Math.max(0, game.score - 5) };
    }
  }

  isComplete(game: IMicroGame): boolean {
    return this.currentOrder >= this.totalDots;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.totalDots * 50; // Max if no mistakes
  }

  private findDotAt(game: IMicroGame, x: number, y: number): IGameEntity | null {
    return game.entities.find(e =>
      x >= e.position.x && x <= e.position.x + e.size.x &&
      y >= e.position.y && y <= e.position.y + e.size.y
    ) ?? null;
  }

  private getDotCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 6,
      [Difficulty.NORMAL]: 10,
      [Difficulty.HARD]: 15,
      [Difficulty.EXPERT]: 20,
    };
    return counts[difficulty] ?? 10;
  }
}
