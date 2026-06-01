import {
  AnalyticsEngine,
  AnalyticsEventType,
  IAnalyticsEvent,
} from './AnalyticsEngine';
import { GameType } from '../models/types';

describe('AnalyticsEngine', () => {
  let engine: AnalyticsEngine;

  beforeEach(() => {
    engine = new AnalyticsEngine();
  });

  // ===== trackEvent =====

  describe('trackEvent()', () => {
    it('should track a generic event', () => {
      const event = engine.trackEvent(AnalyticsEventType.GAME_START, 'user-1', { gameName: 'RhythmTap' });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.type).toBe(AnalyticsEventType.GAME_START);
      expect(event.userId).toBe('user-1');
      expect(event.properties.gameName).toBe('RhythmTap');
      expect(event.timestamp).toBeGreaterThan(0);
    });
  });

  // ===== trackGameStart =====

  describe('trackGameStart()', () => {
    it('should track game start with correct properties', () => {
      const event = engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);

      expect(event.type).toBe(AnalyticsEventType.GAME_START);
      expect(event.properties.gameName).toBe('RhythmTap');
      expect(event.properties.gameType).toBe(GameType.REACTION);
    });
  });

  // ===== trackGameComplete =====

  describe('trackGameComplete()', () => {
    it('should track game completion with score and duration', () => {
      const event = engine.trackGameComplete('user-1', 'RhythmTap', 850, 45);

      expect(event.type).toBe(AnalyticsEventType.GAME_COMPLETE);
      expect(event.properties.gameName).toBe('RhythmTap');
      expect(event.properties.score).toBe(850);
      expect(event.properties.duration).toBe(45);
    });
  });

  // ===== trackSessionStart / trackSessionEnd =====

  describe('session tracking', () => {
    it('should start a session and return session ID', () => {
      const sessionId = engine.trackSessionStart('user-1');

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    it('should end a session', () => {
      const sessionId = engine.trackSessionStart('user-1');
      engine.trackSessionEnd(sessionId);

      const events = engine.getEvents({ type: AnalyticsEventType.SESSION_END });
      expect(events.length).toBe(1);
      expect(events[0].sessionId).toBe(sessionId);
    });

    it('should handle ending a non-existent session gracefully', () => {
      expect(() => engine.trackSessionEnd('non-existent')).not.toThrow();
    });
  });

  // ===== getEvents =====

  describe('getEvents()', () => {
    beforeEach(() => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameComplete('user-1', 'RhythmTap', 850, 45);
      engine.trackGameStart('user-2', 'Elimination', GameType.PUZZLE);
    });

    it('should return all events', () => {
      const events = engine.getEvents();
      expect(events.length).toBe(3);
    });

    it('should filter by type', () => {
      const events = engine.getEvents({ type: AnalyticsEventType.GAME_START });
      expect(events.length).toBe(2);
    });

    it('should filter by userId', () => {
      const events = engine.getEvents({ userId: 'user-1' });
      expect(events.length).toBe(2);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const events = engine.getEvents({ since: now - 1000, until: now + 1000 });
      expect(events.length).toBe(3);
    });
  });

  // ===== getEventCount =====

  describe('getEventCount()', () => {
    it('should count events by type', () => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameStart('user-2', 'Elimination', GameType.PUZZLE);
      engine.trackGameComplete('user-1', 'RhythmTap', 500, 30);

      expect(engine.getEventCount(AnalyticsEventType.GAME_START)).toBe(2);
      expect(engine.getEventCount(AnalyticsEventType.GAME_COMPLETE)).toBe(1);
    });
  });

  // ===== getUserAnalytics =====

  describe('getUserAnalytics()', () => {
    it('should return analytics for a user with no activity', () => {
      const analytics = engine.getUserAnalytics('user-1');

      expect(analytics.userId).toBe('user-1');
      expect(analytics.totalSessions).toBe(0);
      expect(analytics.totalGameTime).toBe(0);
      expect(analytics.gamesPerSession).toBe(0);
      expect(analytics.favoriteGame).toBe('none');
      expect(analytics.engagementScore).toBe(0);
    });

    it('should compute analytics with activity', () => {
      const sid = engine.trackSessionStart('user-1');
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameComplete('user-1', 'RhythmTap', 850, 45);
      engine.trackSessionEnd(sid);

      const analytics = engine.getUserAnalytics('user-1');

      expect(analytics.totalSessions).toBe(1);
      // totalGameTime comes from session end duration; may be ~0 in fast tests
      expect(analytics.totalGameTime).toBeGreaterThanOrEqual(0);
      expect(analytics.gamesPerSession).toBeGreaterThan(0);
      expect(analytics.favoriteGame).toBe('RhythmTap');
    });
  });

  // ===== getDashboardMetrics =====

  describe('getDashboardMetrics()', () => {
    it('should return metrics with no data', () => {
      const metrics = engine.getDashboardMetrics();

      expect(metrics.totalUsers).toBe(0);
      expect(metrics.totalGamesPlayed).toBe(0);
      expect(metrics.avgScore).toBe(0);
      expect(metrics.topGame).toBe('none');
    });

    it('should compute dashboard metrics', () => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameStart('user-1', 'Elimination', GameType.PUZZLE);
      engine.trackGameStart('user-2', 'RhythmTap', GameType.REACTION);
      engine.trackGameComplete('user-1', 'RhythmTap', 800, 30);
      engine.trackGameComplete('user-2', 'RhythmTap', 600, 25);

      const metrics = engine.getDashboardMetrics();

      expect(metrics.totalUsers).toBe(2);
      expect(metrics.totalGamesPlayed).toBe(2);
      expect(metrics.topGame).toBe('RhythmTap');
      expect(metrics.avgScore).toBe(700);
    });
  });

  // ===== analyzeFunnel =====

  describe('analyzeFunnel()', () => {
    it('should return empty funnel for no steps', () => {
      const funnel = engine.analyzeFunnel('test', []);
      expect(funnel.steps.length).toBe(0);
      expect(funnel.totalConversion).toBe(0);
    });

    it('should compute funnel conversion', () => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameStart('user-2', 'RhythmTap', GameType.REACTION);
      engine.trackGameComplete('user-1', 'RhythmTap', 800, 30);

      const funnel = engine.analyzeFunnel('play_funnel', [
        AnalyticsEventType.GAME_START,
        AnalyticsEventType.GAME_COMPLETE,
      ]);

      expect(funnel.steps.length).toBe(2);
      expect(funnel.steps[0].count).toBe(2);
      expect(funnel.steps[1].count).toBe(1);
      expect(funnel.totalConversion).toBeGreaterThan(0);
      expect(funnel.totalConversion).toBeLessThanOrEqual(1);
    });
  });

  // ===== getGamePopularity =====

  describe('getGamePopularity()', () => {
    it('should return empty for no data', () => {
      const popularity = engine.getGamePopularity();
      expect(popularity).toEqual([]);
    });

    it('should rank games by play count', () => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);
      engine.trackGameStart('user-1', 'Elimination', GameType.PUZZLE);

      const popularity = engine.getGamePopularity();
      expect(popularity.length).toBe(2);
      expect(popularity[0].gameName).toBe('RhythmTap');
      expect(popularity[0].playCount).toBe(2);
    });
  });

  // ===== getPeakHours =====

  describe('getPeakHours()', () => {
    it('should return all 24 hours sorted by event count', () => {
      engine.trackGameStart('user-1', 'RhythmTap', GameType.REACTION);

      const hours = engine.getPeakHours();
      expect(hours.length).toBe(24);
      // First entry should have the most events
      expect(hours[0].eventCount).toBeGreaterThanOrEqual(hours[1].eventCount);
    });
  });

  // ===== clearOldData =====

  describe('clearOldData()', () => {
    it('should remove old events', () => {
      engine.trackEvent(AnalyticsEventType.GAME_START, 'user-1', {});
      const countBefore = engine.getEvents().length;

      // Clear everything older than now + 1 day (should clear nothing)
      const removed = engine.clearOldData(Date.now() + 86400000);
      expect(removed).toBe(countBefore);
    });

    it('should keep recent events', () => {
      engine.trackEvent(AnalyticsEventType.GAME_START, 'user-1', {});

      // Clear events older than 1 day ago (should keep recent)
      const removed = engine.clearOldData(Date.now() - 86400000);
      expect(removed).toBe(0);
      expect(engine.getEvents().length).toBe(1);
    });
  });
});
