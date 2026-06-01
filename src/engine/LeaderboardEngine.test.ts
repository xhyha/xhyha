import {
  LeaderboardEngine,
  LeaderboardWindow,
  ILeaderboardEntry,
} from './LeaderboardEngine';

function makeEntry(overrides: Partial<Omit<ILeaderboardEntry, 'rank'>> = {}): Omit<ILeaderboardEntry, 'rank'> {
  return {
    userId: 'user-1',
    nickname: 'Player1',
    avatar: '😊',
    score: 100,
    gameType: 'REACTION',
    gameName: 'RhythmTap',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('LeaderboardEngine', () => {
  let engine: LeaderboardEngine;

  beforeEach(() => {
    engine = new LeaderboardEngine();
  });

  // ===== constructor =====

  describe('constructor()', () => {
    it('should create engine with default config', () => {
      expect(engine).toBeDefined();
      const stats = engine.getStats(LeaderboardWindow.ALL_TIME);
      expect(stats.totalEntries).toBe(0);
    });

    it('should accept custom config', () => {
      const custom = new LeaderboardEngine({ maxEntries: 50 });
      expect(custom).toBeDefined();
    });
  });

  // ===== submitScore =====

  describe('submitScore()', () => {
    it('should submit a score and return a ranked entry', () => {
      const entry = engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));

      expect(entry).toBeDefined();
      expect(entry.rank).toBe(1);
      expect(entry.userId).toBe('u1');
      expect(entry.score).toBe(100);
    });

    it('should rank higher scores first', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      const entry2 = engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));

      expect(entry2.rank).toBe(1);

      const top = engine.getTopN(LeaderboardWindow.ALL_TIME, 2);
      expect(top[0].score).toBe(200);
      expect(top[1].score).toBe(100);
    });

    it('should submit to all windows', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));

      expect(engine.getStats(LeaderboardWindow.DAILY).totalEntries).toBe(1);
      expect(engine.getStats(LeaderboardWindow.WEEKLY).totalEntries).toBe(1);
      expect(engine.getStats(LeaderboardWindow.MONTHLY).totalEntries).toBe(1);
      expect(engine.getStats(LeaderboardWindow.ALL_TIME).totalEntries).toBe(1);
    });

    it('should respect maxEntries limit', () => {
      const small = new LeaderboardEngine({ maxEntries: 3 });
      for (let i = 0; i < 5; i++) {
        small.submitScore(makeEntry({ userId: `u${i}`, score: i * 10, timestamp: Date.now() + i }));
      }
      expect(small.getStats(LeaderboardWindow.ALL_TIME).totalEntries).toBe(3);
    });
  });

  // ===== query =====

  describe('query()', () => {
    beforeEach(() => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 200, gameType: 'REACTION' }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 100, gameType: 'PUZZLE' }));
      engine.submitScore(makeEntry({ userId: 'u3', score: 300, gameType: 'REACTION' }));
    });

    it('should return all entries for a window', () => {
      const results = engine.query({ window: LeaderboardWindow.ALL_TIME });
      expect(results.length).toBe(3);
    });

    it('should filter by gameType', () => {
      const results = engine.query({ window: LeaderboardWindow.ALL_TIME, gameType: 'REACTION' });
      expect(results.length).toBe(2);
      results.forEach(r => expect(r.gameType).toBe('REACTION'));
    });

    it('should filter by friendIds', () => {
      const results = engine.query({
        window: LeaderboardWindow.ALL_TIME,
        friendIds: ['u1', 'u3'],
      });
      expect(results.length).toBe(2);
      const ids = results.map(r => r.userId);
      expect(ids).toContain('u1');
      expect(ids).toContain('u3');
    });

    it('should support pagination with limit', () => {
      const results = engine.query({ window: LeaderboardWindow.ALL_TIME, limit: 2 });
      expect(results.length).toBe(2);
    });

    it('should support pagination with offset', () => {
      const results = engine.query({ window: LeaderboardWindow.ALL_TIME, offset: 1 });
      expect(results.length).toBe(2);
    });

    it('should support pagination with offset and limit', () => {
      const results = engine.query({ window: LeaderboardWindow.ALL_TIME, offset: 1, limit: 1 });
      expect(results.length).toBe(1);
    });

    it('should query DAILY window', () => {
      const results = engine.query({ window: LeaderboardWindow.DAILY });
      expect(results.length).toBe(3);
    });

    it('should query WEEKLY window', () => {
      const results = engine.query({ window: LeaderboardWindow.WEEKLY });
      expect(results.length).toBe(3);
    });

    it('should query MONTHLY window', () => {
      const results = engine.query({ window: LeaderboardWindow.MONTHLY });
      expect(results.length).toBe(3);
    });
  });

  // ===== getUserRank =====

  describe('getUserRank()', () => {
    it('should return -1 for unknown user', () => {
      expect(engine.getUserRank('unknown', LeaderboardWindow.ALL_TIME)).toBe(-1);
    });

    it('should return correct rank', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));

      expect(engine.getUserRank('u2', LeaderboardWindow.ALL_TIME)).toBe(1);
      expect(engine.getUserRank('u1', LeaderboardWindow.ALL_TIME)).toBe(2);
    });
  });

  // ===== getTopN =====

  describe('getTopN()', () => {
    it('should return top N entries', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));
      engine.submitScore(makeEntry({ userId: 'u3', score: 300 }));

      const top2 = engine.getTopN(LeaderboardWindow.ALL_TIME, 2);
      expect(top2.length).toBe(2);
      expect(top2[0].score).toBe(300);
      expect(top2[1].score).toBe(200);
    });

    it('should return fewer if not enough entries', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      const top5 = engine.getTopN(LeaderboardWindow.ALL_TIME, 5);
      expect(top5.length).toBe(1);
    });
  });

  // ===== getStats =====

  describe('getStats()', () => {
    it('should return zeros for empty leaderboard', () => {
      const stats = engine.getStats(LeaderboardWindow.ALL_TIME);
      expect(stats.totalEntries).toBe(0);
      expect(stats.avgScore).toBe(0);
      expect(stats.topScore).toBe(0);
    });

    it('should compute stats correctly', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));

      const stats = engine.getStats(LeaderboardWindow.ALL_TIME);
      expect(stats.totalEntries).toBe(2);
      expect(stats.topScore).toBe(200);
      expect(stats.avgScore).toBe(150);
    });
  });

  // ===== clearExpired =====

  describe('clearExpired()', () => {
    it('should return 0 for ALL_TIME window', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      expect(engine.clearExpired(LeaderboardWindow.ALL_TIME)).toBe(0);
    });

    it('should clear entries older than TTL', () => {
      // Submit with old timestamp (2 days ago)
      const twoDaysAgo = Date.now() - 2 * 86400 * 1000;
      engine.submitScore(makeEntry({ userId: 'u1', score: 100, timestamp: twoDaysAgo }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200, timestamp: Date.now() }));

      // DAILY TTL is 86400 seconds = 1 day, so the old entry should be cleared
      const removed = engine.clearExpired(LeaderboardWindow.DAILY);
      expect(removed).toBe(1);
      expect(engine.getStats(LeaderboardWindow.DAILY).totalEntries).toBe(1);
    });
  });

  // ===== reset =====

  describe('reset()', () => {
    it('should clear all entries in a window', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));

      engine.reset(LeaderboardWindow.ALL_TIME);
      expect(engine.getStats(LeaderboardWindow.ALL_TIME).totalEntries).toBe(0);
    });

    it('should not affect other windows', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));

      engine.reset(LeaderboardWindow.DAILY);
      expect(engine.getStats(LeaderboardWindow.WEEKLY).totalEntries).toBe(1);
    });
  });

  // ===== export =====

  describe('export()', () => {
    it('should return a copy of entries', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));

      const exported = engine.export(LeaderboardWindow.ALL_TIME);
      expect(exported.length).toBe(1);
      expect(exported[0].userId).toBe('u1');
    });

    it('should return empty array for empty window', () => {
      const exported = engine.export(LeaderboardWindow.ALL_TIME);
      expect(exported).toEqual([]);
    });
  });

  // ===== getUserBestRank =====

  describe('getUserBestRank()', () => {
    it('should return null for unknown user', () => {
      expect(engine.getUserBestRank('unknown')).toBeNull();
    });

    it('should return best rank across windows', () => {
      engine.submitScore(makeEntry({ userId: 'u1', score: 100 }));
      engine.submitScore(makeEntry({ userId: 'u2', score: 200 }));

      const best = engine.getUserBestRank('u1');
      expect(best).not.toBeNull();
      expect(best!.rank).toBe(2);
    });
  });
});
