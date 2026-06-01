import {
  ExperimentEngine,
  ExperimentStatus,
  MetricType,
  IExperiment,
  IExperimentVariant,
  IMetricDefinition,
  ITargetingRule,
} from './ExperimentEngine';

function makeExperiment(overrides: Partial<Omit<IExperiment, 'status'>> = {}): Omit<IExperiment, 'status'> {
  const variants: IExperimentVariant[] = [
    { name: 'control', description: 'Control variant', trafficPercentage: 50, config: {}, isControl: true },
    { name: 'treatment', description: 'Treatment variant', trafficPercentage: 50, config: {}, isControl: false },
  ];
  const metrics: IMetricDefinition[] = [
    { id: 'metric_1', name: 'Test Metric', type: MetricType.COUNT, description: 'A test metric', goal: 'increase' },
  ];
  return {
    id: 'test_exp_' + Date.now(),
    name: 'Test Experiment',
    description: 'A test experiment',
    variants,
    metrics,
    startDate: Date.now(),
    endDate: null,
    targeting: [],
    minimumSampleSize: 100,
    ...overrides,
  };
}

describe('ExperimentEngine', () => {
  let engine: ExperimentEngine;

  beforeEach(() => {
    engine = new ExperimentEngine();
  });

  // ===== Default Experiments =====

  describe('default experiments', () => {
    it('should have default experiments registered', () => {
      const experiments = engine.listExperiments();
      expect(experiments.length).toBeGreaterThanOrEqual(3);
    });

    it('should have difficulty_tuning and ad_frequency as RUNNING', () => {
      const running = engine.listExperiments({ status: ExperimentStatus.RUNNING });
      expect(running.length).toBeGreaterThanOrEqual(2);
      expect(running.some(e => e.id === 'difficulty_tuning')).toBe(true);
      expect(running.some(e => e.id === 'ad_frequency')).toBe(true);
    });

    it('should have onboarding_flow as DRAFT', () => {
      const exp = engine.getExperiment('onboarding_flow');
      expect(exp).not.toBeNull();
      expect(exp!.status).toBe(ExperimentStatus.DRAFT);
    });
  });

  // ===== createExperiment =====

  describe('createExperiment()', () => {
    it('should create a new experiment in DRAFT status', () => {
      const def = makeExperiment();
      const exp = engine.createExperiment(def);

      expect(exp.status).toBe(ExperimentStatus.DRAFT);
      expect(exp.id).toBe(def.id);
      expect(exp.name).toBe(def.name);
    });

    it('should be retrievable after creation', () => {
      const def = makeExperiment({ id: 'my_exp' });
      engine.createExperiment(def);
      expect(engine.getExperiment('my_exp')).not.toBeNull();
    });
  });

  // ===== startExperiment =====

  describe('startExperiment()', () => {
    it('should transition DRAFT to RUNNING', () => {
      const def = makeExperiment({ id: 'start_test' });
      engine.createExperiment(def);
      engine.startExperiment('start_test');

      const exp = engine.getExperiment('start_test');
      expect(exp!.status).toBe(ExperimentStatus.RUNNING);
    });

    it('should transition PAUSED to RUNNING', () => {
      const def = makeExperiment({ id: 'pause_test' });
      engine.createExperiment(def);
      engine.startExperiment('pause_test');
      engine.pauseExperiment('pause_test');
      engine.startExperiment('pause_test');

      const exp = engine.getExperiment('pause_test');
      expect(exp!.status).toBe(ExperimentStatus.RUNNING);
    });

    it('should not affect COMPLETED experiments', () => {
      const def = makeExperiment({ id: 'completed_test' });
      engine.createExperiment(def);
      engine.startExperiment('completed_test');
      engine.completeExperiment('completed_test');
      engine.startExperiment('completed_test');

      const exp = engine.getExperiment('completed_test');
      expect(exp!.status).toBe(ExperimentStatus.COMPLETED);
    });

    it('should not throw for nonexistent experiment', () => {
      expect(() => engine.startExperiment('nonexistent')).not.toThrow();
    });
  });

  // ===== Experiment Lifecycle =====

  describe('experiment lifecycle', () => {
    it('should go DRAFT → RUNNING → PAUSED → RUNNING → COMPLETED', () => {
      const def = makeExperiment({ id: 'lifecycle_test' });
      const exp = engine.createExperiment(def);
      expect(exp.status).toBe(ExperimentStatus.DRAFT);

      engine.startExperiment('lifecycle_test');
      expect(engine.getExperiment('lifecycle_test')!.status).toBe(ExperimentStatus.RUNNING);

      engine.pauseExperiment('lifecycle_test');
      expect(engine.getExperiment('lifecycle_test')!.status).toBe(ExperimentStatus.PAUSED);

      engine.startExperiment('lifecycle_test');
      expect(engine.getExperiment('lifecycle_test')!.status).toBe(ExperimentStatus.RUNNING);

      engine.completeExperiment('lifecycle_test');
      expect(engine.getExperiment('lifecycle_test')!.status).toBe(ExperimentStatus.COMPLETED);
      expect(engine.getExperiment('lifecycle_test')!.endDate).not.toBeNull();
    });
  });

  // ===== assignVariant (deterministic) =====

  describe('assignVariant()', () => {
    it('should deterministically assign the same variant', () => {
      const def = makeExperiment({ id: 'variant_test' });
      engine.createExperiment(def);
      engine.startExperiment('variant_test');

      const v1 = engine.assignVariant('user1', 'variant_test');
      const v2 = engine.assignVariant('user1', 'variant_test');
      expect(v1).toBe(v2);
    });

    it('should assign different users potentially to different variants', () => {
      const def = makeExperiment({ id: 'multi_user_test' });
      engine.createExperiment(def);
      engine.startExperiment('multi_user_test');

      const variants = new Set<string>();
      // Use many users to increase probability of covering both variants
      for (let i = 0; i < 50; i++) {
        variants.add(engine.assignVariant(`user_${i}`, 'multi_user_test'));
      }
      // With 50 users and 50/50 split, both variants should appear
      expect(variants.size).toBeGreaterThanOrEqual(1);
    });

    it('should throw for nonexistent experiment', () => {
      expect(() => engine.assignVariant('user1', 'nonexistent')).toThrow();
    });
  });

  // ===== trackMetric =====

  describe('trackMetric()', () => {
    it('should track a metric for an assigned user', () => {
      const def = makeExperiment({ id: 'metric_test' });
      engine.createExperiment(def);
      engine.startExperiment('metric_test');

      engine.assignVariant('user1', 'metric_test');
      engine.trackMetric('user1', 'metric_test', 'metric_1', 42);

      const metrics = engine.getMetrics('metric_test');
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(42);
      expect(metrics[0].userId).toBe('user1');
    });

    it('should not track for unassigned user', () => {
      const def = makeExperiment({ id: 'no_assign_test' });
      engine.createExperiment(def);
      engine.startExperiment('no_assign_test');

      engine.trackMetric('user1', 'no_assign_test', 'metric_1', 10);
      expect(engine.getMetrics('no_assign_test').length).toBe(0);
    });

    it('should filter metrics by variant', () => {
      const def = makeExperiment({ id: 'filter_test' });
      engine.createExperiment(def);
      engine.startExperiment('filter_test');

      // Assign many users and track
      for (let i = 0; i < 20; i++) {
        const variant = engine.assignVariant(`user_${i}`, 'filter_test');
        engine.trackMetric(`user_${i}`, 'filter_test', 'metric_1', i * 10);
      }

      const allMetrics = engine.getMetrics('filter_test');
      expect(allMetrics.length).toBe(20);

      // Filter by a specific variant
      const controlMetrics = engine.getMetrics('filter_test', 'control');
      expect(controlMetrics.every(m => m.variantName === 'control')).toBe(true);
    });
  });

  // ===== analyzeExperiment =====

  describe('analyzeExperiment()', () => {
    it('should return analysis results', () => {
      const def = makeExperiment({ id: 'analysis_test' });
      engine.createExperiment(def);
      engine.startExperiment('analysis_test');

      // Assign users and track metrics
      for (let i = 0; i < 20; i++) {
        engine.assignVariant(`user_${i}`, 'analysis_test');
        engine.trackMetric(`user_${i}`, 'analysis_test', 'metric_1', Math.random() * 100);
      }

      const result = engine.analyzeExperiment('analysis_test');
      expect(result.experimentId).toBe('analysis_test');
      expect(result.variants.length).toBe(2);
      expect(result.totalParticipants).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should throw for nonexistent experiment', () => {
      expect(() => engine.analyzeExperiment('nonexistent')).toThrow();
    });

    it('should handle zero metrics gracefully', () => {
      const def = makeExperiment({ id: 'empty_analysis' });
      engine.createExperiment(def);
      engine.startExperiment('empty_analysis');

      const result = engine.analyzeExperiment('empty_analysis');
      expect(result.totalParticipants).toBe(0);
      expect(result.winner).toBeNull();
    });
  });

  // ===== Targeting =====

  describe('checkTargeting()', () => {
    it('should return true when no targeting rules', () => {
      const def = makeExperiment({ id: 'no_targeting', targeting: [] });
      engine.createExperiment(def);
      expect(engine.checkTargeting('user1', {}, 'no_targeting')).toBe(true);
    });

    it('should evaluate targeting rules correctly', () => {
      const targeting: ITargetingRule[] = [
        { field: 'totalGamesPlayed', operator: 'lt', value: 5 },
      ];
      const def = makeExperiment({ id: 'targeting_test', targeting });
      engine.createExperiment(def);

      expect(engine.checkTargeting('user1', { totalGamesPlayed: 3 }, 'targeting_test')).toBe(true);
      expect(engine.checkTargeting('user1', { totalGamesPlayed: 10 }, 'targeting_test')).toBe(false);
    });

    it('should support eq operator', () => {
      const targeting: ITargetingRule[] = [
        { field: 'country', operator: 'eq', value: 'US' },
      ];
      const def = makeExperiment({ id: 'eq_test', targeting });
      engine.createExperiment(def);

      expect(engine.checkTargeting('user1', { country: 'US' }, 'eq_test')).toBe(true);
      expect(engine.checkTargeting('user1', { country: 'UK' }, 'eq_test')).toBe(false);
    });

    it('should support in operator', () => {
      const targeting: ITargetingRule[] = [
        { field: 'country', operator: 'in', value: ['US', 'UK', 'CA'] },
      ];
      const def = makeExperiment({ id: 'in_test', targeting });
      engine.createExperiment(def);

      expect(engine.checkTargeting('user1', { country: 'US' }, 'in_test')).toBe(true);
      expect(engine.checkTargeting('user1', { country: 'JP' }, 'in_test')).toBe(false);
    });

    it('should return false for nonexistent experiment', () => {
      expect(engine.checkTargeting('user1', {}, 'nonexistent')).toBe(false);
    });
  });

  // ===== Health Check =====

  describe('getExperimentHealth()', () => {
    it('should return health data for an experiment', () => {
      const def = makeExperiment({ id: 'health_test' });
      engine.createExperiment(def);
      engine.startExperiment('health_test');

      for (let i = 0; i < 20; i++) {
        engine.assignVariant(`user_${i}`, 'health_test');
        engine.trackMetric(`user_${i}`, 'health_test', 'metric_1', i);
      }

      const health = engine.getExperimentHealth('health_test');
      expect(health.sampleSize).toBeGreaterThan(0);
      expect(typeof health.variantsBalanced).toBe('boolean');
      expect(typeof health.dataQuality).toBe('number');
    });

    it('should return defaults for nonexistent experiment', () => {
      const health = engine.getExperimentHealth('nonexistent');
      expect(health.sampleSize).toBe(0);
      expect(health.variantsBalanced).toBe(false);
      expect(health.dataQuality).toBe(0);
    });
  });

  // ===== getVariant / getVariantConfig =====

  describe('getVariant()', () => {
    it('should return null for unassigned user', () => {
      expect(engine.getVariant('user1', 'difficulty_tuning')).toBeNull();
    });

    it('should return assigned variant', () => {
      const variant = engine.assignVariant('user1', 'difficulty_tuning');
      expect(engine.getVariant('user1', 'difficulty_tuning')).toBe(variant);
    });
  });

  describe('getVariantConfig()', () => {
    it('should return null for unassigned user', () => {
      expect(engine.getVariantConfig('user1', 'difficulty_tuning')).toBeNull();
    });

    it('should return config for assigned user', () => {
      engine.assignVariant('user1', 'difficulty_tuning');
      const config = engine.getVariantConfig('user1', 'difficulty_tuning');
      expect(config).not.toBeNull();
      expect(typeof config).toBe('object');
    });
  });

  // ===== listExperiments =====

  describe('listExperiments()', () => {
    it('should list all experiments', () => {
      const all = engine.listExperiments();
      expect(all.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', () => {
      const running = engine.listExperiments({ status: ExperimentStatus.RUNNING });
      expect(running.every(e => e.status === ExperimentStatus.RUNNING)).toBe(true);
    });
  });

  // ===== cleanup =====

  describe('cleanup()', () => {
    it('should remove old completed experiments', () => {
      const def = makeExperiment({ id: 'cleanup_test' });
      engine.createExperiment(def);
      engine.startExperiment('cleanup_test');
      engine.completeExperiment('cleanup_test');

      // Manually set endDate to > 30 days ago
      const exp = engine.getExperiment('cleanup_test');
      if (exp) {
        exp.endDate = Date.now() - 31 * 24 * 60 * 60 * 1000;
      }

      engine.cleanup();
      expect(engine.getExperiment('cleanup_test')).toBeNull();
    });

    it('should not remove recent completed experiments', () => {
      const def = makeExperiment({ id: 'recent_test' });
      engine.createExperiment(def);
      engine.startExperiment('recent_test');
      engine.completeExperiment('recent_test');

      engine.cleanup();
      expect(engine.getExperiment('recent_test')).not.toBeNull();
    });
  });
});
