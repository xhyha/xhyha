import { PersonalizationEngine, IGameRecommendation } from './PersonalizationEngine';
import { IUserProfile, IGameResult, GameType, Difficulty, TasteDimension } from '../models/types';
import { UserProfileFactory } from '../models/UserProfile';

describe('PersonalizationEngine', () => {
  let engine: PersonalizationEngine;

  beforeEach(() => {
    engine = new PersonalizationEngine();
  });

  // ===== recommend() =====

  describe('recommend()', () => {
    it('should return a recommendation with all required fields', () => {
      const profile = UserProfileFactory.create('user-1');
      const rec = engine.recommend(profile);

      expect(rec).toHaveProperty('gameType');
      expect(rec).toHaveProperty('difficulty');
      expect(rec).toHaveProperty('duration');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('confidence');
    });

    it('should recommend REACTION for action-oriented users', () => {
      const profile = UserProfileFactory.create('action-user', {
        tasteProfile: {
          [TasteDimension.STRATEGY]: 0.1,
          [TasteDimension.ACTION]: 0.95,
          [TasteDimension.SOCIAL]: 0.2,
          [TasteDimension.CREATIVE]: 0.1,
          [TasteDimension.RELAXATION]: 0.1,
          [TasteDimension.COMPETITION]: 0.3,
        },
      });

      const rec = engine.recommend(profile);
      expect(rec.gameType).toBe(GameType.REACTION);
    });

    it('should recommend PUZZLE for strategy-oriented users', () => {
      const profile = UserProfileFactory.create('strat-user', {
        tasteProfile: {
          [TasteDimension.STRATEGY]: 0.95,
          [TasteDimension.ACTION]: 0.1,
          [TasteDimension.SOCIAL]: 0.2,
          [TasteDimension.CREATIVE]: 0.3,
          [TasteDimension.RELAXATION]: 0.1,
          [TasteDimension.COMPETITION]: 0.4,
        },
      });

      const rec = engine.recommend(profile);
      expect(rec.gameType).toBe(GameType.PUZZLE);
    });

    it('should recommend HEALING for relaxation-oriented users', () => {
      const profile = UserProfileFactory.create('relax-user', {
        tasteProfile: {
          [TasteDimension.STRATEGY]: 0.1,
          [TasteDimension.ACTION]: 0.1,
          [TasteDimension.SOCIAL]: 0.3,
          [TasteDimension.CREATIVE]: 0.2,
          [TasteDimension.RELAXATION]: 0.9,
          [TasteDimension.COMPETITION]: 0.1,
        },
      });

      const rec = engine.recommend(profile);
      expect(rec.gameType).toBe(GameType.HEALING);
    });

    it('should recommend CREATE for creative users', () => {
      const profile = UserProfileFactory.create('creative-user', {
        tasteProfile: {
          [TasteDimension.STRATEGY]: 0.2,
          [TasteDimension.ACTION]: 0.1,
          [TasteDimension.SOCIAL]: 0.3,
          [TasteDimension.CREATIVE]: 0.95,
          [TasteDimension.RELAXATION]: 0.3,
          [TasteDimension.COMPETITION]: 0.1,
        },
      });

      const rec = engine.recommend(profile);
      expect(rec.gameType).toBe(GameType.CREATE);
    });

    it('should recommend SOCIAL for social users', () => {
      const profile = UserProfileFactory.create('social-user', {
        tasteProfile: {
          [TasteDimension.STRATEGY]: 0.2,
          [TasteDimension.ACTION]: 0.3,
          [TasteDimension.SOCIAL]: 0.95,
          [TasteDimension.CREATIVE]: 0.3,
          [TasteDimension.RELAXATION]: 0.2,
          [TasteDimension.COMPETITION]: 0.1,
        },
      });

      const rec = engine.recommend(profile);
      expect(rec.gameType).toBe(GameType.SOCIAL);
    });

    it('should recommend EASY difficulty for new players', () => {
      const profile = UserProfileFactory.create('newbie', {
        totalGamesPlayed: 0,
        totalMicroGamesPlayed: 0,
      });

      const rec = engine.recommend(profile);
      expect(rec.difficulty).toBe(Difficulty.EASY);
    });

    it('should recommend NORMAL difficulty for moderate experience', () => {
      const profile = UserProfileFactory.create('moderate', {
        totalGamesPlayed: 20,
        totalMicroGamesPlayed: 15,
      });

      const rec = engine.recommend(profile);
      expect(rec.difficulty).toBe(Difficulty.NORMAL);
    });

    it('should recommend HARD difficulty for experienced players', () => {
      const profile = UserProfileFactory.create('veteran', {
        totalGamesPlayed: 60,
        totalMicroGamesPlayed: 50,
      });

      const rec = engine.recommend(profile);
      expect(rec.difficulty).toBe(Difficulty.HARD);
    });

    it('should cap duration between 30 and 120 seconds', () => {
      const profileShort = UserProfileFactory.create('short', {
        averageSessionDuration: 10,
      });
      const profileLong = UserProfileFactory.create('long', {
        averageSessionDuration: 5000,
      });

      const recShort = engine.recommend(profileShort);
      const recLong = engine.recommend(profileLong);

      expect(recShort.duration).toBeGreaterThanOrEqual(30);
      expect(recShort.duration).toBeLessThanOrEqual(120);
      expect(recLong.duration).toBe(120); // capped
    });

    it('should increase confidence with more games played', () => {
      const newPlayer = UserProfileFactory.create('new', {
        totalGamesPlayed: 0,
        totalMicroGamesPlayed: 0,
      });
      const experiencedPlayer = UserProfileFactory.create('exp', {
        totalGamesPlayed: 30,
        totalMicroGamesPlayed: 20,
      });

      const recNew = engine.recommend(newPlayer);
      const recExp = engine.recommend(experiencedPlayer);

      expect(recExp.confidence).toBeGreaterThan(recNew.confidence);
    });
  });

  // ===== generateConfig() =====

  describe('generateConfig()', () => {
    it('should generate a valid IGameConfig', () => {
      const rec: IGameRecommendation = {
        gameType: GameType.REACTION,
        difficulty: Difficulty.NORMAL,
        duration: 60,
        reason: 'Test',
        confidence: 0.8,
      };

      const config = engine.generateConfig(rec, 'TestTemplate');

      expect(config.id).toMatch(/^genesis_/);
      expect(config.name).toBe('TestTemplate');
      expect(config.type).toBe(GameType.REACTION);
      expect(config.difficulty).toBe(Difficulty.NORMAL);
      expect(config.estimatedDuration).toBe(60);
      expect(config.maxDuration).toBe(90); // 60 * 1.5
      expect(config.theme).toBeDefined();
      expect(config.theme.primaryColor).toBeDefined();
      expect(config.theme.backgroundColor).toBeDefined();
    });

    it('should set maxDuration to 1.5x estimatedDuration', () => {
      const rec: IGameRecommendation = {
        gameType: GameType.PUZZLE,
        difficulty: Difficulty.EASY,
        duration: 45,
        reason: 'Test',
        confidence: 0.5,
      };

      const config = engine.generateConfig(rec, 'Puzzle');
      expect(config.maxDuration).toBeCloseTo(67.5, 1);
    });

    it('should generate appropriate theme for each game type', () => {
      const types = [GameType.REACTION, GameType.PUZZLE, GameType.HEALING, GameType.CREATE];

      for (const type of types) {
        const rec: IGameRecommendation = {
          gameType: type,
          difficulty: Difficulty.NORMAL,
          duration: 60,
          reason: 'Test',
          confidence: 0.5,
        };
        const config = engine.generateConfig(rec, 'Template');
        expect(config.theme).toBeDefined();
        expect(config.theme.primaryColor).toBeTruthy();
      }
    });
  });

  // ===== updateProfile() =====

  describe('updateProfile()', () => {
    it('should increment totalMicroGamesPlayed', () => {
      const profile = UserProfileFactory.create('user-1');
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 500,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.totalMicroGamesPlayed).toBe(profile.totalMicroGamesPlayed + 1);
    });

    it('should increase difficulty when performance is high (>85%)', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 900,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.preferredDifficulty).toBe(Difficulty.HARD);
    });

    it('should decrease difficulty when performance is low (<30%)', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 200,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.preferredDifficulty).toBe(Difficulty.EASY);
    });

    it('should not increase difficulty beyond EXPERT', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.EXPERT,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 1000,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.EXPERT,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.preferredDifficulty).toBe(Difficulty.EXPERT);
    });

    it('should not decrease difficulty below EASY', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.EASY,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 0,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.EASY,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.preferredDifficulty).toBe(Difficulty.EASY);
    });

    it('should update reaction speed for REACTION games', () => {
      const profile = UserProfileFactory.create('user-1', {
        averageReactionSpeed: 300,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.REACTION,
        score: 500,
        maxScore: 1000,
        duration: 2,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      // Should have changed from original 300
      expect(updated.averageReactionSpeed).not.toBe(300);
    });

    it('should keep reaction speed unchanged for non-REACTION games', () => {
      const profile = UserProfileFactory.create('user-1', {
        averageReactionSpeed: 300,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 500,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.averageReactionSpeed).toBe(300);
    });

    it('should update lastActiveTime', () => {
      const profile = UserProfileFactory.create('user-1', {
        lastActiveTime: 1000,
      });
      const result: IGameResult = {
        gameId: 'g1',
        gameType: GameType.PUZZLE,
        score: 500,
        maxScore: 1000,
        duration: 30,
        completed: true,
        difficulty: Difficulty.NORMAL,
        timestamp: Date.now(),
      };

      const updated = engine.updateProfile(profile, result);
      expect(updated.lastActiveTime).toBeGreaterThan(profile.lastActiveTime);
    });
  });

  // ===== calculateDynamicDifficulty() =====

  describe('calculateDynamicDifficulty()', () => {
    it('should increase difficulty when performance >90%', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });

      const result = engine.calculateDynamicDifficulty(profile, 950, 1000);
      expect(result).toBe(Difficulty.HARD);
    });

    it('should decrease difficulty when performance <20%', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });

      const result = engine.calculateDynamicDifficulty(profile, 100, 1000);
      expect(result).toBe(Difficulty.EASY);
    });

    it('should keep difficulty when performance is moderate', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });

      const result = engine.calculateDynamicDifficulty(profile, 500, 1000);
      expect(result).toBe(Difficulty.NORMAL);
    });

    it('should not increase beyond EXPERT', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.EXPERT,
      });

      const result = engine.calculateDynamicDifficulty(profile, 1000, 1000);
      expect(result).toBe(Difficulty.EXPERT);
    });

    it('should not decrease below EASY', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.EASY,
      });

      const result = engine.calculateDynamicDifficulty(profile, 0, 1000);
      expect(result).toBe(Difficulty.EASY);
    });

    it('should default to 0.5 performance when maxScore is 0', () => {
      const profile = UserProfileFactory.create('user-1', {
        preferredDifficulty: Difficulty.NORMAL,
      });

      // 0.5 performance → keep base difficulty
      const result = engine.calculateDynamicDifficulty(profile, 0, 0);
      expect(result).toBe(Difficulty.NORMAL);
    });
  });
});
