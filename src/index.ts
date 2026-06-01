// Core
export { EventEmitter } from './core/EventEmitter';
export { Vector2 } from './core/Vector2';
export { GameLoop } from './core/GameLoop';

// Engine
export { MicroGameEngine } from './engine/MicroGameEngine';
export { TemplateFactory } from './engine/TemplateFactory';
export { TriggerEngine } from './engine/TriggerEngine';
export { PersonalizationEngine } from './engine/PersonalizationEngine';
export { LeaderboardEngine, LeaderboardWindow } from './engine/LeaderboardEngine';
export type { ILeaderboardEntry, ILeaderboardConfig, ILeaderboardQuery } from './engine/LeaderboardEngine';
export { AchievementEngine, AchievementCategory, AchievementRarity } from './engine/AchievementEngine';
export type { IAchievement, IAchievementReward, IAchievementProgress, IUnlockedAchievement, IDailyChallenge } from './engine/AchievementEngine';
export { SocialEngine, FriendStatus, ChallengeStatus } from './engine/SocialEngine';
export type { IFriendship, IGameChallenge, IShareRecord, ISocialFeedItem, ISocialNotification } from './engine/SocialEngine';
export { AnalyticsEngine, AnalyticsEventType } from './engine/AnalyticsEngine';
export type { IAnalyticsEvent, IFunnelStep, IFunnelAnalysis, IRetentionCohort, IUserAnalytics, IDashboardMetrics } from './engine/AnalyticsEngine';
export { TemplateSDK, SDK_VERSION } from './engine/TemplateSDK';
export type { ITemplateMetadata, IValidationResult, IValidationError, IValidationWarning, ICustomTemplateConfig, IRegistrationResult } from './engine/TemplateSDK';

// Models
export * from './models/types';
export { TriggerContextFactory } from './models/TriggerContext';
export { UserProfileFactory } from './models/UserProfile';

// Templates
export { EliminationGame } from './templates/EliminationGame';
export { RhythmTapGame } from './templates/RhythmTapGame';
export { MemoryFlipGame } from './templates/MemoryFlipGame';
export { BreathingGame } from './templates/BreathingGame';
export { DrawingGame } from './templates/DrawingGame';
export { ColorMatchGame } from './templates/ColorMatchGame';
export { QuickMathGame } from './templates/QuickMathGame';
export { BubblePopGame } from './templates/BubblePopGame';
export { WordScrambleGame } from './templates/WordScrambleGame';
export { ChaseLightGame } from './templates/ChaseLightGame';
export { Game2048 } from './templates/Game2048';
export { SnakeGame } from './templates/SnakeGame';
export { BreakoutGame } from './templates/BreakoutGame';
export { WhackAMoleGame } from './templates/WhackAMoleGame';
export { CatchCoinsGame } from './templates/CatchCoinsGame';
export { TicTacToeGame } from './templates/TicTacToeGame';
export { PianoTilesGame } from './templates/PianoTilesGame';
export { MazeGame } from './templates/MazeGame';
export { ReflexGame } from './templates/ReflexGame';
export { SimonSaysGame } from './templates/SimonSaysGame';
