import { EmotionEngine, EmotionSource, IEmotionSignal, IBehaviorContext } from './EmotionEngine';
import { EmotionState, GameType } from '../models/types';

function makeBehaviorContext(overrides: Partial<IBehaviorContext> = {}): IBehaviorContext {
  return {
    userId: 'user1',
    tapFrequency: 1.5,
    tapForce: 0.5,
    recentScores: [50, 60, 70],
    averageScore: 60,
    completionRate: 0.7,
    averageResponseTime: 1500,
    sessionDuration: 120,
    gamesPlayedThisSession: 3,
    preferredGameTypes: [GameType.PUZZLE],
    currentGameType: GameType.PUZZLE,
    retryCount: 0,
    quitCount: 0,
    streak: 0,
    ...overrides,
  };
}

describe('EmotionEngine', () => {
  let engine: EmotionEngine;

  beforeEach(() => {
    engine = new EmotionEngine();
  });

  // ===== analyzeBehavior =====

  describe('analyzeBehavior()', () => {
    it('should return an emotion signal from behavioral context', () => {
      const context = makeBehaviorContext();
      const signal = engine.analyzeBehavior(context);

      expect(signal.source).toBe(EmotionSource.PERFORMANCE);
      expect(signal.emotion).toBeDefined();
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
      expect(signal.timestamp).toBeGreaterThan(0);
    });

    it('should detect frustration from high tap frequency and low scores', () => {
      const context = makeBehaviorContext({
        tapFrequency: 4.0,
        tapForce: 0.7,
        averageScore: 20,
        completionRate: 0.2,
        averageResponseTime: 4000,
        retryCount: 4,
      });
      const signal = engine.analyzeBehavior(context);
      // The fused signal should lean toward negative emotions
      expect([EmotionState.FRUSTRATED, EmotionState.ANGRY, EmotionState.ANXIOUS]).toContain(signal.emotion);
    });
  });

  // ===== detectEmotionFromTaps =====

  describe('detectEmotionFromTaps()', () => {
    it('should detect anger from very high tap frequency and force', () => {
      const signal = engine.detectEmotionFromTaps(6.0, 0.95);
      expect(signal.emotion).toBe(EmotionState.ANGRY);
      expect(signal.confidence).toBeGreaterThan(0.5);
      expect(signal.source).toBe(EmotionSource.TAP);
    });

    it('should detect frustration from high tap frequency', () => {
      const signal = engine.detectEmotionFromTaps(4.0, 0.5);
      expect(signal.emotion).toBe(EmotionState.FRUSTRATED);
      expect(signal.confidence).toBeGreaterThan(0.5);
    });

    it('should detect excitement from high tap frequency and low force', () => {
      const signal = engine.detectEmotionFromTaps(3.0, 0.3);
      expect(signal.emotion).toBe(EmotionState.EXCITED);
      expect(signal.confidence).toBeGreaterThan(0.4);
    });

    it('should detect anxiety from high tap force', () => {
      const signal = engine.detectEmotionFromTaps(1.5, 0.9);
      expect(signal.emotion).toBe(EmotionState.ANXIOUS);
      expect(signal.confidence).toBeGreaterThan(0.5);
    });

    it('should detect boredom from low tap frequency', () => {
      const signal = engine.detectEmotionFromTaps(0.2, 0.3);
      expect(signal.emotion).toBe(EmotionState.BORED);
      expect(signal.confidence).toBeGreaterThan(0.3);
    });

    it('should default to calm for normal tapping', () => {
      const signal = engine.detectEmotionFromTaps(1.5, 0.5);
      expect(signal.emotion).toBe(EmotionState.CALM);
    });
  });

  // ===== detectEmotionFromPerformance =====

  describe('detectEmotionFromPerformance()', () => {
    it('should detect frustration from low scores and completion rate', () => {
      const signal = engine.detectEmotionFromPerformance(0.2, 0.3, -2);
      expect(signal.emotion).toBe(EmotionState.FRUSTRATED);
      expect(signal.source).toBe(EmotionSource.PERFORMANCE);
    });

    it('should detect excitement from high scores with streak', () => {
      const signal = engine.detectEmotionFromPerformance(0.9, 0.8, 3);
      expect(signal.emotion).toBe(EmotionState.EXCITED);
    });

    it('should detect happiness from good completion and scores', () => {
      const signal = engine.detectEmotionFromPerformance(0.7, 0.8, 0);
      expect(signal.emotion).toBe(EmotionState.HAPPY);
    });

    it('should detect anger from long losing streak', () => {
      const signal = engine.detectEmotionFromPerformance(0.3, 0.4, -4);
      expect(signal.emotion).toBe(EmotionState.ANGRY);
    });

    it('should default to calm for moderate performance', () => {
      const signal = engine.detectEmotionFromPerformance(0.5, 0.6, 0);
      expect(signal.emotion).toBe(EmotionState.CALM);
    });
  });

  // ===== detectEmotionFromTiming =====

  describe('detectEmotionFromTiming()', () => {
    it('should detect frustration from slow response time', () => {
      const signal = engine.detectEmotionFromTiming(3500, 60);
      expect(signal.emotion).toBe(EmotionState.FRUSTRATED);
      expect(signal.source).toBe(EmotionSource.TIMING);
    });

    it('should detect excitement from fast response time', () => {
      const signal = engine.detectEmotionFromTiming(500, 60);
      expect(signal.emotion).toBe(EmotionState.EXCITED);
    });

    it('should detect anxiety from moderately slow response', () => {
      const signal = engine.detectEmotionFromTiming(2800, 60);
      expect(signal.emotion).toBe(EmotionState.ANXIOUS);
    });

    it('should detect nostalgia from long session', () => {
      const signal = engine.detectEmotionFromTiming(1200, 400);
      expect(signal.emotion).toBe(EmotionState.NOSTALGIC);
    });

    it('should default to calm for normal timing', () => {
      const signal = engine.detectEmotionFromTiming(1500, 60);
      expect(signal.emotion).toBe(EmotionState.CALM);
    });
  });

  // ===== detectEmotionFromChoice =====

  describe('detectEmotionFromChoice()', () => {
    it('should detect anger from high quit count', () => {
      const signal = engine.detectEmotionFromChoice([GameType.PUZZLE], 5, 3, 1);
      expect(signal.emotion).toBe(EmotionState.ANGRY);
      expect(signal.source).toBe(EmotionSource.CHOICE);
    });

    it('should detect frustration from high retry count', () => {
      const signal = engine.detectEmotionFromChoice([GameType.PUZZLE], 5, 0, 4);
      expect(signal.emotion).toBe(EmotionState.FRUSTRATED);
    });

    it('should detect calm from healing game preference', () => {
      const signal = engine.detectEmotionFromChoice([GameType.HEALING], 3, 0, 0);
      expect(signal.emotion).toBe(EmotionState.CALM);
    });

    it('should detect boredom from many games played', () => {
      const signal = engine.detectEmotionFromChoice([GameType.REACTION], 15, 0, 0);
      expect(signal.emotion).toBe(EmotionState.BORED);
    });
  });

  // ===== getAdaptiveNarrative =====

  describe('getAdaptiveNarrative()', () => {
    it('should return neutral narrative for unknown user', () => {
      const narrative = engine.getAdaptiveNarrative('unknown');
      expect(narrative.tone).toBe('neutral');
      expect(narrative.text).toBeDefined();
      expect(narrative.urgency).toBe(0);
    });

    it('should return calming narrative for frustrated user', () => {
      const signal: IEmotionSignal = {
        source: EmotionSource.TAP,
        emotion: EmotionState.FRUSTRATED,
        confidence: 0.8,
        timestamp: Date.now(),
      };
      engine.updateProfile('user1', signal);
      engine.updateProfile('user1', signal); // second signal to reinforce

      const narrative = engine.getAdaptiveNarrative('user1');
      expect(narrative.tone).toBe('calming');
      expect(narrative.suggestedGameType).toBe(GameType.HEALING);
      expect(narrative.urgency).toBeGreaterThan(0);
    });

    it('should return celebratory narrative for happy user', () => {
      const signal: IEmotionSignal = {
        source: EmotionSource.PERFORMANCE,
        emotion: EmotionState.HAPPY,
        confidence: 0.8,
        timestamp: Date.now(),
      };
      engine.updateProfile('user1', signal);
      engine.updateProfile('user1', signal);

      const narrative = engine.getAdaptiveNarrative('user1');
      expect(narrative.tone).toBe('celebratory');
    });
  });

  // ===== updateProfile =====

  describe('updateProfile()', () => {
    it('should create a new profile if not exists', () => {
      const signal: IEmotionSignal = {
        source: EmotionSource.TAP,
        emotion: EmotionState.HAPPY,
        confidence: 0.8,
        timestamp: Date.now(),
      };

      const profile = engine.updateProfile('user1', signal);
      expect(profile.userId).toBe('user1');
      expect(profile.dominantEmotion).toBe(EmotionState.HAPPY);
      expect(profile.emotionHistory.length).toBe(1);
    });

    it('should accumulate signals in history', () => {
      for (let i = 0; i < 5; i++) {
        engine.updateProfile('user1', {
          source: EmotionSource.TAP,
          emotion: EmotionState.CALM,
          confidence: 0.5,
          timestamp: Date.now(),
        });
      }

      const profile = engine.getProfile('user1')!;
      expect(profile.emotionHistory.length).toBe(5);
    });

    it('should cap history at 100 signals', () => {
      for (let i = 0; i < 120; i++) {
        engine.updateProfile('user1', {
          source: EmotionSource.TAP,
          emotion: EmotionState.CALM,
          confidence: 0.5,
          timestamp: Date.now(),
        });
      }

      const profile = engine.getProfile('user1')!;
      expect(profile.emotionHistory.length).toBe(100);
    });
  });

  // ===== recommendForEmotion =====

  describe('recommendForEmotion()', () => {
    it('should recommend healing for frustrated', () => {
      const rec = engine.recommendForEmotion(EmotionState.FRUSTRATED);
      expect(rec.gameType).toBe(GameType.HEALING);
      expect(rec.difficulty).toBeLessThanOrEqual(1);
      expect(rec.confidence).toBeGreaterThan(0);
      expect(rec.reason).toBeDefined();
    });

    it('should recommend puzzle for bored', () => {
      const rec = engine.recommendForEmotion(EmotionState.BORED);
      expect(rec.gameType).toBe(GameType.PUZZLE);
      expect(rec.difficulty).toBeGreaterThanOrEqual(3);
    });

    it('should recommend reaction for excited', () => {
      const rec = engine.recommendForEmotion(EmotionState.EXCITED);
      expect(rec.gameType).toBe(GameType.REACTION);
    });

    it('should recommend healing for angry', () => {
      const rec = engine.recommendForEmotion(EmotionState.ANGRY);
      expect(rec.gameType).toBe(GameType.HEALING);
    });

    it('should recommend healing for anxious', () => {
      const rec = engine.recommendForEmotion(EmotionState.ANXIOUS);
      expect(rec.gameType).toBe(GameType.HEALING);
    });

    it('should recommend social for happy', () => {
      const rec = engine.recommendForEmotion(EmotionState.HAPPY);
      expect(rec.gameType).toBe(GameType.SOCIAL);
    });

    it('should recommend senses for nostalgic', () => {
      const rec = engine.recommendForEmotion(EmotionState.NOSTALGIC);
      expect(rec.gameType).toBe(GameType.SENSES);
    });

    it('should recommend puzzle for calm', () => {
      const rec = engine.recommendForEmotion(EmotionState.CALM);
      expect(rec.gameType).toBe(GameType.PUZZLE);
    });
  });

  // ===== shouldIntervene =====

  describe('shouldIntervene()', () => {
    it('should not intervene for unknown user', () => {
      const result = engine.shouldIntervene('unknown');
      expect(result.needed).toBe(false);
      expect(result.urgency).toBe(0);
    });

    it('should not intervene for user with insufficient data', () => {
      engine.updateProfile('user1', {
        source: EmotionSource.TAP,
        emotion: EmotionState.FRUSTRATED,
        confidence: 0.8,
        timestamp: Date.now(),
      });

      const result = engine.shouldIntervene('user1');
      expect(result.needed).toBe(false);
    });

    it('should intervene for sustained negative emotions', () => {
      for (let i = 0; i < 5; i++) {
        engine.updateProfile('user1', {
          source: EmotionSource.TAP,
          emotion: EmotionState.FRUSTRATED,
          confidence: 0.8,
          timestamp: Date.now(),
        });
      }

      const result = engine.shouldIntervene('user1');
      expect(result.needed).toBe(true);
      expect(result.urgency).toBeGreaterThan(0.5);
    });

    it('should intervene for boredom', () => {
      for (let i = 0; i < 4; i++) {
        engine.updateProfile('user1', {
          source: EmotionSource.CHOICE,
          emotion: EmotionState.BORED,
          confidence: 0.7,
          timestamp: Date.now(),
        });
      }

      const result = engine.shouldIntervene('user1');
      expect(result.needed).toBe(true);
    });

    it('should not intervene for positive emotions', () => {
      for (let i = 0; i < 5; i++) {
        engine.updateProfile('user1', {
          source: EmotionSource.PERFORMANCE,
          emotion: EmotionState.HAPPY,
          confidence: 0.7,
          timestamp: Date.now(),
        });
      }

      const result = engine.shouldIntervene('user1');
      expect(result.needed).toBe(false);
    });
  });

  // ===== fuseSignals =====

  describe('fuseSignals()', () => {
    it('should return calm with 0.5 confidence for empty signals', () => {
      const result = engine.fuseSignals([]);
      expect(result.emotion).toBe(EmotionState.CALM);
      expect(result.confidence).toBe(0.5);
    });

    it('should return dominant emotion from signals', () => {
      const signals: IEmotionSignal[] = [
        { source: EmotionSource.TAP, emotion: EmotionState.HAPPY, confidence: 0.8, timestamp: Date.now() },
        { source: EmotionSource.PERFORMANCE, emotion: EmotionState.HAPPY, confidence: 0.6, timestamp: Date.now() },
        { source: EmotionSource.TIMING, emotion: EmotionState.CALM, confidence: 0.3, timestamp: Date.now() },
      ];

      const result = engine.fuseSignals(signals);
      expect(result.emotion).toBe(EmotionState.HAPPY);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle single signal', () => {
      const signals: IEmotionSignal[] = [
        { source: EmotionSource.TAP, emotion: EmotionState.EXCITED, confidence: 0.9, timestamp: Date.now() },
      ];

      const result = engine.fuseSignals(signals);
      expect(result.emotion).toBe(EmotionState.EXCITED);
    });

    it('should weight SELF_REPORT more heavily', () => {
      const signals: IEmotionSignal[] = [
        { source: EmotionSource.PERFORMANCE, emotion: EmotionState.CALM, confidence: 0.8, timestamp: Date.now() },
        { source: EmotionSource.SELF_REPORT, emotion: EmotionState.FRUSTRATED, confidence: 0.7, timestamp: Date.now() },
      ];

      const result = engine.fuseSignals(signals);
      // SELF_REPORT has 2x weight so FRUSTRATED should dominate
      expect(result.emotion).toBe(EmotionState.FRUSTRATED);
    });
  });
});
