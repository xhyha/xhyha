import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface ColorButton extends IGameEntity {
  colorName: string;
  colorHex: string;
  correct: boolean;
}

const COLORS = [
  { name: 'RED', hex: '#E74C3C' },
  { name: 'BLUE', hex: '#3498DB' },
  { name: 'GREEN', hex: '#2ECC71' },
  { name: 'YELLOW', hex: '#F1C40F' },
  { name: 'PURPLE', hex: '#9B59B6' },
  { name: 'ORANGE', hex: '#FF6B35' },
];

/**
 * Color Match (Stroop) micro-game.
 * A color name appears in a mismatched color.
 * Player must tap the button matching the DISPLAY color.
 */
export class ColorMatchGame extends BaseGameTemplate {
  readonly type = GameType.REACTION;
  readonly name = 'ColorMatch';

  private currentRound: number = 0;
  private totalRounds: number = 0;
  private streak: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.currentRound = 0;
    this.streak = 0;
    this.totalRounds = this.getRoundCount(config.difficulty);
    return this.createRoundEntities(config);
  }

  private createRoundEntities(config: IGameConfig): IGameEntity[] {
    const buttonCount = this.getButtonCount(config.difficulty);
    const entities: ColorButton[] = [];

    // Pick display color (the color the text is rendered in)
    const displayColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    // Pick text color (different from display)
    let textColor: typeof COLORS[0];
    do {
      textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (textColor.name === displayColor.name);

    // Create buttons, one correct (matching display color)
    const usedIndices = new Set<number>();
    const correctIdx = Math.floor(Math.random() * buttonCount);

    for (let i = 0; i < buttonCount; i++) {
      const isCorrect = i === correctIdx;
      let colorIdx: number;
      if (isCorrect) {
        colorIdx = COLORS.indexOf(displayColor);
      } else {
        do {
          colorIdx = Math.floor(Math.random() * COLORS.length);
        } while (colorIdx === COLORS.indexOf(displayColor) || usedIndices.has(colorIdx));
      }
      usedIndices.add(colorIdx);

      const cols = Math.min(buttonCount, 3);
      const row = Math.floor(i / cols);
      const col = i % cols;
      const btnSize = 80;
      const gap = 10;
      const offsetX = 60;
      const offsetY = 200;

      entities.push({
        ...this.createEntity(
          offsetX + col * (btnSize + gap),
          offsetY + row * (btnSize + gap + 20),
          btnSize,
          btnSize
        ),
        colorName: COLORS[colorIdx].name,
        colorHex: COLORS[colorIdx].hex,
        correct: isCorrect,
      });
    }

    return entities;
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const tapped = game.entities.find(e =>
      input.position.x >= e.position.x && input.position.x <= e.position.x + e.size.x &&
      input.position.y >= e.position.y && input.position.y <= e.position.y + e.size.y
    );
    if (!tapped) return game;

    const button = tapped as ColorButton;
    this.currentRound++;

    if (button.correct) {
      this.streak++;
      const streakBonus = Math.min(this.streak, 5) * 10;
      return {
        ...game,
        score: game.score + 50 + streakBonus,
        entities: this.currentRound < this.totalRounds
          ? this.createRoundEntities(game.config)
          : game.entities,
      };
    } else {
      this.streak = 0;
      return { ...game, score: Math.max(0, game.score - 20) };
    }
  }

  isComplete(game: IMicroGame): boolean {
    return this.currentRound >= this.totalRounds;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.totalRounds * 100;
  }

  private getRoundCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 5, [Difficulty.NORMAL]: 8,
      [Difficulty.HARD]: 12, [Difficulty.EXPERT]: 16,
    };
    return counts[difficulty] ?? 8;
  }

  private getButtonCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 3, [Difficulty.NORMAL]: 4,
      [Difficulty.HARD]: 5, [Difficulty.EXPERT]: 6,
    };
    return counts[difficulty] ?? 4;
  }
}
