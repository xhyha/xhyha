import {
  IGameTemplate, IGameConfig, IMicroGame, IGameInput,
  IGameResult, GameState, GameType, IGameEntity,
} from '../models/types';

/**
 * Abstract base class for all micro-game templates.
 * Provides common game logic, entity management, and state handling.
 */
export abstract class BaseGameTemplate implements IGameTemplate {
  abstract readonly type: GameType;
  abstract readonly name: string;

  /**
   * Create a new game instance from config
   */
  createGame(config: IGameConfig): IMicroGame {
    return {
      config,
      state: GameState.IDLE,
      score: 0,
      elapsed: 0,
      entities: this.initializeEntities(config),
    };
  }

  /**
   * Handle user input - subclasses can override for specific behavior
   */
  handleInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (game.state === GameState.IDLE) {
      return { ...game, state: GameState.PLAYING };
    }
    if (game.state !== GameState.PLAYING) {
      return game;
    }
    return this.processInput(game, input);
  }

  /**
   * Update game state per frame
   */
  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) {
      return game;
    }

    const newElapsed = game.elapsed + dt;
    const updatedEntities = game.entities.map(e => {
      e.update(dt);
      return e;
    });

    let updated: IMicroGame = {
      ...game,
      elapsed: newElapsed,
      entities: updatedEntities,
    };

    // Check time limit
    if (newElapsed >= game.config.maxDuration) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    // Check completion condition
    if (this.isComplete(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    return updated;
  }

  /**
   * Check if game is complete - subclasses must implement
   */
  abstract isComplete(game: IMicroGame): boolean;

  /**
   * Get game result
   */
  getResult(game: IMicroGame): IGameResult {
    return {
      gameId: game.config.id,
      gameType: game.config.type,
      score: game.score,
      maxScore: this.getMaxScore(game),
      duration: game.elapsed,
      completed: game.state === GameState.COMPLETED,
      difficulty: game.config.difficulty,
      timestamp: Date.now(),
    };
  }

  // ===== Protected methods for subclasses =====

  /**
   * Initialize game entities - subclasses must implement
   */
  protected abstract initializeEntities(config: IGameConfig): IGameEntity[];

  /**
   * Process input during gameplay - subclasses can override
   */
  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    return game;
  }

  /**
   * Get maximum possible score - subclasses can override
   */
  protected getMaxScore(game: IMicroGame): number {
    return 1000;
  }

  /**
   * Helper: generate a unique entity ID
   */
  protected generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: create a simple entity
   */
  protected createEntity(
    x: number, y: number,
    width: number, height: number,
    updateFn?: (dt: number) => void
  ): IGameEntity {
    return {
      id: this.generateId(),
      position: { x, y },
      size: { x: width, y: height },
      visible: true,
      update: updateFn ?? (() => {}),
    };
  }
}
