import { DotsAndBoxesGame } from './DotsAndBoxesGame';
import { TileSlideGame } from './TileSlideGame';
import { ReactionDualGame } from './ReactionDualGame';
import { PatternMemoryGame } from './PatternMemoryGame';
import { BalloonPopGame } from './BalloonPopGame';
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
// DotsAndBoxesGame
// ============================
describe('DotsAndBoxesGame', () => {
  let template: DotsAndBoxesGame;

  beforeEach(() => {
    template = new DotsAndBoxesGame();
  });

  it('should have PUZZLE type and name DotsAndBoxes', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('DotsAndBoxes');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create entities for 4x4 grid (NORMAL)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      // 5x5 dots + 5x4 hLines + 4x5 vLines + 4x4 boxes = 25+20+20+16 = 81
      expect(game.entities.length).toBe(81);
    });

    it('should create entities for 3x3 grid (EASY)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      // 4x4 dots + 4x3 hLines + 3x4 vLines + 3x3 boxes = 16+12+12+9 = 49
      expect(game.entities.length).toBe(49);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 50, y: 70 },
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
        position: { x: 50, y: 70 },
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 50 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.PUZZLE);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(50);
    });
  });
});

// ============================
// TileSlideGame
// ============================
describe('TileSlideGame', () => {
  let template: TileSlideGame;

  beforeEach(() => {
    template = new TileSlideGame();
  });

  it('should have PUZZLE type and name TileSlide', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('TileSlide');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // 4x4 grid = 16 tiles
      expect(game.entities.length).toBe(16);
    });

    it('should create 9 tiles for EASY (3x3)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(9);
    });

    it('should have one empty tile (value 0)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const emptyTiles = game.entities.filter(e => (e as any).value === 0);
      expect(emptyTiles.length).toBe(1);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
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
    it('should return false at start (shuffled)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 800 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.PUZZLE);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBe(1000);
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
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});

// ============================
// ReactionDualGame
// ============================
describe('ReactionDualGame', () => {
  let template: ReactionDualGame;

  beforeEach(() => {
    template = new ReactionDualGame();
  });

  it('should have REACTION type and name ReactionDual', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('ReactionDual');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // Should have circle, divider, number display, target label, status
      expect(game.entities.length).toBeGreaterThan(0);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 200 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should handle left-side tap (circle reaction)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 80, y: 180 }, // left side
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
    });

    it('should handle right-side tap (number matching)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 220, y: 180 }, // right side
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
        position: { x: 100, y: 200 },
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 30 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(30);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and update circle state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 2.5);
      expect(updated.elapsed).toBeCloseTo(2.5, 1);
    });
  });
});

// ============================
// PatternMemoryGame
// ============================
describe('PatternMemoryGame', () => {
  let template: PatternMemoryGame;

  beforeEach(() => {
    template = new PatternMemoryGame();
  });

  it('should have PUZZLE type and name PatternMemory', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('PatternMemory');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // 4x4 grid + 1 info entity = 17
      expect(game.entities.length).toBe(17);
    });

    it('should create 3x3 grid for EASY', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      // 3x3 grid + 1 info entity = 10
      expect(game.entities.length).toBe(10);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should ignore taps during showing phase', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };

      // During showing phase, input should be ignored
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
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 45 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.PUZZLE);
      expect(result.completed).toBe(true);
    });
  });

  describe('update()', () => {
    it('should advance from showing to input phase', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Advance past displayTime (2.0s for NORMAL)
      const updated = template.update(game, 2.5);
      expect(updated.elapsed).toBeCloseTo(2.5, 1);
    });
  });
});

// ============================
// BalloonPopGame
// ============================
describe('BalloonPopGame', () => {
  let template: BalloonPopGame;

  beforeEach(() => {
    template = new BalloonPopGame();
  });

  it('should have REACTION type and name BalloonPop', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('BalloonPop');
  });

  describe('createGame()', () => {
    it('should create a game with correct initial state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      // NORMAL: 4 balloons + 1 equation + 1 score = 6
      expect(game.entities.length).toBeGreaterThanOrEqual(4);
    });

    it('should create balloon entities with values', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const balloons = game.entities.filter(e => (e as any).kind === 'balloon');
      expect(balloons.length).toBe(4); // NORMAL has 4 options

      balloons.forEach(b => {
        const balloon = b as any;
        expect(typeof balloon.value).toBe('number');
        expect(typeof balloon.speed).toBe('number');
        expect(balloon.popped).toBe(false);
      });
    });

    it('should have an equation entity', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const equation = game.entities.find(e => (e as any).kind === 'equation');
      expect(equation).toBeDefined();
      expect(typeof (equation as any).display).toBe('string');
      expect((equation as any).display).toContain('=');
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 150, y: 300 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should pop correct balloon on tap', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Find a balloon and tap its center
      const balloons = game.entities.filter(e => (e as any).kind === 'balloon');
      const target = balloons[0];
      const cx = target.position.x + target.size.x / 2;
      const cy = target.position.y + target.size.y / 2;

      const input: IGameInput = {
        type: 'tap',
        position: { x: cx, y: cy },
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
        position: { x: 150, y: 300 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(game.score);
    });
  });

  describe('isComplete()', () => {
    it('should return false (only ends by timer)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return valid result', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.COMPLETED, score: 45 };

      const result = template.getResult(game);

      expect(result.gameId).toBe('test-game');
      expect(result.gameType).toBe(GameType.REACTION);
      expect(result.completed).toBe(true);
      expect(result.maxScore).toBeGreaterThan(0);
    });
  });

  describe('update()', () => {
    it('should move balloons upward', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const initialY = game.entities.filter(e => (e as any).kind === 'balloon')[0].position.y;
      const updated = template.update(game, 1.0);

      const balloons = updated.entities.filter(e => (e as any).kind === 'balloon');
      const newY = balloons[0].position.y;
      expect(newY).toBeLessThan(initialY);
    });

    it('should complete when time runs out', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL, maxDuration: 5 });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      game = template.update(game, 6.0);
      expect(game.state).toBe(GameState.COMPLETED);
    });

    it('should not update when not PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });
  });
});
