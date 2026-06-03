import { MicroGameEngine } from '../engine/MicroGameEngine';
import { BuiltInTriggers } from '../triggers/BuiltInTriggers';
import {
  IUserProfile, ITriggerContext, IMicroGame, IGameInput,
  IGameResult, GameState,
} from '../models/types';
import { UserProfileFactory } from '../models/UserProfile';
import { TriggerContextFactory } from '../models/TriggerContext';

/**
 * Genesis MetaAbility Service
 * 
 * This is the main entry point for the HarmonyOS MetaAbility.
 * It wraps the MicroGameEngine and provides the HarmonyOS-specific
 * lifecycle management.
 * 
 * In a real HarmonyOS app, this would be used within EntryAbility.
 * For now, it's a pure TypeScript service that can be tested independently.
 */
export class GenesisService {
  private engine: MicroGameEngine;
  private userProfile: IUserProfile | null = null;
  private initialized: boolean = false;

  constructor() {
    this.engine = new MicroGameEngine();
  }

  /**
   * Initialize the Genesis service.
   * Called when the MetaAbility is created.
   */
  initialize(userId?: string): void {
    // Load or create user profile
    this.userProfile = userId
      ? UserProfileFactory.create(userId)
      : UserProfileFactory.create('default');

    // Register built-in triggers
    this.engine.registerTriggers(BuiltInTriggers.getAll());

    this.initialized = true;
  }

  /**
   * Check if a micro-game should be triggered for the current context.
   * Called periodically or when context changes.
   */
  checkForMicroGame(context?: Partial<ITriggerContext>): IMicroGame | null {
    if (!this.initialized || !this.userProfile) return null;

    const triggerContext = TriggerContextFactory.createDefault(context);
    const result = this.engine.checkTrigger(triggerContext);

    if (result.triggered) {
      return this.engine.generateGame(this.userProfile, triggerContext);
    }

    return null;
  }

  /**
   * Generate a micro-game on demand (e.g., user tapped "play")
   */
  generateMicroGame(context?: Partial<ITriggerContext>): IMicroGame | null {
    if (!this.initialized || !this.userProfile) return null;

    const triggerContext = TriggerContextFactory.createDefault(context);
    return this.engine.generateGame(this.userProfile, triggerContext);
  }

  /**
   * Start playing a micro-game
   */
  startMicroGame(game: IMicroGame): void {
    this.engine.startGame(game);
  }

  /**
   * Handle touch input during gameplay
   */
  handleTouchInput(type: 'tap' | 'swipe' | 'hold' | 'release', x: number, y: number): IMicroGame | null {
    const input: IGameInput = {
      type,
      position: { x, y },
      timestamp: Date.now(),
    };
    return this.engine.handleInput(input);
  }

  /**
   * Update game state (called per frame by the game loop)
   */
  updateGame(dt: number): IMicroGame | null {
    return this.engine.update(dt);
  }

  /**
   * End the current game and process results
   */
  finishMicroGame(): IGameResult | null {
    const result = this.engine.endGame();

    if (result && this.userProfile) {
      this.userProfile = this.engine.updateUserProfile(this.userProfile, result);
    }

    return result;
  }

  /**
   * Get the active game state
   */
  getActiveGame(): IMicroGame | null {
    return this.engine.getActiveGame();
  }

  /**
   * Get the active game state as a serializable object (for Widget/卡片)
   */
  getWidgetData(): GenesisWidgetData {
    const game = this.engine.getActiveGame();

    if (!game) {
      return {
        hasActiveGame: false,
        dailyGameAvailable: true,
        message: 'Today\'s micro-game awaits!',
      };
    }

    return {
      hasActiveGame: true,
      gameId: game.config.id,
      gameName: game.config.name,
      gameType: game.config.type,
      score: game.score,
      elapsed: Math.round(game.elapsed),
      maxDuration: game.config.maxDuration,
      state: game.state,
    };
  }

  /**
   * Get user profile
   */
  getUserProfile(): IUserProfile | null {
    return this.userProfile;
  }

  /**
   * Update user profile externally
   */
  updateUserProfile(profile: Partial<IUserProfile>): void {
    if (this.userProfile) {
      this.userProfile = { ...this.userProfile, ...profile };
    }
  }

  /**
   * Subscribe to Genesis events
   */
  onEvent(event: string, callback: (data: Record<string, unknown>) => void): () => void {
    return this.engine.on(event, callback);
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.engine.destroy();
    this.userProfile = null;
    this.initialized = false;
  }
}

/** Widget data interface for HarmonyOS service cards */
export interface GenesisWidgetData {
  hasActiveGame: boolean;
  gameId?: string;
  gameName?: string;
  gameType?: string;
  score?: number;
  elapsed?: number;
  maxDuration?: number;
  state?: GameState;
  dailyGameAvailable?: boolean;
  message?: string;
}
