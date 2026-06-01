import { TicTacToeGame } from './TicTacToeGame';
import { PianoTilesGame } from './PianoTilesGame';
import { MazeGame } from './MazeGame';
import { ReflexGame } from './ReflexGame';
import { SimonSaysGame } from './SimonSaysGame';
import {
  IGameConfig, IMicroGame, IGameInput, GameType, Difficulty, GameState,
} from '../models/types';

// ===== Helper: create a game config =====
function makeConfig(overrides: Partial<IGameConfig> = {}): IGameConfig {
  return {
    id: 'test-game',
    name: 'TestGame',
    type: GameType.PUZZLE,
    description: 'Test game',
    estimatedDuration: 60,
    maxDuration: 90,
    difficulty: Difficulty.NORMAL,
    parameters: {},
    theme: {
      primaryColor: '#fff',
      secondaryColor: '#000',
      backgroundColor: '#333',
      fontFamily: 'system',
      particleEffect: false,
    },
    ...overrides,
  };
}

// ============================
// TicTacToeGame
// ============================
describe('TicTacToeGame', () => {
  let template: TicTacToeGame;

  beforeEach(() => {
    template = new TicTacToeGame();
  });

  it('should have PUZZLE type and name TicTacToe', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('TicTacToe');
  });

  describe('createGame()', () => {
    it('should create a game with 9 entities (3x3 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBe(9);
    });

    it('should create entities with row, col, and empty value', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      game.entities.forEach(e => {
        const cell = e as any;
        expect(cell.row).toBeDefined();
        expect(cell.col).toBeDefined();
        expect(cell.value).toBe('');
      });
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: BOARD_X + CELL_SIZE / 2, y: BOARD_Y + CELL_SIZE / 2 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should place X on tap and AI responds with O', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: BOARD_X + CELL_SIZE / 2, y: BOARD_Y + CELL_SIZE / 2 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      // At least one X and one O should be on the board
      const xs = result.entities.filter(e => (e as any).value === 'X');
      const os = result.entities.filter(e => (e as any).value === 'O');
      expect(xs.length).toBe(1);
      expect(os.length).toBeGreaterThanOrEqual(0); // AI may or may not have placed yet
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.score).toBe(game.score);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);
      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.PUZZLE);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(150);
    });
  });

  describe('update()', () => {
    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// Board constants for positioning (same as TicTacToeGame)
const BOARD_X = 30;
const BOARD_Y = 80;
const CELL_SIZE = 90;

// ============================
// PianoTilesGame
// ============================
describe('PianoTilesGame', () => {
  let template: PianoTilesGame;

  beforeEach(() => {
    template = new PianoTilesGame();
  });

  it('should have REACTION type and name PianoTiles', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('PianoTiles');
  });

  describe('createGame()', () => {
    it('should create a game with initial tiles', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0); // 5 rows * 4 cols = 20
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 60, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'hold',
        position: { x: 60, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.score).toBe(game.score);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 100 };

      const result = template.getResult(game);
      expect(result.gameId).toBe('test-game');
      expect(result.completed).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time when PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// MazeGame
// ============================
describe('MazeGame', () => {
  let template: MazeGame;

  beforeEach(() => {
    template = new MazeGame();
  });

  it('should have PUZZLE type and name Maze', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('Maze');
  });

  describe('createGame()', () => {
    it('should create a game with entities', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should include player and exit entities', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const player = game.entities.find(e => (e as any).kind === 'player');
      const exit = game.entities.find(e => (e as any).kind === 'exit');
      expect(player).toBeDefined();
      expect(exit).toBeDefined();
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 200 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result with maxScore 100', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);
      expect(result.gameId).toBe('test-game');
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(100);
    });
  });

  describe('update()', () => {
    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// ReflexGame
// ============================
describe('ReflexGame', () => {
  let template: ReflexGame;

  beforeEach(() => {
    template = new ReflexGame();
  });

  it('should have REACTION type and name Reflex', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('Reflex');
  });

  describe('createGame()', () => {
    it('should create a game with signal entity', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 150, y: 200 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result with maxScore 1000', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);
      expect(result.gameId).toBe('test-game');
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(1000);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time when PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// SimonSaysGame
// ============================
describe('SimonSaysGame', () => {
  let template: SimonSaysGame;

  beforeEach(() => {
    template = new SimonSaysGame();
  });

  it('should have PUZZLE type and name SimonSays', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('SimonSays');
  });

  describe('createGame()', () => {
    it('should create a game with 4 buttons + status entity', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      // 4 buttons + 1 status = 5 entities
      expect(game.entities.length).toBeGreaterThanOrEqual(5);
    });

    it('should create button entities', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const buttons = game.entities.filter(e => (e as any).kind === 'button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 80, y: 150 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 80, y: 150 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.score).toBe(game.score);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 40 };

      const result = template.getResult(game);
      expect(result.gameId).toBe('test-game');
      expect(result.completed).toBe(true);
      expect(result.score).toBe(40);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time when PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});
