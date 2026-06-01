import {
  SocialEngine,
  FriendStatus,
  ChallengeStatus,
} from './SocialEngine';

describe('SocialEngine', () => {
  let engine: SocialEngine;

  beforeEach(() => {
    engine = new SocialEngine();
  });

  // ===== addFriend =====

  describe('addFriend()', () => {
    it('should create a pending friendship', () => {
      const friendship = engine.addFriend('user-1', 'user-2');

      expect(friendship).toBeDefined();
      expect(friendship.status).toBe(FriendStatus.PENDING);
      expect(friendship.userId).toBe('user-1');
      expect(friendship.friendId).toBe('user-2');
    });

    it('should return existing friendship if already added', () => {
      const first = engine.addFriend('user-1', 'user-2');
      const second = engine.addFriend('user-1', 'user-2');

      expect(second.status).toBe(FriendStatus.PENDING);
    });
  });

  // ===== acceptFriend =====

  describe('acceptFriend()', () => {
    it('should accept a pending friend request', () => {
      engine.addFriend('user-1', 'user-2');
      const accepted = engine.acceptFriend('user-2', 'user-1');

      expect(accepted).not.toBeNull();
      expect(accepted!.status).toBe(FriendStatus.ACCEPTED);
    });

    it('should return null if no pending request', () => {
      const result = engine.acceptFriend('user-1', 'user-2');
      expect(result).toBeNull();
    });
  });

  // ===== getFriends =====

  describe('getFriends()', () => {
    it('should return accepted friends', () => {
      engine.addFriend('user-1', 'user-2');
      engine.acceptFriend('user-2', 'user-1');

      const friends = engine.getFriends('user-1');
      expect(friends.length).toBe(1);
      expect(friends[0].status).toBe(FriendStatus.ACCEPTED);
    });

    it('should not include pending friendships', () => {
      engine.addFriend('user-1', 'user-2');
      const friends = engine.getFriends('user-1');
      expect(friends.length).toBe(0);
    });
  });

  // ===== isFriend =====

  describe('isFriend()', () => {
    it('should return false when not friends', () => {
      expect(engine.isFriend('user-1', 'user-2')).toBe(false);
    });

    it('should return true for accepted friends', () => {
      engine.addFriend('user-1', 'user-2');
      engine.acceptFriend('user-2', 'user-1');
      expect(engine.isFriend('user-1', 'user-2')).toBe(true);
    });

    it('should return false for pending friends', () => {
      engine.addFriend('user-1', 'user-2');
      expect(engine.isFriend('user-1', 'user-2')).toBe(false);
    });
  });

  // ===== createChallenge =====

  describe('createChallenge()', () => {
    it('should create a pending challenge', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');

      expect(challenge).toBeDefined();
      expect(challenge.fromUserId).toBe('user-1');
      expect(challenge.toUserId).toBe('user-2');
      expect(challenge.gameName).toBe('RhythmTap');
      expect(challenge.status).toBe(ChallengeStatus.PENDING);
      expect(challenge.challengerScore).toBe(0);
      expect(challenge.challengedScore).toBe(0);
      expect(challenge.winner).toBeNull();
    });
  });

  // ===== acceptChallenge =====

  describe('acceptChallenge()', () => {
    it('should accept a pending challenge', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      const accepted = engine.acceptChallenge(challenge.id);

      expect(accepted).not.toBeNull();
      expect(accepted!.status).toBe(ChallengeStatus.ACCEPTED);
    });

    it('should return null for non-existent challenge', () => {
      expect(engine.acceptChallenge('non-existent')).toBeNull();
    });
  });

  // ===== completeChallenge =====

  describe('completeChallenge()', () => {
    it('should set first score', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      engine.acceptChallenge(challenge.id);

      const updated = engine.completeChallenge(challenge.id, 500);
      expect(updated).not.toBeNull();
      expect(updated!.challengerScore).toBe(500);
      expect(updated!.status).toBe(ChallengeStatus.ACCEPTED); // not both scores yet
    });

    it('should complete when both scores are set', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      engine.acceptChallenge(challenge.id);

      engine.completeChallenge(challenge.id, 500);
      const updated = engine.completeChallenge(challenge.id, 300);

      expect(updated!.status).toBe(ChallengeStatus.COMPLETED);
      expect(updated!.winner).toBe('user-1'); // higher score
      expect(updated!.completedAt).not.toBeNull();
    });

    it('should return null for non-accepted challenge', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      const result = engine.completeChallenge(challenge.id, 500);
      expect(result).toBeNull();
    });
  });

  // ===== declineChallenge =====

  describe('declineChallenge()', () => {
    it('should decline a pending challenge', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      const declined = engine.declineChallenge(challenge.id);

      expect(declined).not.toBeNull();
      expect(declined!.status).toBe(ChallengeStatus.DECLINED);
    });

    it('should return null for non-pending challenge', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      engine.acceptChallenge(challenge.id);

      const result = engine.declineChallenge(challenge.id);
      expect(result).toBeNull();
    });
  });

  // ===== getChallengeStats =====

  describe('getChallengeStats()', () => {
    it('should return empty stats initially', () => {
      const stats = engine.getChallengeStats('user-1');
      expect(stats.sent).toBe(0);
      expect(stats.received).toBe(0);
      expect(stats.won).toBe(0);
      expect(stats.lost).toBe(0);
    });

    it('should track sent and received challenges', () => {
      engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');

      const stats1 = engine.getChallengeStats('user-1');
      expect(stats1.sent).toBe(1);

      const stats2 = engine.getChallengeStats('user-2');
      expect(stats2.received).toBe(1);
    });

    it('should track wins and losses', () => {
      const challenge = engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      engine.acceptChallenge(challenge.id);
      engine.completeChallenge(challenge.id, 500);
      engine.completeChallenge(challenge.id, 300);

      const stats1 = engine.getChallengeStats('user-1');
      expect(stats1.won).toBe(1);

      const stats2 = engine.getChallengeStats('user-2');
      expect(stats2.lost).toBe(1);
    });
  });

  // ===== shareResult =====

  describe('shareResult()', () => {
    it('should create a share record', () => {
      const share = engine.shareResult('user-1', 'RhythmTap', 500, 'result');

      expect(share).toBeDefined();
      expect(share.userId).toBe('user-1');
      expect(share.gameName).toBe('RhythmTap');
      expect(share.score).toBe(500);
      expect(share.shareType).toBe('result');
      expect(share.shareCount).toBe(1);
    });
  });

  // ===== addToFeed / getFeed =====

  describe('feed', () => {
    it('should add and retrieve feed items', () => {
      engine.addToFeed({
        userId: 'user-1',
        nickname: 'Player1',
        avatar: '😊',
        type: 'game_completed',
        gameName: 'RhythmTap',
        score: 500,
        timestamp: Date.now(),
        likes: 0,
        comments: 0,
      });

      const feed = engine.getFeed();
      expect(feed.length).toBe(1);
      expect(feed[0].type).toBe('game_completed');
    });

    it('should return feed in reverse chronological order', () => {
      engine.addToFeed({
        userId: 'user-1', nickname: 'P1', avatar: '😊',
        type: 'game_completed', gameName: 'RhythmTap', score: 100,
        timestamp: 1000, likes: 0, comments: 0,
      });
      engine.addToFeed({
        userId: 'user-2', nickname: 'P2', avatar: '😎',
        type: 'achievement_unlocked', gameName: '', score: 0,
        timestamp: 2000, likes: 0, comments: 0,
      });

      const feed = engine.getFeed();
      expect(feed[0].userId).toBe('user-2'); // most recent first
    });

    it('should support pagination', () => {
      for (let i = 0; i < 5; i++) {
        engine.addToFeed({
          userId: `user-${i}`, nickname: `P${i}`, avatar: '😊',
          type: 'game_completed', gameName: 'RhythmTap', score: i * 100,
          timestamp: Date.now() + i, likes: 0, comments: 0,
        });
      }

      const page1 = engine.getFeed(2, 0);
      expect(page1.length).toBe(2);

      const page2 = engine.getFeed(2, 2);
      expect(page2.length).toBe(2);
    });
  });

  // ===== notifications =====

  describe('notifications', () => {
    it('should create notification on friend request', () => {
      engine.addFriend('user-1', 'user-2');

      const notifications = engine.getNotifications('user-2');
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('friend_request');
      expect(notifications[0].read).toBe(false);
    });

    it('should create notification on challenge', () => {
      engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');

      const notifications = engine.getNotifications('user-2');
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('challenge_received');
    });

    it('should mark notification as read', () => {
      engine.addFriend('user-1', 'user-2');
      const notifications = engine.getNotifications('user-2');
      const notifId = notifications[0].id;

      engine.markRead(notifId, 'user-2');
      expect(notifications[0].read).toBe(true);
    });

    it('should count unread notifications', () => {
      engine.addFriend('user-1', 'user-2');
      expect(engine.getUnreadCount('user-2')).toBe(1);
    });
  });

  // ===== expireChallenges =====

  describe('expireChallenges()', () => {
    it('should not expire non-expired challenges', () => {
      engine.createChallenge('user-1', 'user-2', 'RhythmTap', 'REACTION');
      expect(engine.expireChallenges()).toBe(0);
    });
  });

  // ===== removeFriend =====

  describe('removeFriend()', () => {
    it('should remove a friendship', () => {
      engine.addFriend('user-1', 'user-2');
      engine.acceptFriend('user-2', 'user-1');
      expect(engine.isFriend('user-1', 'user-2')).toBe(true);

      const removed = engine.removeFriend('user-1', 'user-2');
      expect(removed).toBe(true);
      expect(engine.isFriend('user-1', 'user-2')).toBe(false);
    });

    it('should return false for non-existent friendship', () => {
      expect(engine.removeFriend('user-1', 'user-2')).toBe(false);
    });
  });
});
