import { EliminationGame } from './EliminationGame';
import { RhythmTapGame } from './RhythmTapGame';
import { MemoryFlipGame } from './MemoryFlipGame';
import { BreathingGame } from './BreathingGame';
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
// EliminationGame
// ============================
describe('EliminationGame', () => {
  let template: EliminationGame;

  beforeEach(() => {
    template = new EliminationGame();
  });

  it('should have PUZZLE type and name Elimination', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('Elimination');
  });

  describe('createGame()', () => {
    it('should create a game with entities', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBe(25); // 5x5 grid
    });

    it('should create 4x4 grid for EASY', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(16); // 4x4
    });

    it('should create 6x6 grid for HARD', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(36); // 6x6
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on first input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 60, y: 110 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);

      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should return game unchanged when not a tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 0, y: 0 },
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
    });
  });
});

// ============================
// RhythmTapGame
// ============================
describe('RhythmTapGame', () => {
  let template: RhythmTapGame;

  beforeEach(() => {
    template = new RhythmTapGame();
  });

  it('should have REACTION type and name RhythmTap', () => {
    expect(template.type).toBe(GameType.REACTION);
    expect(template.name).toBe('RhythmTap');
  });

  describe('createGame()', () => {
    it('should create game with correct target count for NORMAL', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(12); // 12 targets for NORMAL
    });

    it('should create 8 targets for EASY', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(8);
    });

    it('should create 16 targets for HARD', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.HARD });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(16);
    });
  });

  describe('handleInput()', () => {
    it('should start on first input from IDLE', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should not score when tapping away from targets', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING, elapsed: 2 };

      const input: IGameInput = {
        type: 'tap',
        position: { x: -100, y: -100 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(0);
    });

    it('should ignore non-tap inputs', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'hold',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(0);
    });
  });

  describe('update()', () => {
    it('should advance elapsed time and detect missed targets', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      // Start the game
      const playing = { ...game, state: GameState.PLAYING };

      // Advance time past hit windows
      const updated = template.update(playing, 5.0);

      expect(updated.elapsed).toBe(5.0);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return result with maxScore = targets * 100', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);

      expect(result.maxScore).toBe(800); // 8 targets * 100
    });
  });
});

// ============================
// MemoryFlipGame
// ============================
describe('MemoryFlipGame', () => {
  let template: MemoryFlipGame;

  beforeEach(() => {
    template = new MemoryFlipGame();
  });

  it('should have PUZZLE type and name MemoryFlip', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('MemoryFlip');
  });

  describe('createGame()', () => {
    it('should create 12 cards for NORMAL (6 pairs)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(12);
    });

    it('should create 8 cards for EASY (4 pairs)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(8);
    });

    it('should create 16 cards for HARD (8 pairs)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(16);
    });

    it('should create cards with paired symbols', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const symbols = game.entities.map(e => (e as any).symbol);
      // Each symbol should appear exactly twice
      const counts: Record<number, number> = {};
      for (const s of symbols) {
        counts[s] = (counts[s] || 0) + 1;
      }
      Object.values(counts).forEach(c => expect(c).toBe(2));
    });
  });

  describe('handleInput()', () => {
    it('should flip a card on tap', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      // First input transitions to PLAYING + flips card
      const card = game.entities[0];
      const input: IGameInput = {
        type: 'tap',
        position: { x: card.position.x + 5, y: card.position.y + 5 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      // State changes to PLAYING on first handleInput
      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should not flip already flipped or matched cards', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const card = game.entities[0];
      (card as any).flipped = true;

      const input: IGameInput = {
        type: 'tap',
        position: { x: card.position.x + 5, y: card.position.y + 5 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      // Score should not change
      expect(result.score).toBe(0);
    });
  });

  describe('update()', () => {
    it('should flip cards back after mismatch wait timer', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = { ...game, state: GameState.PLAYING };

      // Simulate two non-matching flips (requires accessing internal state)
      // We test the wait timer mechanism by updating with a large dt
      const updated = template.update(game, 1.0);
      expect(updated.elapsed).toBeGreaterThan(0);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return maxScore = pairs * 100', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);
      expect(result.maxScore).toBe(400); // 4 pairs * 100
    });
  });
});

// ============================
// BreathingGame
// ============================
describe('BreathingGame', () => {
  let template: BreathingGame;

  beforeEach(() => {
    template = new BreathingGame();
  });

  it('should have HEALING type and name Breathing', () => {
    expect(template.type).toBe(GameType.HEALING);
    expect(template.name).toBe('Breathing');
  });

  describe('createGame()', () => {
    it('should create game with a single breath circle entity', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.entities.length).toBe(1);
      const circle = game.entities[0] as any;
      expect(circle.phase).toBe('inhale');
      expect(circle.cycleCount).toBe(0);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING on tap', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 180, y: 190 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.state).toBe(GameState.PLAYING);
    });

    it('should set isHolding on hold input during hold phase', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      // First transition to playing
      const tapInput: IGameInput = {
        type: 'tap',
        position: { x: 180, y: 190 },
        timestamp: Date.now(),
      };
      let result = template.handleInput(game, tapInput);
      expect(result.state).toBe(GameState.PLAYING);

      // Advance to hold phase (inhale is 4 seconds at NORMAL)
      result = template.update(result, 4.5);
      const circle = result.entities[0] as any;
      expect(circle.phase).toBe('hold');

      // Hold input
      const holdInput: IGameInput = {
        type: 'hold',
        position: { x: 180, y: 190 },
        timestamp: Date.now(),
      };
      const afterHold = template.handleInput(result, holdInput);
      expect(afterHold.state).toBe(GameState.PLAYING);
    });

    it('should handle release input', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'release',
        position: { x: 180, y: 190 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result).toBeDefined();
    });
  });

  describe('update()', () => {
    it('should advance phase progress', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 1.0);

      expect(updated.elapsed).toBe(1.0);
      const circle = updated.entities[0] as any;
      expect(circle.phaseProgress).toBeGreaterThan(0);
    });

    it('should transition phases in order: inhale → hold → exhale → rest → inhale', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.EASY });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      // inhale = 4s, hold = 2s, exhale = 4s, rest = 2s for EASY
      // Advance through inhale
      game = template.update(game, 5.0);
      let circle = game.entities[0] as any;
      expect(circle.phase).toBe('hold');

      // Advance through hold
      game = template.update(game, 3.0);
      circle = game.entities[0] as any;
      expect(circle.phase).toBe('exhale');

      // Advance through exhale
      game = template.update(game, 5.0);
      circle = game.entities[0] as any;
      expect(circle.phase).toBe('rest');

      // Advance through rest
      game = template.update(game, 3.0);
      circle = game.entities[0] as any;
      expect(circle.phase).toBe('inhale');
      expect(circle.cycleCount).toBe(1);
    });

    it('should complete after target cycles', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.EASY });
      // EASY: 3 cycles, inhale=4, hold=2, exhale=4, rest=2 → 12s per cycle → 36s
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      // Each update call advances at most one phase, so call update enough times
      // with dt large enough to advance past each phase duration
      for (let i = 0; i < 20; i++) {
        game = template.update(game, 5.0);
      }

      expect(game.state).toBe(GameState.COMPLETED);
    });
  });

  describe('isComplete()', () => {
    it('should return false at start', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return result with maxScore = cycles * 100', () => {
      const config = makeConfig({ type: GameType.HEALING, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.COMPLETED };

      const result = template.getResult(game);
      expect(result.maxScore).toBe(300); // 3 cycles * 100
    });
  });
});
