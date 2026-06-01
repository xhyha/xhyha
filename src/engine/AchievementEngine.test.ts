import {
  AchievementEngine,
  AchievementCategory,
  AchievementRarity,
  IAchievement,
  IAchievementProgress,
} from './AchievementEngine';

function makeProgress(overrides: Partial<IAchievementProgress> = {}): IAchievementProgress {
  return {
    userId: 'user-1',
    totalGamesPlayed: 0,
    totalScore: 0,
    perfectGames: 0,
    uniqueGamesPlayed: new Set<string>(),
    currentStreak: 0,
    bestStreak: 0,
    friendsChallenged: 0,
    gamesShared: 0,
    dailyChallengeCompleted: false,
    fastestWin: 0,
    scoresByGame: new Map<string, number[]>(),
    unlockedAchievements: new Set<string>(),
    ...overrides,
  };
}

describe('AchievementEngine', () => {
  let engine: AchievementEngine;

  beforeEach(() => {
    engine = new AchievementEngine();
  });

  // ===== constructor =====

  describe('constructor()', () => {
    it('should have 15 default achievements', () => {
      const all = engine.getAllAchievements(new Set());
      expect(all.length).toBe(15);
    });
  });

  // ===== checkAchievements =====

  describe('checkAchievements()', () => {
    it('should unlock "first_steps" when totalGamesPlayed >= 1', () => {
      const progress = makeProgress({ totalGamesPlayed: 1 });
      const unlocked = engine.checkAchievements(progress);

      const ids = unlocked.map(u => u.achievementId);
      expect(ids).toContain('first_steps');
      expect(unlocked.some(u => u.isNew)).toBe(true);
    });

    it('should not re-unlock already unlocked achievements', () => {
      const progress = makeProgress({
        totalGamesPlayed: 1,
        unlockedAchievements: new Set(['first_steps']),
      });

      const unlocked = engine.checkAchievements(progress);
      const ids = unlocked.map(u => u.achievementId);
      expect(ids).not.toContain('first_steps');
    });

    it('should unlock milestone achievements at correct thresholds', () => {
      const progress = makeProgress({ totalGamesPlayed: 5 });
      const unlocked = engine.checkAchievements(progress);
      const ids = unlocked.map(u => u.achievementId);
      expect(ids).toContain('getting_started');
    });

    it('should unlock streak achievements', () => {
      const progress = makeProgress({ bestStreak: 3 });
      const unlocked = engine.checkAchievements(progress);
      const ids = unlocked.map(u => u.achievementId);
      expect(ids).toContain('on_fire');
    });

    it('should unlock skill achievements', () => {
      const progress = makeProgress({ fastestWin: 5 });
      const unlocked = engine.checkAchievements(progress);
      const ids = unlocked.map(u => u.achievementId);
      expect(ids).toContain('speed_demon');
    });

    it('should unlock perfectionist for perfect game', () => {
      const progress = makeProgress({ perfectGames: 1 });
      const unlocked = engine.checkAchievements(progress);
      const ids = unlocked.map(u => u.achievementId);
      expect(ids).toContain('perfectionist');
    });

    it('should return empty array when no achievements are met', () => {
      const progress = makeProgress();
      const unlocked = engine.checkAchievements(progress);
      expect(unlocked).toEqual([]);
    });
  });

  // ===== getAllAchievements =====

  describe('getAllAchievements()', () => {
    it('should return all achievements with unlock status', () => {
      const unlockedIds = new Set(['first_steps']);
      const all = engine.getAllAchievements(unlockedIds);

      expect(all.length).toBe(15);
      const firstSteps = all.find(a => a.id === 'first_steps');
      expect(firstSteps!.unlocked).toBe(true);

      const other = all.find(a => a.id === 'getting_started');
      expect(other!.unlocked).toBe(false);
    });
  });

  // ===== getByCategory =====

  describe('getByCategory()', () => {
    it('should filter achievements by MILESTONE category', () => {
      const results = engine.getByCategory(AchievementCategory.MILESTONE, new Set());
      expect(results.length).toBeGreaterThan(0);
      results.forEach(a => expect(a.category).toBe(AchievementCategory.MILESTONE));
    });

    it('should filter achievements by SKILL category', () => {
      const results = engine.getByCategory(AchievementCategory.SKILL, new Set());
      expect(results.length).toBeGreaterThan(0);
      results.forEach(a => expect(a.category).toBe(AchievementCategory.SKILL));
    });

    it('should filter achievements by STREAK category', () => {
      const results = engine.getByCategory(AchievementCategory.STREAK, new Set());
      expect(results.length).toBeGreaterThan(0);
      results.forEach(a => expect(a.category).toBe(AchievementCategory.STREAK));
    });
  });

  // ===== getCompletionStats =====

  describe('getCompletionStats()', () => {
    it('should return zero stats when nothing unlocked', () => {
      const stats = engine.getCompletionStats(new Set());
      expect(stats.total).toBe(15);
      expect(stats.unlocked).toBe(0);
      expect(stats.percentage).toBe(0);
    });

    it('should compute completion stats', () => {
      const stats = engine.getCompletionStats(new Set(['first_steps', 'getting_started']));
      expect(stats.total).toBe(15);
      expect(stats.unlocked).toBe(2);
      expect(stats.percentage).toBe(Math.round((2 / 15) * 100));
    });

    it('should have byCategory breakdown', () => {
      const stats = engine.getCompletionStats(new Set());
      expect(stats.byCategory).toBeDefined();
      expect(stats.byCategory[AchievementCategory.MILESTONE]).toBeDefined();
      expect(stats.byCategory[AchievementCategory.MILESTONE].total).toBeGreaterThan(0);
    });
  });

  // ===== generateDailyChallenge =====

  describe('generateDailyChallenge()', () => {
    it('should generate a challenge from game names', () => {
      const challenge = engine.generateDailyChallenge(['RhythmTap', 'Elimination']);

      expect(challenge).toBeDefined();
      expect(challenge.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['RhythmTap', 'Elimination']).toContain(challenge.gameName);
      expect(challenge.targetScore).toBeGreaterThan(0);
      expect(challenge.bonusMultiplier).toBeGreaterThan(1);
      expect(challenge.completedBy).toBeDefined();
    });

    it('should store the challenge', () => {
      engine.generateDailyChallenge(['RhythmTap']);
      expect(engine.getDailyChallenge()).not.toBeNull();
    });
  });

  // ===== completeDailyChallenge =====

  describe('completeDailyChallenge()', () => {
    it('should return completed=false when no daily challenge', () => {
      const result = engine.completeDailyChallenge('user-1', 100);
      expect(result.completed).toBe(false);
      expect(result.bonus).toBe(0);
    });

    it('should complete when score meets target', () => {
      engine.generateDailyChallenge(['RhythmTap']);
      const challenge = engine.getDailyChallenge()!;
      const result = engine.completeDailyChallenge('user-1', challenge.targetScore);

      expect(result.completed).toBe(true);
      expect(result.bonus).toBeGreaterThan(0);
    });

    it('should not complete when score is below target', () => {
      engine.generateDailyChallenge(['RhythmTap']);
      const challenge = engine.getDailyChallenge()!;
      const result = engine.completeDailyChallenge('user-1', challenge.targetScore - 1);

      expect(result.completed).toBe(false);
      expect(result.bonus).toBe(0);
    });
  });

  // ===== createDefaultProgress =====

  describe('createDefaultProgress()', () => {
    it('should create default progress for a new user', () => {
      const progress = engine.createDefaultProgress('user-1');

      expect(progress.userId).toBe('user-1');
      expect(progress.totalGamesPlayed).toBe(0);
      expect(progress.totalScore).toBe(0);
      expect(progress.perfectGames).toBe(0);
      expect(progress.uniqueGamesPlayed.size).toBe(0);
      expect(progress.currentStreak).toBe(0);
      expect(progress.bestStreak).toBe(0);
      expect(progress.friendsChallenged).toBe(0);
      expect(progress.gamesShared).toBe(0);
      expect(progress.dailyChallengeCompleted).toBe(false);
      expect(progress.fastestWin).toBe(0);
      expect(progress.scoresByGame.size).toBe(0);
      expect(progress.unlockedAchievements.size).toBe(0);
    });
  });

  // ===== updateProgress =====

  describe('updateProgress()', () => {
    it('should update progress from game result', () => {
      const progress = engine.createDefaultProgress('user-1');
      const updated = engine.updateProgress(progress, 'RhythmTap', 500, 10, 1000);

      expect(updated.totalGamesPlayed).toBe(1);
      expect(updated.totalScore).toBe(500);
      expect(updated.uniqueGamesPlayed.has('RhythmTap')).toBe(true);
      expect(updated.currentStreak).toBe(1);
      expect(updated.bestStreak).toBe(1);
      expect(updated.fastestWin).toBe(10);
    });

    it('should detect perfect game', () => {
      const progress = engine.createDefaultProgress('user-1');
      const updated = engine.updateProgress(progress, 'RhythmTap', 1000, 10, 1000);

      expect(updated.perfectGames).toBe(1);
    });

    it('should update scoresByGame', () => {
      const progress = engine.createDefaultProgress('user-1');
      const updated = engine.updateProgress(progress, 'RhythmTap', 500, 10, 1000);

      const scores = updated.scoresByGame.get('RhythmTap');
      expect(scores).toBeDefined();
      expect(scores!).toContain(500);
    });

    it('should track best streak', () => {
      let progress = engine.createDefaultProgress('user-1');
      progress = engine.updateProgress(progress, 'RhythmTap', 100, 10, 1000);
      progress = engine.updateProgress(progress, 'Elimination', 200, 15, 1000);

      expect(progress.bestStreak).toBe(2);
      expect(progress.currentStreak).toBe(2);
    });
  });
});
