import { TriggerContextFactory } from './TriggerContext';
import { UserProfileFactory } from './UserProfile';
import {
  ITriggerContext, IUserProfile, EmotionState, GameType, Difficulty,
  TasteDimension,
} from './types';

// ============================
// TriggerContextFactory
// ============================
describe('TriggerContextFactory', () => {
  describe('createDefault()', () => {
    it('should create a context with all required fields', () => {
      const ctx = TriggerContextFactory.createDefault();

      expect(ctx).toHaveProperty('timestamp');
      expect(ctx).toHaveProperty('hour');
      expect(ctx).toHaveProperty('dayOfWeek');
      expect(ctx).toHaveProperty('isWeekend');
      expect(ctx).toHaveProperty('isDownloading');
      expect(ctx).toHaveProperty('downloadProgress');
      expect(ctx).toHaveProperty('recentWinRate');
      expect(ctx).toHaveProperty('consecutiveLosses');
      expect(ctx).toHaveProperty('emotionState');
      expect(ctx).toHaveProperty('batteryLevel');
      expect(ctx).toHaveProperty('isCharging');
      expect(ctx).toHaveProperty('networkAvailable');
      expect(ctx).toHaveProperty('friendOnlineCount');
      expect(ctx).toHaveProperty('lastGameTime');
      expect(ctx).toHaveProperty('weatherCondition');
      expect(ctx).toHaveProperty('currentLocation');
    });

    it('should have sensible defaults', () => {
      const ctx = TriggerContextFactory.createDefault();

      expect(ctx.isDownloading).toBe(false);
      expect(ctx.downloadProgress).toBe(0);
      expect(ctx.recentWinRate).toBe(0.5);
      expect(ctx.consecutiveLosses).toBe(0);
      expect(ctx.emotionState).toBe(EmotionState.CALM);
      expect(ctx.batteryLevel).toBe(80);
      expect(ctx.isCharging).toBe(false);
      expect(ctx.networkAvailable).toBe(true);
      expect(ctx.friendOnlineCount).toBe(0);
      expect(ctx.weatherCondition).toBe('clear');
      expect(ctx.currentLocation).toBe('unknown');
    });

    it('should apply overrides', () => {
      const ctx = TriggerContextFactory.createDefault({
        hour: 15,
        batteryLevel: 20,
        emotionState: EmotionState.FRUSTRATED,
      });

      expect(ctx.hour).toBe(15);
      expect(ctx.batteryLevel).toBe(20);
      expect(ctx.emotionState).toBe(EmotionState.FRUSTRATED);
    });

    it('should infer isWeekend from dayOfWeek if not overridden', () => {
      const sat = TriggerContextFactory.createDefault({ dayOfWeek: 6 });
      const mon = TriggerContextFactory.createDefault({ dayOfWeek: 1 });

      expect(sat.isWeekend).toBe(true);
      expect(mon.isWeekend).toBe(false);
    });

    it('should respect explicit isWeekend override', () => {
      const ctx = TriggerContextFactory.createDefault({
        dayOfWeek: 1,
        isWeekend: true,
      });

      // Override takes precedence via spread
      expect(ctx.isWeekend).toBe(true);
    });
  });

  describe('createDownloadWaiting()', () => {
    it('should set isDownloading=true', () => {
      const ctx = TriggerContextFactory.createDownloadWaiting(30);

      expect(ctx.isDownloading).toBe(true);
    });

    it('should set downloadProgress to specified value', () => {
      const ctx = TriggerContextFactory.createDownloadWaiting(75);

      expect(ctx.downloadProgress).toBe(75);
    });

    it('should default progress to 0', () => {
      const ctx = TriggerContextFactory.createDownloadWaiting();

      expect(ctx.downloadProgress).toBe(0);
    });
  });

  describe('createLosingStreak()', () => {
    it('should set consecutiveLosses', () => {
      const ctx = TriggerContextFactory.createLosingStreak(3);

      expect(ctx.consecutiveLosses).toBe(3);
    });

    it('should reduce winRate based on losses', () => {
      const ctx = TriggerContextFactory.createLosingStreak(3);

      expect(ctx.recentWinRate).toBeLessThan(0.5);
      expect(ctx.recentWinRate).toBeCloseTo(0.2, 2);
    });

    it('should set FRUSTRATED emotion for less than 5 losses', () => {
      const ctx = TriggerContextFactory.createLosingStreak(3);

      expect(ctx.emotionState).toBe(EmotionState.FRUSTRATED);
    });

    it('should set ANGRY emotion for 5+ losses', () => {
      const ctx = TriggerContextFactory.createLosingStreak(5);

      expect(ctx.emotionState).toBe(EmotionState.ANGRY);
    });

    it('should not let winRate go below 0', () => {
      const ctx = TriggerContextFactory.createLosingStreak(20);

      expect(ctx.recentWinRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createLateNight()', () => {
    it('should set hour to 23', () => {
      const ctx = TriggerContextFactory.createLateNight();

      expect(ctx.hour).toBe(23);
    });

    it('should set low battery level', () => {
      const ctx = TriggerContextFactory.createLateNight();

      expect(ctx.batteryLevel).toBe(30);
    });

    it('should set CALM emotion', () => {
      const ctx = TriggerContextFactory.createLateNight();

      expect(ctx.emotionState).toBe(EmotionState.CALM);
    });
  });

  describe('createMorning()', () => {
    it('should set hour to 7', () => {
      const ctx = TriggerContextFactory.createMorning();

      expect(ctx.hour).toBe(7);
    });

    it('should set CALM emotion', () => {
      const ctx = TriggerContextFactory.createMorning();

      expect(ctx.emotionState).toBe(EmotionState.CALM);
    });
  });

  describe('createCommute()', () => {
    it('should set hour to 8', () => {
      const ctx = TriggerContextFactory.createCommute();

      expect(ctx.hour).toBe(8);
    });

    it('should set location to transit', () => {
      const ctx = TriggerContextFactory.createCommute();

      expect(ctx.currentLocation).toBe('transit');
    });

    it('should set isWeekend to false', () => {
      const ctx = TriggerContextFactory.createCommute();

      expect(ctx.isWeekend).toBe(false);
    });
  });
});

// ============================
// UserProfileFactory
// ============================
describe('UserProfileFactory', () => {
  describe('create()', () => {
    it('should create a profile with all required fields', () => {
      const profile = UserProfileFactory.create('user-1');

      expect(profile.userId).toBe('user-1');
      expect(profile.tasteProfile).toBeDefined();
      expect(profile.preferredGameTypes).toBeDefined();
      expect(profile.preferredDifficulty).toBeDefined();
      expect(profile.averageSessionDuration).toBeDefined();
      expect(profile.averageReactionSpeed).toBeDefined();
      expect(profile.totalGamesPlayed).toBeDefined();
      expect(profile.totalMicroGamesPlayed).toBeDefined();
      expect(profile.lastActiveTime).toBeDefined();
      expect(profile.createdAt).toBeDefined();
    });

    it('should have default taste profile with all dimensions at 0.5', () => {
      const profile = UserProfileFactory.create('user-1');

      for (const dim of Object.values(TasteDimension)) {
        expect(profile.tasteProfile[dim]).toBe(0.5);
      }
    });

    it('should have default preferredGameTypes of REACTION and PUZZLE', () => {
      const profile = UserProfileFactory.create('user-1');

      expect(profile.preferredGameTypes).toEqual([GameType.REACTION, GameType.PUZZLE]);
    });

    it('should have default NORMAL difficulty', () => {
      const profile = UserProfileFactory.create('user-1');

      expect(profile.preferredDifficulty).toBe(Difficulty.NORMAL);
    });

    it('should have default 300s session duration', () => {
      const profile = UserProfileFactory.create('user-1');

      expect(profile.averageSessionDuration).toBe(300);
    });

    it('should have 0 games played by default', () => {
      const profile = UserProfileFactory.create('user-1');

      expect(profile.totalGamesPlayed).toBe(0);
      expect(profile.totalMicroGamesPlayed).toBe(0);
    });

    it('should apply overrides', () => {
      const profile = UserProfileFactory.create('user-1', {
        totalGamesPlayed: 50,
        preferredDifficulty: Difficulty.HARD,
      });

      expect(profile.totalGamesPlayed).toBe(50);
      expect(profile.preferredDifficulty).toBe(Difficulty.HARD);
      // userId should remain unchanged
      expect(profile.userId).toBe('user-1');
    });

    it('should create unique profiles for different user IDs', () => {
      const p1 = UserProfileFactory.create('user-A');
      const p2 = UserProfileFactory.create('user-B');

      expect(p1.userId).toBe('user-A');
      expect(p2.userId).toBe('user-B');
      expect(p1).not.toBe(p2);
    });
  });

  describe('createHardcoreGamer()', () => {
    it('should have high action and competition taste', () => {
      const profile = UserProfileFactory.createHardcoreGamer('hardcore');

      expect(profile.tasteProfile[TasteDimension.ACTION]).toBe(0.9);
      expect(profile.tasteProfile[TasteDimension.COMPETITION]).toBe(0.95);
    });

    it('should have HARD difficulty', () => {
      const profile = UserProfileFactory.createHardcoreGamer('hardcore');

      expect(profile.preferredDifficulty).toBe(Difficulty.HARD);
    });

    it('should have fast reaction speed', () => {
      const profile = UserProfileFactory.createHardcoreGamer('hardcore');

      expect(profile.averageReactionSpeed).toBeLessThan(250);
    });

    it('should have many games played', () => {
      const profile = UserProfileFactory.createHardcoreGamer('hardcore');

      expect(profile.totalGamesPlayed).toBeGreaterThan(100);
    });

    it('should have long average session', () => {
      const profile = UserProfileFactory.createHardcoreGamer('hardcore');

      expect(profile.averageSessionDuration).toBe(3600);
    });
  });

  describe('createCasualGamer()', () => {
    it('should have high relaxation and creative taste', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.tasteProfile[TasteDimension.RELAXATION]).toBe(0.9);
      expect(profile.tasteProfile[TasteDimension.CREATIVE]).toBe(0.8);
    });

    it('should have EASY difficulty', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.preferredDifficulty).toBe(Difficulty.EASY);
    });

    it('should have slower reaction speed', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.averageReactionSpeed).toBeGreaterThan(300);
    });

    it('should prefer HEALING and CREATE games', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.preferredGameTypes).toEqual([GameType.HEALING, GameType.CREATE]);
    });

    it('should have fewer total games', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.totalGamesPlayed).toBeLessThan(50);
    });

    it('should have low competition taste', () => {
      const profile = UserProfileFactory.createCasualGamer('casual');

      expect(profile.tasteProfile[TasteDimension.COMPETITION]).toBeLessThan(0.3);
    });
  });
});
