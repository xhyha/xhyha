import { MicroGameEngine } from './MicroGameEngine';
import {
  ITriggerContext, IUserProfile, IGameInput, IGameResult,
  GameState, GenesisEvent, GameType, Difficulty, ITrigger,
} from '../models/types';
import { TriggerContextFactory } from '../models/TriggerContext';
import { UserProfileFactory } from '../models/UserProfile';

describe('MicroGameEngine', () => {
  let engine: MicroGameEngine;

  beforeEach(() => {
    engine = new MicroGameEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  // ===== generateGame =====

  describe('generateGame()', () => {
    it('should generate a micro-game for a valid profile', () => {
      const profile = UserProfileFactory.create('user-1');
      const context = TriggerContextFactory.createDefault();

      const game = engine.generateGame(profile, context);

      expect(game).not.toBeNull();
      expect(game!.config).toBeDefined();
      expect(game!.config.id).toMatch(/^genesis_/);
      expect(game!.state).toBe(GameState.IDLE);
      expect(game!.score).toBe(0);
      expect(game!.elapsed).toBe(0);
      expect(game!.entities.length).toBeGreaterThan(0);
    });

    it('should emit GAME_CREATED event', () => {
      const listener = jest.fn();
      engine.on(GenesisEvent.GAME_CREATED, listener);

      const profile = UserProfileFactory.create('user-1');
      const context = TriggerContextFactory.createDefault();
      engine.generateGame(profile, context);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: expect.any(String),
        })
      );
    });

    it('should generate different game types for different profiles', () => {
      const casualProfile = UserProfileFactory.createCasualGamer('casual');
      const context = TriggerContextFactory.createDefault();

      const game = engine.generateGame(casualProfile, context);
      expect(game).not.toBeNull();
      // Casual gamer prefers RELAXATION → HEALING game type
      expect([GameType.HEALING, GameType.CREATE]).toContain(game!.config.type);
    });
  });

  // ===== startGame =====

  describe('startGame()', () => {
    it('should set game state to PLAYING', () => {
      const profile = UserProfileFactory.create('user-1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;

      engine.startGame(game);
      const active = engine.getActiveGame();

      expect(active).not.toBeNull();
      expect(active!.state).toBe(GameState.PLAYING);
    });

    it('should emit GAME_STARTED event', () => {
      const listener = jest.fn();
      engine.on(GenesisEvent.GAME_STARTED, listener);

      const profile = UserProfileFactory.create('user-1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // ===== handleInput =====

  describe('handleInput()', () => {
    it('should return null when no active game', () => {
      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      expect(engine.handleInput(input)).toBeNull();
    });

    it('should process input on the active game', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };

      const result = engine.handleInput(input);
      expect(result).not.toBeNull();
    });
  });

  // ===== update =====

  describe('update()', () => {
    it('should return null when no active game', () => {
      expect(engine.update(0.016)).toBeNull();
    });

    it('should advance elapsed time', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      const before = engine.getActiveGame()!.elapsed;
      engine.update(1.0);
      const after = engine.getActiveGame()!.elapsed;

      expect(after).toBeGreaterThan(before);
    });

    it('should emit GAME_COMPLETED when game finishes', () => {
      const listener = jest.fn();
      engine.on(GenesisEvent.GAME_COMPLETED, listener);

      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      // Simulate a very large dt to push past maxDuration
      const maxDur = game.config.maxDuration;
      engine.update(maxDur + 1);

      expect(listener).toHaveBeenCalled();
    });
  });

  // ===== endGame =====

  describe('endGame()', () => {
    it('should return null when no active game', () => {
      expect(engine.endGame()).toBeNull();
    });

    it('should return a valid IGameResult', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);
      engine.update(0.5);

      const result = engine.endGame();

      expect(result).not.toBeNull();
      expect(result!.gameId).toBe(game.config.id);
      expect(result!.gameType).toBe(game.config.type);
      expect(result!.duration).toBeGreaterThanOrEqual(0);
      expect(result!.completed).toBe(true);
    });

    it('should clear the active game after ending', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      engine.endGame();

      expect(engine.getActiveGame()).toBeNull();
    });

    it('should add result to game history', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      engine.endGame();

      const history = engine.getGameHistory();
      expect(history).toHaveLength(1);
    });
  });

  // ===== Full game lifecycle =====

  describe('full game lifecycle', () => {
    it('should support generate → start → input → update → end flow', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();

      // Generate
      const game = engine.generateGame(profile, context);
      expect(game).not.toBeNull();
      expect(game!.state).toBe(GameState.IDLE);

      // Start
      engine.startGame(game!);
      expect(engine.getActiveGame()!.state).toBe(GameState.PLAYING);

      // Input
      const input: IGameInput = {
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      };
      engine.handleInput(input);

      // Update
      engine.update(0.016);

      // End
      const result = engine.endGame();
      expect(result).not.toBeNull();
      expect(result!.completed).toBe(true);
      expect(engine.getActiveGame()).toBeNull();
    });
  });

  // ===== checkTrigger =====

  describe('checkTrigger()', () => {
    it('should return not triggered when no triggers registered', () => {
      const context = TriggerContextFactory.createDefault();
      const result = engine.checkTrigger(context);

      expect(result.triggered).toBe(false);
    });

    it('should evaluate registered triggers', () => {
      engine.registerTriggers([{
        id: 'test-trigger',
        category: 'BEHAVIOR' as any,
        name: 'Test',
        description: 'desc',
        cooldown: 0,
        priority: 5,
        condition: () => true,
      }]);

      const context = TriggerContextFactory.createDefault();
      const result = engine.checkTrigger(context);

      expect(result.triggered).toBe(true);
    });
  });

  // ===== getRecommendation =====

  describe('getRecommendation()', () => {
    it('should return a recommendation without generating game', () => {
      const profile = UserProfileFactory.create('user-1');
      const rec = engine.getRecommendation(profile);

      expect(rec).toBeDefined();
      expect(rec.gameType).toBeDefined();
      expect(rec.difficulty).toBeDefined();
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ===== updateUserProfile =====

  describe('updateUserProfile()', () => {
    it('should update profile based on game result', () => {
      const profile = UserProfileFactory.create('user-1');
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.REACTION,
        score: 900,
        maxScore: 1000,
        duration: 10,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateUserProfile(profile, result);
      expect(updated.totalMicroGamesPlayed).toBe(1);
    });
  });

  // ===== destroy =====

  describe('destroy()', () => {
    it('should clean up resources', () => {
      const profile = UserProfileFactory.createHardcoreGamer('h1');
      const context = TriggerContextFactory.createDefault();
      const game = engine.generateGame(profile, context)!;
      engine.startGame(game);

      engine.destroy();

      expect(engine.getActiveGame()).toBeNull();
      expect(engine.getGameHistory()).toHaveLength(0);
    });
  });
});
