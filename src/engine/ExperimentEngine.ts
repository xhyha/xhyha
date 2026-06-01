/**
 * Genesis AI Micro-Game Engine - Experiment Engine
 *
 * A complete A/B testing framework with experiment groups,
 * metric tracking, and statistical analysis.
 */

// ========== Enums ==========

/** Experiment status */
export enum ExperimentStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

/** Metric type */
export enum MetricType {
  COUNT = 'COUNT',
  DURATION = 'DURATION',
  PERCENTAGE = 'PERCENTAGE',
  SCORE = 'SCORE',
}

// ========== Interfaces ==========

/** Experiment variant */
export interface IExperimentVariant {
  name: string;
  description: string;
  trafficPercentage: number;
  config: Record<string, unknown>;
  isControl: boolean;
}

/** Metric definition */
export interface IMetricDefinition {
  id: string;
  name: string;
  type: MetricType;
  description: string;
  goal: 'increase' | 'decrease';
}

/** Experiment definition */
export interface IExperiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: IExperimentVariant[];
  metrics: IMetricDefinition[];
  startDate: number;
  endDate: number | null;
  targeting: ITargetingRule[];
  minimumSampleSize: number;
}

/** Metric data point */
export interface IMetricPoint {
  experimentId: string;
  variantName: string;
  metricId: string;
  userId: string;
  value: number;
  timestamp: number;
}

/** Targeting rule */
export interface ITargetingRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains';
  value: unknown;
}

/** Experiment result */
export interface IExperimentResult {
  experimentId: string;
  experimentName: string;
  status: ExperimentStatus;
  variants: IExperimentResultVariant[];
  winner: string | null;
  confidence: number;
  totalParticipants: number;
  duration: number;
}

/** Variant result */
export interface IExperimentResultVariant {
  variantName: string;
  participantCount: number;
  metrics: IExperimentMetricResult[];
  isControl: boolean;
}

/** Metric result for a variant */
export interface IExperimentMetricResult {
  metricId: string;
  metricName: string;
  mean: number;
  median: number;
  stdDev: number;
  sampleSize: number;
  changeFromControl: number | null;
  pValue: number | null;
  isSignificant: boolean;
}

// ========== Helpers ==========

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Deterministic hash for consistent variant assignment.
 * Uses a simple string hashing algorithm.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Compute the mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute the median of an array of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Compute the standard deviation of an array of numbers.
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Approximate a two-tailed p-value using a simplified z-test.
 * Returns a value between 0 and 1.
 */
function approximatePValue(
  controlMean: number,
  controlStdDev: number,
  controlN: number,
  variantMean: number,
  variantStdDev: number,
  variantN: number,
): number {
  if (controlN < 2 || variantN < 2) return 1;

  const pooledSE = Math.sqrt(
    (Math.pow(controlStdDev, 2) / controlN) +
    (Math.pow(variantStdDev, 2) / variantN),
  );

  if (pooledSE === 0) return 1;

  const z = Math.abs(variantMean - controlMean) / pooledSE;

  // Approximate cumulative normal using logistic approximation
  // P(|Z| > z) ≈ 2 / (1 + exp(0.0741 * z^3 + 0.0605 * z^2 + 1.2517 * z))
  const expTerm = Math.exp(0.0741 * Math.pow(z, 3) + 0.0605 * Math.pow(z, 2) + 1.2517 * z);
  const pValue = 2 / (1 + expTerm);

  return Math.max(0, Math.min(1, pValue));
}

/**
 * Evaluate a targeting rule against a user profile.
 */
function evaluateRule(profile: Record<string, unknown>, rule: ITargetingRule): boolean {
  const fieldValue = profile[rule.field];

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value;
    case 'neq':
      return fieldValue !== rule.value;
    case 'gt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue > rule.value;
    case 'lt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue < rule.value;
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(fieldValue);
    case 'contains':
      return typeof fieldValue === 'string' &&
        typeof rule.value === 'string' &&
        fieldValue.includes(rule.value);
    default:
      return false;
  }
}

// ========== Default Experiments ==========

const DEFAULT_EXPERIMENTS: Array<Omit<IExperiment, 'status'>> = [
  {
    id: 'difficulty_tuning',
    name: 'Difficulty Tuning',
    description: 'Test EASY default vs NORMAL default for new users',
    variants: [
      {
        name: 'easy_default',
        description: 'New users start at EASY difficulty',
        trafficPercentage: 50,
        config: { defaultDifficulty: 1, label: 'EASY' },
        isControl: true,
      },
      {
        name: 'normal_default',
        description: 'New users start at NORMAL difficulty',
        trafficPercentage: 50,
        config: { defaultDifficulty: 2, label: 'NORMAL' },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'games_completed',
        name: 'Games Completed',
        type: MetricType.COUNT,
        description: 'Number of games completed in first session',
        goal: 'increase',
      },
      {
        id: 'avg_score',
        name: 'Average Score',
        type: MetricType.SCORE,
        description: 'Average score in first 3 games',
        goal: 'increase',
      },
      {
        id: 'retention_day1',
        name: 'Day 1 Retention',
        type: MetricType.PERCENTAGE,
        description: 'Whether user returned on day 1',
        goal: 'increase',
      },
    ],
    startDate: Date.now() - 7 * MS_PER_DAY,
    endDate: null,
    targeting: [
      { field: 'totalGamesPlayed', operator: 'lt', value: 5 },
    ],
    minimumSampleSize: 1000,
  },
  {
    id: 'ad_frequency',
    name: 'Ad Frequency',
    description: 'Test showing ads every 3 games vs every 5 games',
    variants: [
      {
        name: 'every_3_games',
        description: 'Show interstitial ad every 3 games',
        trafficPercentage: 50,
        config: { adInterval: 3 },
        isControl: true,
      },
      {
        name: 'every_5_games',
        description: 'Show interstitial ad every 5 games',
        trafficPercentage: 50,
        config: { adInterval: 5 },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'session_length',
        name: 'Session Length',
        type: MetricType.DURATION,
        description: 'Average session length in seconds',
        goal: 'increase',
      },
      {
        id: 'games_per_session',
        name: 'Games Per Session',
        type: MetricType.COUNT,
        description: 'Average games played per session',
        goal: 'increase',
      },
      {
        id: 'churn_rate',
        name: 'Churn Rate',
        type: MetricType.PERCENTAGE,
        description: 'Percentage of users who do not return',
        goal: 'decrease',
      },
    ],
    startDate: Date.now() - 3 * MS_PER_DAY,
    endDate: null,
    targeting: [],
    minimumSampleSize: 500,
  },
  {
    id: 'onboarding_flow',
    name: 'Onboarding Flow',
    description: 'Test tutorial vs direct play for first-time users',
    variants: [
      {
        name: 'tutorial',
        description: 'Show guided tutorial before first game',
        trafficPercentage: 50,
        config: { showTutorial: true, tutorialSteps: 5 },
        isControl: true,
      },
      {
        name: 'direct_play',
        description: 'Skip tutorial and go straight to gameplay',
        trafficPercentage: 50,
        config: { showTutorial: false },
        isControl: false,
      },
    ],
    metrics: [
      {
        id: 'first_game_completion',
        name: 'First Game Completion',
        type: MetricType.PERCENTAGE,
        description: 'Rate of completing the first game',
        goal: 'increase',
      },
      {
        id: 'time_to_first_game',
        name: 'Time to First Game',
        type: MetricType.DURATION,
        description: 'Seconds from app open to first game start',
        goal: 'decrease',
      },
      {
        id: 'day7_retention',
        name: 'Day 7 Retention',
        type: MetricType.PERCENTAGE,
        description: 'Whether user returned on day 7',
        goal: 'increase',
      },
    ],
    startDate: Date.now(),
    endDate: null,
    targeting: [
      { field: 'totalGamesPlayed', operator: 'eq', value: 0 },
    ],
    minimumSampleSize: 2000,
  },
];

// ========== ExperimentEngine Class ==========

/**
 * Engine that manages A/B testing experiments, variant assignment,
 * metric tracking, and statistical analysis.
 *
 * Usage:
 *   const experiments = new ExperimentEngine();
 *   experiments.startExperiment('difficulty_tuning');
 *   const variant = experiments.assignVariant('user1', 'difficulty_tuning');
 *   experiments.trackMetric('user1', 'difficulty_tuning', 'games_completed', 5);
 *   const result = experiments.analyzeExperiment('difficulty_tuning');
 */
export class ExperimentEngine {
  private experiments: Map<string, IExperiment>;
  private assignments: Map<string, Map<string, string>>;
  private metrics: IMetricPoint[];

  constructor() {
    this.experiments = new Map();
    this.assignments = new Map();
    this.metrics = [];

    // Register default experiments
    for (const def of DEFAULT_EXPERIMENTS) {
      // Determine initial status based on experiment id
      let status = ExperimentStatus.DRAFT;
      if (def.id === 'difficulty_tuning' || def.id === 'ad_frequency') {
        status = ExperimentStatus.RUNNING;
      }

      const experiment: IExperiment = {
        ...def,
        status,
      };
      this.experiments.set(def.id, experiment);
    }
  }

  // ---- Experiment Management ----

  /**
   * Create a new experiment. Starts in DRAFT status.
   */
  createExperiment(experiment: Omit<IExperiment, 'status'>): IExperiment {
    const exp: IExperiment = {
      ...experiment,
      status: ExperimentStatus.DRAFT,
    };
    this.experiments.set(exp.id, exp);
    return exp;
  }

  /**
   * Start an experiment (transition from DRAFT/PAUSED to RUNNING).
   */
  startExperiment(experimentId: string): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    if (exp.status === ExperimentStatus.DRAFT || exp.status === ExperimentStatus.PAUSED) {
      exp.status = ExperimentStatus.RUNNING;
      if (exp.startDate === 0) {
        exp.startDate = Date.now();
      }
    }
  }

  /**
   * Pause a running experiment.
   */
  pauseExperiment(experimentId: string): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    if (exp.status === ExperimentStatus.RUNNING) {
      exp.status = ExperimentStatus.PAUSED;
    }
  }

  /**
   * Complete an experiment.
   */
  completeExperiment(experimentId: string): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    exp.status = ExperimentStatus.COMPLETED;
    exp.endDate = Date.now();
  }

  /**
   * Get an experiment by ID.
   */
  getExperiment(experimentId: string): IExperiment | null {
    return this.experiments.get(experimentId) ?? null;
  }

  /**
   * List experiments with optional status filter.
   */
  listExperiments(filter?: { status?: ExperimentStatus }): IExperiment[] {
    let result = Array.from(this.experiments.values());

    if (filter?.status !== undefined) {
      result = result.filter((exp) => exp.status === filter.status);
    }

    return result;
  }

  // ---- Variant Assignment ----

  /**
   * Assign a user to a variant for an experiment.
   * Uses deterministic hashing for consistent assignment.
   * Returns the variant name.
   */
  assignVariant(userId: string, experimentId: string): string {
    const exp = this.experiments.get(experimentId);
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Check for existing assignment
    if (!this.assignments.has(userId)) {
      this.assignments.set(userId, new Map());
    }

    const userAssignments = this.assignments.get(userId)!;
    const existing = userAssignments.get(experimentId);
    if (existing) return existing;

    // Deterministic assignment based on hash
    const hash = hashString(`${userId}:${experimentId}`);
    const bucket = hash % 100;

    // Assign to variant based on traffic percentages
    let cumulative = 0;
    let assignedVariant = exp.variants[0];

    for (const variant of exp.variants) {
      cumulative += variant.trafficPercentage;
      if (bucket < cumulative) {
        assignedVariant = variant;
        break;
      }
    }

    userAssignments.set(experimentId, assignedVariant.name);
    return assignedVariant.name;
  }

  /**
   * Get the variant a user is assigned to for an experiment.
   * Returns null if not assigned.
   */
  getVariant(userId: string, experimentId: string): string | null {
    const userAssignments = this.assignments.get(userId);
    if (!userAssignments) return null;
    return userAssignments.get(experimentId) ?? null;
  }

  /**
   * Get the variant configuration for a user in an experiment.
   * Returns null if not assigned.
   */
  getVariantConfig(userId: string, experimentId: string): Record<string, unknown> | null {
    const variantName = this.getVariant(userId, experimentId);
    if (!variantName) return null;

    const exp = this.experiments.get(experimentId);
    if (!exp) return null;

    const variant = exp.variants.find((v) => v.name === variantName);
    return variant?.config ?? null;
  }

  // ---- Metric Tracking ----

  /**
   * Track a metric value for a user in an experiment.
   */
  trackMetric(userId: string, experimentId: string, metricId: string, value: number): void {
    const variantName = this.getVariant(userId, experimentId);
    if (!variantName) return;

    const point: IMetricPoint = {
      experimentId,
      variantName,
      metricId,
      userId,
      value,
      timestamp: Date.now(),
    };

    this.metrics.push(point);
  }

  /**
   * Get metric data points for an experiment, optionally filtered by variant.
   */
  getMetrics(experimentId: string, variantName?: string): IMetricPoint[] {
    let result = this.metrics.filter((m) => m.experimentId === experimentId);

    if (variantName !== undefined) {
      result = result.filter((m) => m.variantName === variantName);
    }

    return result;
  }

  // ---- Analysis ----

  /**
   * Analyze an experiment and compute statistical results.
   */
  analyzeExperiment(experimentId: string): IExperimentResult {
    const exp = this.experiments.get(experimentId);
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const experimentMetrics = this.metrics.filter((m) => m.experimentId === experimentId);

    // Count participants per variant
    const participantMap: Map<string, Set<string>> = new Map();
    for (const variant of exp.variants) {
      participantMap.set(variant.name, new Set());
    }

    for (const point of experimentMetrics) {
      const variantUsers = participantMap.get(point.variantName);
      if (variantUsers) {
        variantUsers.add(point.userId);
      }
    }

    // Find control variant
    const controlVariant = exp.variants.find((v) => v.isControl);

    // Build variant results
    const variantResults: IExperimentResultVariant[] = exp.variants.map((variant) => {
      const participants = participantMap.get(variant.name) ?? new Set();
      const participantCount = participants.size;

      const metricResults: IExperimentMetricResult[] = exp.metrics.map((metricDef) => {
        const variantValues = experimentMetrics
          .filter((m) => m.variantName === variant.name && m.metricId === metricDef.id)
          .map((m) => m.value);

        const sampleSize = variantValues.length;
        const m = mean(variantValues);
        const med = median(variantValues);
        const sd = stdDev(variantValues);

        // Compare with control
        let changeFromControl: number | null = null;
        let pValue: number | null = null;
        let isSignificant = false;

        if (controlVariant && !variant.isControl) {
          const controlValues = experimentMetrics
            .filter((m2) => m2.variantName === controlVariant.name && m2.metricId === metricDef.id)
            .map((m2) => m2.value);

          if (controlValues.length > 0) {
            const controlMean = mean(controlValues);
            const controlSD = stdDev(controlValues);

            if (controlMean !== 0) {
              changeFromControl = Math.round(((m - controlMean) / Math.abs(controlMean)) * 10000) / 100;
            }

            pValue = approximatePValue(controlMean, controlSD, controlValues.length, m, sd, sampleSize);
            isSignificant = pValue < 0.05;
          }
        }

        return {
          metricId: metricDef.id,
          metricName: metricDef.name,
          mean: Math.round(m * 10000) / 10000,
          median: Math.round(med * 10000) / 10000,
          stdDev: Math.round(sd * 10000) / 10000,
          sampleSize,
          changeFromControl,
          pValue: pValue !== null ? Math.round(pValue * 10000) / 10000 : null,
          isSignificant,
        };
      });

      return {
        variantName: variant.name,
        participantCount,
        metrics: metricResults,
        isControl: variant.isControl,
      };
    });

    // Determine overall winner
    let winner: string | null = null;
    let bestConfidence = 0;

    if (controlVariant) {
      for (const vr of variantResults) {
        if (vr.isControl) continue;

        // Check if this variant is significantly better on primary metric
        const primaryMetric = exp.metrics[0];
        if (!primaryMetric) continue;

        const metricResult = vr.metrics.find((mr) => mr.metricId === primaryMetric.id);
        if (!metricResult || !metricResult.isSignificant) continue;

        const isImprovement = primaryMetric.goal === 'increase'
          ? (metricResult.changeFromControl ?? 0) > 0
          : (metricResult.changeFromControl ?? 0) < 0;

        if (isImprovement) {
          const confidence = metricResult.pValue !== null ? 1 - metricResult.pValue : 0;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            winner = vr.variantName;
          }
        }
      }
    }

    // Overall confidence
    const confidence = winner ? Math.round(bestConfidence * 10000) / 10000 : 0;

    // Total participants
    const totalParticipants = Array.from(participantMap.values())
      .reduce((sum, users) => sum + users.size, 0);

    // Duration in days
    const durationEnd = exp.endDate ?? Date.now();
    const duration = Math.max(0, Math.round((durationEnd - exp.startDate) / MS_PER_DAY));

    return {
      experimentId,
      experimentName: exp.name,
      status: exp.status,
      variants: variantResults,
      winner,
      confidence,
      totalParticipants,
      duration,
    };
  }

  /**
   * Check the health of an experiment (sample size, balance, data quality).
   */
  getExperimentHealth(experimentId: string): {
    sampleSize: number;
    variantsBalanced: boolean;
    dataQuality: number;
  } {
    const exp = this.experiments.get(experimentId);
    if (!exp) {
      return { sampleSize: 0, variantsBalanced: false, dataQuality: 0 };
    }

    const experimentMetrics = this.metrics.filter((m) => m.experimentId === experimentId);

    // Sample size
    const uniqueUsers = new Set(experimentMetrics.map((m) => m.userId));
    const sampleSize = uniqueUsers.size;

    // Check variant balance
    const variantCounts: Record<string, number> = {};
    for (const variant of exp.variants) {
      const users = new Set(
        experimentMetrics
          .filter((m) => m.variantName === variant.name)
          .map((m) => m.userId),
      );
      variantCounts[variant.name] = users.size;
    }

    const counts = Object.values(variantCounts);
    const maxCount = Math.max(...counts, 0);
    const minCount = Math.min(...counts, 0);
    const variantsBalanced = maxCount > 0 && minCount > 0
      ? (maxCount - minCount) / maxCount < 0.2
      : counts.every((c) => c === 0);

    // Data quality: based on completeness of metrics per user
    const expectedMetricsPerUser = exp.metrics.length;
    let qualityScore = 1;
    if (expectedMetricsPerUser > 0 && sampleSize > 0) {
      const totalMetricPoints = experimentMetrics.length;
      const expectedTotal = sampleSize * expectedMetricsPerUser;
      qualityScore = Math.min(1, totalMetricPoints / expectedTotal);
    }

    return {
      sampleSize,
      variantsBalanced,
      dataQuality: Math.round(qualityScore * 100) / 100,
    };
  }

  // ---- Targeting ----

  /**
   * Check if a user matches the targeting rules for an experiment.
   */
  checkTargeting(userId: string, profile: Record<string, unknown>, experimentId: string): boolean {
    const exp = this.experiments.get(experimentId);
    if (!exp) return false;

    if (exp.targeting.length === 0) return true;

    return exp.targeting.every((rule) => evaluateRule(profile, rule));
  }

  // ---- Cleanup ----

  /**
   * Remove data for completed or expired experiments.
   */
  cleanup(): void {
    const now = Date.now();

    for (const [id, exp] of this.experiments) {
      // Remove data for completed experiments older than 30 days
      if (exp.status === ExperimentStatus.COMPLETED && exp.endDate !== null) {
        if (now - exp.endDate > 30 * MS_PER_DAY) {
          // Remove related metrics
          this.metrics = this.metrics.filter((m) => m.experimentId !== id);

          // Remove assignments
          for (const userAssignments of this.assignments.values()) {
            userAssignments.delete(id);
          }

          this.experiments.delete(id);
        }
      }
    }
  }
}
