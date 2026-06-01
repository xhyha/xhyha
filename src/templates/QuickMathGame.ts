import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity, GameType, Difficulty,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

interface MathChoice extends IGameEntity {
  value: number;
  correct: boolean;
}

/**
 * Quick Math micro-game.
 * Solve arithmetic problems by tapping the correct answer.
 */
export class QuickMathGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'QuickMath';

  private currentRound: number = 0;
  private totalRounds: number = 0;
  private correctAnswers: number = 0;

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.currentRound = 0;
    this.correctAnswers = 0;
    this.totalRounds = this.getRoundCount(config.difficulty);
    return this.createMathRound(config);
  }

  private createMathRound(config: IGameConfig): IGameEntity[] {
    const { answer } = this.generateProblem(config.difficulty);
    const choiceCount = this.getChoiceCount(config.difficulty);

    // Generate choices including correct answer
    const choices = new Set<number>();
    choices.add(answer);
    while (choices.size < choiceCount) {
      const wrong = answer + (Math.floor(Math.random() * 20) - 10);
      if (wrong !== answer) choices.add(wrong);
    }

    const choiceArray = Array.from(choices);
    // Shuffle
    for (let i = choiceArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choiceArray[i], choiceArray[j]] = [choiceArray[j], choiceArray[i]];
    }

    const entities: MathChoice[] = [];
    const cols = 2;
    for (let i = 0; i < choiceArray.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      entities.push({
        ...this.createEntity(
          40 + col * 130,
          180 + row * 70,
          120,
          55
        ),
        value: choiceArray[i],
        correct: choiceArray[i] === answer,
      });
    }

    return entities;
  }

  private generateProblem(difficulty: Difficulty): { question: string; answer: number } {
    const maxNum = difficulty >= Difficulty.HARD ? 50 : 20;
    const ops = difficulty >= Difficulty.HARD ? ['+', '-', '×'] : ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;

    switch (op) {
      case '×':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        break;
      case '-':
        a = Math.floor(Math.random() * maxNum) + 10;
        b = Math.floor(Math.random() * a);
        answer = a - b;
        break;
      default:
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * maxNum) + 1;
        answer = a + b;
    }

    return { question: `${a} ${op} ${b} = ?`, answer };
  }

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;

    const tapped = game.entities.find(e =>
      input.position.x >= e.position.x && input.position.x <= e.position.x + e.size.x &&
      input.position.y >= e.position.y && input.position.y <= e.position.y + e.size.y
    );
    if (!tapped) return game;

    const choice = tapped as MathChoice;
    this.currentRound++;

    if (choice.correct) {
      this.correctAnswers++;
      return {
        ...game,
        score: game.score + 40,
        entities: this.currentRound < this.totalRounds
          ? this.createMathRound(game.config) : game.entities,
      };
    } else {
      return { ...game, score: Math.max(0, game.score - 10) };
    }
  }

  isComplete(game: IMicroGame): boolean {
    return this.currentRound >= this.totalRounds;
  }

  protected getMaxScore(game: IMicroGame): number {
    return this.totalRounds * 40;
  }

  private getRoundCount(difficulty: Difficulty): number {
    const counts: Record<number, number> = {
      [Difficulty.EASY]: 5, [Difficulty.NORMAL]: 8,
      [Difficulty.HARD]: 12, [Difficulty.EXPERT]: 15,
    };
    return counts[difficulty] ?? 8;
  }

  private getChoiceCount(difficulty: Difficulty): number {
    return difficulty >= Difficulty.HARD ? 4 : 3;
  }
}
