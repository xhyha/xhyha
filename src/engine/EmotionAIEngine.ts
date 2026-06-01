/**
 * Genesis AI Micro-Game Engine - Emotion Detection & Adaptive Narrative Engine
 *
 * Reads user behavior signals to determine emotional state and adapt
 * game content through narrative nodes, difficulty adjustments, and
 * personalized recommendations.
 */

// ========== Enums ==========

/** Emotion signal source */
export enum EmotionSource {
  TAP_PATTERN = 'TAP_PATTERN',
  GAME_PERFORMANCE = 'GAME_PERFORMANCE',
  SESSION_TIMING = 'SESSION_TIMING',
  GAME_CHOICE = 'GAME_CHOICE',
  ABANDONMENT = 'ABANDONMENT',
}

// ========== Interfaces ==========

/** Detected emotion (extends existing EmotionState) */
export interface IEmotionReading {
  userId: string;
  primaryEmotion: string;
  secondaryEmotion: string | null;
  intensity: number; // 0-1
  confidence: number; // 0-1
  sources: EmotionSource[];
  timestamp: number;
}

/** Behavior snapshot for emotion analysis */
export interface IBehaviorSnapshot {
  userId: string;
  tapFrequency: number; // taps per minute
  avgTapInterval: number; // ms between taps
  accuracy: number; // 0-1 hit rate
  scoreTrend: number[]; // last 5 scores
  gamesAbandoned: number; // games left in last hour
  gamesCompleted: number;
  currentStreak: number; // positive = win streak, negative = loss streak
  sessionDuration: number; // minutes
  timeOfDay: number; // hour 0-23
  gameChoices: string[]; // last 5 game names chosen
  hesitationTime: number; // avg ms before acting
}

/** Adaptive narrative node */
export interface INarrativeNode {
  id: string;
  emotion: string;
  intensityRange: [number, number];
  message: string;
  gameRecommendation: string | null;
  difficultyAdjustment: number; // -2 to +2
  toneAdaptation: 'encouraging' | 'neutral' | 'challenging' | 'comforting';
  visualTheme: 'warm' | 'cool' | 'dark' | 'bright' | 'nature';
}

/** Emotion history entry */
export interface IEmotionHistoryEntry {
  timestamp: number;
  emotion: string;
  intensity: number;
  trigger: string;
}

/** Emotion profile summary */
export interface IEmotionProfile {
  userId: string;
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;
  averageIntensity: number;
  volatility: number; // 0-1
  resilience: number; // 0-1
  preferredTone: string;
  lastReading: IEmotionReading | null;
  history: IEmotionHistoryEntry[];
}

/** Signal fusion input */
interface ISignalInput {
  emotion: string;
  intensity: number;
  weight: number;
}

/**
 * EmotionEngine - Detects emotional state from behavior and adapts
 * game narratives, difficulty, and recommendations accordingly.
 */
export class EmotionEngine {
  private narratives: Map<string, INarrativeNode> = new Map();
  private emotionProfiles: Map<string, IEmotionProfile> = new Map();
  private readingHistory: Map<string, IEmotionHistoryEntry[]> = new Map();

  constructor() {
    this.registerDefaultNarratives();
  }

  // ========== Emotion Detection ==========

  /**
   * Analyze a full behavior snapshot and produce an emotion reading.
   * Fuses signals from taps, performance, timing, choices, and abandonment.
   */
  analyzeBehavior(snapshot: IBehaviorSnapshot): IEmotionReading {
    const tapSignal = this.detectEmotionFromTaps(
      snapshot.tapFrequency,
      snapshot.avgTapInterval,
      snapshot.hesitationTime,
    );
    const perfSignal = this.detectEmotionFromPerformance(
      snapshot.scoreTrend,
      snapshot.accuracy,
      snapshot.currentStreak,
    );
    const timingSignal = this.detectEmotionFromTiming(
      snapshot.timeOfDay,
      snapshot.sessionDuration,
    );
    const choiceSignal = this.detectEmotionFromChoice(snapshot.gameChoices);

    // Abandonment signal
    const abandonSignal = this.detectEmotionFromAbandonment(
      snapshot.gamesAbandoned,
      snapshot.gamesCompleted,
    );

    // Fuse all signals with weighted priorities
    const fused = this.fuseSignals([
      { emotion: tapSignal.emotion, intensity: tapSignal.intensity, weight: 0.25 },
      { emotion: perfSignal.emotion, intensity: perfSignal.intensity, weight: 0.30 },
      { emotion: timingSignal.emotion, intensity: timingSignal.intensity, weight: 0.10 },
      { emotion: choiceSignal.emotion, intensity: choiceSignal.intensity, weight: 0.15 },
      { emotion: abandonSignal.emotion, intensity: abandonSignal.intensity, weight: 0.20 },
    ]);

    // Determine secondary emotion from the strongest divergent signal
    const signals = [tapSignal, perfSignal, timingSignal, choiceSignal, abandonSignal];
    const secondary = this.pickSecondaryEmotion(fused.emotion, signals);

    // Confidence based on agreement among signals
    const agreementCount = signals.filter(s => s.emotion === fused.emotion).length;
    const confidence = Math.min(1.0, 0.3 + (agreementCount / signals.length) * 0.7);

    const sources: EmotionSource[] = [];
    if (tapSignal.intensity > 0.3) sources.push(EmotionSource.TAP_PATTERN);
    if (perfSignal.intensity > 0.3) sources.push(EmotionSource.GAME_PERFORMANCE);
    if (timingSignal.intensity > 0.3) sources.push(EmotionSource.SESSION_TIMING);
    if (choiceSignal.intensity > 0.3) sources.push(EmotionSource.GAME_CHOICE);
    if (abandonSignal.intensity > 0.3) sources.push(EmotionSource.ABANDONMENT);

    return {
      userId: snapshot.userId,
      primaryEmotion: fused.emotion,
      secondaryEmotion: secondary,
      intensity: fused.intensity,
      confidence,
      sources: sources.length > 0 ? sources : [EmotionSource.GAME_PERFORMANCE],
      timestamp: Date.now(),
    };
  }

  /**
   * Detect emotion from tap patterns.
   * Fast, rhythmic taps → excited/happy.
   * Slow, erratic taps → anxious/frustrated.
   * Very slow taps → bored/calm.
   */
  detectEmotionFromTaps(
    tapFrequency: number,
    avgInterval: number,
    hesitation: number,
  ): { emotion: string; intensity: number } {
    // High frequency + low interval + low hesitation = excited
    if (tapFrequency > 60 && avgInterval < 800 && hesitation < 300) {
      return { emotion: 'EXCITED', intensity: Math.min(1.0, tapFrequency / 80) };
    }

    // Moderate frequency + steady = happy
    if (tapFrequency > 30 && tapFrequency <= 60 && hesitation < 500) {
      return { emotion: 'HAPPY', intensity: Math.min(0.8, tapFrequency / 60) };
    }

    // Erratic intervals + high hesitation = anxious
    if (avgInterval > 2000 && hesitation > 1500) {
      return { emotion: 'ANXIOUS', intensity: Math.min(1.0, hesitation / 3000) };
    }

    // Very fast but with high hesitation = frustrated
    if (tapFrequency > 40 && hesitation > 1000) {
      return { emotion: 'FRUSTRATED', intensity: Math.min(1.0, hesitation / 2000) };
    }

    // Slow taps + high hesitation = bored
    if (tapFrequency < 15 && hesitation > 800) {
      return { emotion: 'BORED', intensity: Math.min(0.9, (1000 - tapFrequency) / 1000) };
    }

    // Default: calm
    return { emotion: 'CALM', intensity: 0.4 };
  }

  /**
   * Detect emotion from game performance.
   * Rising scores → happy/excited.
   * Falling scores → frustrated/angry.
   * Low accuracy → frustrated/anxious.
   */
  detectEmotionFromPerformance(
    scoreTrend: number[],
    accuracy: number,
    streak: number,
  ): { emotion: string; intensity: number } {
    if (scoreTrend.length === 0) {
      return { emotion: 'CALM', intensity: 0.3 };
    }

    // Calculate trend direction
    let trendSum = 0;
    for (let i = 1; i < scoreTrend.length; i++) {
      trendSum += scoreTrend[i] - scoreTrend[i - 1];
    }
    const avgTrend = scoreTrend.length > 1 ? trendSum / (scoreTrend.length - 1) : 0;
    const latestScore = scoreTrend[scoreTrend.length - 1];

    // Strong win streak + rising scores = excited
    if (streak >= 3 && avgTrend > 0) {
      return { emotion: 'EXCITED', intensity: Math.min(1.0, streak * 0.2) };
    }

    // Rising scores + good accuracy = happy
    if (avgTrend > 0 && accuracy > 0.7) {
      const intensity = Math.min(0.9, accuracy);
      return { emotion: 'HAPPY', intensity };
    }

    // Strong loss streak + low accuracy = angry
    if (streak <= -3 && accuracy < 0.4) {
      return { emotion: 'ANGRY', intensity: Math.min(1.0, Math.abs(streak) * 0.2) };
    }

    // Falling scores = frustrated
    if (avgTrend < -10) {
      return { emotion: 'FRUSTRATED', intensity: Math.min(1.0, Math.abs(avgTrend) / 50) };
    }

    // Low accuracy = anxious
    if (accuracy < 0.3) {
      return { emotion: 'ANXIOUS', intensity: Math.min(0.9, 1.0 - accuracy) };
    }

    // Flat scores + medium accuracy = bored
    if (Math.abs(avgTrend) < 5 && accuracy > 0.5 && accuracy < 0.75) {
      return { emotion: 'BORED', intensity: 0.5 };
    }

    return { emotion: 'CALM', intensity: 0.4 };
  }

  /**
   * Detect emotion from session timing patterns.
   * Late night → anxious/nostalgic.
   * Long session → tired/bored.
   * Morning → happy/calm.
   */
  detectEmotionFromTiming(
    timeOfDay: number,
    sessionDuration: number,
  ): { emotion: string; intensity: number } {
    // Late night (after midnight to 4am) → anxious
    if (timeOfDay >= 0 && timeOfDay < 4) {
      return { emotion: 'ANXIOUS', intensity: Math.min(0.8, sessionDuration / 120) };
    }

    // Early morning (5-8) → calm
    if (timeOfDay >= 5 && timeOfDay < 8) {
      return { emotion: 'CALM', intensity: 0.3 };
    }

    // Morning (8-12) → happy
    if (timeOfDay >= 8 && timeOfDay < 12) {
      return { emotion: 'HAPPY', intensity: 0.5 };
    }

    // Afternoon (12-17) → neutral/calm
    if (timeOfDay >= 12 && timeOfDay < 17) {
      return { emotion: 'CALM', intensity: 0.35 };
    }

    // Evening (17-21) → relaxed/happy
    if (timeOfDay >= 17 && timeOfDay < 21) {
      return { emotion: 'HAPPY', intensity: 0.4 };
    }

    // Night (21-24) → calm/nostalgic
    if (timeOfDay >= 21) {
      return { emotion: 'CALM', intensity: Math.min(0.6, 0.3 + sessionDuration / 180) };
    }

    return { emotion: 'CALM', intensity: 0.3 };
  }

  /**
   * Detect emotion from game choice patterns.
   * Repetitive choices → comfort/calm.
   * Varied choices → excited/exploring.
   * Only easy games → anxious.
   */
  detectEmotionFromChoice(
    gameChoices: string[],
  ): { emotion: string; intensity: number } {
    if (gameChoices.length === 0) {
      return { emotion: 'CALM', intensity: 0.2 };
    }

    const uniqueChoices = new Set(gameChoices).size;
    const varietyRatio = uniqueChoices / gameChoices.length;

    // All same game → seeking comfort (calm or anxious)
    if (uniqueChoices === 1 && gameChoices.length >= 3) {
      return { emotion: 'CALM', intensity: 0.6 };
    }

    // High variety → excited / exploring
    if (varietyRatio >= 0.8) {
      return { emotion: 'EXCITED', intensity: Math.min(0.8, varietyRatio) };
    }

    // Moderate variety → happy
    if (varietyRatio >= 0.5) {
      return { emotion: 'HAPPY', intensity: 0.5 };
    }

    // Low variety but not all same → bored
    return { emotion: 'BORED', intensity: Math.min(0.7, 1.0 - varietyRatio) };
  }

  // ========== Narrative Adaptation ==========

  /**
   * Get the best matching narrative node for an emotion reading.
   */
  getAdaptiveNarrative(emotion: IEmotionReading): INarrativeNode {
    // Try exact emotion match first
    const exactMatch = this.findNarrativeMatch(emotion.primaryEmotion, emotion.intensity);
    if (exactMatch) {
      return exactMatch;
    }

    // Try secondary emotion
    if (emotion.secondaryEmotion) {
      const secondaryMatch = this.findNarrativeMatch(emotion.secondaryEmotion, emotion.intensity);
      if (secondaryMatch) {
        return secondaryMatch;
      }
    }

    // Fallback: return a generic neutral narrative
    return this.getFallbackNarrative();
  }

  /**
   * Register a narrative node.
   */
  registerNarrative(node: INarrativeNode): void {
    this.narratives.set(node.id, node);
  }

  // ========== Profile Management ==========

  /**
   * Get the emotion profile for a user, creating a default if needed.
   */
  getEmotionProfile(userId: string): IEmotionProfile {
    const existing = this.emotionProfiles.get(userId);
    if (existing) {
      return existing;
    }

    const profile: IEmotionProfile = {
      userId,
      dominantEmotion: 'CALM',
      emotionDistribution: { CALM: 1.0 },
      averageIntensity: 0.3,
      volatility: 0.2,
      resilience: 0.5,
      preferredTone: 'neutral',
      lastReading: null,
      history: [],
    };
    this.emotionProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Update a user's emotion profile with a new reading.
   */
  updateProfile(userId: string, reading: IEmotionReading): IEmotionProfile {
    const profile = this.getEmotionProfile(userId);
    const now = Date.now();

    // Add history entry
    const entry: IEmotionHistoryEntry = {
      timestamp: now,
      emotion: reading.primaryEmotion,
      intensity: reading.intensity,
      trigger: reading.sources.join(','),
    };

    const history = [...profile.history, entry];
    // Keep last 100 entries
    const trimmedHistory = history.length > 100 ? history.slice(-100) : history;

    // Update emotion distribution
    const distribution = { ...profile.emotionDistribution };
    distribution[reading.primaryEmotion] = (distribution[reading.primaryEmotion] ?? 0) + 1;
    // Normalize
    const total = Object.values(distribution).reduce((s, v) => s + v, 0);
    for (const key of Object.keys(distribution)) {
      distribution[key] = distribution[key] / total;
    }

    // Find dominant emotion
    let dominantEmotion = profile.dominantEmotion;
    let maxPct = 0;
    for (const [emo, pct] of Object.entries(distribution)) {
      if (pct > maxPct) {
        maxPct = pct;
        dominantEmotion = emo;
      }
    }

    // Calculate average intensity
    const allIntensities = trimmedHistory.map(h => h.intensity);
    const averageIntensity = allIntensities.length > 0
      ? allIntensities.reduce((s, v) => s + v, 0) / allIntensities.length
      : 0.3;

    // Calculate volatility (rate of emotion change)
    let volatility = profile.volatility;
    if (trimmedHistory.length >= 2) {
      let changes = 0;
      for (let i = 1; i < trimmedHistory.length; i++) {
        if (trimmedHistory[i].emotion !== trimmedHistory[i - 1].emotion) {
          changes++;
        }
      }
      volatility = changes / (trimmedHistory.length - 1);
    }

    // Calculate resilience (recovery from negative emotions)
    let resilience = profile.resilience;
    const negativeEmotions = ['FRUSTRATED', 'ANGRY', 'ANXIOUS', 'SAD'];
    const negativeEntries = trimmedHistory.filter(h => negativeEmotions.includes(h.emotion));
    if (negativeEntries.length >= 2) {
      let recoveries = 0;
      for (let i = 1; i < trimmedHistory.length; i++) {
        if (negativeEmotions.includes(trimmedHistory[i - 1].emotion)
          && !negativeEmotions.includes(trimmedHistory[i].emotion)) {
          recoveries++;
        }
      }
      resilience = Math.min(1.0, recoveries / negativeEntries.length);
    }

    // Determine preferred tone from reading
    const toneMap: Record<string, string> = {
      HAPPY: 'encouraging',
      EXCITED: 'challenging',
      FRUSTRATED: 'comforting',
      ANGRY: 'comforting',
      ANXIOUS: 'comforting',
      BORED: 'challenging',
      CALM: 'neutral',
    };
    const preferredTone = toneMap[dominantEmotion] ?? 'neutral';

    // Store history separately for memory management
    this.readingHistory.set(userId, trimmedHistory);

    const updated: IEmotionProfile = {
      userId,
      dominantEmotion,
      emotionDistribution: distribution,
      averageIntensity,
      volatility,
      resilience,
      preferredTone,
      lastReading: reading,
      history: trimmedHistory,
    };
    this.emotionProfiles.set(userId, updated);
    return updated;
  }

  /**
   * Get emotion history for a user, optionally filtered by timestamp.
   */
  getEmotionHistory(userId: string, since?: number): IEmotionHistoryEntry[] {
    const history = this.readingHistory.get(userId) ?? [];
    if (since !== undefined) {
      return history.filter(e => e.timestamp >= since);
    }
    return history;
  }

  // ========== Adaptive Recommendations ==========

  /**
   * Recommend a game type, reason, and difficulty based on emotional state.
   */
  recommendForEmotion(
    emotion: string,
    intensity: number,
  ): { gameName: string; reason: string; difficulty: number } {
    const recommendations: Record<string, {
      gameName: string;
      reason: string;
      difficulty: number;
    }> = {
      HAPPY: {
        gameName: 'reaction_challenge',
        reason: 'You\'re in a great mood — time for a fun challenge!',
        difficulty: 2,
      },
      EXCITED: {
        gameName: 'competitive_sprint',
        reason: 'Ride the energy with something competitive!',
        difficulty: 3,
      },
      FRUSTRATED: {
        gameName: 'zen_garden',
        reason: 'Take a breather with something calming.',
        difficulty: 1,
      },
      ANGRY: {
        gameName: 'bubble_pop',
        reason: 'Let it out with a satisfying, low-pressure game.',
        difficulty: 1,
      },
      ANXIOUS: {
        gameName: 'breathing_bloom',
        reason: 'A gentle game to help you relax.',
        difficulty: 1,
      },
      BORED: {
        gameName: 'speed_puzzle',
        reason: 'Let\'s spice things up!',
        difficulty: 3,
      },
      CALM: {
        gameName: 'strategy_grid',
        reason: 'A thoughtful game for a relaxed mind.',
        difficulty: 2,
      },
      SAD: {
        gameName: 'comfort_catch',
        reason: 'Something gentle to lift your spirits.',
        difficulty: 1,
      },
      NOSTALGIC: {
        gameName: 'memory_lane',
        reason: 'Enjoy a warm, familiar experience.',
        difficulty: 2,
      },
    };

    const rec = recommendations[emotion] ?? recommendations['CALM'];

    // Adjust difficulty based on intensity
    let adjustedDifficulty = rec.difficulty;
    if (intensity > 0.7) {
      adjustedDifficulty = Math.max(1, rec.difficulty - 1); // easier for high intensity negative
      if (emotion === 'HAPPY' || emotion === 'EXCITED') {
        adjustedDifficulty = Math.min(4, rec.difficulty + 1); // harder for high intensity positive
      }
    }

    return {
      gameName: rec.gameName,
      reason: rec.reason,
      difficulty: adjustedDifficulty,
    };
  }

  /**
   * Determine if an emotional intervention is needed.
   */
  shouldIntervene(
    profile: IEmotionProfile,
  ): { needed: boolean; type: string; message: string } {
    const negativeEmotions = ['FRUSTRATED', 'ANGRY', 'ANXIOUS', 'SAD'];
    const last = profile.lastReading;

    // No reading yet
    if (!last) {
      return { needed: false, type: 'none', message: '' };
    }

    // High intensity negative emotion
    if (negativeEmotions.includes(last.primaryEmotion) && last.intensity > 0.7) {
      if (last.primaryEmotion === 'FRUSTRATED') {
        return {
          needed: true,
          type: 'comfort',
          message: 'It looks like things are getting tough. Want to try a relaxing game?',
        };
      }
      if (last.primaryEmotion === 'ANXIOUS') {
        return {
          needed: true,
          type: 'calming',
          message: 'Take a deep breath. A calming game might help right now.',
        };
      }
      if (last.primaryEmotion === 'ANGRY') {
        return {
          needed: true,
          type: 'redirect',
          message: 'Let\'s channel that energy into something satisfying.',
        };
      }
      if (last.primaryEmotion === 'SAD') {
        return {
          needed: true,
          type: 'comfort',
          message: 'Here\'s something gentle that might brighten your day.',
        };
      }
    }

    // High volatility — user's emotions are swinging a lot
    if (profile.volatility > 0.7) {
      return {
        needed: true,
        type: 'stabilize',
        message: 'Let\'s find a steady rhythm with something consistent.',
      };
    }

    // Extended boredom
    if (profile.dominantEmotion === 'BORED' && profile.averageIntensity > 0.5) {
      return {
        needed: true,
        type: 'engage',
        message: 'Time to try something new and exciting!',
      };
    }

    // Low resilience + negative reading
    if (negativeEmotions.includes(last.primaryEmotion) && profile.resilience < 0.3) {
      return {
        needed: true,
        type: 'support',
        message: 'You\'re doing great! How about a quick win to boost your confidence?',
      };
    }

    return { needed: false, type: 'none', message: '' };
  }

  // ========== Utility ==========

  /**
   * Fuse multiple emotion signals into a single reading.
   * Uses weighted voting across emotions.
   */
  fuseSignals(
    signals: Array<{ emotion: string; intensity: number; weight: number }>,
  ): { emotion: string; intensity: number } {
    if (signals.length === 0) {
      return { emotion: 'CALM', intensity: 0.3 };
    }

    // Aggregate weighted intensity per emotion
    const emotionScores: Record<string, number> = {};
    const emotionWeights: Record<string, number> = {};

    for (const signal of signals) {
      const score = signal.intensity * signal.weight;
      emotionScores[signal.emotion] = (emotionScores[signal.emotion] ?? 0) + score;
      emotionWeights[signal.emotion] = (emotionWeights[signal.emotion] ?? 0) + signal.weight;
    }

    // Find the emotion with the highest weighted score
    let bestEmotion = 'CALM';
    let bestScore = 0;

    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestEmotion = emotion;
      }
    }

    // Weighted average intensity for the winning emotion
    const totalWeight = emotionWeights[bestEmotion] ?? 1;
    const fusedIntensity = Math.min(1.0, bestScore / totalWeight);

    return {
      emotion: bestEmotion,
      intensity: Math.round(fusedIntensity * 100) / 100,
    };
  }

  // ========== Private Methods ==========

  /**
   * Detect emotion from abandonment patterns.
   */
  private detectEmotionFromAbandonment(
    gamesAbandoned: number,
    gamesCompleted: number,
  ): { emotion: string; intensity: number } {
    const total = gamesAbandoned + gamesCompleted;
    if (total === 0) {
      return { emotion: 'CALM', intensity: 0.2 };
    }

    const abandonRate = gamesAbandoned / total;

    // High abandonment → frustrated
    if (abandonRate > 0.6) {
      return { emotion: 'FRUSTRATED', intensity: Math.min(1.0, abandonRate) };
    }

    // Moderate abandonment → bored
    if (abandonRate > 0.3) {
      return { emotion: 'BORED', intensity: Math.min(0.8, abandonRate) };
    }

    // Low abandonment → happy/engaged
    return { emotion: 'HAPPY', intensity: Math.min(0.7, 1.0 - abandonRate) };
  }

  /**
   * Pick a secondary emotion — the strongest signal that differs from primary.
   */
  private pickSecondaryEmotion(
    primary: string,
    signals: Array<{ emotion: string; intensity: number }>,
  ): string | null {
    const filtered = signals.filter(s => s.emotion !== primary);
    if (filtered.length === 0) return null;

    filtered.sort((a, b) => b.intensity - a.intensity);
    return filtered[0].intensity > 0.2 ? filtered[0].emotion : null;
  }

  /**
   * Find a narrative node matching emotion and intensity range.
   */
  private findNarrativeMatch(emotion: string, intensity: number): INarrativeNode | null {
    for (const node of this.narratives.values()) {
      if (node.emotion === emotion
        && intensity >= node.intensityRange[0]
        && intensity <= node.intensityRange[1]) {
        return node;
      }
    }

    // Try any intensity for this emotion
    for (const node of this.narratives.values()) {
      if (node.emotion === emotion) {
        return node;
      }
    }

    return null;
  }

  /**
   * Return a fallback neutral narrative.
   */
  private getFallbackNarrative(): INarrativeNode {
    return {
      id: 'fallback_neutral',
      emotion: 'CALM',
      intensityRange: [0, 1],
      message: 'Enjoy your game!',
      gameRecommendation: null,
      difficultyAdjustment: 0,
      toneAdaptation: 'neutral',
      visualTheme: 'bright',
    };
  }

  /**
   * Register the default set of narrative nodes.
   */
  private registerDefaultNarratives(): void {
    const defaults: INarrativeNode[] = [
      {
        id: 'happy_high',
        emotion: 'HAPPY',
        intensityRange: [0.6, 1.0],
        message: 'You\'re on fire! Ready for something tougher?',
        gameRecommendation: 'challenge_mode',
        difficultyAdjustment: 2,
        toneAdaptation: 'encouraging',
        visualTheme: 'bright',
      },
      {
        id: 'happy_low',
        emotion: 'HAPPY',
        intensityRange: [0.0, 0.6],
        message: 'Great vibes! Keep the momentum going.',
        gameRecommendation: null,
        difficultyAdjustment: 1,
        toneAdaptation: 'encouraging',
        visualTheme: 'warm',
      },
      {
        id: 'frustrated_high',
        emotion: 'FRUSTRATED',
        intensityRange: [0.6, 1.0],
        message: 'Take it easy — here\'s something calming.',
        gameRecommendation: 'healing_garden',
        difficultyAdjustment: -2,
        toneAdaptation: 'comforting',
        visualTheme: 'nature',
      },
      {
        id: 'frustrated_low',
        emotion: 'FRUSTRATED',
        intensityRange: [0.0, 0.6],
        message: 'Almost got it! Try a slightly easier round.',
        gameRecommendation: null,
        difficultyAdjustment: -1,
        toneAdaptation: 'comforting',
        visualTheme: 'cool',
      },
      {
        id: 'bored_any',
        emotion: 'BORED',
        intensityRange: [0.0, 1.0],
        message: 'Let\'s shake things up!',
        gameRecommendation: 'surprise_me',
        difficultyAdjustment: 1,
        toneAdaptation: 'challenging',
        visualTheme: 'bright',
      },
      {
        id: 'anxious_high',
        emotion: 'ANXIOUS',
        intensityRange: [0.6, 1.0],
        message: 'Breathe in, breathe out. This one\'s gentle.',
        gameRecommendation: 'breathing_bloom',
        difficultyAdjustment: -2,
        toneAdaptation: 'comforting',
        visualTheme: 'nature',
      },
      {
        id: 'anxious_low',
        emotion: 'ANXIOUS',
        intensityRange: [0.0, 0.6],
        message: 'No pressure — just enjoy.',
        gameRecommendation: 'zen_garden',
        difficultyAdjustment: -1,
        toneAdaptation: 'comforting',
        visualTheme: 'cool',
      },
      {
        id: 'excited_high',
        emotion: 'EXCITED',
        intensityRange: [0.6, 1.0],
        message: 'Channel that energy — bring it on!',
        gameRecommendation: 'competitive_sprint',
        difficultyAdjustment: 2,
        toneAdaptation: 'challenging',
        visualTheme: 'warm',
      },
      {
        id: 'excited_low',
        emotion: 'EXCITED',
        intensityRange: [0.0, 0.6],
        message: 'Feeling good? Let\'s level up!',
        gameRecommendation: null,
        difficultyAdjustment: 1,
        toneAdaptation: 'encouraging',
        visualTheme: 'bright',
      },
      {
        id: 'calm_medium',
        emotion: 'CALM',
        intensityRange: [0.3, 0.7],
        message: 'A perfect time for some strategic thinking.',
        gameRecommendation: 'strategy_grid',
        difficultyAdjustment: 0,
        toneAdaptation: 'neutral',
        visualTheme: 'cool',
      },
      {
        id: 'calm_low',
        emotion: 'CALM',
        intensityRange: [0.0, 0.3],
        message: 'Relaxed and ready. Pick your game!',
        gameRecommendation: null,
        difficultyAdjustment: 0,
        toneAdaptation: 'neutral',
        visualTheme: 'bright',
      },
      {
        id: 'angry_high',
        emotion: 'ANGRY',
        intensityRange: [0.6, 1.0],
        message: 'Let\'s turn that energy into something satisfying.',
        gameRecommendation: 'bubble_pop',
        difficultyAdjustment: -1,
        toneAdaptation: 'comforting',
        visualTheme: 'cool',
      },
      {
        id: 'sad_high',
        emotion: 'SAD',
        intensityRange: [0.5, 1.0],
        message: 'Here\'s something warm and gentle for you.',
        gameRecommendation: 'comfort_catch',
        difficultyAdjustment: -2,
        toneAdaptation: 'comforting',
        visualTheme: 'warm',
      },
      {
        id: 'nostalgic_any',
        emotion: 'NOSTALGIC',
        intensityRange: [0.0, 1.0],
        message: 'Enjoy this familiar feeling.',
        gameRecommendation: 'memory_lane',
        difficultyAdjustment: 0,
        toneAdaptation: 'neutral',
        visualTheme: 'warm',
      },
    ];

    for (const node of defaults) {
      this.registerNarrative(node);
    }
  }
}
