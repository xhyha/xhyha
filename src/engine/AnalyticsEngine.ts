/**
 * Genesis AI Micro-Game Engine - Analytics Engine
 *
 * Tracks user behavior, funnels, retention cohorts, and dashboard metrics.
 */

import { GameType } from '../models/types';

// ========== Enums ==========

/** Analytics event types */
export enum AnalyticsEventType {
  GAME_START = 'GAME_START',
  GAME_COMPLETE = 'GAME_COMPLETE',
  GAME_FAIL = 'GAME_FAIL',
  GAME_ABANDON = 'GAME_ABANDON',
  TRIGGER_FIRED = 'TRIGGER_FIRED',
  TRIGGER_DISMISSED = 'TRIGGER_DISMISSED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  CHALLENGE_SENT = 'CHALLENGE_SENT',
  CHALLENGE_ACCEPTED = 'CHALLENGE_ACCEPTED',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  SHARE = 'SHARE',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  PROFILE_VIEW = 'PROFILE_VIEW',
  LEADERBOARD_VIEW = 'LEADERBOARD_VIEW',
}

// ========== Interfaces ==========

/** Analytics event */
export interface IAnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId: string;
  timestamp: number;
  properties: Record<string, unknown>;
  sessionId: string;
}

/** Funnel step */
export interface IFunnelStep {
  name: string;
  event: AnalyticsEventType;
  count: number;
  rate: number; // conversion rate from previous step
}

/** Funnel analysis result */
export interface IFunnelAnalysis {
  name: string;
  steps: IFunnelStep[];
  totalConversion: number; // overall conversion rate
  dropOffStep: string; // step with biggest drop-off
}

/** Retention cohort */
export interface IRetentionCohort {
  cohortDate: string; // YYYY-MM-DD
  cohortSize: number;
  retention: Record<number, number>; // day N → retained count
  retentionRate: Record<number, number>; // day N → retention %
}

/** User analytics summary */
export interface IUserAnalytics {
  userId: string;
  totalSessions: number;
  totalGameTime: number; // seconds
  avgSessionDuration: number;
  gamesPerSession: number;
  favoriteGame: string;
  favoriteTimeOfDay: string; // 'morning' | 'afternoon' | 'evening' | 'night'
  engagementScore: number; // 0-100
  churnRisk: number; // 0-1, higher = more likely to churn
  lastActiveDate: string;
  daysSinceLastActive: number;
}

/** Dashboard metrics */
export interface IDashboardMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  totalGamesPlayed: number;
  avgScore: number;
  topGame: string;
  avgSessionDuration: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
}

// ========== Helpers ==========

let _analyticsIdCounter = 0;

function generateAnalyticsId(): string {
  _analyticsIdCounter++;
  return `evt_${Date.now()}_${_analyticsIdCounter}`;
}

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

function getTimeOfDay(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function daysBetween(a: string, b: string): number {
  const dA = new Date(a).getTime();
  const dB = new Date(b).getTime();
  return Math.floor(Math.abs(dB - dA) / (24 * 60 * 60 * 1000));
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ========== AnalyticsEngine Class ==========

/**
 * Engine that tracks analytics events, computes funnels, retention,
 * and dashboard-level metrics.
 *
 * Usage:
 *   const analytics = new AnalyticsEngine();
 *   const sid = analytics.trackSessionStart('user1');
 *   analytics.trackGameStart('user1', 'Tap Rush', GameType.REACTION);
 *   analytics.trackGameComplete('user1', 'Tap Rush', 850, 45);
 *   analytics.trackSessionEnd(sid);
 *   const dashboard = analytics.getDashboardMetrics();
 */
export class AnalyticsEngine {
  private events: IAnalyticsEvent[] = [];
  private sessionMap: Map<string, { userId: string; startTime: number }> = new Map();

  constructor() {}

  // ---- Event Tracking ----

  /**
   * Track a generic analytics event
   */
  trackEvent(
    type: AnalyticsEventType,
    userId: string,
    properties: Record<string, unknown> = {},
    sessionId: string = ''
  ): IAnalyticsEvent {
    const event: IAnalyticsEvent = {
      id: generateAnalyticsId(),
      type,
      userId,
      timestamp: Date.now(),
      properties,
      sessionId,
    };

    this.events.push(event);
    return event;
  }

  /**
   * Track a game start event
   */
  trackGameStart(userId: string, gameName: string, gameType: string): IAnalyticsEvent {
    return this.trackEvent(AnalyticsEventType.GAME_START, userId, {
      gameName,
      gameType,
    });
  }

  /**
   * Track a game completion event
   */
  trackGameComplete(userId: string, gameName: string, score: number, duration: number): IAnalyticsEvent {
    return this.trackEvent(AnalyticsEventType.GAME_COMPLETE, userId, {
      gameName,
      score,
      duration,
    });
  }

  /**
   * Start a session and return the session ID
   */
  trackSessionStart(userId: string): string {
    const sessionId = generateAnalyticsId();
    this.sessionMap.set(sessionId, {
      userId,
      startTime: Date.now(),
    });

    this.trackEvent(AnalyticsEventType.SESSION_START, userId, {}, sessionId);
    return sessionId;
  }

  /**
   * End a tracked session
   */
  trackSessionEnd(sessionId: string): void {
    const session = this.sessionMap.get(sessionId);
    if (!session) return;

    const duration = (Date.now() - session.startTime) / 1000;
    this.trackEvent(AnalyticsEventType.SESSION_END, session.userId, {
      duration,
    }, sessionId);

    this.sessionMap.delete(sessionId);
  }

  // ---- Queries ----

  /**
   * Get events with optional filters
   */
  getEvents(filter?: {
    type?: AnalyticsEventType;
    userId?: string;
    since?: number;
    until?: number;
  }): IAnalyticsEvent[] {
    let result = [...this.events];

    if (filter) {
      if (filter.type !== undefined) {
        result = result.filter((e) => e.type === filter.type);
      }
      if (filter.userId !== undefined) {
        result = result.filter((e) => e.userId === filter.userId);
      }
      if (filter.since !== undefined) {
        result = result.filter((e) => e.timestamp >= filter.since!);
      }
      if (filter.until !== undefined) {
        result = result.filter((e) => e.timestamp <= filter.until!);
      }
    }

    return result;
  }

  /**
   * Get count of events of a given type
   */
  getEventCount(type: AnalyticsEventType, since?: number): number {
    return this.events.filter(
      (e) => e.type === type && (since === undefined || e.timestamp >= since)
    ).length;
  }

  // ---- Analytics ----

  /**
   * Compute analytics summary for a specific user
   */
  getUserAnalytics(userId: string): IUserAnalytics {
    const userEvents = this.events.filter((e) => e.userId === userId);
    const sessionStarts = userEvents.filter((e) => e.type === AnalyticsEventType.SESSION_START);
    const sessionEnds = userEvents.filter((e) => e.type === AnalyticsEventType.SESSION_END);
    const gameStarts = userEvents.filter((e) => e.type === AnalyticsEventType.GAME_START);
    const gameCompletes = userEvents.filter((e) => e.type === AnalyticsEventType.GAME_COMPLETE);

    const totalSessions = sessionStarts.length;

    // Total game time from session end durations
    const totalGameTime = sessionEnds.reduce((sum, e) => {
      return sum + (typeof e.properties.duration === 'number' ? e.properties.duration : 0);
    }, 0);

    const avgSessionDuration = totalSessions > 0 ? totalGameTime / totalSessions : 0;
    const gamesPerSession = totalSessions > 0 ? gameStarts.length / totalSessions : 0;

    // Favorite game
    const gameCounts: Record<string, number> = {};
    for (const e of gameStarts) {
      const name = (e.properties.gameName as string) ?? 'unknown';
      gameCounts[name] = (gameCounts[name] ?? 0) + 1;
    }
    const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

    // Favorite time of day
    const hourCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const e of userEvents) {
      const hour = new Date(e.timestamp).getHours();
      const tod = getTimeOfDay(hour);
      hourCounts[tod]++;
    }
    const favoriteTimeOfDay = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'afternoon';

    // Engagement score: based on event count, sessions, and game completions (0-100)
    const rawEngagement = Math.min(100, userEvents.length * 2 + totalSessions * 5 + gameCompletes.length * 3);

    // Churn risk: higher if fewer recent events
    const now = Date.now();
    const recentEvents = userEvents.filter((e) => now - e.timestamp < 7 * MS_PER_DAY).length;
    const churnRisk = Math.max(0, Math.min(1, 1 - recentEvents / 50));

    // Last active
    const lastEvent = userEvents.length > 0
      ? userEvents.reduce((latest, e) => (e.timestamp > latest ? e.timestamp : latest), userEvents[0].timestamp)
      : 0;
    const lastActiveDate = lastEvent > 0 ? toDateString(lastEvent) : '';
    const daysSinceLastActive = lastEvent > 0 ? Math.floor((now - lastEvent) / MS_PER_DAY) : 999;

    return {
      userId,
      totalSessions,
      totalGameTime: Math.round(totalGameTime),
      avgSessionDuration: Math.round(avgSessionDuration),
      gamesPerSession: Math.round(gamesPerSession * 100) / 100,
      favoriteGame,
      favoriteTimeOfDay,
      engagementScore: Math.round(rawEngagement),
      churnRisk: Math.round(churnRisk * 100) / 100,
      lastActiveDate,
      daysSinceLastActive,
    };
  }

  /**
   * Compute high-level dashboard metrics
   */
  getDashboardMetrics(): IDashboardMetrics {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * MS_PER_DAY;
    const monthAgo = now - 30 * MS_PER_DAY;

    const allUsers = new Set(this.events.map((e) => e.userId));
    const todayUsers = new Set(this.events.filter((e) => e.timestamp >= todayStart).map((e) => e.userId));
    const weekUsers = new Set(this.events.filter((e) => e.timestamp >= weekAgo).map((e) => e.userId));
    const monthUsers = new Set(this.events.filter((e) => e.timestamp >= monthAgo).map((e) => e.userId));

    const gameCompletes = this.events.filter((e) => e.type === AnalyticsEventType.GAME_COMPLETE);
    const totalGamesPlayed = gameCompletes.length;

    const avgScore = totalGamesPlayed > 0
      ? gameCompletes.reduce((sum, e) => sum + ((e.properties.score as number) ?? 0), 0) / totalGamesPlayed
      : 0;

    // Top game by play count
    const gamePlayCounts: Record<string, number> = {};
    for (const e of this.events.filter((e) => e.type === AnalyticsEventType.GAME_START)) {
      const name = (e.properties.gameName as string) ?? 'unknown';
      gamePlayCounts[name] = (gamePlayCounts[name] ?? 0) + 1;
    }
    const topGame = Object.entries(gamePlayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

    // Average session duration
    const sessionEnds = this.events.filter((e) => e.type === AnalyticsEventType.SESSION_END);
    const avgSessionDuration = sessionEnds.length > 0
      ? sessionEnds.reduce((sum, e) => sum + ((e.properties.duration as number) ?? 0), 0) / sessionEnds.length
      : 0;

    // Retention (simplified: users who returned after N days relative to cohort)
    const retentionDay1 = this.computeRetentionRate(allUsers, 1);
    const retentionDay7 = this.computeRetentionRate(allUsers, 7);
    const retentionDay30 = this.computeRetentionRate(allUsers, 30);

    return {
      totalUsers: allUsers.size,
      activeUsersToday: todayUsers.size,
      activeUsersWeek: weekUsers.size,
      activeUsersMonth: monthUsers.size,
      totalGamesPlayed,
      avgScore: Math.round(avgScore * 100) / 100,
      topGame,
      avgSessionDuration: Math.round(avgSessionDuration),
      retentionDay1,
      retentionDay7,
      retentionDay30,
    };
  }

  // ---- Funnel Analysis ----

  /**
   * Analyze a conversion funnel given ordered event types as steps
   */
  analyzeFunnel(name: string, steps: AnalyticsEventType[]): IFunnelAnalysis {
    if (steps.length === 0) {
      return { name, steps: [], totalConversion: 0, dropOffStep: '' };
    }

    // Collect unique users per step
    const usersPerStep: Array<{ name: string; event: AnalyticsEventType; users: Set<string> }> = steps.map(
      (step) => ({
        name: step,
        event: step,
        users: new Set(
          this.events.filter((e) => e.type === step).map((e) => e.userId)
        ),
      })
    );

    const funnelSteps: IFunnelStep[] = usersPerStep.map((step, i) => {
      const count = step.users.size;
      let rate = 1;

      if (i > 0) {
        const prevCount = usersPerStep[i - 1].users.size;
        rate = prevCount > 0 ? count / prevCount : 0;
      }

      return {
        name: step.name,
        event: step.event,
        count,
        rate: Math.round(rate * 1000) / 1000,
      };
    });

    const firstCount = funnelSteps[0].count;
    const lastCount = funnelSteps[funnelSteps.length - 1].count;
    const totalConversion = firstCount > 0 ? lastCount / firstCount : 0;

    // Find step with biggest drop-off (largest decrease in rate)
    let dropOffStep = funnelSteps[0].name;
    let maxDrop = 0;
    for (let i = 1; i < funnelSteps.length; i++) {
      const drop = funnelSteps[i - 1].count - funnelSteps[i].count;
      if (drop > maxDrop) {
        maxDrop = drop;
        dropOffStep = funnelSteps[i].name;
      }
    }

    return {
      name,
      steps: funnelSteps,
      totalConversion: Math.round(totalConversion * 1000) / 1000,
      dropOffStep,
    };
  }

  // ---- Retention Analysis ----

  /**
   * Compute retention cohorts starting from a given date for a number of days.
   * Each cohort represents users whose first event was on that day.
   */
  analyzeRetention(cohortStartDate: string, days: number): IRetentionCohort[] {
    const startDate = new Date(cohortStartDate).getTime();
    if (isNaN(startDate)) return [];

    const cohorts: IRetentionCohort[] = [];

    // Build map of userId → set of active dates
    const userActiveDays: Map<string, Set<string>> = new Map();
    // Build map of userId → first active date string
    const userFirstDay: Map<string, string> = new Map();

    for (const event of this.events) {
      const ds = toDateString(event.timestamp);
      if (!userActiveDays.has(event.userId)) {
        userActiveDays.set(event.userId, new Set());
      }
      userActiveDays.get(event.userId)!.add(ds);

      const existing = userFirstDay.get(event.userId);
      if (!existing || ds < existing) {
        userFirstDay.set(event.userId, ds);
      }
    }

    for (let d = 0; d < days; d++) {
      const cohortDate = toDateString(startDate + d * MS_PER_DAY);
      // Users whose first day is cohortDate
      const cohortUserIds: string[] = [];
      for (const [uid, firstDay] of userFirstDay) {
        if (firstDay === cohortDate) {
          cohortUserIds.push(uid);
        }
      }

      const cohortSize = cohortUserIds.length;
      const retention: Record<number, number> = {};
      const retentionRate: Record<number, number> = {};

      for (let n = 0; n <= days - d; n++) {
        const targetDate = toDateString(startDate + (d + n) * MS_PER_DAY);
        let retained = 0;
        for (const uid of cohortUserIds) {
          if (userActiveDays.get(uid)?.has(targetDate)) {
            retained++;
          }
        }
        retention[n] = retained;
        retentionRate[n] = cohortSize > 0 ? Math.round((retained / cohortSize) * 1000) / 1000 : 0;
      }

      cohorts.push({
        cohortDate,
        cohortSize,
        retention,
        retentionRate,
      });
    }

    return cohorts;
  }

  // ---- Aggregation Helpers ----

  /**
   * Get game popularity ranking
   */
  getGamePopularity(): Array<{ gameName: string; playCount: number; avgScore: number }> {
    const stats: Record<string, { count: number; totalScore: number }> = {};

    const gameStarts = this.events.filter((e) => e.type === AnalyticsEventType.GAME_START);
    for (const e of gameStarts) {
      const name = (e.properties.gameName as string) ?? 'unknown';
      if (!stats[name]) stats[name] = { count: 0, totalScore: 0 };
      stats[name].count++;
    }

    const gameCompletes = this.events.filter((e) => e.type === AnalyticsEventType.GAME_COMPLETE);
    for (const e of gameCompletes) {
      const name = (e.properties.gameName as string) ?? 'unknown';
      if (!stats[name]) stats[name] = { count: 0, totalScore: 0 };
      stats[name].totalScore += (e.properties.score as number) ?? 0;
    }

    return Object.entries(stats)
      .map(([gameName, { count, totalScore }]) => ({
        gameName,
        playCount: count,
        avgScore: count > 0 ? Math.round((totalScore / count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.playCount - a.playCount);
  }

  /**
   * Get peak activity hours (0-23)
   */
  getPeakHours(): Array<{ hour: number; eventCount: number }> {
    const hourCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;

    for (const e of this.events) {
      const hour = new Date(e.timestamp).getHours();
      hourCounts[hour]++;
    }

    return Object.entries(hourCounts)
      .map(([hour, eventCount]) => ({
        hour: parseInt(hour, 10),
        eventCount,
      }))
      .sort((a, b) => b.eventCount - a.eventCount);
  }

  /**
   * Get top users by engagement
   */
  getTopUsers(limit: number): Array<{ userId: string; gamesPlayed: number; totalScore: number }> {
    const userStats: Record<string, { gamesPlayed: number; totalScore: number }> = {};

    const gameStarts = this.events.filter((e) => e.type === AnalyticsEventType.GAME_START);
    for (const e of gameStarts) {
      if (!userStats[e.userId]) userStats[e.userId] = { gamesPlayed: 0, totalScore: 0 };
      userStats[e.userId].gamesPlayed++;
    }

    const gameCompletes = this.events.filter((e) => e.type === AnalyticsEventType.GAME_COMPLETE);
    for (const e of gameCompletes) {
      if (!userStats[e.userId]) userStats[e.userId] = { gamesPlayed: 0, totalScore: 0 };
      userStats[e.userId].totalScore += (e.properties.score as number) ?? 0;
    }

    return Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        gamesPlayed: stats.gamesPlayed,
        totalScore: Math.round(stats.totalScore),
      }))
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, limit);
  }

  // ---- Utility ----

  /**
   * Get count of unique users, optionally since a given timestamp
   */
  getUniqueUsers(since?: number): number {
    const filtered = since !== undefined
      ? this.events.filter((e) => e.timestamp >= since)
      : this.events;
    return new Set(filtered.map((e) => e.userId)).size;
  }

  /**
   * Clear events older than the given timestamp.
   * Returns the number of deleted events.
   */
  clearOldData(olderThan: number): number {
    const before = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= olderThan);
    return before - this.events.length;
  }

  // ---- Private Helpers ----

  /**
   * Compute simplified retention rate: % of users who had events on both
   * their first day and N days later.
   */
  private computeRetentionRate(allUsers: Set<string>, targetDay: number): number {
    if (allUsers.size === 0) return 0;

    const userFirstDay: Map<string, string> = new Map();
    const userActiveDays: Map<string, Set<string>> = new Map();

    for (const event of this.events) {
      const ds = toDateString(event.timestamp);
      const existing = userFirstDay.get(event.userId);
      if (!existing || ds < existing) {
        userFirstDay.set(event.userId, ds);
      }
      if (!userActiveDays.has(event.userId)) {
        userActiveDays.set(event.userId, new Set());
      }
      userActiveDays.get(event.userId)!.add(ds);
    }

    let retained = 0;
    for (const userId of allUsers) {
      const first = userFirstDay.get(userId);
      if (!first) continue;
      const targetDate = toDateString(new Date(first).getTime() + targetDay * MS_PER_DAY);
      if (userActiveDays.get(userId)?.has(targetDate)) {
        retained++;
      }
    }

    return Math.round((retained / allUsers.size) * 1000) / 1000;
  }
}
