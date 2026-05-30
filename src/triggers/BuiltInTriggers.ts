import { ITrigger, ITriggerContext, TriggerCategory, EmotionState } from '../models/types';

/**
 * Built-in trigger definitions for common Genesis scenarios.
 * These cover the most important trigger scenarios from the product spec.
 */
export class BuiltInTriggers {

  /**
   * Download waiting trigger - fires when user is waiting for a game download
   */
  static getDownloadWaitingTrigger(): ITrigger {
    return {
      id: 'trigger_download_waiting',
      category: TriggerCategory.BEHAVIOR,
      name: 'Download Waiting',
      description: 'Triggered when user is waiting for a game to download',
      cooldown: 120, // 2 minutes between triggers
      priority: 90,
      condition: (ctx: ITriggerContext) => {
        return ctx.isDownloading && ctx.downloadProgress < 95 && ctx.downloadProgress > 0;
      },
    };
  }

  /**
   * Losing streak trigger - fires when user is on a losing streak
   */
  static getLosingStreakTrigger(): ITrigger {
    return {
      id: 'trigger_losing_streak',
      category: TriggerCategory.EMOTION,
      name: 'Losing Streak Comfort',
      description: 'Triggered when user has lost multiple games in a row',
      cooldown: 600, // 10 minutes
      priority: 85,
      condition: (ctx: ITriggerContext) => {
        return ctx.consecutiveLosses >= 3;
      },
    };
  }

  /**
   * Late night trigger - fires during late night hours
   */
  static getLateNightTrigger(): ITrigger {
    return {
      id: 'trigger_late_night',
      category: TriggerCategory.TIME,
      name: 'Late Night Companion',
      description: 'Triggered during late night hours for relaxation',
      cooldown: 1800, // 30 minutes
      priority: 70,
      condition: (ctx: ITriggerContext) => {
        return (ctx.hour >= 23 || ctx.hour < 2) && ctx.emotionState !== EmotionState.ANGRY;
      },
    };
  }

  /**
   * Morning greeting trigger
   */
  static getMorningGreetingTrigger(): ITrigger {
    return {
      id: 'trigger_morning_greeting',
      category: TriggerCategory.TIME,
      name: 'Morning Greeting',
      description: 'Triggered in the morning to start the day',
      cooldown: 3600, // 1 hour
      priority: 60,
      condition: (ctx: ITriggerContext) => {
        return ctx.hour >= 6 && ctx.hour <= 9 && ctx.lastGameTime > 28800; // 8+ hours since last game
      },
    };
  }

  /**
   * Commute trigger - fires during typical commute hours
   */
  static getCommuteTrigger(): ITrigger {
    return {
      id: 'trigger_commute',
      category: TriggerCategory.ENVIRONMENT,
      name: 'Commute Companion',
      description: 'Triggered during commute time on weekdays',
      cooldown: 1800,
      priority: 65,
      condition: (ctx: ITriggerContext) => {
        const isMorningCommute = ctx.hour >= 7 && ctx.hour <= 9;
        const isEveningCommute = ctx.hour >= 17 && ctx.hour <= 19;
        return !ctx.isWeekend && (isMorningCommute || isEveningCommute);
      },
    };
  }

  /**
   * Boredom trigger - fires when user seems bored
   */
  static getBoredomTrigger(): ITrigger {
    return {
      id: 'trigger_boredom',
      category: TriggerCategory.EMOTION,
      name: 'Boredom Buster',
      description: 'Triggered when user seems to be browsing aimlessly',
      cooldown: 900, // 15 minutes
      priority: 50,
      condition: (ctx: ITriggerContext) => {
        return ctx.emotionState === EmotionState.BORED;
      },
    };
  }

  /**
   * Uninstall comfort trigger - fires after user uninstalls a game
   */
  static getUninstallComfortTrigger(): ITrigger {
    return {
      id: 'trigger_uninstall_comfort',
      category: TriggerCategory.BEHAVIOR,
      name: 'Uninstall Comfort',
      description: 'Triggered after user uninstalls a game',
      cooldown: 3600,
      priority: 75,
      condition: (ctx: ITriggerContext) => {
        // This would be set by the behavior tracker
        return (ctx as any).justUninstalled === true;
      },
    };
  }

  /**
   * Rainy day trigger - fires when it's raining
   */
  static getRainyDayTrigger(): ITrigger {
    return {
      id: 'trigger_rainy_day',
      category: TriggerCategory.ENVIRONMENT,
      name: 'Rainy Day',
      description: 'Triggered on rainy days for cozy gaming',
      cooldown: 3600,
      priority: 55,
      condition: (ctx: ITriggerContext) => {
        return ctx.weatherCondition === 'rain' || ctx.weatherCondition === 'storm';
      },
    };
  }

  /**
   * Friend online trigger - fires when friends come online
   */
  static getFriendOnlineTrigger(): ITrigger {
    return {
      id: 'trigger_friend_online',
      category: TriggerCategory.SOCIAL,
      name: 'Friend Online',
      description: 'Triggered when friends come online',
      cooldown: 600,
      priority: 80,
      condition: (ctx: ITriggerContext) => {
        return ctx.friendOnlineCount >= 2;
      },
    };
  }

  /**
   * Get all built-in triggers
   */
  static getAll(): ITrigger[] {
    return [
      this.getDownloadWaitingTrigger(),
      this.getLosingStreakTrigger(),
      this.getLateNightTrigger(),
      this.getMorningGreetingTrigger(),
      this.getCommuteTrigger(),
      this.getBoredomTrigger(),
      this.getUninstallComfortTrigger(),
      this.getRainyDayTrigger(),
      this.getFriendOnlineTrigger(),
    ];
  }
}
