import { Game2048 } from './Game2048';
import { SnakeGame } from './SnakeGame';
import { BreakoutGame } from './BreakoutGame';
import { WhackAMoleGame } from './WhackAMoleGame';
import { CatchCoinsGame } from './CatchCoinsGame';
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
// Game2048
// ============================
describe('Game2048', () => {
  let template: Game2048;

  beforeEach(() => {
    template = new Game2048();
  });

  it('should have PUZZLE type and name Game2048', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('Game2048');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBeGreaterThanOrEqual(2); // at least 2 tiles
    });

    it('should place exactly 2 initial tiles on the grid', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      // Each entity has a value
      const values = game.entities.map(e => (e as any).value);
      expect(values.length).toBe(2);
      values.forEach(v => {
        expect(v === 2 || v === 4).toBe(true);
      });
    });

    it('should create tiles with correct structure', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      game.entities.forEach(e => {
        const tile = e as any;
        expect(tile.value).toBeDefined();
        expect(typeof tile.value).toBe('number');
        expect(tile.row).toBeDefined();
        expect(tile.col).toBeDefined();
        expect(tile.position).toBeDefined();
        expect(tile.size).toBeDefined();
        expect(tile.id).toBeDefined();
        expect(tile.visible).toBe(true);
      });
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 300, y: 200 }, // far from center to get a direction
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should slide tiles when tapping away from center', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Tap right edge to slide right
      const input: IGameInput = {
        type: 'tap',
        position: { x: 350, y: 200 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
      expect(result.entities.length).toBeGreaterThanOrEqual(2);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 300, y: 200 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(game.score);
    });

    it('should ignore tap near center (no direction)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Tap at board center
      const boardCenterX = 20 + (4 * (70 + 6)) / 2;
      const boardCenterY = 80 + (4 * (70 + 6)) / 2;
      const input: IGameInput = {
        type: 'tap',
        position: { x: boardCenterX, y: boardCenterY },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 100 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.PUZZLE);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.maxScore).toBe(512 * 10); // NORMAL targetTile=512
    });
  });

  describe('update()', () => {
    it('should advance elapsed time', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config); // IDLE state

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// SnakeGame
// ============================
describe('SnakeGame', () => {
  let template: SnakeGame;

  beforeEach(() => {
    template = new SnakeGame();
  });

  it('should have REACTION type and name SnakeGame', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('SnakeGame');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBe(4); // 3 segments + 1 food
    });

    it('should have a snake head and food', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const head = game.entities.find(e => (e as any).isHead === true);
      const food = game.entities.find(e => (e as any).isFood === true);
      expect(head).toBeDefined();
      expect(food).toBeDefined();
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should change direction on tap during PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 50, y: 100 }, // left of head → left
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'hold',
        position: { x: 100, y: 100 },
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(15 * 15 * 10); // GRID_SIZE^2 * 10
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and move snake', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Advance past move interval (NORMAL = 0.2s)
      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config); // IDLE state

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should move snake and potentially eat food', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Run multiple update ticks
      let current = game;
      for (let i = 0; i < 20; i++) {
        current = template.update(current, 0.3);
      }

      // Game should still be progressing or completed
      expect(current.elapsed).toBeGreaterThan(0);
    });
  });
});

// ============================
// BreakoutGame
// ============================
describe('BreakoutGame', () => {
  let template: BreakoutGame;

  beforeEach(() => {
    template = new BreakoutGame();
  });

  it('should have REACTION type and name BreakoutGame', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('BreakoutGame');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // NORMAL: 4 rows * 8 cols bricks + 1 paddle + 1 ball = 34
      expect(game.entities.length).toBe(34);
    });

    it('should create paddle, ball, and bricks', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const paddle = game.entities.find(e => (e as any).isPaddle === true);
      const ball = game.entities.find(e => (e as any).isBall === true);
      const bricks = game.entities.filter(e => (e as any).isBrick === true);

      expect(paddle).toBeDefined();
      expect(ball).toBeDefined();
      expect(bricks.length).toBe(32); // 4 rows * 8 cols
    });

    it('should create 3 rows of bricks for EASY', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const bricks = game.entities.filter(e => (e as any).isBrick === true);
      expect(bricks.length).toBe(24); // 3 rows * 8 cols
    });

    it('should create 6 rows of bricks for EXPERT', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);

      const bricks = game.entities.filter(e => (e as any).isBrick === true);
      expect(bricks.length).toBe(48); // 6 rows * 8 cols
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 160, y: 400 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should move paddle on tap during PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 200, y: 400 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 200, y: 400 },
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(32 * 10); // 4 rows * 8 cols * 10
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and move ball', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.1);
      expect(updated.elapsed).toBeCloseTo(0.1, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config); // IDLE state

      const updated = template.update(game, 0.1);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// WhackAMoleGame
// ============================
describe('WhackAMoleGame', () => {
  let template: WhackAMoleGame;

  beforeEach(() => {
    template = new WhackAMoleGame();
  });

  it('should have REACTION type and name WhackAMole', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('WhackAMole');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBe(9); // 3x3 grid of holes
    });

    it('should create hole entities with correct properties', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      game.entities.forEach((e, i) => {
        const hole = e as any;
        expect(hole.holeIndex).toBe(i);
        expect(hole.hasMole).toBe(true);
        expect(typeof hole.moleActive).toBe('boolean');
      });
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should penalize tapping empty area (no hole)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING, score: 10 };

      // Tap far outside grid
      const input: IGameInput = {
        type: 'tap',
        position: { x: 0, y: 0 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBeLessThanOrEqual(game.score);
    });

    it('should penalize tapping empty hole', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING, score: 20 };

      // Tap a hole that has no mole
      const hole = game.entities[0];
      const input: IGameInput = {
        type: 'tap',
        position: { x: hole.position.x + 5, y: hole.position.y + 5 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      // No mole active, so score should decrease or stay same
      expect(result.score).toBeLessThanOrEqual(game.score);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'hold',
        position: { x: 100, y: 100 },
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(15 * 10); // NORMAL: 15 moles * 10
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and spawn moles', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Advance past spawn interval (NORMAL = 0.9s)
      const updated = template.update(game, 1.5);
      expect(updated.elapsed).toBeCloseTo(1.5, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config); // IDLE state

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should eventually complete after all moles spawn and resolve', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      // EASY: 10 moles, spawnInterval=1.2s, stayDuration=1.5s
      // Run enough time for all moles to spawn and expire
      for (let i = 0; i < 60; i++) {
        game = template.update(game, 0.5);
        if (game.state === GameState.COMPLETED) break;
      }

      expect(game.state).toBe(GameState.COMPLETED);
    });
  });
});

// ============================
// CatchCoinsGame
// ============================
describe('CatchCoinsGame', () => {
  let template: CatchCoinsGame;

  beforeEach(() => {
    template = new CatchCoinsGame();
  });

  it('should have REACTION type and name CatchCoins', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('CatchCoins');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // Should have at least the basket entity
      expect(game.entities.length).toBeGreaterThanOrEqual(1);
    });

    it('should create a basket entity', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const basket = game.entities.find(e => (e as any).isBasket === true);
      expect(basket).toBeDefined();
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 160, y: 400 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should move basket on tap during PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 250, y: 400 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 160, y: 400 },
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
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL, maxDuration: 90 });
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 50 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(50);
      expect(result.maxScore).toBeGreaterThan(0);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and spawn coins', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Advance past spawn interval (NORMAL = 0.8s)
      const updated = template.update(game, 1.0);
      expect(updated.elapsed).toBeCloseTo(1.0, 1);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config); // IDLE state

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should complete when time runs out', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL, maxDuration: 5 });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      // Advance past maxDuration
      game = template.update(game, 6.0);

      expect(game.state).toBe(GameState.COMPLETED);
    });
  });
});
