/**
 * Genesis AI Micro-Game Generator - Core Type Definitions
 */

// ========== Enums ==========

/** Game state */
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/** Micro-game type categories */
export enum GameType {
  REACTION = 'REACTION',
  PUZZLE = 'PUZZLE',
  CREATE = 'CREATE',
  SENSES = 'SENSES',
  SOCIAL = 'SOCIAL',
  HEALING = 'HEALING',
}

/** Trigger category */
export enum TriggerCategory {
  TIME = 'TIME',
  BEHAVIOR = 'BEHAVIOR',
  EMOTION = 'EMOTION',
  ENVIRONMENT = 'ENVIRONMENT',
  SOCIAL = 'SOCIAL',
}

/** Emotion state detected from user behavior */
export enum EmotionState {
  HAPPY = 'HAPPY',
  EXCITED = 'EXCITED',
  CALM = 'CALM',
  BORED = 'BORED',
  FRUSTRATED = 'FRUSTRATED',
  ANGRY = 'ANGRY',
  ANXIOUS = 'ANXIOUS',
  NOSTALGIC = 'NOSTALGIC',
}

/** Difficulty level */
export enum Difficulty {
  EASY = 1,
  NORMAL = 2,
  HARD = 3,
  EXPERT = 4,
}

/** User game taste dimension */
export enum TasteDimension {
  STRATEGY = 'STRATEGY',
  ACTION = 'ACTION',
  SOCIAL = 'SOCIAL',
  CREATIVE = 'CREATIVE',
  RELAXATION = 'RELAXATION',
  COMPETITION = 'COMPETITION',
}

// ========== Interfaces ==========

/** 2D position */
export interface IVector2 {
  x: number;
  y: number;
}

/** Game entity base */
export interface IGameEntity {
  id: string;
  position: IVector2;
  size: IVector2;
  visible: boolean;
  update(dt: number): void;
}

/** Game template configuration */
export interface IGameConfig {
  id: string;
  name: string;
  type: GameType;
  description: string;
  estimatedDuration: number; // seconds
  maxDuration: number; // seconds
  difficulty: Difficulty;
  parameters: Record<string, unknown>;
  theme: IGameTheme;
}

/** Visual theme for a micro-game */
export interface IGameTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  particleEffect: boolean;
}

/** Trigger definition */
export interface ITrigger {
  id: string;
  category: TriggerCategory;
  name: string;
  description: string;
  cooldown: number; // minimum seconds between triggers
  priority: number; // higher = more important
  condition: (context: ITriggerContext) => boolean;
}

/** Trigger context - all signals for scene understanding */
export interface ITriggerContext {
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  recentWinRate: number;
  consecutiveLosses: number;
  emotionState: EmotionState;
  batteryLevel: number;
  isCharging: boolean;
  networkAvailable: boolean;
  friendOnlineCount: number;
  lastGameTime: number; // seconds since last game
  weatherCondition: string;
  currentLocation: string;
}

/** User profile for personalization */
export interface IUserProfile {
  userId: string;
  tasteProfile: Record<TasteDimension, number>; // 0-1 score per dimension
  preferredGameTypes: GameType[];
  preferredDifficulty: Difficulty;
  averageSessionDuration: number;
  averageReactionSpeed: number; // ms
  totalGamesPlayed: number;
  totalMicroGamesPlayed: number;
  lastActiveTime: number;
  createdAt: number;
}

/** Game session result */
export interface IGameResult {
  gameId: string;
  gameType: GameType;
  score: number;
  maxScore: number;
  duration: number; // actual seconds played
  completed: boolean;
  difficulty: Difficulty;
  timestamp: number;
}

/** Micro-game instance - runtime state */
export interface IMicroGame {
  config: IGameConfig;
  state: GameState;
  score: number;
  elapsed: number;
  entities: IGameEntity[];
}

/** Template interface - all game templates implement this */
export interface IGameTemplate {
  readonly type: GameType;
  readonly name: string;

  /** Generate a new game instance based on config */
  createGame(config: IGameConfig): IMicroGame;

  /** Handle user input */
  handleInput(game: IMicroGame, input: IGameInput): IMicroGame;

  /** Update game state per frame */
  update(game: IMicroGame, dt: number): IMicroGame;

  /** Check if game is complete */
  isComplete(game: IMicroGame): boolean;

  /** Get game result */
  getResult(game: IMicroGame): IGameResult;
}

/** User input during game */
export interface IGameInput {
  type: 'tap' | 'swipe' | 'hold' | 'release';
  position: IVector2;
  timestamp: number;
  extra?: Record<string, unknown>;
}

/** Event types */
export enum GenesisEvent {
  GAME_CREATED = 'GAME_CREATED',
  GAME_STARTED = 'GAME_STARTED',
  GAME_UPDATED = 'GAME_UPDATED',
  GAME_COMPLETED = 'GAME_COMPLETED',
  GAME_FAILED = 'GAME_FAILED',
  TRIGGER_FIRED = 'TRIGGER_FIRED',
  TRIGGER_SUPPRESSED = 'TRIGGER_SUPPRESSED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  DIFFICULTY_CHANGED = 'DIFFICULTY_CHANGED',
  SCORE_CHANGED = 'SCORE_CHANGED',
}

/** Event payload */
export interface IEventPayload {
  type: GenesisEvent;
  data: Record<string, unknown>;
  timestamp: number;
}
