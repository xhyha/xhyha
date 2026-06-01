// ========== Enums ==========

/** Achievement category */
export enum AchievementCategory {
  MILESTONE = 'MILESTONE',     // Play X games, score X points total
  STREAK = 'STREAK',           // Daily login streak, win streak
  SKILL = 'SKILL',             // Perfect score, speed run
  SOCIAL = 'SOCIAL',           // Challenge friends, share
  EXPLORATION = 'EXPLORATION', // Try all game types
  DAILY = 'DAILY',             // Daily challenge
}

/** Achievement rarity */
export enum AchievementRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

// ========== Interfaces ==========

/** Achievement reward */
export interface IAchievementReward {
  type: 'badge' | 'title' | 'bonus_score';
  value: string | number;
}

/** Achievement definition */
export interface IAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // emoji icon
  condition: (progress: IAchievementProgress) => boolean;
  reward: IAchievementReward;
  hidden: boolean; // hidden until unlocked
}

/** Achievement progress for a user */
export interface IAchievementProgress {
  userId: string;
  totalGamesPlayed: number;
  totalScore: number;
  perfectGames: number;
  uniqueGamesPlayed: Set<string>; // set of game template names
  currentStreak: number;
  bestStreak: number;
  friendsChallenged: number;
  gamesShared: number;
  dailyChallengeCompleted: boolean;
  fastestWin: number; // seconds
  scoresByGame: Map<string, number[]>; // game name → list of scores
  unlockedAchievements: Set<string>; // achievement IDs
}

/** Unlocked achievement record */
export interface IUnlockedAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: number;
  isNew: boolean; // just unlocked this session
}

/** Daily challenge definition */
export interface IDailyChallenge {
  date: string; // YYYY-MM-DD
  gameName: string;
  targetScore: number;
  bonusMultiplier: number;
  completedBy: Set<string>; // user IDs
}

// ========== Default achievements ==========

const DEFAULT_ACHIEVEMENTS: IAchievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Play your first game',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.COMMON,
    icon: '🎮',
    condition: (p) => p.totalGamesPlayed >= 1,
    reward: { type: 'badge', value: 'first_steps' },
    hidden: false,
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Play 5 games',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.COMMON,
    icon: '🚀',
    condition: (p) => p.totalGamesPlayed >= 5,
    reward: { type: 'badge', value: 'getting_started' },
    hidden: false,
  },
  {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play 25 games',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.RARE,
    icon: '💪',
    condition: (p) => p.totalGamesPlayed >= 25,
    reward: { type: 'badge', value: 'dedicated_player' },
    hidden: false,
  },
  {
    id: 'micro_game_master',
    name: 'Micro-Game Master',
    description: 'Play 100 games',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.EPIC,
    icon: '👑',
    condition: (p) => p.totalGamesPlayed >= 100,
    reward: { type: 'title', value: 'Micro-Game Master' },
    hidden: true,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a game in under 10 seconds',
    category: AchievementCategory.SKILL,
    rarity: AchievementRarity.RARE,
    icon: '⚡',
    condition: (p) => p.fastestWin > 0 && p.fastestWin < 10,
    reward: { type: 'badge', value: 'speed_demon' },
    hidden: false,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get a perfect score',
    category: AchievementCategory.SKILL,
    rarity: AchievementRarity.EPIC,
    icon: '💯',
    condition: (p) => p.perfectGames >= 1,
    reward: { type: 'title', value: 'Perfectionist' },
    hidden: true,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try 5 different game types',
    category: AchievementCategory.EXPLORATION,
    rarity: AchievementRarity.RARE,
    icon: '🧭',
    condition: (p) => p.uniqueGamesPlayed.size >= 5,
    reward: { type: 'badge', value: 'explorer' },
    hidden: false,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Try all 15 game types',
    category: AchievementCategory.EXPLORATION,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🏆',
    condition: (p) => p.uniqueGamesPlayed.size >= 15,
    reward: { type: 'title', value: 'Completionist' },
    hidden: true,
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: '3-game win streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.RARE,
    icon: '🔥',
    condition: (p) => p.bestStreak >= 3,
    reward: { type: 'badge', value: 'on_fire' },
    hidden: false,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '10-game win streak',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.EPIC,
    icon: '🌟',
    condition: (p) => p.bestStreak >= 10,
    reward: { type: 'title', value: 'Unstoppable' },
    hidden: true,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Challenge 3 friends',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.RARE,
    icon: '🦋',
    condition: (p) => p.friendsChallenged >= 3,
    reward: { type: 'badge', value: 'social_butterfly' },
    hidden: false,
  },
  {
    id: 'daily_warrior',
    name: 'Daily Warrior',
    description: 'Complete a daily challenge',
    category: AchievementCategory.DAILY,
    rarity: AchievementRarity.COMMON,
    icon: '⚔️',
    condition: (p) => p.dailyChallengeCompleted,
    reward: { type: 'badge', value: 'daily_warrior' },
    hidden: false,
  },
  {
    id: 'daily_champion',
    name: 'Daily Champion',
    description: 'Complete 7 daily challenges in a row',
    category: AchievementCategory.DAILY,
    rarity: AchievementRarity.EPIC,
    icon: '🏅',
    condition: (p) => p.currentStreak >= 7,
    reward: { type: 'title', value: 'Daily Champion' },
    hidden: true,
  },
  {
    id: 'score_hunter',
    name: 'Score Hunter',
    description: 'Accumulate 1000 total points',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.RARE,
    icon: '🎯',
    condition: (p) => p.totalScore >= 1000,
    reward: { type: 'badge', value: 'score_hunter' },
    hidden: false,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Accumulate 10000 total points',
    category: AchievementCategory.MILESTONE,
    rarity: AchievementRarity.LEGENDARY,
    icon: '🎖️',
    condition: (p) => p.totalScore >= 10000,
    reward: { type: 'title', value: 'Legend' },
    hidden: true,
  },
];

// ========== Engine ==========

/**
 * Engine that manages achievements, badges, milestones, streaks, and daily challenges.
 * Checks progress against registered achievement conditions and unlocks new achievements.
 */
export class AchievementEngine {
  private achievements: Map<string, IAchievement>;
  private dailyChallenge: IDailyChallenge | null;

  constructor() {
    this.achievements = new Map();
    this.dailyChallenge = null;

    // Register default achievements
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      this.achievements.set(achievement.id, achievement);
    }
  }

  /**
   * Register a custom achievement.
   */
  registerAchievement(achievement: IAchievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  /**
   * Check all achievements against user progress.
   * Returns newly unlocked achievements (not previously in progress.unlockedAchievements).
   */
  checkAchievements(progress: IAchievementProgress): IUnlockedAchievement[] {
    const newlyUnlocked: IUnlockedAchievement[] = [];

    for (const [id, achievement] of this.achievements) {
      // Skip if already unlocked
      if (progress.unlockedAchievements.has(id)) continue;

      // Check if condition is met
      if (achievement.condition(progress)) {
        const unlocked: IUnlockedAchievement = {
          achievementId: id,
          userId: progress.userId,
          unlockedAt: Date.now(),
          isNew: true,
        };
        newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get all achievements with their unlock status.
   */
  getAllAchievements(unlockedIds: Set<string>): Array<IAchievement & { unlocked: boolean }> {
    const result: Array<IAchievement & { unlocked: boolean }> = [];

    for (const [id, achievement] of this.achievements) {
      result.push({
        ...achievement,
        unlocked: unlockedIds.has(id),
      });
    }

    return result;
  }

  /**
   * Get achievements filtered by category, with unlock status.
   */
  getByCategory(
    category: AchievementCategory,
    unlockedIds: Set<string>,
  ): Array<IAchievement & { unlocked: boolean }> {
    const result: Array<IAchievement & { unlocked: boolean }> = [];

    for (const [id, achievement] of this.achievements) {
      if (achievement.category === category) {
        result.push({
          ...achievement,
          unlocked: unlockedIds.has(id),
        });
      }
    }

    return result;
  }

  /**
   * Get achievement completion statistics.
   */
  getCompletionStats(unlockedIds: Set<string>): {
    total: number;
    unlocked: number;
    percentage: number;
    byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  } {
    let total = 0;
    let unlocked = 0;
    const byCategory = {} as Record<AchievementCategory, { total: number; unlocked: number }>;

    // Initialize categories
    const categories = Object.values(AchievementCategory);
    for (const cat of categories) {
      byCategory[cat] = { total: 0, unlocked: 0 };
    }

    for (const [id, achievement] of this.achievements) {
      total++;
      byCategory[achievement.category].total++;

      if (unlockedIds.has(id)) {
        unlocked++;
        byCategory[achievement.category].unlocked++;
      }
    }

    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return { total, unlocked, percentage, byCategory };
  }

  /**
   * Generate a daily challenge from available game names.
   */
  generateDailyChallenge(gameNames: string[]): IDailyChallenge {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Pseudo-random selection based on date seed
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const gameIndex = seed % gameNames.length;
    const gameName = gameNames[gameIndex];

    // Scale target score and bonus with day-of-year
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const targetScore = 50 + (dayOfYear % 5) * 10; // 50-90 range
    const bonusMultiplier = 1.5 + (dayOfYear % 3) * 0.5; // 1.5-2.5 range

    const challenge: IDailyChallenge = {
      date: dateStr,
      gameName,
      targetScore,
      bonusMultiplier,
      completedBy: new Set<string>(),
    };

    this.dailyChallenge = challenge;
    return challenge;
  }

  /**
   * Check if user completed the daily challenge.
   * Returns completion status and bonus points.
   */
  completeDailyChallenge(userId: string, score: number): { completed: boolean; bonus: number } {
    if (!this.dailyChallenge) {
      return { completed: false, bonus: 0 };
    }

    if (score >= this.dailyChallenge.targetScore) {
      this.dailyChallenge.completedBy.add(userId);
      const bonus = Math.round(score * this.dailyChallenge.bonusMultiplier) - score;
      return { completed: true, bonus };
    }

    return { completed: false, bonus: 0 };
  }

  /**
   * Get the current daily challenge.
   */
  getDailyChallenge(): IDailyChallenge | null {
    return this.dailyChallenge;
  }

  /**
   * Create default progress for a new user.
   */
  createDefaultProgress(userId: string): IAchievementProgress {
    return {
      userId,
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
    };
  }

  /**
   * Update progress from a game result.
   * Returns a new progress object with updated values.
   */
  updateProgress(
    progress: IAchievementProgress,
    gameName: string,
    score: number,
    duration: number,
    maxScore: number,
  ): IAchievementProgress {
    // Update scores by game
    const scoresByGame = new Map(progress.scoresByGame);
    const existingScores = scoresByGame.get(gameName) ?? [];
    scoresByGame.set(gameName, [...existingScores, score]);

    // Update unique games
    const uniqueGamesPlayed = new Set(progress.uniqueGamesPlayed);
    uniqueGamesPlayed.add(gameName);

    // Check for perfect game
    const isPerfect = maxScore > 0 && score >= maxScore;

    // Update streak
    const currentStreak = progress.currentStreak + 1;
    const bestStreak = Math.max(progress.bestStreak, currentStreak);

    // Update fastest win
    const fastestWin =
      progress.fastestWin > 0
        ? Math.min(progress.fastestWin, duration)
        : duration;

    return {
      ...progress,
      totalGamesPlayed: progress.totalGamesPlayed + 1,
      totalScore: progress.totalScore + score,
      perfectGames: progress.perfectGames + (isPerfect ? 1 : 0),
      uniqueGamesPlayed,
      currentStreak,
      bestStreak,
      fastestWin,
      scoresByGame,
    };
  }
}
