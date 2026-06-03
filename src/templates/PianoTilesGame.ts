/**
 * PianoTiles micro-game template.
 * 4 columns of tiles scroll downward; tap the black tiles before they
 * leave the screen. Missing a black tile or tapping an empty space ends
 * the game.
 *
 * Difficulty scaling:
 *   EASY   – slow scroll speed, fewer tiles
 *   NORMAL – moderate speed
 *   HARD   – fast speed, many tiles
 *   EXPERT – very fast, dense tiles
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TileEntity extends IGameEntity {
  column: number;    // 0-3
  tileType: 'black' | 'empty';
  rowIndex: number;  // logical row (for tap matching)
  tapped: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLS = 4;
const COL_WIDTH = 80;
const TILE_HEIGHT = 120;
const BOARD_X = 20;

// ---------------------------------------------------------------------------
// Difficulty parameters
// ---------------------------------------------------------------------------

interface DifficultyParams {
  scrollSpeed: number;   // pixels per second
  spawnInterval: number;  // tiles per second
  maxTiles: number;
}

function getDifficultyParams(difficulty: Difficulty): DifficultyParams {
  const d = difficulty as number;
  const params: Record<number, DifficultyParams> = {
    [Difficulty.EASY]:   { scrollSpeed: 120, spawnInterval: 1.2, maxTiles: 15 },
    [Difficulty.NORMAL]: { scrollSpeed: 200, spawnInterval: 1.6, maxTiles: 25 },
    [Difficulty.HARD]:   { scrollSpeed: 300, spawnInterval: 2.2, maxTiles: 35 },
    [Difficulty.EXPERT]: { scrollSpeed: 400, spawnInterval: 2.8, maxTiles: 50 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// PianoTilesGame
// ---------------------------------------------------------------------------

export class PianoTilesGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'PianoTiles';

  private params!: DifficultyParams;
  private tiles: TileEntity[] = [];
  private spawnTimer = 0;
  private tilesTapped = 0;
  private missed = false;
  private totalSpawned = 0;
  private nextRow = 0;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getDifficultyParams(config.difficulty);
    this.tiles = [];
    this.spawnTimer = 0;
    this.tilesTapped = 0;
    this.missed = false;
    this.totalSpawned = 0;
    this.nextRow = 0;

    // Spawn initial rows so the screen isn't empty.
    for (let i = 0; i < 5; i++) {
      this.spawnRow(-i * TILE_HEIGHT);
    }

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    // Move existing tiles down.
    for (const tile of this.tiles) {
      tile.position.y += this.params.scrollSpeed * dt;
    }

    // Spawn new tiles.
    this.spawnTimer += dt;
    const spawnPeriod = 1 / this.params.spawnInterval;
    if (this.spawnTimer >= spawnPeriod && this.totalSpawned < this.params.maxTiles) {
      this.spawnTimer -= spawnPeriod;
      this.spawnRow(-TILE_HEIGHT);
    }

    // Check if any black tile scrolled off screen → miss.
    for (const tile of this.tiles) {
      if (tile.tileType === 'black' && tile.position.y > 700 && !this.isTileTapped(tile)) {
        this.missed = true;
      }
    }

    // Remove tiles well off-screen.
    this.tiles = this.tiles.filter(t => t.position.y < 900);

    const updated: IMicroGame = {
      ...game,
      elapsed: game.elapsed + dt,
      entities: this.buildEntities(),
      score: this.tilesTapped * 10,
    };

    if (this.isComplete(updated)) {
      return { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.missed) return game;

    const tapX = input.position.x;
    const tapY = input.position.y;

    // Determine which column was tapped.
    const col = Math.floor((tapX - BOARD_X) / COL_WIDTH);
    if (col < 0 || col >= COLS) return game;

    // Find the lowest (closest to bottom) black tile in that column that
    // hasn't been tapped yet and is within vertical range.
    let bestTile: TileEntity | null = null;
    let bestY = -Infinity;

    for (const tile of this.tiles) {
      if (tile.column !== col) continue;
      if (tile.tileType !== 'black') continue;
      if (this.isTileTapped(tile)) continue;
      // Tile must overlap with tap vertically.
      if (tapY >= tile.position.y && tapY <= tile.position.y + TILE_HEIGHT) {
        if (tile.position.y > bestY) {
          bestY = tile.position.y;
          bestTile = tile;
        }
      }
    }

    if (bestTile) {
      bestTile.tapped = true;
      this.tilesTapped++;
    } else {
      // Tapped empty space – game over.
      this.missed = true;
    }

    return {
      ...game,
      score: this.tilesTapped * 10,
      entities: this.buildEntities(),
    };
  }

  // ---- Completion ----

  isComplete(game: IMicroGame): boolean {
    return this.missed || game.elapsed >= game.config.maxDuration;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.params.maxTiles * 10;
  }

  // ---- Private helpers ----

  private spawnRow(startY: number): void {
    const blackCol = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) {
      const tile: TileEntity = {
        ...this.createEntity(
          BOARD_X + c * COL_WIDTH,
          startY,
          COL_WIDTH - 2,
          TILE_HEIGHT - 2,
        ),
        column: c,
        tileType: c === blackCol ? 'black' : 'empty',
        rowIndex: this.nextRow,
        tapped: false,
      };
      this.tiles.push(tile);
    }
    this.totalSpawned++;
    this.nextRow++;
  }

  private isTileTapped(tile: TileEntity): boolean {
    return tile.tapped;
  }

  private buildEntities(): IGameEntity[] {
    return [...this.tiles];
  }
}
