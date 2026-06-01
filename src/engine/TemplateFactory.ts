import { IGameTemplate, GameType } from '../models/types';
import { EliminationGame } from '../templates/EliminationGame';
import { RhythmTapGame } from '../templates/RhythmTapGame';
import { MemoryFlipGame } from '../templates/MemoryFlipGame';
import { BreathingGame } from '../templates/BreathingGame';
import { DrawingGame } from '../templates/DrawingGame';
import { ColorMatchGame } from '../templates/ColorMatchGame';
import { QuickMathGame } from '../templates/QuickMathGame';
import { BubblePopGame } from '../templates/BubblePopGame';
import { WordScrambleGame } from '../templates/WordScrambleGame';
import { ChaseLightGame } from '../templates/ChaseLightGame';
import { Game2048 } from '../templates/Game2048';
import { SnakeGame } from '../templates/SnakeGame';
import { BreakoutGame } from '../templates/BreakoutGame';
import { WhackAMoleGame } from '../templates/WhackAMoleGame';
import { CatchCoinsGame } from '../templates/CatchCoinsGame';
import { TicTacToeGame } from '../templates/TicTacToeGame';
import { PianoTilesGame } from '../templates/PianoTilesGame';
import { MazeGame } from '../templates/MazeGame';
import { ReflexGame } from '../templates/ReflexGame';
import { SimonSaysGame } from '../templates/SimonSaysGame';
import { DotsAndBoxesGame } from '../templates/DotsAndBoxesGame';
import { TileSlideGame } from '../templates/TileSlideGame';
import { ReactionDualGame } from '../templates/ReactionDualGame';
import { PatternMemoryGame } from '../templates/PatternMemoryGame';
import { BalloonPopGame } from '../templates/BalloonPopGame';

/**
 * Factory for creating game template instances.
 * Maps GameType to concrete template implementations.
 * Also supports name-based lookup for multiple templates sharing the same type.
 */
export class TemplateFactory {
  private templates: Map<GameType, IGameTemplate> = new Map();
  private templatesByName: Map<string, IGameTemplate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register a template for a game type
   */
  register(type: GameType, template: IGameTemplate): void {
    this.templates.set(type, template);
    this.templatesByName.set(template.name, template);
  }

  /**
   * Get template for a game type
   */
  getTemplate(type: GameType): IGameTemplate | null {
    return this.templates.get(type) ?? null;
  }

  /**
   * Get template by name (supports multiple templates per GameType)
   */
  getTemplateByName(name: string): IGameTemplate | null {
    return this.templatesByName.get(name) ?? null;
  }

  /**
   * Get all registered game types
   */
  getRegisteredTypes(): GameType[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get all registered template names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.templatesByName.keys());
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

    this.register(GameType.CREATE, new DrawingGame());

    // Memory game also maps to PUZZLE type but can be selected by name
    const memoryGame = new MemoryFlipGame();
    // Store as alternate puzzle template
    this.register(GameType.SENSES, memoryGame); // reuse SENSES slot for memory

    // New game templates - registered by name via templatesByName
    this.templatesByName.set('ColorMatch', new ColorMatchGame());
    this.templatesByName.set('QuickMath', new QuickMathGame());
    this.templatesByName.set('BubblePop', new BubblePopGame());
    this.templatesByName.set('WordScramble', new WordScrambleGame());
    this.templatesByName.set('ChaseLight', new ChaseLightGame());
    this.templatesByName.set('Game2048', new Game2048());
    this.templatesByName.set('SnakeGame', new SnakeGame());
    this.templatesByName.set('Breakout', new BreakoutGame());
    this.templatesByName.set('WhackAMole', new WhackAMoleGame());
    this.templatesByName.set('CatchCoins', new CatchCoinsGame());
    this.templatesByName.set('TicTacToe', new TicTacToeGame());
    this.templatesByName.set('PianoTiles', new PianoTilesGame());
    this.templatesByName.set('Maze', new MazeGame());
    this.templatesByName.set('Reflex', new ReflexGame());
    this.templatesByName.set('SimonSays', new SimonSaysGame());
    this.templatesByName.set('DotsAndBoxes', new DotsAndBoxesGame());
    this.templatesByName.set('TileSlide', new TileSlideGame());
    this.templatesByName.set('ReactionDual', new ReactionDualGame());
    this.templatesByName.set('PatternMemory', new PatternMemoryGame());
    this.templatesByName.set('BalloonPop', new BalloonPopGame());
  }
}
