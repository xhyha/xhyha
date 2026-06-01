// ========== Enums ==========

/** Leaderboard time window */
export enum LeaderboardWindow {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

// ========== Interfaces ==========

/** A single leaderboard entry */
export interface ILeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  gameType: string;
  gameName: string;
  timestamp: number;
  rank: number;
}

/** Leaderboard configuration */
export interface ILeaderboardConfig {
  maxEntries: number; // max entries per leaderboard (default 100)
  ttl: Record<LeaderboardWindow, number>; // time-to-live in seconds per window
}

/** Leaderboard query options */
export interface ILeaderboardQuery {
  window: LeaderboardWindow;
  gameType?: string; // filter by game type
  friendIds?: string[]; // only show friends
  limit?: number; // max results
  offset?: number; // pagination offset
}

/** Default TTL values in seconds per window */
const DEFAULT_TTL: Record<LeaderboardWindow, number> = {
  [LeaderboardWindow.DAILY]: 86400,
  [LeaderboardWindow.WEEKLY]: 604800,
  [LeaderboardWindow.MONTHLY]: 2592000,
  [LeaderboardWindow.ALL_TIME]: Infinity,
};

const DEFAULT_CONFIG: ILeaderboardConfig = {
  maxEntries: 100,
  ttl: { ...DEFAULT_TTL },
};

/**
 * Engine that manages leaderboard rankings across multiple time windows.
 * Supports friend filtering, pagination, and TTL-based expiration.
 */
export class LeaderboardEngine {
  private entries: Map<LeaderboardWindow, ILeaderboardEntry[]>;
  private config: ILeaderboardConfig;

  constructor(config?: Partial<ILeaderboardConfig>) {
    this.entries = new Map([
      [LeaderboardWindow.DAILY, []],
      [LeaderboardWindow.WEEKLY, []],
      [LeaderboardWindow.MONTHLY, []],
      [LeaderboardWindow.ALL_TIME, []],
    ]);
    this.config = {
      maxEntries: config?.maxEntries ?? DEFAULT_CONFIG.maxEntries,
      ttl: {
        ...DEFAULT_TTL,
        ...(config?.ttl ?? {}),
      },
    };
  }

  /**
   * Submit a new score to the appropriate leaderboard windows.
   * Inserts in sorted order (highest score first) and assigns rank.
   */
  submitScore(entry: Omit<ILeaderboardEntry, 'rank'>): ILeaderboardEntry {
    // Submit to all windows — entries flow into every time window
    const windows: LeaderboardWindow[] = [
      LeaderboardWindow.DAILY,
      LeaderboardWindow.WEEKLY,
      LeaderboardWindow.MONTHLY,
      LeaderboardWindow.ALL_TIME,
    ];

    let rankedEntry: ILeaderboardEntry | null = null;

    for (const window of windows) {
      const windowEntries = this.entries.get(window)!;
      const newEntry: ILeaderboardEntry = { ...entry, rank: 0 };

      // Insert in sorted order (highest score first, earliest timestamp breaks ties)
      let insertIndex = windowEntries.length;
      for (let i = 0; i < windowEntries.length; i++) {
        if (
          newEntry.score > windowEntries[i].score ||
          (newEntry.score === windowEntries[i].score &&
            newEntry.timestamp < windowEntries[i].timestamp)
        ) {
          insertIndex = i;
          break;
        }
      }

      windowEntries.splice(insertIndex, 0, newEntry);

      // Enforce max entries
      if (windowEntries.length > this.config.maxEntries) {
        windowEntries.pop();
      }

      // Reassign ranks
      this.reassignRanks(window);

      // Capture the ranked entry from ALL_TIME window as canonical
      if (window === LeaderboardWindow.ALL_TIME) {
        const found = windowEntries.find(
          (e) => e.userId === entry.userId && e.timestamp === entry.timestamp && e.score === entry.score,
        );
        if (found) {
          rankedEntry = { ...found };
        }
      }
    }

    return rankedEntry!;
  }

  /**
   * Query leaderboard with optional filters and pagination.
   */
  query(query: ILeaderboardQuery): ILeaderboardEntry[] {
    let results = [...(this.entries.get(query.window) ?? [])];

    // Filter by game type
    if (query.gameType) {
      results = results.filter((e) => e.gameType === query.gameType);
    }

    // Filter by friends
    if (query.friendIds && query.friendIds.length > 0) {
      const friendSet = new Set(query.friendIds);
      results = results.filter((e) => friendSet.has(e.userId));
    }

    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Get user's best rank across all time windows.
   */
  getUserBestRank(userId: string): { window: LeaderboardWindow; rank: number } | null {
    let best: { window: LeaderboardWindow; rank: number } | null = null;

    for (const [window, windowEntries] of this.entries) {
      const entry = windowEntries.find((e) => e.userId === userId);
      if (entry) {
        if (!best || entry.rank < best.rank) {
          best = { window, rank: entry.rank };
        }
      }
    }

    return best;
  }

  /**
   * Get user's rank in a specific window.
   * Returns -1 if user is not found.
   */
  getUserRank(userId: string, window: LeaderboardWindow): number {
    const windowEntries = this.entries.get(window);
    if (!windowEntries) return -1;

    const entry = windowEntries.find((e) => e.userId === userId);
    return entry ? entry.rank : -1;
  }

  /**
   * Get top N entries for a window.
   */
  getTopN(window: LeaderboardWindow, n: number): ILeaderboardEntry[] {
    const windowEntries = this.entries.get(window) ?? [];
    return windowEntries.slice(0, n);
  }

  /**
   * Clear expired entries based on TTL for a given window.
   * Returns the number of entries removed.
   */
  clearExpired(window: LeaderboardWindow): number {
    const windowEntries = this.entries.get(window);
    if (!windowEntries) return 0;

    const ttlSeconds = this.config.ttl[window];
    if (ttlSeconds === Infinity) return 0; // ALL_TIME never expires

    const now = Date.now();
    const cutoff = now - ttlSeconds * 1000;
    const initialLength = windowEntries.length;

    const remaining = windowEntries.filter((e) => e.timestamp >= cutoff);
    this.entries.set(window, remaining);

    // Reassign ranks after removal
    this.reassignRanks(window);

    return initialLength - remaining.length;
  }

  /**
   * Get statistics about a leaderboard window.
   */
  getStats(window: LeaderboardWindow): { totalEntries: number; avgScore: number; topScore: number } {
    const windowEntries = this.entries.get(window) ?? [];

    if (windowEntries.length === 0) {
      return { totalEntries: 0, avgScore: 0, topScore: 0 };
    }

    const totalScore = windowEntries.reduce((sum, e) => sum + e.score, 0);
    const topScore = windowEntries[0]?.score ?? 0;

    return {
      totalEntries: windowEntries.length,
      avgScore: Math.round(totalScore / windowEntries.length),
      topScore,
    };
  }

  /**
   * Reset a specific leaderboard window, clearing all entries.
   */
  reset(window: LeaderboardWindow): void {
    this.entries.set(window, []);
  }

  /**
   * Export leaderboard data for a window.
   */
  export(window: LeaderboardWindow): ILeaderboardEntry[] {
    return [...(this.entries.get(window) ?? [])];
  }

  // ---- Private methods ----

  /**
   * Reassign sequential ranks based on current order.
   */
  private reassignRanks(window: LeaderboardWindow): void {
    const windowEntries = this.entries.get(window);
    if (!windowEntries) return;

    for (let i = 0; i < windowEntries.length; i++) {
      windowEntries[i] = { ...windowEntries[i], rank: i + 1 };
    }
  }
}
