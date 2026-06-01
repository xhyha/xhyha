/**
 * Genesis AI Micro-Game Engine - Emotion Engine
 *
 * Detects player emotion from behavioral signals (taps, performance,
 * timing, choices) and provides adaptive narrative, recommendations,
 * and intervention triggers.
 */

import { EmotionState, GameType } from '../models/types';

// ========== Enums ==========

/** Source of an emotion signal */
export enum EmotionSource {
  TAP = 'TAP',
  PERFORMANCE = 'PERFORMANCE',
  TIMING = 'TIMING',
  CHOICE = 'CHOICE',
  SELF_REPORT = 'SELF_REPORT',
}

// ========== Interfaces ==========

/** A single emotion signal observation */
export interface IEmotionSignal {
  source: EmotionSource;
  emotion: EmotionState;
  confidence: number; // 0-1
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/** The emotion profile built up over a session */
export interface IEmotionProfile {
  userId: string;
  dominantEmotion: EmotionState;
  emotionHistory: IEmotionSignal[];
  emotionWeights: Record<string, number>;
  lastUpdated: number;
}

/** Behavioral context used to infer emotion */
export interface IBehaviorContext {
  userId: string;
  tapFrequency: number;       // taps per second
  tapForce: number;           // 0-1 normalized
  recentScores: number[];     // last N scores
  averageScore: number;
  completionRate: number;     // 0-1
  averageResponseTime: number; // ms
  sessionDuration: number;    // seconds
  gamesPlayedThisSession: number;
  preferredGameTypes: GameType[];
  currentGameType: GameType;
  retryCount: number;
  quitCount: number;
  streak: number;             // positive = wins, negative = losses
}

/** An adaptive narrative suggestion */
export interface IAdaptiveNarrative {
  text: string;
  tone: 'encouraging' | 'challenging' | 'calming' | 'celebratory' | 'neutral';
  suggestedGameType: GameType | null;
  suggestedDifficulty: number | null;
  urgency: number; // 0-1, how quickly to intervene
}

/** A game recommendation based on emotion */
export interface IEmotionRecommendation {
  gameType: GameType;
  difficulty: number;
  reason: string;
  confidence: number;
}

// ========== Helpers ==========

const EMOTION_THRESHOLDS = {
  frustrated: { highTapFrequency: 3.5, lowScore: 0.3, highResponseTime: 3000, highRetryCount: 3 },
  bored: { lowTapFrequency: 0.5, highCompletionRate: 0.9, longSession: 600, highGamesPlayed: 10 },
  excited: { highTapFrequency: 2.5, highScore: 0.8, lowResponseTime: 800 },
  anxious: { highTapForce: 0.8, highResponseTime: 2500, highRetryCount: 2 },
  happy: { goodCompletionRate: 0.7, goodScore: 0.6, positiveStreak: 3 },
  angry: { veryHighTapFrequency: 5.0, veryHighTapForce: 0.9, highQuitCount: 2 },
  calm: { moderateTapFrequency: 2.0, goodCompletionRate: 0.7, moderateResponseTime: 1500 },
  nostalgic: { longSession: 300, highGamesPlayed: 5 },
};

/**
 * Fuse multiple emotion signals into a single dominant emotion.
 * Uses weighted average of confidence scores.
 */
function fuseSignals(signals: IEmotionSignal[]): { emotion: EmotionState; confidence: number } {
  if (signals.length === 0) {
    return { emotion: EmotionState.CALM, confidence: 0.5 };
  }

  const weights: Record<string, number> = {};
  for (const signal of signals) {
    const key = signal.emotion as string;
    // Weight by source reliability
    const sourceWeight = signal.source === EmotionSource.SELF_REPORT ? 2.0 : 1.0;
    weights[key] = (weights[key] ?? 0) + signal.confidence * sourceWeight;
  }

  let dominant = EmotionState.CALM;
  let maxWeight = 0;
  for (const [emotion, weight] of Object.entries(weights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      dominant = emotion as EmotionState;
    }
  }

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const confidence = totalWeight > 0 ? maxWeight / totalWeight : 0.5;

  return { emotion: dominant, confidence: Math.min(1, confidence) };
}

// ========== EmotionEngine Class ==========

/**
 * Engine that analyzes player behavior to detect emotional state,
 * provide adaptive narrative, and recommend games or interventions.
 */
export class EmotionEngine {
  private profiles: Map<string, IEmotionProfile> = new Map();

  constructor() {}

  // ===== Behavior Analysis =====

  /**
   * Analyze behavioral context and return an emotion signal.
   */
  analyzeBehavior(context: IBehaviorContext): IEmotionSignal {
    const signals = this.generateSignals(context);
    const fused = fuseSignals(signals);

    return {
      source: EmotionSource.PERFORMANCE,
      emotion: fused.emotion,
      confidence: fused.confidence,
      timestamp: Date.now(),
      metadata: {
        userId: context.userId,
        tapFrequency: context.tapFrequency,
        averageScore: context.averageScore,
        completionRate: context.completionRate,
      },
    };
  }

  // ===== Detection Methods =====

  /**
   * Detect emotion from tap patterns.
   */
  detectEmotionFromTaps(tapFrequency: number, tapForce: number): IEmotionSignal {
    let emotion = EmotionState.CALM;
    let confidence = 0.3;

    if (tapFrequency > EMOTION_THRESHOLDS.angry.veryHighTapFrequency &&
        tapForce > EMOTION_THRESHOLDS.angry.veryHighTapForce) {
      emotion = EmotionState.ANGRY;
      confidence = 0.85;
    } else if (tapFrequency > EMOTION_THRESHOLDS.frustrated.highTapFrequency) {
      emotion = EmotionState.FRUSTRATED;
      confidence = 0.7;
    } else if (tapFrequency > EMOTION_THRESHOLDS.excited.highTapFrequency &&
               tapForce < EMOTION_THRESHOLDS.anxious.highTapForce) {
      emotion = EmotionState.EXCITED;
      confidence = 0.6;
    } else if (tapForce > EMOTION_THRESHOLDS.anxious.highTapForce) {
      emotion = EmotionState.ANXIOUS;
      confidence = 0.65;
    } else if (tapFrequency < EMOTION_THRESHOLDS.bored.lowTapFrequency) {
      emotion = EmotionState.BORED;
      confidence = 0.5;
    }

    return {
      source: EmotionSource.TAP,
      emotion,
      confidence,
      timestamp: Date.now(),
      metadata: { tapFrequency, tapForce },
    };
  }

  /**
   * Detect emotion from game performance metrics.
   */
  detectEmotionFromPerformance(
    averageScore: number,
    completionRate: number,
    streak: number,
  ): IEmotionSignal {
    let emotion = EmotionState.CALM;
    let confidence = 0.3;

    if (averageScore < EMOTION_THRESHOLDS.frustrated.lowScore && completionRate < 0.5) {
      emotion = EmotionState.FRUSTRATED;
      confidence = 0.75;
    } else if (averageScore > EMOTION_THRESHOLDS.excited.highScore && streak >= 2) {
      emotion = EmotionState.EXCITED;
      confidence = 0.7;
    } else if (completionRate >= EMOTION_THRESHOLDS.happy.goodCompletionRate &&
               averageScore >= EMOTION_THRESHOLDS.happy.goodScore) {
      emotion = EmotionState.HAPPY;
      confidence = 0.65;
    } else if (streak <= -3) {
      emotion = EmotionState.ANGRY;
      confidence = 0.7;
    } else if (streak >= EMOTION_THRESHOLDS.happy.positiveStreak) {
      emotion = EmotionState.HAPPY;
      confidence = 0.6;
    }

    return {
      source: EmotionSource.PERFORMANCE,
      emotion,
      confidence,
      timestamp: Date.now(),
      metadata: { averageScore, completionRate, streak },
    };
  }

  /**
   * Detect emotion from response timing patterns.
   */
  detectEmotionFromTiming(
    averageResponseTime: number,
    sessionDuration: number,
  ): IEmotionSignal {
    let emotion = EmotionState.CALM;
    let confidence = 0.3;

    if (averageResponseTime > EMOTION_THRESHOLDS.frustrated.highResponseTime) {
      emotion = EmotionState.FRUSTRATED;
      confidence = 0.6;
    } else if (averageResponseTime < EMOTION_THRESHOLDS.excited.lowResponseTime) {
      emotion = EmotionState.EXCITED;
      confidence = 0.55;
    } else if (averageResponseTime > EMOTION_THRESHOLDS.anxious.highResponseTime) {
      emotion = EmotionState.ANXIOUS;
      confidence = 0.5;
    } else if (sessionDuration > EMOTION_THRESHOLDS.nostalgic.longSession) {
      emotion = EmotionState.NOSTALGIC;
      confidence = 0.4;
    } else if (sessionDuration > EMOTION_THRESHOLDS.bored.longSession) {
      emotion = EmotionState.BORED;
      confidence = 0.45;
    }

    return {
      source: EmotionSource.TIMING,
      emotion,
      confidence,
      timestamp: Date.now(),
      metadata: { averageResponseTime, sessionDuration },
    };
  }

  /**
   * Detect emotion from game choice patterns.
   */
  detectEmotionFromChoice(
    preferredGameTypes: GameType[],
    gamesPlayedThisSession: number,
    quitCount: number,
    retryCount: number,
  ): IEmotionSignal {
    let emotion = EmotionState.CALM;
    let confidence = 0.3;

    if (quitCount >= EMOTION_THRESHOLDS.angry.highQuitCount) {
      emotion = EmotionState.ANGRY;
      confidence = 0.7;
    } else if (retryCount >= EMOTION_THRESHOLDS.frustrated.highRetryCount) {
      emotion = EmotionState.FRUSTRATED;
      confidence = 0.6;
    } else if (preferredGameTypes.includes(GameType.HEALING)) {
      emotion = EmotionState.CALM;
      confidence = 0.5;
    } else if (preferredGameTypes.includes(GameType.REACTION) &&
               gamesPlayedThisSession > EMOTION_THRESHOLDS.bored.highGamesPlayed) {
      emotion = EmotionState.BORED;
      confidence = 0.45;
    }

    return {
      source: EmotionSource.CHOICE,
      emotion,
      confidence,
      timestamp: Date.now(),
      metadata: { preferredGameTypes, gamesPlayedThisSession, quitCount, retryCount },
    };
  }

  // ===== Profile Management =====

  /**
   * Update the emotion profile for a user with a new signal.
   */
  updateProfile(userId: string, signal: IEmotionSignal): IEmotionProfile {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        dominantEmotion: EmotionState.CALM,
        emotionHistory: [],
        emotionWeights: {},
        lastUpdated: Date.now(),
      };
    }

    profile.emotionHistory.push(signal);
    // Keep last 100 signals
    if (profile.emotionHistory.length > 100) {
      profile.emotionHistory = profile.emotionHistory.slice(-100);
    }

    // Update weights with decay
    const decayFactor = 0.95;
    for (const key of Object.keys(profile.emotionWeights)) {
      profile.emotionWeights[key] *= decayFactor;
    }

    const emotionKey = signal.emotion as string;
    profile.emotionWeights[emotionKey] = (profile.emotionWeights[emotionKey] ?? 0) + signal.confidence;

    // Recompute dominant emotion
    let maxWeight = 0;
    let dominant = EmotionState.CALM;
    for (const [emotion, weight] of Object.entries(profile.emotionWeights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = emotion as EmotionState;
      }
    }
    profile.dominantEmotion = dominant;
    profile.lastUpdated = Date.now();

    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Get the emotion profile for a user.
   */
  getProfile(userId: string): IEmotionProfile | null {
    return this.profiles.get(userId) ?? null;
  }

  // ===== Adaptive Narrative =====

  /**
   * Get an adaptive narrative suggestion based on the user's current emotion.
   */
  getAdaptiveNarrative(userId: string): IAdaptiveNarrative {
    const profile = this.profiles.get(userId);

    if (!profile) {
      return {
        text: 'Welcome! Let\'s play a game.',
        tone: 'neutral',
        suggestedGameType: null,
        suggestedDifficulty: null,
        urgency: 0,
      };
    }

    return this.narrativeForEmotion(profile.dominantEmotion);
  }

  /**
   * Generate a narrative for a specific emotion.
   */
  private narrativeForEmotion(emotion: EmotionState): IAdaptiveNarrative {
    switch (emotion) {
      case EmotionState.FRUSTRATED:
        return {
          text: 'Take a breath! How about something relaxing?',
          tone: 'calming',
          suggestedGameType: GameType.HEALING,
          suggestedDifficulty: 1,
          urgency: 0.7,
        };
      case EmotionState.ANGRY:
        return {
          text: 'Let\'s try a calming game to unwind.',
          tone: 'calming',
          suggestedGameType: GameType.HEALING,
          suggestedDifficulty: 1,
          urgency: 0.9,
        };
      case EmotionState.BORED:
        return {
          text: 'Ready for a new challenge?',
          tone: 'challenging',
          suggestedGameType: GameType.PUZZLE,
          suggestedDifficulty: 3,
          urgency: 0.4,
        };
      case EmotionState.EXCITED:
        return {
          text: 'Great energy! Let\'s keep it going!',
          tone: 'celebratory',
          suggestedGameType: GameType.REACTION,
          suggestedDifficulty: 2,
          urgency: 0.2,
        };
      case EmotionState.HAPPY:
        return {
          text: 'Awesome! You\'re doing great!',
          tone: 'celebratory',
          suggestedGameType: null,
          suggestedDifficulty: null,
          urgency: 0.1,
        };
      case EmotionState.ANXIOUS:
        return {
          text: 'Relax and enjoy at your own pace.',
          tone: 'calming',
          suggestedGameType: GameType.HEALING,
          suggestedDifficulty: 1,
          urgency: 0.6,
        };
      case EmotionState.NOSTALGIC:
        return {
          text: 'Welcome back! Great to see you again.',
          tone: 'encouraging',
          suggestedGameType: null,
          suggestedDifficulty: null,
          urgency: 0.2,
        };
      case EmotionState.CALM:
      default:
        return {
          text: 'Enjoy your game!',
          tone: 'neutral',
          suggestedGameType: null,
          suggestedDifficulty: null,
          urgency: 0,
        };
    }
  }

  // ===== Recommendations =====

  /**
   * Recommend a game type and difficulty based on emotion.
   */
  recommendForEmotion(emotion: EmotionState): IEmotionRecommendation {
    switch (emotion) {
      case EmotionState.FRUSTRATED:
        return { gameType: GameType.HEALING, difficulty: 1, reason: 'Reduce stress with calming gameplay', confidence: 0.8 };
      case EmotionState.ANGRY:
        return { gameType: GameType.HEALING, difficulty: 1, reason: 'Cool down with relaxing activities', confidence: 0.85 };
      case EmotionState.BORED:
        return { gameType: GameType.PUZZLE, difficulty: 3, reason: 'Challenge with harder puzzles', confidence: 0.7 };
      case EmotionState.EXCITED:
        return { gameType: GameType.REACTION, difficulty: 3, reason: 'Channel energy into fast-paced games', confidence: 0.65 };
      case EmotionState.HAPPY:
        return { gameType: GameType.SOCIAL, difficulty: 2, reason: 'Share the joy with social games', confidence: 0.6 };
      case EmotionState.ANXIOUS:
        return { gameType: GameType.HEALING, difficulty: 1, reason: 'Soothe anxiety with gentle gameplay', confidence: 0.75 };
      case EmotionState.NOSTALGIC:
        return { gameType: GameType.SENSES, difficulty: 2, reason: 'Classic games for a nostalgic mood', confidence: 0.55 };
      case EmotionState.CALM:
      default:
        return { gameType: GameType.PUZZLE, difficulty: 2, reason: 'Balanced gameplay for calm state', confidence: 0.5 };
    }
  }

  // ===== Intervention =====

  /**
   * Determine whether an intervention is needed based on the user's emotion profile.
   */
  shouldIntervene(userId: string): { needed: boolean; reason: string; urgency: number } {
    const profile = this.profiles.get(userId);
    if (!profile) {
      return { needed: false, reason: 'No profile data', urgency: 0 };
    }

    const recentSignals = profile.emotionHistory.slice(-5);
    if (recentSignals.length < 2) {
      return { needed: false, reason: 'Insufficient data', urgency: 0 };
    }

    // Check for sustained negative emotions
    const negativeEmotions = new Set([
      EmotionState.FRUSTRATED as string,
      EmotionState.ANGRY as string,
      EmotionState.ANXIOUS as string,
    ]);

    const negativeCount = recentSignals.filter(s => negativeEmotions.has(s.emotion as string)).length;
    const negativeRatio = negativeCount / recentSignals.length;

    if (negativeRatio >= 0.8) {
      return {
        needed: true,
        reason: 'Sustained negative emotions detected',
        urgency: 0.9,
      };
    }

    if (negativeRatio >= 0.6) {
      return {
        needed: true,
        reason: 'Increasing frustration or anxiety',
        urgency: 0.6,
      };
    }

    // Check for boredom
    const boredCount = recentSignals.filter(s => s.emotion === EmotionState.BORED).length;
    if (boredCount >= 3) {
      return {
        needed: true,
        reason: 'Player appears bored',
        urgency: 0.4,
      };
    }

    return { needed: false, reason: 'Player is in a healthy state', urgency: 0 };
  }

  // ===== Signal Fusion =====

  /**
   * Fuse multiple signals to produce a composite emotion reading.
   */
  fuseSignals(signals: IEmotionSignal[]): { emotion: EmotionState; confidence: number } {
    return fuseSignals(signals);
  }

  // ===== Private Helpers =====

  private generateSignals(context: IBehaviorContext): IEmotionSignal[] {
    const signals: IEmotionSignal[] = [];

    signals.push(this.detectEmotionFromTaps(context.tapFrequency, context.tapForce));
    signals.push(this.detectEmotionFromPerformance(
      context.averageScore, context.completionRate, context.streak,
    ));
    signals.push(this.detectEmotionFromTiming(
      context.averageResponseTime, context.sessionDuration,
    ));
    signals.push(this.detectEmotionFromChoice(
      context.preferredGameTypes,
      context.gamesPlayedThisSession,
      context.quitCount,
      context.retryCount,
    ));

    return signals;
  }
}
