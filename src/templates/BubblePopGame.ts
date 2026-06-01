import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface Bubble extends IGameEntity {
  color: string;
  points: number;
  speed: number;
  popped: boolean;
  escaped: boolean;
}

const BUBBLE_COLORS = [
  { color: '#E74C3C', points: 10 },
  { color: '#3498DB', points: 20 },
  { color: '#2ECC71', points: 15 },
  { color: '#FFD700', points: 30 },
  { color: '#9B59B6', points: 25 },
];

/**
 * Bubble Pop micro-game.
 * Tap rising bubbles before they escape off screen.
 */
export class BubblePopGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'BubblePop';

  private spawnTimer: number = 0;
  private spawnInterval: number = 0;
  private totalSpawned: number = 0;
  private maxBubbles: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.spawnTimer = 0;
    this.spawnInterval = this.getSpawnInterval(config.difficulty);
    this.totalSpawned = 0;
    this.maxBubbles = this.getMaxBubbles(config.difficulty);
    return [];
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    const newElapsed = game.elapsed + dt;
    const entities = [...game.entities] as Bubble[];

    // Move bubbles up
    for (const bubble of entities) {
      if (!bubble.popped && !bubble.escaped) {
        bubble.position = {
          x: bubble.position.x,
          y: bubble.position.y - bubble.speed * dt,
        };
        if (bubble.position.y < -bubble.size.y) {
          bubble.escaped = true;
        }
      }
    }

    // Spawn new bubbles
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.totalSpawned < this.maxBubbles) {
      this.spawnTimer = 0;
      this.totalSpawned++;
      const colorInfo = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      entities.push({
        ...this.createEntity(
          20 + Math.random() * 250,
          420,
          35 + Math.random() * 20,
          35 + Math.random() * 20
        ),
        color: colorInfo.color,
        points: colorInfo.points,
        speed: 60 + Math.random() * 40,
        popped: false,
        escaped: false,
      });
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities,
    };

    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const entities = [...game.entities] as Bubble[];
    for (const bubble of entities) {
      if (bubble.popped || bubble.escaped) continue;
      const dx = input.position.x - (bubble.position.x + bubble.size.x / 2);
      const dy = input.position.y - (bubble.position.y + bubble.size.y / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bubble.size.x) {
        bubble.popped = true;
        return { ...game, score: game.score + bubble.points, entities };
      }
    }
    return game;
  }

  isComplete(game: IMicroGame): boolean {
    return this.totalSpawned >= this.maxBubbles &&
      game.entities.every((e) => (e as Bubble).popped || (e as Bubble).escaped);
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.maxBubbles * 30;
  }

  private getSpawnInterval(difficulty: Difficulty): number {
    const intervals: Record<number, number> = {
      [Difficulty.EASY]: 1.2, [Difficulty.NORMAL]: 0.8,
      [Difficulty.HARD]: 0.5, [Difficulty.EXPERT]: 0.35,
    };
    return intervals[difficulty] ?? 0.8;
  }

  private getMaxBubbles(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 10, [Difficulty.NORMAL]: 15,
      [Difficulty.HARD]: 20, [Difficulty.EXPERT]: 30,
    };
    return counts[difficulty] ?? 15;
  }
}
