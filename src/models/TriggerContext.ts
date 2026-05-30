import { ITriggerContext, EmotionState } from './types';

/**
 * Factory for creating trigger contexts with defaults
 */
export class TriggerContextFactory {
  /**
   * Create a default trigger context
   */
  static createDefault(overrides?: Partial<ITriggerContext>): ITriggerContext {
    const now = Date.now();
    const date = new Date(now);
    const hour = overrides?.hour ?? date.getHours();
    const dayOfWeek = overrides?.dayOfWeek ?? date.getDay();

    return {
      timestamp: now,
      hour,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isDownloading: false,
      downloadProgress: 0,
      recentWinRate: 0.5,
      consecutiveLosses: 0,
      emotionState: EmotionState.CALM,
      batteryLevel: 80,
      isCharging: false,
      networkAvailable: true,
      friendOnlineCount: 0,
      lastGameTime: 0,
      weatherCondition: 'clear',
      currentLocation: 'unknown',
      ...overrides,
    };
  }

  /**
   * Create context for download waiting scenario
   */
  static createDownloadWaiting(progress: number = 0): ITriggerContext {
    return this.createDefault({
      isDownloading: true,
      downloadProgress: progress,
    });
  }

  /**
   * Create context for losing streak scenario
   */
  static createLosingStreak(losses: number): ITriggerContext {
    return this.createDefault({
      consecutiveLosses: losses,
      recentWinRate: Math.max(0, 0.5 - losses * 0.1),
      emotionState: losses >= 5 ? EmotionState.ANGRY : EmotionState.FRUSTRATED,
    });
  }

  /**
   * Create context for late night scenario
   */
  static createLateNight(): ITriggerContext {
    return this.createDefault({
      hour: 23,
      emotionState: EmotionState.CALM,
      batteryLevel: 30,
    });
  }

  /**
   * Create context for morning scenario
   */
  static createMorning(): ITriggerContext {
    return this.createDefault({
      hour: 7,
      emotionState: EmotionState.CALM,
    });
  }

  /**
   * Create context for commute scenario
   */
  static createCommute(): ITriggerContext {
    return this.createDefault({
      hour: 8,
      isWeekend: false,
      currentLocation: 'transit',
    });
  }
}
