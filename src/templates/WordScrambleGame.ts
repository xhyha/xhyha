import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

const WORD_LISTS: Record<number, string[]> = {
  [Difficulty.EASY]: ['CAT', 'DOG', 'SUN', 'RUN', 'FLY', 'HAT', 'CUP', 'BOX'],
  [Difficulty.NORMAL]: ['GAME', 'PLAY', 'CODE', 'HERO', 'STAR', 'MOON', 'FIRE', 'WIND'],
  [Difficulty.HARD]: ['WORLD', 'QUEST', 'MAGIC', 'POWER', 'SWORD', 'LIGHT', 'BRAIN', 'SPEED'],
  [Difficulty.EXPERT]: ['DRAGON', 'WIZARD', 'PUZZLE', 'GALAXY', 'KNIGHT', 'SHADOW', 'BATTLE', 'CASTLE'],
};

interface LetterTile extends IGameEntity {
  letter: string;
  originalIndex: number;
  selected: boolean;
}

/**
 * Word Scramble micro-game.
 * Unscramble letters to spell the correct word.
 */
export class WordScrambleGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'WordScramble';

  private targetWord: string = '';
  private selectedLetters: string[] = [];
  private currentRound: number = 0;
  private totalRounds: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.currentRound = 0;
    this.totalRounds = this.getRoundCount(config.difficulty);
    return this.createWordRound(config);
  }

  private createWordRound(config: IGameConfig): IGameEntity[] {
    this.selectedLetters = [];
    const words = WORD_LISTS[config.difficulty] ?? WORD_LISTS[Difficulty.NORMAL];
    this.targetWord = words[Math.floor(Math.random() * words.length)];

    const letters = this.targetWord.split('');
    // Shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    const tileSize = 45;
    const gap = 8;
    const totalWidth = letters.length * (tileSize + gap) - gap;
    const startX = (300 - totalWidth) / 2;

    return letters.map((letter, i) => ({
      ...this.createEntity(startX + i * (tileSize + gap), 200, tileSize, tileSize),
      letter,
      originalIndex: i,
      selected: false,
    }));
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const entities = [...game.entities] as LetterTile[];
    const tapped = entities.find(e =>
      !e.selected &&
      input.position.x >= e.position.x && input.position.x <= e.position.x + e.size.x &&
      input.position.y >= e.position.y && input.position.y <= e.position.y + e.size.y
    );
    if (!tapped) return game;

    tapped.selected = true;
    this.selectedLetters.push(tapped.letter);

    // Check if word is complete
    if (this.selectedLetters.length === this.targetWord.length) {
      const guess = this.selectedLetters.join('');
      this.currentRound++;

      if (guess === this.targetWord) {
        const remaining = this.totalRounds - this.currentRound;
        return {
          ...game,
          score: game.score + 60,
          entities: remaining > 0 ? this.createWordRound(game.config) : entities,
        };
      } else {
        // Wrong - reset
        this.selectedLetters = [];
        return {
          ...game,
          score: Math.max(0, game.score - 15),
          entities: this.createWordRound(game.config),
        };
      }
    }

    return { ...game, entities };
  }

  isComplete(game: IMicroGame): boolean {
    return this.currentRound >= this.totalRounds;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.totalRounds * 60;
  }

  private getRoundCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 3, [Difficulty.NORMAL]: 4,
      [Difficulty.HARD]: 5, [Difficulty.EXPERT]: 6,
    };
    return counts[difficulty] ?? 4;
  }
}
