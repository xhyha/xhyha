import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface BasketEntity extends IGameEntity {
  isBasket: boolean;
}

interface FallingItem extends IGameEntity {
  itemType: 'coin' | 'gold' | 'bomb';
  points: number;
  speed: number;
  caught: boolean;
  missed: boolean;
}

const FIELD_WIDTH = 320;
const FIELD_HEIGHT = 480;
const BASKET_HEIGHT = 20;

interface DifficultyConfig {
  basketWidth: number;
  coinSpeed: number;
  spawnInterval: number;
  bombChance: number;
}

/**
 * Catch-Coins micro-game template.
 * Coins (and bombs) fall from the top; move the basket to catch coins and dodge bombs.
 * The game ends when the timer (maxDuration) runs out.
 */
export class CatchCoinsGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'CatchCoins';

  private basketX: number = 0;
  private basketWidth: number = 50;
  private items: {
    x: number; y: number;
    itemType: 'coin' | 'gold' | 'bomb';
    points: number;
    speed: number;
    caught: boolean;
    missed: boolean;
    size: number;
  }[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.8;
  private coinSpeed: number = 120;
  private bombChance: number = 0;
  private diffConfig: DifficultyConfig | null = null;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.diffConfig = this.getDifficultyConfig(config.difficulty);
    this.basketWidth = this.diffConfig.basketWidth;
    this.coinSpeed = this.diffConfig.coinSpeed;
    this.spawnInterval = this.diffConfig.spawnInterval;
    this.bombChance = this.diffConfig.bombChance;

    this.basketX = (FIELD_WIDTH - this.basketWidth) / 2;
    this.items = [];
    this.spawnTimer = 0;

    return this.buildEntities();
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;
    let scoreDelta = 0;
    let anyChange = false;

    const basketTop = FIELD_HEIGHT - BASKET_HEIGHT - 10;

    // Move items down
    for (const item of this.items) {
      if (item.caught || item.missed) continue;

      item.y += item.speed * dt;
      anyChange = true;

      // Check if caught by basket
      if (
        item.y + item.size >= basketTop &&
        item.y + item.size <= basketTop + BASKET_HEIGHT + item.speed * dt &&
        item.x + item.size > this.basketX &&
        item.x < this.basketX + this.basketWidth
      ) {
        item.caught = true;
        scoreDelta += item.points;
        continue;
      }

      // Check if fell off screen
      if (item.y > FIELD_HEIGHT + 10) {
        item.missed = true;
      }
    }

    // Spawn new items
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      this.spawnItem();
      anyChange = true;
    }

    // Clean up old items (performance)
    if (this.items.length > 50) {
      this.items = this.items.filter(i => !i.caught && !i.missed);
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: anyChange ? this.buildEntities() : game.entities,
      score: Math.max(0, game.score + scoreDelta),
    };

    // Time-based completion
    if (newElapsed >= game.config.maxDuration || this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    // Move basket to tap x position
    const targetX = input.position.x - this.basketWidth / 2;
    this.basketX = Math.max(0, Math.min(FIELD_WIDTH - this.basketWidth, targetX));

    return { ...game, entities: this.buildEntities() };
  }

  isComplete(game: IMicroGame): boolean {
    return game.elapsed >= game.config.maxDuration;
  }

  protected getMaxScore(game: IMicroGame): number {
    return Math.floor(game.config.maxDuration / (this.spawnInterval || 0.8)) * 25;
  }

  // ---- Item spawning ----

  private spawnItem(): void {
    const roll = Math.random();
    let itemType: 'coin' | 'gold' | 'bomb';
    let points: number;
    let size: number;

    if (roll < this.bombChance) {
      itemType = 'bomb';
      points = -20;
      size = 24;
    } else if (roll < this.bombChance + 0.2) {
      itemType = 'gold';
      points = 25;
      size = 22;
    } else {
      itemType = 'coin';
      points = 10;
      size = 20;
    }

    this.items.push({
      x: 10 + Math.random() * (FIELD_WIDTH - 20 - size),
      y: -size,
      itemType,
      points,
      speed: this.coinSpeed + Math.random() * 40,
      caught: false,
      missed: false,
      size,
    });
  }

  // ---- Entity builder ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    // Basket
    entities.push({
      ...this.createEntity(this.basketX, FIELD_HEIGHT - BASKET_HEIGHT - 10, this.basketWidth, BASKET_HEIGHT),
      isBasket: true,
    } as BasketEntity);

    // Falling items
    for (const item of this.items) {
      if (item.caught || item.missed) continue;
      entities.push({
        ...this.createEntity(item.x, item.y, item.size, item.size),
        itemType: item.itemType,
        points: item.points,
        speed: item.speed,
        caught: item.caught,
        missed: item.missed,
        visible: !item.caught && !item.missed,
      } as FallingItem);
    }

    return entities;
  }

  // ---- Difficulty ----

  private getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
    const configs: Record<number, DifficultyConfig> = {
      [Difficulty.EASY]: { basketWidth: 70, coinSpeed: 80, spawnInterval: 1.0, bombChance: 0.0 },
      [Difficulty.NORMAL]: { basketWidth: 55, coinSpeed: 120, spawnInterval: 0.8, bombChance: 0.1 },
      [Difficulty.HARD]: { basketWidth: 42, coinSpeed: 170, spawnInterval: 0.6, bombChance: 0.2 },
      [Difficulty.EXPERT]: { basketWidth: 32, coinSpeed: 220, spawnInterval: 0.45, bombChance: 0.3 },
    };
    return configs[difficulty] ?? configs[Difficulty.NORMAL];
  }
}
