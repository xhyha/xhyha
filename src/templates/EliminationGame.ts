import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface TileEntity extends IGameEntity {
  tileType: number;
  row: number;
  col: number;
  matched: boolean;
}

/**
 * Elimination (match-3) micro-game template.
 * Players tap tiles to swap adjacent ones and create matches of 3+.
 */
export class EliminationGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'Elimination';

  private readonly GRID_SIZE_MAP: Record<number, number> = {
    [Difficulty.EASY]: 4,
    [Difficulty.NORMAL]: 5,
    [Difficulty.HARD]: 6,
    [Difficulty.EXPERT]: 7,
  };

  private readonly TILE_TYPES_MAP: Record<number, number> = {
    [Difficulty.EASY]: 4,
    [Difficulty.NORMAL]: 5,
    [Difficulty.HARD]: 6,
    [Difficulty.EXPERT]: 7,
  };

  private selectedTile: TileEntity | null = null;
  private movesLeft: number = 0;
  private targetScore: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    const gridSize = this.GRID_SIZE_MAP[config.difficulty] ?? 5;
    const tileTypes = this.TILE_TYPES_MAP[config.difficulty] ?? 5;
    this.movesLeft = gridSize * 3;
    this.targetScore = gridSize * 100;
    this.selectedTile = null;

    const entities: TileEntity[] = [];
    const cellSize = 60;
    const offsetX = 50;
    const offsetY = 100;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        entities.push({
          ...this.createEntity(
            offsetX + col * cellSize,
            offsetY + row * cellSize,
            cellSize - 4,
            cellSize - 4
          ),
          tileType: Math.floor(Math.random() * tileTypes),
          row,
          col,
          matched: false,
        });
      }
    }
    return entities;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap' || this.movesLeft <= 0) return game;

    const tappedTile = this.findTileAt(game, input.position.x, input.position.y);
    if (!tappedTile) return game;

    let updated = { ...game };

    if (!this.selectedTile) {
      // First selection
      this.selectedTile = tappedTile as TileEntity;
      return updated;
    }

    // Second selection - check adjacency
    const first = this.selectedTile;
    const second = tappedTile as TileEntity;
    const isAdjacent = this.isAdjacent(first, second);

    if (isAdjacent) {
      // Swap tiles
      const newEntities = [...game.entities] as TileEntity[];
      const idx1 = newEntities.findIndex(e => e.id === first.id);
      const idx2 = newEntities.findIndex(e => e.id === second.id);

      if (idx1 >= 0 && idx2 >= 0) {
        // Swap tile types
        const tempType = newEntities[idx1].tileType;
        newEntities[idx1].tileType = newEntities[idx2].tileType;
        newEntities[idx2].tileType = tempType;

        // Check for matches
        const matchedCount = this.countMatches(newEntities);
        if (matchedCount > 0) {
          // Remove matches and add score
          const scorePerMatch = 30;
          updated = {
            ...updated,
            entities: this.removeMatches(newEntities),
            score: game.score + matchedCount * scorePerMatch,
          };
        } else {
          // Swap back - invalid move
          const tempType2 = newEntities[idx1].tileType;
          newEntities[idx1].tileType = newEntities[idx2].tileType;
          newEntities[idx2].tileType = tempType2;
        }
      }

      this.movesLeft--;
    }

    this.selectedTile = null;
    return updated;
  }

  isComplete(game: IMicroGame): boolean {
    return game.score >= this.targetScore || this.movesLeft <= 0;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.targetScore;
  }

  // ---- Private helpers ----

  private findTileAt(game: IMicroGame, x: number, y: number): IGameEntity | null {
    return game.entities.find(e =>
      x >= e.position.x && x <= e.position.x + e.size.x &&
      y >= e.position.y && y <= e.position.y + e.size.y
    ) ?? null;
  }

  private isAdjacent(a: TileEntity, b: TileEntity): boolean {
    const rowDiff = Math.abs(a.row - b.row);
    const colDiff = Math.abs(a.col - b.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  private countMatches(entities: TileEntity[]): number {
    let count = 0;
    const gridSize = Math.sqrt(entities.length);

    // Check horizontal matches
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize - 2; col++) {
        const idx = row * gridSize + col;
        const a = entities[idx];
        const b = entities[idx + 1];
        const c = entities[idx + 2];
        if (a.tileType === b.tileType && b.tileType === c.tileType) {
          a.matched = true;
          b.matched = true;
          c.matched = true;
          count += 3;
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < gridSize; col++) {
      for (let row = 0; row < gridSize - 2; row++) {
        const idx = row * gridSize + col;
        const a = entities[idx];
        const b = entities[idx + gridSize];
        const c = entities[idx + gridSize * 2];
        if (a.tileType === b.tileType && b.tileType === c.tileType) {
          a.matched = true;
          b.matched = true;
          c.matched = true;
          count += 3;
        }
      }
    }

    return count;
  }

  private removeMatches(entities: TileEntity[]): IGameEntity[] {
    return entities.map(e => {
      const tile = e as TileEntity;
      if (tile.matched) {
        return {
          ...tile,
          tileType: Math.floor(Math.random() * 5),
          matched: false,
        };
      }
      return { ...tile, matched: false };
    });
  }
}
