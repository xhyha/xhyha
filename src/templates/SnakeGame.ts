import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface SnakeSegment extends IGameEntity {
  isHead: boolean;
  segmentIndex: number;
}

interface FoodEntity extends IGameEntity {
  isFood: boolean;
}

const GRID_SIZE = 15;
const CELL_SIZE = 24;
const BOARD_OFFSET_X = 15;
const BOARD_OFFSET_Y = 40;

type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Snake micro-game template.
 * Classic grid-based snake: eat food, grow longer, avoid walls and yourself.
 * Tap relative to the snake head to steer.
 */
export class SnakeGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'SnakeGame';

  private snake: { row: number; col: number }[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private food: { row: number; col: number } | null = null;
  private moveTimer: number = 0;
  private moveInterval: number = 0.2;
  private dead: boolean = false;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.moveInterval = this.getMoveInterval(config.difficulty);
    this.dead = false;
    this.moveTimer = 0;

    const centerRow = Math.floor(GRID_SIZE / 2);
    const centerCol = Math.floor(GRID_SIZE / 2);
    this.snake = [
      { row: centerRow, col: centerCol },
      { row: centerRow, col: centerCol - 1 },
      { row: centerRow, col: centerCol - 2 },
    ];
    this.direction = 'right';
    this.nextDirection = 'right';

    this.placeFood();

    return this.buildEntities();
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;
    if (this.dead) return game;

    const newElapsed = game.elapsed + dt;
    this.moveTimer += dt;

    let scoreDelta = 0;

    while (this.moveTimer >= this.moveInterval && !this.dead) {
      this.moveTimer -= this.moveInterval;
      this.direction = this.nextDirection;
      const ate = this.moveSnake();
      if (ate) scoreDelta += 10;
    }

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: this.buildEntities(),
      score: game.score + scoreDelta,
    };

    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.dead) return game;

    const head = this.snake[0];
    const headX = BOARD_OFFSET_X + head.col * CELL_SIZE + CELL_SIZE / 2;
    const headY = BOARD_OFFSET_Y + head.row * CELL_SIZE + CELL_SIZE / 2;

    const dx = input.position.x - headX;
    const dy = input.position.y - headY;

    let newDir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      newDir = dx > 0 ? 'right' : 'left';
    } else {
      newDir = dy > 0 ? 'down' : 'up';
    }

    if (!this.isOpposite(newDir, this.direction)) {
      this.nextDirection = newDir;
    }

    return game;
  }

  isComplete(game: IMicroGame): boolean {
    return this.dead;
  }

  protected getMaxScore(game: IMicroGame): number {
    return GRID_SIZE * GRID_SIZE * 10;
  }

  // ---- Movement ----

  private moveSnake(): boolean {
    const head = this.snake[0];
    let newRow = head.row;
    let newCol = head.col;

    switch (this.direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; break;
      case 'right': newCol++; break;
    }

    // Wall collision
    if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
      this.dead = true;
      return false;
    }

    // Self collision
    if (this.snake.some(s => s.row === newRow && s.col === newCol)) {
      this.dead = true;
      return false;
    }

    this.snake.unshift({ row: newRow, col: newCol });

    // Check food
    if (this.food && newRow === this.food.row && newCol === this.food.col) {
      this.placeFood();
      return true; // ate
    }

    this.snake.pop();
    return false;
  }

  // ---- Food ----

  private placeFood(): void {
    const occupied = new Set(this.snake.map(s => `${s.row},${s.col}`));
    const empty: { row: number; col: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
      }
    }
    if (empty.length === 0) {
      this.food = null;
      return;
    }
    this.food = empty[Math.floor(Math.random() * empty.length)];
  }

  // ---- Helpers ----

  private isOpposite(a: Direction, b: Direction): boolean {
    return (a === 'up' && b === 'down') ||
           (a === 'down' && b === 'up') ||
           (a === 'left' && b === 'right') ||
           (a === 'right' && b === 'left');
  }

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      entities.push({
        ...this.createEntity(
          BOARD_OFFSET_X + seg.col * CELL_SIZE,
          BOARD_OFFSET_Y + seg.row * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        ),
        isHead: i === 0,
        segmentIndex: i,
      } as SnakeSegment);
    }

    if (this.food) {
      entities.push({
        ...this.createEntity(
          BOARD_OFFSET_X + this.food.col * CELL_SIZE,
          BOARD_OFFSET_Y + this.food.row * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        ),
        isFood: true,
      } as FoodEntity);
    }

    return entities;
  }

  private getMoveInterval(difficulty: Difficulty): number {
    const intervals: Record<number, number> = {
      [Difficulty.EASY]: 0.3,
      [Difficulty.NORMAL]: 0.2,
      [Difficulty.HARD]: 0.15,
      [Difficulty.EXPERT]: 0.1,
    };
    return intervals[difficulty] ?? 0.2;
  }
}
