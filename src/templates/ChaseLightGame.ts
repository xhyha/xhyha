import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
  GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface LightCell extends IGameEntity {
  row: number;
  col: number;
  lit: boolean;
  hit: boolean;
  missed: boolean;
}

/**
 * Chase the Light micro-game.
 * A cell lights up randomly, player must tap it before time runs out.
 */
export class ChaseLightGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'ChaseLight';

  private gridSize: number = 0;
  private litDuration: number = 0;
  private litTimer: number = 0;
  private hits: number = 0;
  private misses: number = 0;
  private totalTargets: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.gridSize = this.getGridSize(config.difficulty);
    this.litDuration = this.getLitDuration(config.difficulty);
    this.litTimer = 0;
    this.hits = 0;
    this.misses = 0;
    this.totalTargets = this.getTotalTargets(config.difficulty);

    const cellSize = Math.min(60, Math.floor(280 / this.gridSize));
    const gap = 4;
    const totalWidth = this.gridSize * (cellSize + gap) - gap;
    const startX = (300 - totalWidth) / 2;

    const entities: LightCell[] = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        entities.push({
          ...this.createEntity(
            startX + col * (cellSize + gap),
            120 + row * (cellSize + gap),
            cellSize,
            cellSize
          ),
          row, col,
          lit: false, hit: false, missed: false,
        });
      }
    }

    // Light up first target
    this.lightRandom(entities);
    return entities;
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    let updated = super.update(game, dt);
    if (updated.state !== GameState.PLAYING) return updated;

    this.litTimer += dt;
    if (this.litTimer >= this.litDuration) {
      this.litTimer = 0;
      const entities = [...updated.entities] as LightCell[];

      // Mark current lit cell as missed
      for (const cell of entities) {
        if (cell.lit && !cell.hit) {
          cell.lit = false;
          cell.missed = true;
          this.misses++;
        }
      }

      if (this.hits + this.misses >= this.totalTargets) {
        return { ...updated, entities, state: GameState.COMPLETED };
      }

      this.lightRandom(entities);
      return { ...updated, entities };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const entities = [...game.entities] as LightCell[];
    const tapped = entities.find(e =>
      e.lit && !e.hit &&
      input.position.x >= e.position.x && input.position.x <= e.position.x + e.size.x &&
      input.position.y >= e.position.y && input.position.y <= e.position.y + e.size.y
    );

    if (tapped) {
      tapped.lit = false;
      tapped.hit = true;
      this.hits++;
      this.litTimer = 0;

      if (this.hits + this.misses >= this.totalTargets) {
        return { ...game, score: game.score + 30, entities, state: GameState.COMPLETED };
      }

      this.lightRandom(entities);
      return { ...game, score: game.score + 30, entities };
    }

    return game;
  }

  isComplete(_game: IMicroGame): boolean {
    return this.hits + this.misses >= this.totalTargets;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.totalTargets * 30;
  }

  private lightRandom(entities: LightCell[]): void {
    const available = entities.filter(e => !e.hit && !e.missed && !e.lit);
    if (available.length > 0) {
      available[Math.floor(Math.random() * available.length)].lit = true;
    }
  }

  private getGridSize(difficulty: Difficulty): number {
    return difficulty >= Difficulty.HARD ? 4 : 3;
  }

  private getLitDuration(difficulty: Difficulty): number {
    const durations: Record<number, number> = {
      [Difficulty.EASY]: 2.0, [Difficulty.NORMAL]: 1.2,
      [Difficulty.HARD]: 0.8, [Difficulty.EXPERT]: 0.5,
    };
    return durations[difficulty] ?? 1.2;
  }

  private getTotalTargets(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 6, [Difficulty.NORMAL]: 10,
      [Difficulty.HARD]: 15, [Difficulty.EXPERT]: 20,
    };
    return counts[difficulty] ?? 10;
  }
}
