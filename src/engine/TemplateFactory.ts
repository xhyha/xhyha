import { IGameTemplate, GameType } from '../models/types';
import { EliminationGame } from '../templates/EliminationGame';
import { RhythmTapGame } from '../templates/RhythmTapGame';
import { MemoryFlipGame } from '../templates/MemoryFlipGame';
import { BreathingGame } from '../templates/BreathingGame';

/**
 * Factory for creating game template instances.
 * Maps GameType to concrete template implementations.
 */
export class TemplateFactory {
  private templates: Map<GameType, IGameTemplate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register a template for a game type
   */
  register(type: GameType, template: IGameTemplate): void {
    this.templates.set(type, template);
  }

  /**
   * Get template for a game type
   */
  getTemplate(type: GameType): IGameTemplate | null {
    return this.templates.get(type) ?? null;
  }

  /**
   * Get all registered game types
   */
  getRegisteredTypes(): GameType[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template exists for a type
   */
  hasTemplate(type: GameType): boolean {
    return this.templates.has(type);
  }

  /**
   * Register default templates
   */
  private registerDefaults(): void {
    this.register(GameType.PUZZLE, new EliminationGame());
    this.register(GameType.REACTION, new RhythmTapGame());
    this.register(GameType.HEALING, new BreathingGame());

    // Memory game also maps to PUZZLE type but can be selected by name
    const memoryGame = new MemoryFlipGame();
    // Store as alternate puzzle template
    this.register(GameType.SENSES, memoryGame); // reuse SENSES slot for memory
  }
}
