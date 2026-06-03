/**
 * SimonSays micro-game template.
 * Watch a growing sequence of coloured button flashes, then repeat the
 * sequence by tapping the corresponding buttons.
 *
 * 4 coloured buttons: Red (0), Blue (1), Green (2), Yellow (3).
 *
 * Difficulty scaling:
 *   EASY   – slow flash speed, start at length 2, max 8
 *   NORMAL – moderate speed, start at length 2, max 12
 *   HARD   – fast speed, start at length 3, max 16
 *   EXPERT – very fast, start at length 4, max 20
 */

import {
  IGameConfig, IMicroGame, IGameInput, IGameEntity,
  GameType, Difficulty, GameState,
} from '../models/types';
import { BaseGameTemplate } from './BaseGameTemplate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SimonPhase = 'showing' | 'input' | 'success' | 'fail';
type SimonColor = 0 | 1 | 2 | 3; // R, B, G, Y

interface SimonButtonEntity extends IGameEntity {
  kind: 'button';
  colorIndex: SimonColor;
  highlight: boolean;
}

interface SimonStatusEntity extends IGameEntity {
  kind: 'status';
  phase: SimonPhase;
  round: number;
}

// ---------------------------------------------------------------------------
// Constants & difficulty params
// ---------------------------------------------------------------------------

const COLORS: SimonColor[] = [0, 1, 2, 3];
const BUTTON_SIZE = 100;
const BUTTON_GAP = 12;
const BOARD_X = 30;
const BOARD_Y = 100;

interface SimonParams {
  flashDuration: number;    // seconds each colour is shown
  startLength: number;
  maxLength: number;
}

function getSimonParams(difficulty: Difficulty): SimonParams {
  const d = difficulty as number;
  const params: Record<number, SimonParams> = {
    [Difficulty.EASY]:   { flashDuration: 0.7, startLength: 2, maxLength: 8 },
    [Difficulty.NORMAL]: { flashDuration: 0.5, startLength: 2, maxLength: 12 },
    [Difficulty.HARD]:   { flashDuration: 0.35, startLength: 3, maxLength: 16 },
    [Difficulty.EXPERT]: { flashDuration: 0.25, startLength: 4, maxLength: 20 },
  };
  return params[d] ?? params[Difficulty.NORMAL];
}

// ---------------------------------------------------------------------------
// SimonSaysGame
// ---------------------------------------------------------------------------

export class SimonSaysGame extends BaseGameTemplate {
  readonly type = GameType.PUZZLE;
  readonly name = 'SimonSays';

  private params!: SimonParams;

  // Sequence & round state
  private sequence: SimonColor[] = [];
  private currentRound = 0;        // 0-based, sequence length = startLength + round
  private phase: SimonPhase = 'showing';
  private showingIndex = 0;        // which colour in the sequence is currently flashing
  private showTimer = 0;
  private inputIndex = 0;          // how many colours the player has tapped correctly this round
  private gameOver = false;
  private highlightedButton: SimonColor | null = null;

  // ---- Initialisation ----

  protected initializeEntities(config: IGameConfig): IGameEntity[] {
    this.params = getSimonParams(config.difficulty);
    this.sequence = [];
    this.currentRound = 0;
    this.phase = 'showing';
    this.showingIndex = 0;
    this.showTimer = 0;
    this.inputIndex = 0;
    this.gameOver = false;
    this.highlightedButton = null;

    // Generate the initial sequence for the first round.
    const len = this.params.startLength;
    for (let i = 0; i < len; i++) {
      this.sequence.push(this.randomColor());
    }

    this.startShowingPhase();

    return this.buildEntities();
  }

  // ---- Update ----

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    if (this.phase === 'showing') {
      this.showTimer += dt;
      if (this.showTimer >= this.params.flashDuration) {
        this.showTimer = 0;
        this.showingIndex++;
        if (this.showingIndex >= this.sequence.length) {
          // Done showing; switch to input phase.
          this.phase = 'input';
          this.inputIndex = 0;
          this.highlightedButton = null;
        } else {
          this.highlightedButton = this.sequence[this.showingIndex];
        }
      }
    }

    const updated: IMicroGame = {
      ...game,
      elapsed: game.elapsed + dt,
      entities: this.buildEntities(),
    };

    if (this.isComplete(updated)) {
      return { ...updated, state: GameState.COMPLETED, score: this.computeScore() };
    }

    return updated;
  }

  // ---- Input ----

  protected processInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (input.type !== 'tap') return game;
    if (this.phase !== 'input') return game;

    const col = Math.floor((input.position.x - BOARD_X) / (BUTTON_SIZE + BUTTON_GAP));
    const row = Math.floor((input.position.y - BOARD_Y) / (BUTTON_SIZE + BUTTON_GAP));

    if (row < 0 || row > 1 || col < 0 || col > 1) return game;

    const tappedColor: SimonColor = (row * 2 + col) as SimonColor;

    // Flash the tapped button briefly.
    this.highlightedButton = tappedColor;

    const expectedColor = this.sequence[this.inputIndex];
    if (tappedColor !== expectedColor) {
      this.phase = 'fail';
      this.gameOver = true;
      return {
        ...game,
        score: this.computeScore(),
        entities: this.buildEntities(),
      };
    }

    this.inputIndex++;

    if (this.inputIndex >= this.sequence.length) {
      // Round complete!
      this.currentRound++;
      const seqLen = this.params.startLength + this.currentRound;

      if (seqLen > this.params.maxLength) {
        // Player beat the max rounds – victory!
        this.gameOver = true;
        return {
          ...game,
          score: this.computeScore(),
          entities: this.buildEntities(),
        };
      }

      // Extend sequence and start showing again.
      this.sequence.push(this.randomColor());
      this.startShowingPhase();
    }

    return {
      ...game,
      score: this.computeScore(),
      entities: this.buildEntities(),
    };
  }

  // ---- Completion ----

  isComplete(_game: IMicroGame): boolean {
    return this.gameOver;
  }

  protected getMaxScore(_game: IMicroGame): number {
    return this.params.maxLength * 20;
  }

  // ---- Private helpers ----

  private randomColor(): SimonColor {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  private startShowingPhase(): void {
    this.phase = 'showing';
    this.showingIndex = 0;
    this.showTimer = 0;
    this.highlightedButton = this.sequence[0];
  }

  private computeScore(): number {
    // Each completed round is worth 20 points.
    return this.currentRound * 20;
  }

  private buildEntities(): IGameEntity[] {
    const entities: IGameEntity[] = [];

    // 2×2 grid of coloured buttons.
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const colorIndex: SimonColor = (r * 2 + c) as SimonColor;
        entities.push({
          ...this.createEntity(
            BOARD_X + c * (BUTTON_SIZE + BUTTON_GAP),
            BOARD_Y + r * (BUTTON_SIZE + BUTTON_GAP),
            BUTTON_SIZE,
            BUTTON_SIZE,
          ),
          kind: 'button',
          colorIndex,
          highlight: this.highlightedButton === colorIndex,
        } as SimonButtonEntity);
      }
    }

    // Status entity.
    entities.push({
      ...this.createEntity(10, 10, 300, 60),
      kind: 'status',
      phase: this.phase,
      round: this.currentRound,
    } as SimonStatusEntity);

    return entities;
  }
}
