import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface CardEntity extends IGameEntity {
  symbol: number;
  flipped: boolean;
  matched: boolean;
}

/**
 * Memory flip micro-game template.
 * Players flip cards to find matching pairs.
 */
export class MemoryFlipGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'MemoryFlip';

  private firstFlipped: CardEntity | null = null;
  private secondFlipped: CardEntity | null = null;
  private pairsFound: number = 0;
  private totalPairs: number = 0;
  private flipCount: number = 0;
  private waitTimer: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.firstFlipped = null;
    this.secondFlipped = null;
    this.pairsFound = 0;
    this.flipCount = 0;
    this.waitTimer = 0;

    const pairs = this.getPairCount(config.difficulty);
    this.totalPairs = pairs;
    const totalCards = pairs * 2;
    const cols = Math.ceil(Math.sqrt(totalCards));

    // Generate symbol pairs and shuffle
    const symbols: number[] = [];
    for (let i = 0; i < pairs; i++) {
      symbols.push(i, i);
    }
    this.shuffle(symbols);

    const entities: CardEntity[] = [];
    const cardSize = 70;
    const gap = 8;
    const offsetX = 30;
    const offsetY = 80;

    for (let i = 0; i < totalCards; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      entities.push({
        ...this.createEntity(
          offsetX + col * (cardSize + gap),
          offsetY + row * (cardSize + gap),
          cardSize,
          cardSize
        ),
        symbol: symbols[i],
        flipped: false,
        matched: false,
      });
    }

    return entities;
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    let updated = super.update(game, dt);

    // Handle wait timer for mismatched pair
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.waitTimer = 0;
        const entities = updated.entities as CardEntity[];
        for (const card of entities) {
          if (card.flipped && !card.matched) {
            card.flipped = false;
          }
        }
        this.firstFlipped = null;
        this.secondFlipped = null;
        updated = { ...updated, entities: [...entities] };
      }
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.waitTimer > 0) return game;

    const card = this.findCardAt(game, input.position.x, input.position.y);
    if (!card) return game;

    const cardEntity = card as CardEntity;
    if (cardEntity.flipped || cardEntity.matched) return game;

    const entities = [...game.entities] as CardEntity[];
    const idx = entities.findIndex(e => e.id === cardEntity.id);
    if (idx < 0) return game;

    entities[idx] = { ...entities[idx], flipped: true };
    this.flipCount++;

    if (!this.firstFlipped) {
      this.firstFlipped = entities[idx];
      return { ...game, entities };
    }

    // Second flip
    this.secondFlipped = entities[idx];

    if (this.firstFlipped.symbol === this.secondFlipped.symbol) {
      // Match found!
      const idx1 = entities.findIndex(e => e.id === this.firstFlipped!.id);
      const idx2 = entities.findIndex(e => e.id === this.secondFlipped!.id);
      entities[idx1] = { ...entities[idx1], matched: true };
      entities[idx2] = { ...entities[idx2], matched: true };
      this.pairsFound++;

      const scorePerPair = Math.max(50, 100 - this.flipCount * 2);
      this.firstFlipped = null;
      this.secondFlipped = null;

      return {
        ...game,
        entities,
        score: game.score + scorePerPair,
      };
    } else {
      // Mismatch - wait then flip back
      this.waitTimer = 0.8; // 800ms to view
      return { ...game, entities };
    }
  }

  isComplete(_game: IMicroGame): boolean {
    return this.pairsFound >= this.totalPairs;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.totalPairs * 100;
  }

  private findCardAt(game: IMicroGame, x: number, y: number): IGameEntity | null {
    return game.entities.find(e =>
      x >= e.position.x && x <= e.position.x + e.size.x &&
      y >= e.position.y && y <= e.position.y + e.size.y
    ) ?? null;
  }

  private getPairCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 4,   // 8 cards (2x4)
      [Difficulty.NORMAL]: 6, // 12 cards (3x4)
      [Difficulty.HARD]: 8,   // 16 cards (4x4)
      [Difficulty.EXPERT]: 10, // 20 cards (4x5)
    };
    return counts[difficulty] ?? 6;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
