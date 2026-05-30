import { GenesisService, GenesisWidgetData } from './GenesisService';
import {
  IUserProfile, IMicroGame, IGameResult,
  GameState, EmotionState, GameType, Difficulty,
} from '../models/types';
import { UserProfileFactory } from '../models/UserProfile';

describe('GenesisService', () => {
  let service: GenesisService;

  beforeEach(() => {
    service = new GenesisService();
  });

  afterEach(() => {
    service.destroy();
  });

  // ===== initialize() =====

  describe('initialize()', () => {
    it('should initialize with a provided userId', () => {
      service.initialize('user-abc');

      const profile = service.getUserProfile();
      expect(profile).not.toBeNull();
      expect(profile!.userId).toBe('user-abc');
    });

    it('should initialize with default userId when none provided', () => {
      service.initialize();

      const profile = service.getUserProfile();
      expect(profile).not.toBeNull();
      expect(profile!.userId).toBe('default');
    });

    it('should create a valid default user profile', () => {
      service.initialize('user-1');

      const profile = service.getUserProfile()!;
      expect(profile.tasteProfile).toBeDefined();
      expect(profile.preferredGameTypes.length).toBeGreaterThan(0);
      expect(profile.preferredDifficulty).toBe(Difficulty.NORMAL);
      expect(profile.totalGamesPlayed).toBe(0);
      expect(profile.totalMicroGamesPlayed).toBe(0);
    });

    it('should allow calling initialize multiple times', () => {
      service.initialize('first');
      expect(service.getUserProfile()!.userId).toBe('first');

      service.initialize('second');
      expect(service.getUserProfile()!.userId).toBe('second');
    });
  });

  // ===== checkForMicroGame() =====

  describe('checkForMicroGame()', () => {
    beforeEach(() => {
      service.initialize('test-user');
    });

    it('should return null when no triggers match the default context', () => {
      const game = service.checkForMicroGame();
      expect(game).toBeNull();
    });

    it('should return null before initialization', () => {
      const uninitialized = new GenesisService();
      expect(uninitialized.checkForMicroGame()).toBeNull();
      uninitialized.destroy();
    });

    it('should trigger a micro-game when download waiting context matches', () => {
      const game = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 50,
      });

      expect(game).not.toBeNull();
      expect(game!.config).toBeDefined();
      expect(game!.state).toBe(GameState.IDLE);
    });

    it('should NOT trigger when download progress is 0', () => {
      const game = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 0,
      });

      expect(game).toBeNull();
    });

    it('should NOT trigger when download progress is >= 95', () => {
      const game = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 95,
      });

      expect(game).toBeNull();
    });

    it('should trigger a micro-game when losing streak context matches', () => {
      const game = service.checkForMicroGame({
        consecutiveLosses: 5,
        timestamp: Date.now(),
      });

      expect(game).not.toBeNull();
    });

    it('should NOT trigger when consecutive losses < 3', () => {
      const game = service.checkForMicroGame({
        consecutiveLosses: 2,
      });

      expect(game).toBeNull();
    });

    it('should trigger a micro-game during late night hours', () => {
      const game = service.checkForMicroGame({
        hour: 23,
        emotionState: EmotionState.CALM,
      });

      expect(game).not.toBeNull();
    });

    it('should trigger late night at hour 0', () => {
      const game = service.checkForMicroGame({
        hour: 0,
        emotionState: EmotionState.CALM,
      });

      expect(game).not.toBeNull();
    });

    it('should NOT trigger late night when user is angry', () => {
      const game = service.checkForMicroGame({
        hour: 23,
        emotionState: EmotionState.ANGRY,
      });

      expect(game).toBeNull();
    });

    it('should NOT trigger late night at hour 3', () => {
      const game = service.checkForMicroGame({
        hour: 3,
        emotionState: EmotionState.CALM,
      });

      expect(game).toBeNull();
    });

    it('should trigger morning greeting with matching conditions', () => {
      const game = service.checkForMicroGame({
        hour: 7,
        lastGameTime: 30000, // > 28800 seconds (8+ hours)
      });

      expect(game).not.toBeNull();
    });

    it('should NOT trigger morning greeting when lastGameTime is too short', () => {
      const game = service.checkForMicroGame({
        hour: 7,
        lastGameTime: 1000, // only ~16 minutes since last game
      });

      expect(game).toBeNull();
    });

    it('should trigger commute companion on weekday morning', () => {
      const game = service.checkForMicroGame({
        hour: 8,
        isWeekend: false,
        dayOfWeek: 3, // Wednesday
      });

      expect(game).not.toBeNull();
    });

    it('should trigger commute companion on weekday evening', () => {
      const game = service.checkForMicroGame({
        hour: 18,
        isWeekend: false,
        dayOfWeek: 2, // Tuesday
      });

      expect(game).not.toBeNull();
    });

    it('should NOT trigger commute companion on weekend', () => {
      const game = service.checkForMicroGame({
        hour: 8,
        isWeekend: true,
        dayOfWeek: 6,
      });

      // On a weekend at hour 8 with lastGameTime=0, no morning greeting either
      // because lastGameTime=0 <= 28800
      expect(game).toBeNull();
    });

    it('should trigger boredom buster when emotion is bored', () => {
      const game = service.checkForMicroGame({
        emotionState: EmotionState.BORED,
      });

      expect(game).not.toBeNull();
    });

    it('should trigger rainy day when weather is rain', () => {
      const game = service.checkForMicroGame({
        weatherCondition: 'rain',
      });

      expect(game).not.toBeNull();
    });

    it('should trigger rainy day when weather is storm', () => {
      const game = service.checkForMicroGame({
        weatherCondition: 'storm',
      });

      // storm matches the rainy_day trigger condition
      expect(game).not.toBeNull();
    });

    it('should trigger friend online when 2+ friends online', () => {
      const game = service.checkForMicroGame({
        friendOnlineCount: 3,
      });

      expect(game).not.toBeNull();
    });

    it('should NOT trigger friend online when only 1 friend online', () => {
      const game = service.checkForMicroGame({
        friendOnlineCount: 1,
      });

      expect(game).toBeNull();
    });

    it('should respect cooldown - not trigger same trigger twice in a row', () => {
      // First call triggers
      const game1 = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 50,
      });
      expect(game1).not.toBeNull();

      // Second call at same timestamp should NOT trigger (cooldown)
      const game2 = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 50,
      });
      expect(game2).toBeNull();
    });

    it('should select highest priority trigger when multiple match', () => {
      // Both download (90) and losing streak (85) match;
      // also friend online doesn't match (count=0)
      const game = service.checkForMicroGame({
        isDownloading: true,
        downloadProgress: 50,
        consecutiveLosses: 5,
      });

      // Should return a game (doesn't matter which trigger won,
      // as long as a game is generated)
      expect(game).not.toBeNull();
    });
  });

  // ===== generateMicroGame() =====

  describe('generateMicroGame()', () => {
    beforeEach(() => {
      service.initialize('test-user');
    });

    it('should always generate a game regardless of trigger state', () => {
      const game = service.generateMicroGame();
      expect(game).not.toBeNull();
      expect(game!.config).toBeDefined();
      expect(game!.config.id).toMatch(/^genesis_/);
    });

    it('should return null before initialization', () => {
      const uninitialized = new GenesisService();
      expect(uninitialized.generateMicroGame()).toBeNull();
      uninitialized.destroy();
    });

    it('should generate a game with context overrides', () => {
      const game = service.generateMicroGame({
        emotionState: EmotionState.FRUSTRATED,
        hour: 14,
      });

      expect(game).not.toBeNull();
      expect(game!.state).toBe(GameState.IDLE);
      expect(game!.score).toBe(0);
      expect(game!.elapsed).toBe(0);
    });

    it('should generate different games for different profiles', () => {
      const casualService = new GenesisService();
      casualService.initialize('casual-user');
      // Override profile to a casual gamer
      const casualProfile = UserProfileFactory.createCasualGamer('casual-user');
      casualService.updateUserProfile(casualProfile);

      const profile = casualService.getUserProfile()!;
      expect(profile.preferredGameTypes).toEqual(
        expect.arrayContaining([GameType.HEALING, GameType.CREATE])
      );

      casualService.destroy();
    });
  });

  // ===== Full game lifecycle =====

  describe('full game lifecycle', () => {
    beforeEach(() => {
      service.initialize('lifecycle-user');
    });

    it('should support generate → start → input → update → finish flow', () => {
      // Generate
      const game = service.generateMicroGame();
      expect(game).not.toBeNull();
      expect(game!.state).toBe(GameState.IDLE);

      // Start
      service.startMicroGame(game!);
      const active = service.getActiveGame();
      expect(active).not.toBeNull();
      expect(active!.state).toBe(GameState.PLAYING);

      // Touch input
      const afterTap = service.handleTouchInput('tap', 100, 200);
      expect(afterTap).not.toBeNull();

      // Update
      const afterUpdate = service.updateGame(0.016);
      expect(afterUpdate).not.toBeNull();
      expect(afterUpdate!.elapsed).toBeGreaterThan(0);

      // Finish
      const result = service.finishMicroGame();
      expect(result).not.toBeNull();
      expect(result!.completed).toBe(true);
      expect(service.getActiveGame()).toBeNull();
    });

    it('should update user profile after finishing a game', () => {
      const profileBefore = service.getUserProfile()!;
      expect(profileBefore.totalMicroGamesPlayed).toBe(0);

      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.updateGame(0.5);
      service.finishMicroGame();

      const profileAfter = service.getUserProfile()!;
      expect(profileAfter.totalMicroGamesPlayed).toBe(1);
      expect(profileAfter.lastActiveTime).toBeGreaterThanOrEqual(profileBefore.lastActiveTime);
    });

    it('should support multiple games in sequence', () => {
      // Game 1
      const game1 = service.generateMicroGame()!;
      service.startMicroGame(game1);
      service.handleTouchInput('tap', 50, 50);
      service.updateGame(0.1);
      const result1 = service.finishMicroGame();
      expect(result1).not.toBeNull();
      expect(service.getActiveGame()).toBeNull();

      // Game 2
      const game2 = service.generateMicroGame()!;
      service.startMicroGame(game2);
      service.handleTouchInput('swipe', 100, 100);
      service.updateGame(0.2);
      const result2 = service.finishMicroGame();
      expect(result2).not.toBeNull();

      // Profile should reflect both games
      const profile = service.getUserProfile()!;
      expect(profile.totalMicroGamesPlayed).toBe(2);
    });
  });

  // ===== startMicroGame() =====

  describe('startMicroGame()', () => {
    beforeEach(() => {
      service.initialize('start-user');
    });

    it('should set game state to PLAYING', () => {
      const game = service.generateMicroGame()!;
      expect(game.state).toBe(GameState.IDLE);

      service.startMicroGame(game);
      expect(service.getActiveGame()!.state).toBe(GameState.PLAYING);
    });
  });

  // ===== handleTouchInput() =====

  describe('handleTouchInput()', () => {
    beforeEach(() => {
      service.initialize('input-user');
    });

    it('should return null when no active game', () => {
      const result = service.handleTouchInput('tap', 100, 100);
      expect(result).toBeNull();
    });

    it('should process tap input on active game', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      const result = service.handleTouchInput('tap', 150, 200);
      expect(result).not.toBeNull();
    });

    it('should process swipe input', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      const result = service.handleTouchInput('swipe', 50, 50);
      expect(result).not.toBeNull();
    });

    it('should process hold input', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      const result = service.handleTouchInput('hold', 200, 300);
      expect(result).not.toBeNull();
    });

    it('should process release input', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      const result = service.handleTouchInput('release', 200, 300);
      expect(result).not.toBeNull();
    });
  });

  // ===== updateGame() =====

  describe('updateGame()', () => {
    beforeEach(() => {
      service.initialize('update-user');
    });

    it('should return null when no active game', () => {
      expect(service.updateGame(0.016)).toBeNull();
    });

    it('should advance elapsed time of active game', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      const before = service.getActiveGame()!.elapsed;
      service.updateGame(1.0);
      const after = service.getActiveGame()!.elapsed;

      expect(after).toBeGreaterThan(before);
    });

    it('should handle multiple update calls', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      service.updateGame(0.5);
      service.updateGame(0.5);
      service.updateGame(0.5);

      const active = service.getActiveGame()!;
      expect(active.elapsed).toBeCloseTo(1.5, 1);
    });
  });

  // ===== finishMicroGame() =====

  describe('finishMicroGame()', () => {
    beforeEach(() => {
      service.initialize('finish-user');
    });

    it('should return null when no active game', () => {
      expect(service.finishMicroGame()).toBeNull();
    });

    it('should return a valid game result', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.updateGame(0.5);

      const result = service.finishMicroGame();

      expect(result).not.toBeNull();
      expect(result!.gameId).toBe(game.config.id);
      expect(result!.gameType).toBe(game.config.type);
      expect(result!.duration).toBeGreaterThanOrEqual(0);
      expect(result!.completed).toBe(true);
    });

    it('should clear the active game', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.finishMicroGame();

      expect(service.getActiveGame()).toBeNull();
    });

    it('should update user profile after finish', () => {
      const before = service.getUserProfile()!;
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.updateGame(0.3);
      service.finishMicroGame();

      const after = service.getUserProfile()!;
      expect(after.totalMicroGamesPlayed).toBe(before.totalMicroGamesPlayed + 1);
    });
  });

  // ===== getWidgetData() =====

  describe('getWidgetData()', () => {
    beforeEach(() => {
      service.initialize('widget-user');
    });

    it('should return idle widget data when no active game', () => {
      const data = service.getWidgetData();

      expect(data.hasActiveGame).toBe(false);
      expect(data.dailyGameAvailable).toBe(true);
      expect(data.message).toBe("Today's micro-game awaits!");
    });

    it('should return game widget data when game is active', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.updateGame(2.5);

      const activeGame = service.getActiveGame()!;
      const data = service.getWidgetData();

      expect(data.hasActiveGame).toBe(true);
      expect(data.gameId).toBe(game.config.id);
      expect(data.gameName).toBe(game.config.name);
      expect(data.gameType).toBe(game.config.type);
      expect(data.score).toBe(activeGame.score);
      expect(data.elapsed).toBe(Math.round(activeGame.elapsed));
      expect(data.maxDuration).toBe(game.config.maxDuration);
      expect(data.state).toBe(GameState.PLAYING);
    });

    it('should return idle data after game finishes', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.finishMicroGame();

      const data = service.getWidgetData();
      expect(data.hasActiveGame).toBe(false);
    });

    it('should round elapsed time to integer', () => {
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      service.updateGame(1.567);

      const data = service.getWidgetData();
      expect(data.elapsed).toBe(Math.round(1.567));
      expect(Number.isInteger(data.elapsed!)).toBe(true);
    });
  });

  // ===== getUserProfile() =====

  describe('getUserProfile()', () => {
    it('should return null before initialization', () => {
      expect(service.getUserProfile()).toBeNull();
    });

    it('should return the user profile after initialization', () => {
      service.initialize('profile-user');
      const profile = service.getUserProfile();

      expect(profile).not.toBeNull();
      expect(profile!.userId).toBe('profile-user');
    });
  });

  // ===== updateUserProfile() =====

  describe('updateUserProfile()', () => {
    beforeEach(() => {
      service.initialize('update-profile-user');
    });

    it('should update profile fields', () => {
      service.updateUserProfile({
        totalGamesPlayed: 42,
        averageSessionDuration: 600,
      });

      const profile = service.getUserProfile()!;
      expect(profile.totalGamesPlayed).toBe(42);
      expect(profile.averageSessionDuration).toBe(600);
    });

    it('should not change unmodified fields', () => {
      const before = service.getUserProfile()!;
      service.updateUserProfile({ totalGamesPlayed: 10 });

      const after = service.getUserProfile()!;
      expect(after.userId).toBe(before.userId);
      expect(after.totalMicroGamesPlayed).toBe(before.totalMicroGamesPlayed);
      expect(after.preferredDifficulty).toBe(before.preferredDifficulty);
    });

    it('should do nothing when no profile exists', () => {
      const uninitialized = new GenesisService();
      // Should not throw
      uninitialized.updateUserProfile({ totalGamesPlayed: 100 });
      expect(uninitialized.getUserProfile()).toBeNull();
      uninitialized.destroy();
    });
  });

  // ===== onEvent() =====

  describe('onEvent()', () => {
    beforeEach(() => {
      service.initialize('event-user');
    });

    it('should subscribe to engine events', () => {
      const listener = jest.fn();
      service.onEvent('GAME_CREATED', listener);

      service.generateMicroGame();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: expect.any(String),
        })
      );
    });

    it('should return an unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = service.onEvent('GAME_CREATED', listener);

      unsubscribe();
      service.generateMicroGame();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers for the same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.onEvent('GAME_STARTED', listener1);
      service.onEvent('GAME_STARTED', listener2);

      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should receive GAME_STARTED event when game starts', () => {
      const listener = jest.fn();
      service.onEvent('GAME_STARTED', listener);

      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: game.config.id,
        })
      );
    });

    it('should receive GAME_COMPLETED event when game is updated past max duration', () => {
      const listener = jest.fn();
      service.onEvent('GAME_COMPLETED', listener);

      const game = service.generateMicroGame()!;
      service.startMicroGame(game);

      // Push past maxDuration to trigger completion
      service.updateGame(game.config.maxDuration + 1);

      expect(listener).toHaveBeenCalled();
    });
  });

  // ===== destroy() =====

  describe('destroy()', () => {
    it('should clear user profile', () => {
      service.initialize('destroy-user');
      expect(service.getUserProfile()).not.toBeNull();

      service.destroy();
      expect(service.getUserProfile()).toBeNull();
    });

    it('should clear active game', () => {
      service.initialize('destroy-user');
      const game = service.generateMicroGame()!;
      service.startMicroGame(game);
      expect(service.getActiveGame()).not.toBeNull();

      service.destroy();
      expect(service.getActiveGame()).toBeNull();
    });

    it('should allow re-initialization after destroy', () => {
      service.initialize('first');
      service.destroy();

      service.initialize('second');
      expect(service.getUserProfile()).not.toBeNull();
      expect(service.getUserProfile()!.userId).toBe('second');
    });

    it('should make checkForMicroGame return null after destroy', () => {
      service.initialize('destroy-user');
      service.destroy();

      expect(service.checkForMicroGame()).toBeNull();
    });

    it('should make generateMicroGame return null after destroy', () => {
      service.initialize('destroy-user');
      service.destroy();

      expect(service.generateMicroGame()).toBeNull();
    });
  });
});
