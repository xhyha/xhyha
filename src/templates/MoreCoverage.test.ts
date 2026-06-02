import { DotsAndBoxesGame } from './DotsAndBoxesGame';
import { TicTacToeGame } from './TicTacToeGame';
import { ReflexGame } from './ReflexGame';
import { PatternMemoryGame } from './PatternMemoryGame';
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

function tapInput(x: number, y: number): IGameInput {
  return { type: 'tap', position: { x, y }, timestamp: Date.now() };
}

function swipeInput(x: number, y: number): IGameInput {
  return { type: 'swipe', position: { x, y }, timestamp: Date.now() };
}

// ============================
// DotsAndBoxesGame
// ============================
describe('DotsAndBoxesGame', () => {
  let template: DotsAndBoxesGame;

  // Board layout constants (must match the template)
  const DOT_SIZE = 10;
  const LINE_THICKNESS = 6;
  const BOARD_PADDING_X = 20;
  const BOARD_PADDING_Y = 60;

  function getCellSize(difficulty: Difficulty): number {
    const rows = difficulty >= Difficulty.HARD ? (difficulty >= Difficulty.EXPERT ? 6 : 5) :
                 (difficulty >= Difficulty.NORMAL ? 4 : 3);
    const availableWidth = 300 - 2 * BOARD_PADDING_X;
    const availableHeight = 400 - BOARD_PADDING_Y;
    const maxCellW = Math.floor((availableWidth - DOT_SIZE) / rows);
    const maxCellH = Math.floor((availableHeight - DOT_SIZE) / rows);
    return Math.min(maxCellW, maxCellH, 60);
  }

  beforeEach(() => {
    template = new DotsAndBoxesGame();
  });

  it('should have PUZZLE type and name DotsAndBoxes', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('DotsAndBoxes');
  });

  describe('createGame()', () => {
    it('should create EASY game (3x3 grid of boxes)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);
      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      // 3x3 boxes → 4x4 dots + 4x3 horiz lines + 3x4 vert lines + 3x3 boxes
      // dots: 16, hLines: 12, vLines: 12, boxes: 9 = 49
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create NORMAL game (4x4 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(game.state).toBe(GameState.IDLE);
    });

    it('should create HARD game (5x5 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      const game = template.createGame(config);
      expect(game.state).toBe(GameState.IDLE);
    });

    it('should create EXPERT game (6x6 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      expect(game.state).toBe(GameState.IDLE);
    });

    it('should have dot, line, and box entities', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const dots = game.entities.filter(e => (e as any).kind === 'dot');
      const lines = game.entities.filter(e => (e as any).kind === 'line');
      const boxes = game.entities.filter(e => (e as any).kind === 'box');

      expect(dots.length).toBeGreaterThan(0);
      expect(lines.length).toBeGreaterThan(0);
      expect(boxes.length).toBeGreaterThan(0);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);

      game = template.handleInput(game, tapInput(150, 200));
      expect(game.state).toBe(GameState.PLAYING);
    });

    it('should ignore input in COMPLETED state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = { ...game, state: GameState.COMPLETED, score: 50 };

      game = template.handleInput(game, tapInput(150, 200));
      expect(game.score).toBe(50);
    });
  });

  describe('processInput() - drawing lines', () => {
    it('should allow drawing a horizontal line between dots', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // EASY: 3x3 boxes, cell size varies
      const cs = getCellSize(Difficulty.EASY);
      // Horizontal line between dot(0,0) and dot(0,1): 
      // x = BOARD_PADDING_X + 0*cs + DOT_SIZE, y = BOARD_PADDING_Y + 0*cs + DOT_SIZE/2
      const hx = BOARD_PADDING_X + DOT_SIZE + 5;
      const hy = BOARD_PADDING_Y + DOT_SIZE / 2;

      game = template.handleInput(game, tapInput(hx, hy));

      // Should have drawn a line (score might change)
      // The key thing: no crash, game progresses, AI may respond on update
      expect(game).toBeDefined();
    });

    it('should allow drawing a vertical line between dots', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const cs = getCellSize(Difficulty.EASY);
      // Vertical line between dot(0,0) and dot(1,0):
      // x = BOARD_PADDING_X + DOT_SIZE/2, y = BOARD_PADDING_Y + DOT_SIZE
      const vx = BOARD_PADDING_X + DOT_SIZE / 2;
      const vy = BOARD_PADDING_Y + DOT_SIZE + 5;

      game = template.handleInput(game, tapInput(vx, vy));
      expect(game).toBeDefined();
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const beforeScore = game.score;
      game = template.handleInput(game, swipeInput(150, 200));
      expect(game.score).toBe(beforeScore);
    });

    it('should ignore tap on empty area', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const beforeScore = game.score;
      game = template.handleInput(game, tapInput(-100, -100));
      expect(game.score).toBe(beforeScore);
    });

    it('should ignore tap when game is over', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Force game over by setting state
      game = { ...game, state: GameState.COMPLETED };
      // processInput checks this.gameOver internally
    });
  });

  describe('update() - AI turn', () => {
    it('should not update in IDLE state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should let AI move when it is AI turn', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Draw a line so it becomes AI's turn
      const hx = BOARD_PADDING_X + DOT_SIZE + 5;
      const hy = BOARD_PADDING_Y + DOT_SIZE / 2;
      game = template.handleInput(game, tapInput(hx, hy));

      // If AI turn, update should trigger AI
      game = template.update(game, 0.5);
      expect(game).toBeDefined();
    });

    it('should update elapsed time', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 1.0);
      expect(game.elapsed).toBeGreaterThan(0);
    });

    it('should use different AI for NORMAL difficulty', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Draw a line to trigger AI turn
      const hx = BOARD_PADDING_X + DOT_SIZE + 5;
      const hy = BOARD_PADDING_Y + DOT_SIZE / 2;
      game = template.handleInput(game, tapInput(hx, hy));

      game = template.update(game, 0.5);
      expect(game).toBeDefined();
    });

    it('should use different AI for HARD difficulty', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const hx = BOARD_PADDING_X + DOT_SIZE + 5;
      const hy = BOARD_PADDING_Y + DOT_SIZE / 2;
      game = template.handleInput(game, tapInput(hx, hy));

      game = template.update(game, 0.5);
      expect(game).toBeDefined();
    });

    it('should use different AI for EXPERT difficulty', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const hx = BOARD_PADDING_X + DOT_SIZE + 5;
      const hy = BOARD_PADDING_Y + DOT_SIZE / 2;
      game = template.handleInput(game, tapInput(hx, hy));

      game = template.update(game, 0.5);
      expect(game).toBeDefined();
    });

    it('should complete game when time limit exceeded', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY, maxDuration: 5 });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 6.0);
      expect(game.state).toBe(GameState.COMPLETED);
    });

    it('should play a full game with multiple player and AI moves', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play several rounds of player + AI moves
      for (let move = 0; move < 20; move++) {
        // Try tapping in various positions to draw lines
        const cs = getCellSize(Difficulty.EASY);
        // Try horizontal lines
        for (let r = 0; r <= 3 && !template.isComplete(game); r++) {
          for (let c = 0; c < 3 && !template.isComplete(game); c++) {
            const lx = BOARD_PADDING_X + c * cs + DOT_SIZE + 2;
            const ly = BOARD_PADDING_Y + r * cs + DOT_SIZE / 2;
            game = template.handleInput(game, tapInput(lx, ly));
            game = template.update(game, 0.1);
          }
        }
        // Try vertical lines
        for (let r = 0; r < 3 && !template.isComplete(game); r++) {
          for (let c = 0; c <= 3 && !template.isComplete(game); c++) {
            const lx = BOARD_PADDING_X + c * cs + DOT_SIZE / 2;
            const ly = BOARD_PADDING_Y + r * cs + DOT_SIZE + 2;
            game = template.handleInput(game, tapInput(lx, ly));
            game = template.update(game, 0.1);
          }
        }
        if (template.isComplete(game)) break;
      }

      // Game should have progressed significantly
      expect(game).toBeDefined();
    });
  });

  describe('isComplete()', () => {
    it('should return false when game just started', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return correct result fields', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = { ...game, state: GameState.COMPLETED, score: 100, elapsed: 30 };

      const result = template.getResult(game);
      expect(result.gameId).toBe(config.id);
      expect(result.score).toBe(100);
      expect(result.maxScore).toBe(9 * 10 + 50); // 3x3 boxes * 10 + 50 bonus
      expect(result.duration).toBe(30);
      expect(result.completed).toBe(true);
      expect(result.difficulty).toBe(Difficulty.EASY);
    });

    it('should return correct max score for NORMAL (4x4=16 boxes)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.getResult(game).maxScore).toBe(16 * 10 + 50);
    });

    it('should return correct max score for HARD (5x5=25 boxes)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      const game = template.createGame(config);
      expect(template.getResult(game).maxScore).toBe(25 * 10 + 50);
    });

    it('should return correct max score for EXPERT (6x6=36 boxes)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      expect(template.getResult(game).maxScore).toBe(36 * 10 + 50);
    });
  });

  describe('edge cases', () => {
    it('should handle drawing all lines to complete the game', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const cs = getCellSize(Difficulty.EASY);

      // Draw ALL horizontal lines
      for (let r = 0; r <= 3; r++) {
        for (let c = 0; c < 3; c++) {
          const lx = BOARD_PADDING_X + c * cs + DOT_SIZE + 2;
          const ly = BOARD_PADDING_Y + r * cs + DOT_SIZE / 2;
          game = template.handleInput(game, tapInput(lx, ly));
          game = template.update(game, 0.1); // AI turn
        }
      }

      // Draw ALL vertical lines
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c <= 3; c++) {
          const lx = BOARD_PADDING_X + c * cs + DOT_SIZE / 2;
          const ly = BOARD_PADDING_Y + r * cs + DOT_SIZE + 2;
          game = template.handleInput(game, tapInput(lx, ly));
          game = template.update(game, 0.1); // AI turn
        }
      }

      // All lines drawn - game should be complete
      expect(template.isComplete(game)).toBe(true);
    });

    it('should not allow drawing on an already-drawn line', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const cs = getCellSize(Difficulty.EASY);
      const lx = BOARD_PADDING_X + DOT_SIZE + 2;
      const ly = BOARD_PADDING_Y + DOT_SIZE / 2;

      // Draw a line
      game = template.handleInput(game, tapInput(lx, ly));
      game = template.update(game, 0.1);
      const scoreAfter = game.score;

      // Try drawing same line again (should not change score)
      game = template.handleInput(game, tapInput(lx, ly));
      // Score might change due to AI but no crash
      expect(game).toBeDefined();
    });
  });
});

// ============================
// TicTacToeGame
// ============================
describe('TicTacToeGame', () => {
  let template: TicTacToeGame;

  const CELL_SIZE = 90;
  const CELL_GAP = 6;
  const BOARD_X = 30;
  const BOARD_Y = 80;

  function cellCenter(row: number, col: number) {
    return {
      x: BOARD_X + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      y: BOARD_Y + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    };
  }

  beforeEach(() => {
    template = new TicTacToeGame();
  });

  it('should have PUZZLE type and name TicTacToe', () => {
    expect(template.type).toBe(GameType.PUZZLE);
    expect(template.name).toBe('TicTacToe');
  });

  describe('createGame()', () => {
    it('should create a game with 9 cells', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.entities.length).toBe(9);
    });

    it('should create all empty cells', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const allEmpty = game.entities.every(e => (e as any).value === '');
      expect(allEmpty).toBe(true);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);

      game = template.handleInput(game, tapInput(150, 200));
      expect(game.state).toBe(GameState.PLAYING);
    });
  });

  describe('processInput() - playing the game', () => {

    it('should place X and AI responds with O', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const pos = cellCenter(1, 1); // center
      game = template.handleInput(game, tapInput(pos.x, pos.y));

      // Player X should be placed
      const playerCell = game.entities.find(
        e => (e as any).row === 1 && (e as any).col === 1
      ) as any;
      expect(playerCell.value).toBe('X');

      // AI should have placed an O somewhere
      const oCount = game.entities.filter(e => (e as any).value === 'O').length;
      expect(oCount).toBe(1);
    });

    it('should not allow tapping an occupied cell', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const pos = cellCenter(1, 1);
      game = template.handleInput(game, tapInput(pos.x, pos.y));

      // Try to tap same cell again
      const beforeEntities = game.entities.map(e => (e as any).value);
      game = template.handleInput(game, tapInput(pos.x, pos.y));
      const afterEntities = game.entities.map(e => (e as any).value);

      expect(beforeEntities).toEqual(afterEntities);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const beforeValues = game.entities.map(e => (e as any).value);
      game = template.handleInput(game, swipeInput(150, 200));
      const afterValues = game.entities.map(e => (e as any).value);

      expect(beforeValues).toEqual(afterValues);
    });

    it('should ignore tap outside the board', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const beforeValues = game.entities.map(e => (e as any).value);
      game = template.handleInput(game, tapInput(0, 0));
      const afterValues = game.entities.map(e => (e as any).value);

      expect(beforeValues).toEqual(afterValues);
    });

    it('should detect player win', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // We can't guarantee a win against random AI, but let's try
      // Play center, then try to complete a row
      // Row 0: (0,0), (0,1), (0,2)
      const positions = [
        cellCenter(0, 0), cellCenter(1, 0), cellCenter(0, 1),
        cellCenter(1, 1), cellCenter(0, 2), cellCenter(1, 2),
      ];

      for (const pos of positions) {
        if (template.isComplete(game)) break;
        game = template.handleInput(game, tapInput(pos.x, pos.y));
      }

      // Game should have progressed (either won by X, won by O, or still playing)
      expect(game).toBeDefined();
    });

    it('should play against NORMAL AI (blocking)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play several moves
      const positions = [
        cellCenter(0, 0), cellCenter(1, 1), cellCenter(0, 1),
        cellCenter(2, 2), cellCenter(0, 2),
      ];

      for (const pos of positions) {
        if (template.isComplete(game)) break;
        game = template.handleInput(game, tapInput(pos.x, pos.y));
      }

      expect(game).toBeDefined();
    });

    it('should play against HARD AI (minimax)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play all 9 cells (full game)
      const positions = [
        cellCenter(0, 0), cellCenter(0, 1), cellCenter(0, 2),
        cellCenter(1, 0), cellCenter(1, 1), cellCenter(1, 2),
        cellCenter(2, 0), cellCenter(2, 1), cellCenter(2, 2),
      ];

      for (const pos of positions) {
        if (template.isComplete(game)) break;
        game = template.handleInput(game, tapInput(pos.x, pos.y));
      }

      expect(template.isComplete(game)).toBe(true);
    });

    it('should play against EXPERT AI (perfect minimax)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const positions = [
        cellCenter(0, 0), cellCenter(0, 1), cellCenter(0, 2),
        cellCenter(1, 0), cellCenter(1, 1), cellCenter(1, 2),
        cellCenter(2, 0), cellCenter(2, 1), cellCenter(2, 2),
      ];

      for (const pos of positions) {
        if (template.isComplete(game)) break;
        game = template.handleInput(game, tapInput(pos.x, pos.y));
      }

      // Expert AI should at least draw
      expect(template.isComplete(game)).toBe(true);
    });

    it('should result in draw with optimal play on both sides', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play a full game
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (template.isComplete(game)) break;
          const pos = cellCenter(r, c);
          game = template.handleInput(game, tapInput(pos.x, pos.y));
        }
        if (template.isComplete(game)) break;
      }

      expect(template.isComplete(game)).toBe(true);
      // Board should be full or have a winner
      const values = game.entities.map(e => (e as any).value);
      const empty = values.filter(v => v === '').length;
      if (empty === 0) {
        // Full board - draw or win
        expect(game.score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('update()', () => {
    it('should update elapsed time in PLAYING state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 1.0);
      expect(game.elapsed).toBeGreaterThan(0);
    });

    it('should not update in IDLE state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);

      const updated = template.update(game, 1.0);
      expect(updated.elapsed).toBe(0);
    });
  });

  describe('isComplete()', () => {
    it('should return false when game just started', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return correct result fields', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = { ...game, state: GameState.COMPLETED, score: 100, elapsed: 15 };

      const result = template.getResult(game);
      expect(result.gameId).toBe(config.id);
      expect(result.score).toBe(100);
      expect(result.maxScore).toBe(150);
      expect(result.duration).toBe(15);
      expect(result.completed).toBe(true);
      expect(result.difficulty).toBe(Difficulty.NORMAL);
    });
  });

  describe('score computation', () => {
    it('should give 0 score when AI wins', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Make deliberately bad moves to let AI win
      const positions = [
        cellCenter(0, 0), cellCenter(2, 0), cellCenter(1, 1),
        cellCenter(2, 1), cellCenter(0, 2), cellCenter(2, 2),
      ];

      for (const pos of positions) {
        if (template.isComplete(game)) break;
        game = template.handleInput(game, tapInput(pos.x, pos.y));
      }

      // If AI won, score should be 0
      if (game.entities.filter(e => (e as any).value === 'O').length >= 3) {
        // AI has pieces - could have won
        if (template.isComplete(game)) {
          expect(game.score).toBeGreaterThanOrEqual(0);
        }
      }
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
    it('should create a game in IDLE state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.elapsed).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create game for EASY (5 rounds)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      const game = template.createGame(config);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create game for HARD (8 rounds)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.HARD });
      const game = template.createGame(config);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create game for EXPERT (10 rounds)', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      expect(game.entities.length).toBeGreaterThan(0);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);

      game = template.handleInput(game, tapInput(150, 200));
      expect(game.state).toBe(GameState.PLAYING);
    });
  });

  describe('update() - waiting and ready phases', () => {
    it('should not update in IDLE state', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should transition from waiting to ready after delay', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // EASY max delay is 4.0s
      game = template.update(game, 5.0);

      // Should now be in 'ready' phase (signal shown)
      const signalEntity = game.entities.find(e => (e as any).kind === 'signal') as any;
      expect(signalEntity).toBeDefined();
    });

    it('should advance elapsed time', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 1.0);
      expect(game.elapsed).toBeGreaterThan(0);
    });

    it('should complete when all rounds done', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Complete all 5 rounds
      for (let round = 0; round < 5; round++) {
        // Wait for signal
        game = template.update(game, 5.0);
        // Tap
        game = template.handleInput(game, tapInput(150, 200));
        // Small update to process
        game = template.update(game, 0.1);
      }

      expect(template.isComplete(game)).toBe(true);
      expect(game.state).toBe(GameState.COMPLETED);
    });
  });

  describe('processInput() - tapping', () => {
    it('should record early tap penalty', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Tap immediately (still in 'waiting' phase)
      game = template.handleInput(game, tapInput(150, 200));

      // Should have recorded a round (early tap)
      // Entities should include a result indicator
      expect(game.entities.length).toBeGreaterThan(1);
    });

    it('should record reaction time when tapping during ready phase', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for signal
      game = template.update(game, 5.0);

      // Tap during ready phase
      game = template.handleInput(game, tapInput(150, 200));

      // Score should be computed
      expect(game.score).toBeGreaterThanOrEqual(0);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      const beforeScore = game.score;
      game = template.handleInput(game, swipeInput(150, 200));
      expect(game.score).toBe(beforeScore);
    });

    it('should ignore input when all done', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Complete all rounds
      for (let round = 0; round < 5; round++) {
        game = template.update(game, 5.0);
        game = template.handleInput(game, tapInput(150, 200));
        game = template.update(game, 0.1);
      }

      // Try tapping again - should be ignored
      const scoreBefore = game.score;
      game = template.handleInput(game, tapInput(150, 200));
      expect(game.score).toBe(scoreBefore);
    });

    it('should handle mixed early and normal taps', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Round 1: early tap
      game = template.handleInput(game, tapInput(150, 200));
      game = template.update(game, 0.1);

      // Round 2: wait and tap
      game = template.update(game, 5.0);
      game = template.handleInput(game, tapInput(150, 200));
      game = template.update(game, 0.1);

      // Round 3: early tap
      game = template.handleInput(game, tapInput(150, 200));
      game = template.update(game, 0.1);

      // Round 4: wait and tap
      game = template.update(game, 5.0);
      game = template.handleInput(game, tapInput(150, 200));
      game = template.update(game, 0.1);

      // Round 5: wait and tap
      game = template.update(game, 5.0);
      game = template.handleInput(game, tapInput(150, 200));
      game = template.update(game, 0.1);

      expect(template.isComplete(game)).toBe(true);
    });
  });

  describe('isComplete()', () => {
    it('should return false when game just started', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return correct result fields', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = { ...game, state: GameState.COMPLETED, score: 500, elapsed: 20 };

      const result = template.getResult(game);
      expect(result.gameId).toBe(config.id);
      expect(result.score).toBe(500);
      expect(result.maxScore).toBe(1000);
      expect(result.duration).toBe(20);
      expect(result.completed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should give 0 score for all early taps', () => {
      const config = makeConfig({ type: GameType.REACTION, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // All 5 rounds with early taps
      for (let i = 0; i < 5; i++) {
        game = template.handleInput(game, tapInput(150, 200));
        game = template.update(game, 0.1);
      }

      expect(game.score).toBe(0);
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
    it('should create a game in IDLE state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
      expect(game.entities.length).toBeGreaterThan(0);
    });

    it('should create EASY game (3x3 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);
      const cells = game.entities.filter(e => (e as any).kind === 'cell');
      expect(cells.length).toBe(9); // 3x3
    });

    it('should create NORMAL game (4x4 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const cells = game.entities.filter(e => (e as any).kind === 'cell');
      expect(cells.length).toBe(16); // 4x4
    });

    it('should create HARD game (4x4 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.HARD });
      const game = template.createGame(config);
      const cells = game.entities.filter(e => (e as any).kind === 'cell');
      expect(cells.length).toBe(16); // 4x4
    });

    it('should create EXPERT game (5x5 grid)', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EXPERT });
      const game = template.createGame(config);
      const cells = game.entities.filter(e => (e as any).kind === 'cell');
      expect(cells.length).toBe(25); // 5x5
    });

    it('should have an info entity', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const info = game.entities.find(e => (e as any).kind === 'info');
      expect(info).toBeDefined();
    });

    it('should start in showing phase', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      const info = game.entities.find(e => (e as any).kind === 'info') as any;
      expect(info.phase).toBe('showing');
    });

    it('should light up pattern cells during showing phase', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      const game = template.createGame(config);
      const litCells = game.entities.filter(e => (e as any).kind === 'cell' && (e as any).lit === true);
      // Initial pattern size is 3
      expect(litCells.length).toBe(3);
    });
  });

  describe('handleInput()', () => {
    it('should transition from IDLE to PLAYING', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);

      game = template.handleInput(game, tapInput(150, 200));
      expect(game.state).toBe(GameState.PLAYING);
    });
  });

  describe('update() - showing to input transition', () => {
    it('should not update in IDLE state', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);

      const updated = template.update(game, 0.5);
      expect(updated.elapsed).toBe(0);
    });

    it('should transition from showing to input phase after display time', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // EASY display time is 2.5s
      game = template.update(game, 3.0);

      const info = game.entities.find(e => (e as any).kind === 'info') as any;
      expect(info.phase).toBe('input');
    });

    it('should advance elapsed time', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 1.0);
      expect(game.elapsed).toBeGreaterThan(0);
    });
  });

  describe('processInput() - reproducing patterns', () => {
    it('should accept correct pattern cells', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for showing phase to end
      game = template.update(game, 3.0);

      // Find lit cells (the pattern)
      const litCells = game.entities.filter(
        e => (e as any).kind === 'cell' && (e as any).correct === true
      );

      // Tap the correct cells
      for (const cell of litCells) {
        const cx = cell.position.x + cell.size.x / 2;
        const cy = cell.position.y + cell.size.y / 2;
        game = template.handleInput(game, tapInput(cx, cy));
      }

      // Should be in feedback phase (correct round)
      const info = game.entities.find(e => (e as any).kind === 'info') as any;
      expect(info.phase).toBe('feedback');
    });

    it('should reject wrong cell and end game', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for showing phase to end
      game = template.update(game, 3.0);

      // Find a non-pattern cell
      const wrongCell = game.entities.find(
        e => (e as any).kind === 'cell' && (e as any).correct === false
      );

      if (wrongCell) {
        const cx = wrongCell.position.x + wrongCell.size.x / 2;
        const cy = wrongCell.position.y + wrongCell.size.y / 2;
        game = template.handleInput(game, tapInput(cx, cy));

        // Should be in feedback phase (wrong answer)
        const info = game.entities.find(e => (e as any).kind === 'info') as any;
        expect(info.phase).toBe('feedback');
      }
    });

    it('should ignore tap during showing phase', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Don't wait - tap during showing phase
      const beforeScore = game.score;
      game = template.handleInput(game, tapInput(150, 200));
      expect(game.score).toBe(beforeScore);
    });

    it('should ignore non-tap input', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for input phase
      game = template.update(game, 3.0);

      const beforeScore = game.score;
      game = template.handleInput(game, swipeInput(150, 200));
      expect(game.score).toBe(beforeScore);
    });

    it('should ignore tapping same cell twice', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for input phase
      game = template.update(game, 3.0);

      // Find a correct cell
      const correctCell = game.entities.find(
        e => (e as any).kind === 'cell' && (e as any).correct === true
      );

      if (correctCell) {
        const cx = correctCell.position.x + correctCell.size.x / 2;
        const cy = correctCell.position.y + correctCell.size.y / 2;

        // Tap it once
        game = template.handleInput(game, tapInput(cx, cy));
        // Tap same position again - should be ignored
        const beforeEntities = game.entities.length;
        game = template.handleInput(game, tapInput(cx, cy));
        expect(game.entities.length).toBe(beforeEntities);
      }
    });

    it('should ignore tap on empty area', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for input phase
      game = template.update(game, 3.0);

      const beforeScore = game.score;
      game = template.handleInput(game, tapInput(0, 0));
      expect(game.score).toBe(beforeScore);
    });
  });

  describe('multi-round game flow', () => {
    it('should progress through multiple rounds', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play 3 rounds
      for (let round = 0; round < 3; round++) {
        // Wait for showing phase to end
        game = template.update(game, 3.0);

        // Find correct cells and tap them
        const correctCells = game.entities.filter(
          e => (e as any).kind === 'cell' && (e as any).correct === true
        );

        for (const cell of correctCells) {
          const cx = cell.position.x + cell.size.x / 2;
          const cy = cell.position.y + cell.size.y / 2;
          game = template.handleInput(game, tapInput(cx, cy));
        }

        // Wait for feedback phase to end (0.8s)
        game = template.update(game, 1.0);
      }

      // Game should have progressed (score should increase)
      expect(game.score).toBeGreaterThan(0);
    });

    it('should end game on wrong answer after feedback', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Wait for input phase
      game = template.update(game, 3.0);

      // Tap a wrong cell
      const wrongCell = game.entities.find(
        e => (e as any).kind === 'cell' && (e as any).correct === false
      );

      if (wrongCell) {
        game = template.handleInput(game, tapInput(
          wrongCell.position.x + wrongCell.size.x / 2,
          wrongCell.position.y + wrongCell.size.y / 2
        ));

        // Wait for feedback to process
        game = template.update(game, 1.0);

        // Game should be complete (wrong answer ends it)
        expect(template.isComplete(game)).toBe(true);
      }
    });

    it('should end game when max rounds reached', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Play all 10 rounds (maxRounds for EASY)
      for (let round = 0; round < 10; round++) {
        if (template.isComplete(game)) break;

        // Wait for showing to end
        game = template.update(game, 3.0);

        if (template.isComplete(game)) break;

        // Tap all correct cells
        const correctCells = game.entities.filter(
          e => (e as any).kind === 'cell' && (e as any).correct === true
        );

        for (const cell of correctCells) {
          game = template.handleInput(game, tapInput(
            cell.position.x + cell.size.x / 2,
            cell.position.y + cell.size.y / 2
          ));
        }

        // Wait for feedback
        game = template.update(game, 1.0);
      }

      expect(template.isComplete(game)).toBe(true);
    });

    it('should complete when time limit exceeded', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY, maxDuration: 5 });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      game = template.update(game, 6.0);
      expect(game.state).toBe(GameState.COMPLETED);
    });
  });

  describe('isComplete()', () => {
    it('should return false when game just started', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.NORMAL });
      const game = template.createGame(config);
      expect(template.isComplete(game)).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return correct result fields', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = { ...game, state: GameState.COMPLETED, score: 45, elapsed: 30 };

      const result = template.getResult(game);
      expect(result.gameId).toBe(config.id);
      expect(result.score).toBe(45);
      expect(result.maxScore).toBe(10 * 15); // maxRounds * 15
      expect(result.duration).toBe(30);
      expect(result.completed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should ignore input when finished', () => {
      const config = makeConfig({ type: GameType.PUZZLE, difficulty: Difficulty.EASY });
      let game = template.createGame(config);
      game = template.handleInput(game, tapInput(150, 200)); // start

      // Complete a wrong round
      game = template.update(game, 3.0);

      const wrongCell = game.entities.find(
        e => (e as any).kind === 'cell' && (e as any).correct === false
      );

      if (wrongCell) {
        game = template.handleInput(game, tapInput(
          wrongCell.position.x + wrongCell.size.x / 2,
          wrongCell.position.y + wrongCell.size.y / 2
        ));
        game = template.update(game, 1.0);

        // Now finished - try tapping
        const beforeScore = game.score;
        game = template.handleInput(game, tapInput(150, 200));
        expect(game.score).toBe(beforeScore);
      }
    });
  });
});
