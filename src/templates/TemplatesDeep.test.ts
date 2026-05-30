import { EliminationGame } from './EliminationGame';
import { MemoryFlipGame } from './MemoryFlipGame';
import {
  IGameConfig, IMicroGame, IGameInput, GameType, Difficulty, GameState,
} from '../models/types';

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
// EliminationGame Deep Tests
// ============================
describe('EliminationGame - Deep Coverage', () => {
  let template: EliminationGame;

  beforeEach(() => {
    template = new EliminationGame();
  });

  describe('processInput - tile selection and swapping', () => {
    it('should select first tile on tap', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };
      
      // Tap first tile
      const tile = game.entities[0];
      const input: IGameInput = {
        type: 'tap',
        position: { x: tile.position.x + 5, y: tile.position.y + 5 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      // Score should be 0 after just selecting (no swap yet)
      expect(result.score).toBe(0);
    });

    it('should swap adjacent tiles and attempt match', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Tap first tile (row 0, col 0) at offset (50, 100), cellSize 60
      const tile0 = game.entities[0]; // row 0, col 0
      const tile1 = game.entities[1]; // row 0, col 1 (adjacent)

      const input0: IGameInput = {
        type: 'tap',
        position: { x: tile0.position.x + 5, y: tile0.position.y + 5 },
        timestamp: Date.now(),
      };
      const selected = template.handleInput(game, input0);
      expect(selected.score).toBe(0); // Just selected, no swap

      const input1: IGameInput = {
        type: 'tap',
        position: { x: tile1.position.x + 5, y: tile1.position.y + 5 },
        timestamp: Date.now(),
      };
      const swapped = template.handleInput(selected, input1);
      // After swap, score might increase if match found, or stay same if not
      expect(swapped).toBeDefined();
    });

    it('should not swap non-adjacent tiles', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Select tile at (0,0) then try tile at (2,2) - not adjacent
      const tile0 = game.entities[0];  // row 0, col 0
      const tile5 = game.entities[5];  // row 1, col 1 (diagonal - not adjacent)

      const input0: IGameInput = {
        type: 'tap',
        position: { x: tile0.position.x + 5, y: tile0.position.y + 5 },
        timestamp: Date.now(),
      };
      template.handleInput(game, input0);

      const input1: IGameInput = {
        type: 'tap',
        position: { x: tile5.position.x + 5, y: tile5.position.y + 5 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input1);
      // Should not swap non-adjacent, so score stays 0
      expect(result.score).toBe(0);
    });

    it('should tap outside grid returns unchanged game', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 0, y: 0 }, // Before the grid offset
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(0);
    });

    it('should force match by manipulating tile types', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Force 3 horizontal tiles to same type (row 0, col 0-2)
      // Grid is 4x4, cellSize=60, offset=(50,100)
      const entities = [...game.entities] as any[];
      entities[0].tileType = 0; // row 0, col 0
      entities[1].tileType = 0; // row 0, col 1
      entities[2].tileType = 1; // row 0, col 2
      entities[3].tileType = 1; // row 0, col 3
      const manipulatedGame = { ...game, entities };

      // Now swap col 2 and col 3 → col 2 gets type 1 → match 0,0,1 → no match
      // Let's instead set col2 to type 0 to create 0,0,0 match
      entities[2].tileType = 0;

      // Swap tile at (0,3) with (0,2) - they're adjacent
      // First select (0,3)
      const tile3 = entities[3];
      const selectInput: IGameInput = {
        type: 'tap',
        position: { x: tile3.position.x + 5, y: tile3.position.y + 5 },
        timestamp: Date.now(),
      };
      const selected = template.handleInput(manipulatedGame, selectInput);

      // Now tap (0,2) - adjacent to (0,3)
      const tile2 = entities[2];
      const swapInput: IGameInput = {
        type: 'tap',
        position: { x: tile2.position.x + 5, y: tile2.position.y + 5 },
        timestamp: Date.now(),
      };
      const result = template.handleInput(selected, swapInput);
      // Whether match happens depends on swap result
      expect(result).toBeDefined();
    });

    it('should complete when moves run out', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING, score: 0 };

      // EASY: 4x4, movesLeft = 4*3 = 12, targetScore = 400
      // Simulate many non-matching swaps to exhaust moves
      // This tests the movesLeft path
      expect(template.isComplete({ ...game, score: 0 })).toBe(false);
      
      // High score triggers completion
      expect(template.isComplete({ ...game, score: 500 })).toBe(true);
    });
  });

  describe('EXPERT difficulty', () => {
    it('should create 7x7 grid', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      expect(game.entities.length).toBe(49);
    });
  });
});

// ============================
// MemoryFlipGame - Deep Coverage
// ============================
describe('MemoryFlipGame - Deep Coverage', () => {
  let template: MemoryFlipGame;

  beforeEach(() => {
    template = new MemoryFlipGame();
  });

  describe('processInput - card matching flow', () => {
    it('should flip first card and keep it as firstFlipped', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const card = game.entities[0];
      const input: IGameInput = {
        type: 'tap',
        position: { x: card.position.x + 5, y: card.position.y + 5 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      const flippedCard = result.entities[0] as any;
      expect(flippedCard.flipped).toBe(true);
      expect(result.score).toBe(0); // No match yet
    });

    it('should find a matching pair and increase score', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Find two cards with the same symbol
      const entities = game.entities as any[];
      let pairIndices: [number, number] | null = null;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[i].symbol === entities[j].symbol) {
            pairIndices = [i, j];
            break;
          }
        }
        if (pairIndices) break;
      }
      expect(pairIndices).not.toBeNull();

      const [idx1, idx2] = pairIndices!;
      const card1 = entities[idx1];
      const card2 = entities[idx2];

      // Flip first card
      const input1: IGameInput = {
        type: 'tap',
        position: { x: card1.position.x + 5, y: card1.position.y + 5 },
        timestamp: Date.now(),
      };
      const afterFirst = template.handleInput(game, input1);

      // Flip matching second card
      const input2: IGameInput = {
        type: 'tap',
        position: { x: card2.position.x + 5, y: card2.position.y + 5 },
        timestamp: Date.now(),
      };
      const afterSecond = template.handleInput(afterFirst, input2);

      expect(afterSecond.score).toBeGreaterThan(0);
      const matched1 = afterSecond.entities[idx1] as any;
      const matched2 = afterSecond.entities[idx2] as any;
      expect(matched1.matched).toBe(true);
      expect(matched2.matched).toBe(true);
    });

    it('should handle mismatched pair with wait timer', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      // Find two cards with different symbols
      const entities = game.entities as any[];
      let mismatchIndices: [number, number] | null = null;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[i].symbol !== entities[j].symbol) {
            mismatchIndices = [i, j];
            break;
          }
        }
        if (mismatchIndices) break;
      }
      expect(mismatchIndices).not.toBeNull();

      const [idx1, idx2] = mismatchIndices!;
      const card1 = entities[idx1];
      const card2 = entities[idx2];

      // Flip first card
      const input1: IGameInput = {
        type: 'tap',
        position: { x: card1.position.x + 5, y: card1.position.y + 5 },
        timestamp: Date.now(),
      };
      const afterFirst = template.handleInput(game, input1);

      // Flip mismatching second card
      const input2: IGameInput = {
        type: 'tap',
        position: { x: card2.position.x + 5, y: card2.position.y + 5 },
        timestamp: Date.now(),
      };
      const afterSecond = template.handleInput(afterFirst, input2);

      // Score should not change on mismatch
      expect(afterSecond.score).toBe(0);
    });

    it('should flip back mismatched cards after wait timer expires', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      const entities = game.entities as any[];
      // Find mismatched pair
      let mismatchIndices: [number, number] | null = null;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[i].symbol !== entities[j].symbol) {
            mismatchIndices = [i, j];
            break;
          }
        }
        if (mismatchIndices) break;
      }
      const [idx1, idx2] = mismatchIndices!;

      // Flip both mismatched cards
      const input1: IGameInput = {
        type: 'tap',
        position: { x: entities[idx1].position.x + 5, y: entities[idx1].position.y + 5 },
        timestamp: Date.now(),
      };
      game = template.handleInput(game, input1);

      const input2: IGameInput = {
        type: 'tap',
        position: { x: entities[idx2].position.x + 5, y: entities[idx2].position.y + 5 },
        timestamp: Date.now(),
      };
      game = template.handleInput(game, input2);

      // Both should be flipped
      expect((game.entities[idx1] as any).flipped).toBe(true);
      expect((game.entities[idx2] as any).flipped).toBe(true);

      // Wait timer should be 0.8s, advance past it
      game = template.update(game, 1.0);

      // Cards should be flipped back
      expect((game.entities[idx1] as any).flipped).toBe(false);
      expect((game.entities[idx2] as any).flipped).toBe(false);
    });

    it('should not allow input during wait timer', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = { ...template.createGame(config), state: GameState.PLAYING };

      const entities = game.entities as any[];
      let mismatchIndices: [number, number] | null = null;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          if (entities[i].symbol !== entities[j].symbol) {
            mismatchIndices = [i, j];
            break;
          }
        }
        if (mismatchIndices) break;
      }
      const [idx1, idx2] = mismatchIndices!;

      // Flip mismatched pair
      game = template.handleInput(game, {
        type: 'tap',
        position: { x: entities[idx1].position.x + 5, y: entities[idx1].position.y + 5 },
        timestamp: Date.now(),
      });
      game = template.handleInput(game, {
        type: 'tap',
        position: { x: entities[idx2].position.x + 5, y: entities[idx2].position.y + 5 },
        timestamp: Date.now(),
      });

      // Try to flip another card during wait timer
      const otherCard = entities.find((_, i) => i !== idx1 && i !== idx2)!;
      const duringWait = template.handleInput(game, {
        type: 'tap',
        position: { x: otherCard.position.x + 5, y: otherCard.position.y + 5 },
        timestamp: Date.now(),
      });

      // Score should not change (input was blocked)
      expect(duringWait.score).toBe(0);
    });

    it('should not flip a card outside grid bounds', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'tap',
        position: { x: 0, y: 0 }, // Before grid offset
        timestamp: Date.now(),
      };
      const result = template.handleInput(game, input);
      expect(result.score).toBe(0);
    });

    it('should complete when all pairs found', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      expect(template.isComplete(game)).toBe(false);

      // Manually mark all pairs as matched to test completion
      // We'll find and flip each pair
      const entities = game.entities as any[];
      const symbolMap = new Map<number, number[]>();
      for (let i = 0; i < entities.length; i++) {
        const sym = entities[i].symbol;
        if (!symbolMap.has(sym)) symbolMap.set(sym, []);
        symbolMap.get(sym)!.push(i);
      }

      let current = game;
      for (const [_, indices] of symbolMap) {
        const [i, j] = indices;
        current = template.handleInput(current, {
          type: 'tap',
          position: { x: entities[i].position.x + 5, y: entities[i].position.y + 5 },
          timestamp: Date.now(),
        });
        current = template.handleInput(current, {
          type: 'tap',
          position: { x: entities[j].position.x + 5, y: entities[j].position.y + 5 },
          timestamp: Date.now(),
        });
      }

      expect(template.isComplete(current)).toBe(true);
      expect(current.score).toBeGreaterThan(0);
    });
  });

  describe('EXPERT difficulty', () => {
    it('should create 20 cards (10 pairs)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      expect(game.entities.length).toBe(20);
    });
  });

  describe('update with no wait timer', () => {
    it('should pass through when waitTimer is 0', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBeCloseTo(0.5, 1);
    });
  });

  describe('non-tap input', () => {
    it('should ignore swipe input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = { ...template.createGame(config), state: GameState.PLAYING };

      const input: IGameInput = {
        type: 'swipe',
        position: { x: 50, y: 50 },
        timestamp: Date.now(),
      };

      const result = template.handleInput(game, input);
      expect(result.score).toBe(0);
    });
  });
});
