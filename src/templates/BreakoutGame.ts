import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface PaddleEntity extends IGameEntity {
  isPaddle: boolean;
}

interface BallEntity extends IGameEntity {
  isBall: boolean;
  vx: number;
  vy: number;
}

interface BrickEntity extends IGameEntity {
  isBrick: boolean;
  broken: boolean;
  row: number;
  col: number;
  color: string;
}

const FIELD_WIDTH = 320;
const FIELD_HEIGHT = 480;
const BRICK_ROWS_MAX = 6;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 18;
const BRICK_TOP_OFFSET = 50;
const BALL_SIZE = 12;

const BRICK_COLORS = ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6'];

interface DifficultyConfig {
  paddleWidth: number;
  ballSpeed: number;
  brickRows: number;
}

/**
 * Breakout / brick-breaker micro-game template.
 * Move the paddle to bounce the ball and destroy all bricks.
 * Tap to position the paddle; ball launches on game start.
 */
export class BreakoutGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'BreakoutGame';

  private paddleX: number = 0;
  private paddleWidth: number = 60;
  private ballX: number = 0;
  private ballY: number = 0;
  private ballVX: number = 0;
  private ballVY: number = 0;
  private ballSpeed: number = 200;
  private bricks: { x: number; y: number; w: number; h: number; broken: boolean; row: number; col: number; color: string }[] = [];
  private bricksRemaining: number = 0;
  private lost: boolean = false;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    const diffConfig = this.getDifficultyConfig(config.difficulty);
    this.paddleWidth = diffConfig.paddleWidth;
    this.ballSpeed = diffConfig.ballSpeed;
    this.lost = false;

    this.paddleX = (FIELD_WIDTH - this.paddleWidth) / 2;

    const brickWidth = (FIELD_WIDTH - 20) / BRICK_COLS;
    this.bricks = [];
    for (let r = 0; r < diffConfig.brickRows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        this.bricks.push({
          x: 10 + c * brickWidth,
          y: BRICK_TOP_OFFSET + r * (BRICK_HEIGHT + 4),
          w: brickWidth - 2,
          h: BRICK_HEIGHT,
          broken: false,
          row: r,
          col: c,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
        });
      }
    }
    this.bricksRemaining = this.bricks.length;

    // Ball starts just above paddle, moving upward
    this.ballX = FIELD_WIDTH / 2 - BALL_SIZE / 2;
    this.ballY = FIELD_HEIGHT - 60 - BALL_SIZE;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    this.ballVX = Math.cos(angle) * this.ballSpeed;
    this.ballVY = Math.sin(angle) * this.ballSpeed;

    return this.buildEntities();
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;
    if (this.lost || this.bricksRemaining <= 0) return game;

    const newElapsed = game.elapsed + dt;
    let scoreDelta = 0;

    // Move ball
    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    // Wall bounces
    if (this.ballX <= 0) {
      this.ballX = 0;
      this.ballVX = Math.abs(this.ballVX);
    }
    if (this.ballX + BALL_SIZE >= FIELD_WIDTH) {
      this.ballX = FIELD_WIDTH - BALL_SIZE;
      this.ballVX = -Math.abs(this.ballVX);
    }
    if (this.ballY <= 0) {
      this.ballY = 0;
      this.ballVY = Math.abs(this.ballVY);
    }

    // Ball below paddle -> lose
    if (this.ballY + BALL_SIZE >= FIELD_HEIGHT) {
      this.lost = true;
      let updated: IMicroGame = {
        ...game,
        elapsed: newElapsed,
        entities: this.buildEntities(),
      };
      if (this.isComplete(updated)) {
        updated = { ...updated, state: GameState.COMPLETED };
      }
      return updated;
    }

    // Paddle bounce
    const paddleY = FIELD_HEIGHT - 40;
    if (
      this.ballVY > 0 &&
      this.ballY + BALL_SIZE >= paddleY &&
      this.ballY + BALL_SIZE <= paddleY + 14 &&
      this.ballX + BALL_SIZE >= this.paddleX &&
      this.ballX <= this.paddleX + this.paddleWidth
    ) {
      this.ballY = paddleY - BALL_SIZE;
      // Angle based on hit position relative to paddle center
      const hitPos = (this.ballX + BALL_SIZE / 2 - this.paddleX) / this.paddleWidth;
      const angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
      const currentSpeed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
      this.ballVX = Math.cos(angle) * currentSpeed;
      this.ballVY = Math.sin(angle) * currentSpeed;
      if (this.ballVY > -20) this.ballVY = -20; // always bounce up
    }

    // Brick collisions
    for (const brick of this.bricks) {
      if (brick.broken) continue;

      if (
        this.ballX + BALL_SIZE > brick.x &&
        this.ballX < brick.x + brick.w &&
        this.ballY + BALL_SIZE > brick.y &&
        this.ballY < brick.y + brick.h
      ) {
        brick.broken = true;
        this.bricksRemaining--;
        scoreDelta += 10;

        // Determine bounce direction
        const overlapLeft = (this.ballX + BALL_SIZE) - brick.x;
        const overlapRight = (brick.x + brick.w) - this.ballX;
        const overlapTop = (this.ballY + BALL_SIZE) - brick.y;
        const overlapBottom = (brick.y + brick.h) - this.ballY;
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          this.ballVX = -this.ballVX;
        } else {
          this.ballVY = -this.ballVY;
        }
        break; // one brick per frame
      }
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

    // Move paddle toward tap x position
    const targetX = input.position.x - this.paddleWidth / 2;
    this.paddleX = Math.max(0, Math.min(FIELD_WIDTH - this.paddleWidth, targetX));

    return { ...game, entities: this.buildEntities() };
  }

  isComplete(game: IMicroGame): boolean {
    return this.bricksRemaining <= 0 || this.lost;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.bricks.length * 10;
  }

  // ---- Entity builder ----

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    // Paddle
    entities.push({
      ...this.createEntity(this.paddleX, FIELD_HEIGHT - 40, this.paddleWidth, 14),
      isPaddle: true,
    } as PaddleEntity);

    // Ball
    entities.push({
      ...this.createEntity(this.ballX, this.ballY, BALL_SIZE, BALL_SIZE),
      isBall: true,
      vx: this.ballVX,
      vy: this.ballVY,
    } as BallEntity);

    // Bricks
    for (const brick of this.bricks) {
      entities.push({
        ...this.createEntity(brick.x, brick.y, brick.w, brick.h),
        isBrick: true,
        broken: brick.broken,
        row: brick.row,
        col: brick.col,
        color: brick.color,
        visible: !brick.broken,
      } as BrickEntity);
    }

    return entities;
  }

  // ---- Difficulty config ----

  private getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
    const configs: Record<number, DifficultyConfig> = {
      [Difficulty.EASY]: { paddleWidth: 80, ballSpeed: 150, brickRows: 3 },
      [Difficulty.NORMAL]: { paddleWidth: 60, ballSpeed: 200, brickRows: 4 },
      [Difficulty.HARD]: { paddleWidth: 45, ballSpeed: 260, brickRows: 5 },
      [Difficulty.EXPERT]: { paddleWidth: 35, ballSpeed: 320, brickRows: 6 },
    };
    return configs[difficulty] ?? configs[Difficulty.NORMAL];
  }
}
