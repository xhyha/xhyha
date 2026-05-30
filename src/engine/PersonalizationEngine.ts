import {
  IUserProfile, IGameResult, GameType, Difficulty,
  TasteDimension, IGameConfig, IGameTheme,
} from '../models/types';

/** Personalization recommendation */
export interface IGameRecommendation {
  gameType: GameType;
  difficulty: Difficulty;
  duration: number;
  reason: string;
  confidence: number; // 0-1
}

/**
 * Engine that personalizes micro-game generation based on user profile.
 * Recommends game type, difficulty, duration, and theme.
 */
export class PersonalizationEngine {
  /**
   * Get a game recommendation for a user
   */
  recommend(profile: IUserProfile): IGameRecommendation {
    const topTaste = this.getTopTasteDimensions(profile);
    const gameType = this.mapTasteToGameType(topTaste);
    const difficulty = this.calculateDifficulty(profile);
    const duration = this.estimateDuration(profile);

    return {
      gameType,
      difficulty,
      duration,
      reason: `Based on your ${topTaste} preference`,
      confidence: this.calculateConfidence(profile),
    };
  }

  /**
   * Generate a full game config from recommendation
   */
  generateConfig(rec: IGameRecommendation, templateName: string): IGameConfig {
    return {
      id: `genesis_${Date.now()}`,
      name: templateName,
      type: rec.gameType,
      description: `AI-generated ${rec.gameType} micro-game`,
      estimatedDuration: rec.duration,
      maxDuration: rec.duration * 1.5,
      difficulty: rec.difficulty,
      parameters: {},
      theme: this.generateTheme(rec.gameType),
    };
  }

  /**
   * Update user profile based on game result
   */
  updateProfile(profile: IUserProfile, result: IGameResult): IUserProfile {
    const performance = result.maxScore > 0 ? result.score / result.maxScore : 0;

    // Adjust difficulty preference based on performance
    let newDifficulty = profile.preferredDifficulty;
    if (performance > 0.85 && newDifficulty < Difficulty.EXPERT) {
      newDifficulty = (newDifficulty + 1) as Difficulty;
    } else if (performance < 0.3 && newDifficulty > Difficulty.EASY) {
      newDifficulty = (newDifficulty - 1) as Difficulty;
    }

    // Update reaction speed estimate
    const newReactionSpeed = result.gameType === GameType.REACTION
      ? Math.round(profile.averageReactionSpeed * 0.8 + result.duration * 20 * 0.2)
      : profile.averageReactionSpeed;

    return {
      ...profile,
      preferredDifficulty: newDifficulty,
      averageReactionSpeed: newReactionSpeed,
      totalMicroGamesPlayed: profile.totalMicroGamesPlayed + 1,
      lastActiveTime: Date.now(),
    };
  }

  /**
   * Calculate dynamic difficulty adjustment
   */
  calculateDynamicDifficulty(profile: IUserProfile, currentScore: number, maxScore: number): Difficulty {
    const performance = maxScore > 0 ? currentScore / maxScore : 0.5;
    const base = profile.preferredDifficulty;

    if (performance > 0.9) return Math.min(base + 1, Difficulty.EXPERT) as Difficulty;
    if (performance < 0.2) return Math.max(base - 1, Difficulty.EASY) as Difficulty;
    return base;
  }

  // ---- Private methods ----

  private getTopTasteDimensions(profile: IUserProfile): TasteDimension {
    const entries = Object.entries(profile.tasteProfile) as [TasteDimension, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  private mapTasteToGameType(taste: TasteDimension): GameType {
    const mapping: Record<string, GameType> = {
      [TasteDimension.STRATEGY]: GameType.PUZZLE,
      [TasteDimension.ACTION]: GameType.REACTION,
      [TasteDimension.SOCIAL]: GameType.SOCIAL,
      [TasteDimension.CREATIVE]: GameType.CREATE,
      [TasteDimension.RELAXATION]: GameType.HEALING,
      [TasteDimension.COMPETITION]: GameType.REACTION,
    };
    return mapping[taste] ?? GameType.PUZZLE;
  }

  private calculateDifficulty(profile: IUserProfile): Difficulty {
    const experience = profile.totalGamesPlayed + profile.totalMicroGamesPlayed;
    if (experience > 100) return Difficulty.HARD;
    if (experience > 30) return Difficulty.NORMAL;
    return Difficulty.EASY;
  }

  private estimateDuration(profile: IUserProfile): number {
    // Estimate based on average session duration, capped for micro-games
    return Math.min(Math.max(profile.averageSessionDuration * 0.1, 30), 120);
  }

  private calculateConfidence(profile: IUserProfile): number {
    const gameCount = profile.totalGamesPlayed + profile.totalMicroGamesPlayed;
    // More data = higher confidence, asymptoting at 1.0
    return Math.min(1.0, 0.3 + gameCount * 0.02);
  }

  private generateTheme(type: GameType): IGameTheme {
    const themes: Partial<Record<GameType, IGameTheme>> = {
      [GameType.REACTION]: {
        primaryColor: '#FF6B35',
        secondaryColor: '#F39C12',
        backgroundColor: '#1A1A2E',
        fontFamily: 'system',
        particleEffect: true,
      },
      [GameType.PUZZLE]: {
        primaryColor: '#4ECDC4',
        secondaryColor: '#2ECC71',
        backgroundColor: '#16213E',
        fontFamily: 'system',
        particleEffect: false,
      },
      [GameType.HEALING]: {
        primaryColor: '#A8DADC',
        secondaryColor: '#457B9D',
        backgroundColor: '#0D1B2A',
        fontFamily: 'system',
        particleEffect: true,
      },
      [GameType.CREATE]: {
        primaryColor: '#9B59B6',
        secondaryColor: '#E74C3C',
        backgroundColor: '#1A1A2E',
        fontFamily: 'system',
        particleEffect: true,
      },
    };
    return themes[type] ?? {
      primaryColor: '#CF0A2C',
      secondaryColor: '#FF6B35',
      backgroundColor: '#1A1A2E',
      fontFamily: 'system',
      particleEffect: false,
    };
  }
}
