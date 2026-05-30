import { IUserProfile, GameType, Difficulty, TasteDimension } from './types';

/**
 * Factory for creating user profiles
 */
export class UserProfileFactory {
  private static readonly DEFAULT_TASTE: Record<TasteDimension, number> = {
    [TasteDimension.STRATEGY]: 0.5,
    [TasteDimension.ACTION]: 0.5,
    [TasteDimension.SOCIAL]: 0.5,
    [TasteDimension.CREATIVE]: 0.5,
    [TasteDimension.RELAXATION]: 0.5,
    [TasteDimension.COMPETITION]: 0.5,
  };

  /**
   * Create a new user profile with defaults
   */
  static create(userId: string, overrides?: Partial<IUserProfile>): IUserProfile {
    const now = Date.now();
    return {
      userId,
      tasteProfile: { ...this.DEFAULT_TASTE },
      preferredGameTypes: [GameType.REACTION, GameType.PUZZLE],
      preferredDifficulty: Difficulty.NORMAL,
      averageSessionDuration: 300, // 5 minutes
      averageReactionSpeed: 300, // 300ms
      totalGamesPlayed: 0,
      totalMicroGamesPlayed: 0,
      lastActiveTime: now,
      createdAt: now,
      ...overrides,
    };
  }

  /**
   * Create a hardcore gamer profile
   */
  static createHardcoreGamer(userId: string): IUserProfile {
    return this.create(userId, {
      tasteProfile: {
        [TasteDimension.STRATEGY]: 0.8,
        [TasteDimension.ACTION]: 0.9,
        [TasteDimension.SOCIAL]: 0.6,
        [TasteDimension.CREATIVE]: 0.3,
        [TasteDimension.RELAXATION]: 0.2,
        [TasteDimension.COMPETITION]: 0.95,
      },
      preferredGameTypes: [GameType.REACTION, GameType.PUZZLE],
      preferredDifficulty: Difficulty.HARD,
      averageSessionDuration: 3600,
      averageReactionSpeed: 180,
      totalGamesPlayed: 500,
    });
  }

  /**
   * Create a casual gamer profile
   */
  static createCasualGamer(userId: string): IUserProfile {
    return this.create(userId, {
      tasteProfile: {
        [TasteDimension.STRATEGY]: 0.3,
        [TasteDimension.ACTION]: 0.2,
        [TasteDimension.SOCIAL]: 0.7,
        [TasteDimension.CREATIVE]: 0.8,
        [TasteDimension.RELAXATION]: 0.9,
        [TasteDimension.COMPETITION]: 0.1,
      },
      preferredGameTypes: [GameType.HEALING, GameType.CREATE],
      preferredDifficulty: Difficulty.EASY,
      averageSessionDuration: 600,
      averageReactionSpeed: 400,
      totalGamesPlayed: 20,
    });
  }
}
