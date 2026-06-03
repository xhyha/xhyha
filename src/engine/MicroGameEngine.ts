import {
  IMicroGame, IGameInput, IGameResult,
  ITriggerContext, IUserProfile, GameState, GenesisEvent,
  ITrigger,
} from '../models/types';
import { EventEmitter } from '../core/EventEmitter';
import { TemplateFactory } from './TemplateFactory';
import { TriggerEngine, ITriggerResult } from './TriggerEngine';
import { PersonalizationEngine, IGameRecommendation } from './PersonalizationEngine';

/**
 * Main Genesis Engine - orchestrates micro-game generation and lifecycle.
 *
 * Usage:
 *   const engine = new GenesisEngine();
 *   const game = engine.generateGame(userProfile, triggerContext);
 *   engine.startGame(game);
 *   engine.handleInput(input);
 *   const result = engine.endGame();
 */
export class MicroGameEngine {
  private templateFactory: TemplateFactory;
  private triggerEngine: TriggerEngine;
  private personalizationEngine: PersonalizationEngine;
  private eventEmitter: EventEmitter;
  private activeGame: IMicroGame | null = null;
  private gameHistory: IGameResult[] = [];

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.templateFactory = new TemplateFactory();
    this.triggerEngine = new TriggerEngine(this.eventEmitter);
    this.personalizationEngine = new PersonalizationEngine();
  }

  /**
   * Check if a trigger should fire and generate a game
   */
  checkTrigger(context: ITriggerContext): ITriggerResult {
    return this.triggerEngine.evaluate(context);
  }

  /**
   * Generate a micro-game based on user profile and context
   */
  generateGame(profile: IUserProfile, _context: ITriggerContext): IMicroGame | null {
    const recommendation = this.personalizationEngine.recommend(profile);
    const template = this.templateFactory.getTemplate(recommendation.gameType);

    if (!template) {
      return null;
    }

    const config = this.personalizationEngine.generateConfig(
      recommendation,
      template.name
    );

    const game = template.createGame(config);

    this.eventEmitter.emit(GenesisEvent.GAME_CREATED, {
      gameId: config.id,
      gameType: config.type,
      recommendation,
    });

    return game;
  }

  /**
   * Start a generated game
   */
  startGame(game: IMicroGame): void {
    this.activeGame = { ...game, state: GameState.PLAYING };
    this.eventEmitter.emit(GenesisEvent.GAME_STARTED, {
      gameId: game.config.id,
    });
  }

  /**
   * Process user input on active game
   */
  handleInput(input: IGameInput): IMicroGame | null {
    if (!this.activeGame) return null;

    const template = this.templateFactory.getTemplate(this.activeGame.config.type);
    if (!template) return null;

    this.activeGame = template.handleInput(this.activeGame, input);
    return this.activeGame;
  }

  /**
   * Update active game state (called per frame)
   */
  update(dt: number): IMicroGame | null {
    if (!this.activeGame || this.activeGame.state !== GameState.PLAYING) {
      return this.activeGame;
    }

    const template = this.templateFactory.getTemplate(this.activeGame.config.type);
    if (!template) return this.activeGame;

    this.activeGame = template.update(this.activeGame, dt);

    // Check if game ended
    if (this.activeGame.state === GameState.COMPLETED) {
      this.eventEmitter.emit(GenesisEvent.GAME_COMPLETED, {
        gameId: this.activeGame.config.id,
        score: this.activeGame.score,
      });
    }

    return this.activeGame;
  }

  /**
   * End the current game and get result
   */
  endGame(): IGameResult | null {
    if (!this.activeGame) return null;

    const template = this.templateFactory.getTemplate(this.activeGame.config.type);
    if (!template) return null;

    // Force complete if still playing
    if (this.activeGame.state === GameState.PLAYING) {
      this.activeGame = { ...this.activeGame, state: GameState.COMPLETED };
    }

    const result = template.getResult(this.activeGame);
    this.gameHistory.push(result);
    this.activeGame = null;

    return result;
  }

  /**
   * Get recommendation without generating game
   */
  getRecommendation(profile: IUserProfile): IGameRecommendation {
    return this.personalizationEngine.recommend(profile);
  }

  /**
   * Update user profile from game result
   */
  updateUserProfile(profile: IUserProfile, result: IGameResult): IUserProfile {
    return this.personalizationEngine.updateProfile(profile, result);
  }

  /**
   * Register custom triggers
   */
  registerTriggers(triggers: ITrigger[]): void {
    this.triggerEngine.registerTriggers(triggers);
  }

  /**
   * Subscribe to engine events
   */
  on(event: string, callback: (data: Record<string, unknown>) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Get active game
   */
  getActiveGame(): IMicroGame | null {
    return this.activeGame;
  }

  /**
   * Get game history
   */
  getGameHistory(): IGameResult[] {
    return [...this.gameHistory];
  }

  /**
   * Get event emitter for direct access
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Destroy engine and clean up resources
   */
  destroy(): void {
    this.activeGame = null;
    this.gameHistory = [];
    this.eventEmitter.destroy();
  }
}
