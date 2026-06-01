/**
 * Genesis AI Micro-Game Engine - Social Engine
 *
 * Manages friend interactions, challenges, sharing, social feed, and notifications.
 */

// ========== Enums ==========

/** Social relationship status */
export enum FriendStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

/** Challenge status */
export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  DECLINED = 'DECLINED',
}

// ========== Interfaces ==========

/** Friend relationship */
export interface IFriendship {
  userId: string;
  friendId: string;
  status: FriendStatus;
  addedAt: number;
}

/** Game challenge */
export interface IGameChallenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  gameName: string;
  gameType: string;
  challengerScore: number;
  challengedScore: number;
  status: ChallengeStatus;
  createdAt: number;
  expiresAt: number;
  completedAt: number | null;
  winner: string | null;
}

/** Share record */
export interface IShareRecord {
  id: string;
  userId: string;
  gameName: string;
  score: number;
  shareType: 'screenshot' | 'result' | 'challenge' | 'achievement';
  sharedAt: number;
  shareCount: number;
}

/** Social feed item */
export interface ISocialFeedItem {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  type: 'game_completed' | 'achievement_unlocked' | 'challenge_won' | 'challenge_sent';
  gameName: string;
  score: number;
  achievementName?: string;
  timestamp: number;
  likes: number;
  comments: number;
}

/** Social notification */
export interface ISocialNotification {
  id: string;
  type: 'friend_request' | 'challenge_received' | 'challenge_result' | 'achievement_liked';
  fromUserId: string;
  toUserId: string;
  message: string;
  read: boolean;
  timestamp: number;
  data: Record<string, unknown>;
}

// ========== Helpers ==========

let _socialIdCounter = 0;

function generateSocialId(): string {
  _socialIdCounter++;
  return `social_${Date.now()}_${_socialIdCounter}`;
}

function friendshipKey(userId: string, friendId: string): string {
  return [userId, friendId].sort().join(':');
}

function generateNickname(userId: string): string {
  const prefixes = ['Swift', 'Brave', 'Cool', 'Happy', 'Star', 'Shadow', 'Bright', 'Quick'];
  const suffixes = ['Fox', 'Panda', 'Tiger', 'Wolf', 'Hawk', 'Bear', 'Lynx', 'Hare'];
  const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return `${prefixes[hash % prefixes.length]}${suffixes[(hash + 3) % suffixes.length]}`;
}

function generateAvatar(userId: string): string {
  const colors = ['#FF6B35', '#4ECDC4', '#9B59B6', '#E74C3C', '#2ECC71', '#F39C12'];
  const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

const CHALLENGE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ========== SocialEngine Class ==========

/**
 * Engine that manages social features including friendships, challenges,
 * sharing, social feed, and notifications.
 *
 * Usage:
 *   const social = new SocialEngine();
 *   social.addFriend('user1', 'user2');
 *   social.acceptFriend('user2', 'user1');
 *   const challenge = social.createChallenge('user1', 'user2', 'Tap Rush', 'REACTION');
 *   social.acceptChallenge(challenge.id);
 */
export class SocialEngine {
  private friendships: Map<string, IFriendship> = new Map();
  private challenges: Map<string, IGameChallenge> = new Map();
  private shares: Map<string, IShareRecord> = new Map();
  private feed: ISocialFeedItem[] = [];
  private notifications: Map<string, ISocialNotification[]> = new Map();
  private likeMap: Map<string, number> = new Map();

  constructor() {}

  // ---- Friend Management ----

  /**
   * Send a friend request from userId to friendId
   */
  addFriend(userId: string, friendId: string): IFriendship {
    const key = friendshipKey(userId, friendId);
    const existing = this.friendships.get(key);
    if (existing && existing.status !== FriendStatus.NONE) {
      return existing;
    }

    const friendship: IFriendship = {
      userId,
      friendId,
      status: FriendStatus.PENDING,
      addedAt: Date.now(),
    };

    this.friendships.set(key, friendship);

    this.addNotification({
      type: 'friend_request',
      fromUserId: userId,
      toUserId: friendId,
      message: `${generateNickname(userId)} sent you a friend request`,
      read: false,
      timestamp: Date.now(),
      data: { userId, friendId },
    });

    return friendship;
  }

  /**
   * Accept a pending friend request
   */
  acceptFriend(userId: string, friendId: string): IFriendship | null {
    const key = friendshipKey(userId, friendId);
    const friendship = this.friendships.get(key);

    if (!friendship || friendship.status !== FriendStatus.PENDING) {
      return null;
    }

    const updated: IFriendship = {
      ...friendship,
      status: FriendStatus.ACCEPTED,
    };

    this.friendships.set(key, updated);
    return updated;
  }

  /**
   * Remove / block a friend relationship
   */
  removeFriend(userId: string, friendId: string): boolean {
    const key = friendshipKey(userId, friendId);
    return this.friendships.delete(key);
  }

  /**
   * Get all accepted friendships for a user
   */
  getFriends(userId: string): IFriendship[] {
    return Array.from(this.friendships.values()).filter(
      (f) =>
        (f.userId === userId || f.friendId === userId) &&
        f.status === FriendStatus.ACCEPTED
    );
  }

  /**
   * Check if two users are friends (accepted)
   */
  isFriend(userId: string, friendId: string): boolean {
    const key = friendshipKey(userId, friendId);
    const friendship = this.friendships.get(key);
    return friendship?.status === FriendStatus.ACCEPTED;
  }

  /**
   * Get count of accepted friends for a user
   */
  getFriendCount(userId: string): number {
    return this.getFriends(userId).length;
  }

  // ---- Challenges ----

  /**
   * Create a new game challenge
   */
  createChallenge(from: string, to: string, gameName: string, gameType: string): IGameChallenge {
    const now = Date.now();
    const challenge: IGameChallenge = {
      id: generateSocialId(),
      fromUserId: from,
      toUserId: to,
      gameName,
      gameType,
      challengerScore: 0,
      challengedScore: 0,
      status: ChallengeStatus.PENDING,
      createdAt: now,
      expiresAt: now + CHALLENGE_TTL,
      completedAt: null,
      winner: null,
    };

    this.challenges.set(challenge.id, challenge);

    this.addNotification({
      type: 'challenge_received',
      fromUserId: from,
      toUserId: to,
      message: `${generateNickname(from)} challenged you to ${gameName}!`,
      read: false,
      timestamp: now,
      data: { challengeId: challenge.id, gameName, gameType },
    });

    this.addToFeed({
      userId: from,
      nickname: generateNickname(from),
      avatar: generateAvatar(from),
      type: 'challenge_sent',
      gameName,
      score: 0,
      timestamp: now,
      likes: 0,
      comments: 0,
    });

    return challenge;
  }

  /**
   * Accept a pending challenge
   */
  acceptChallenge(challengeId: string): IGameChallenge | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.PENDING) {
      return null;
    }

    const updated: IGameChallenge = {
      ...challenge,
      status: ChallengeStatus.ACCEPTED,
    };

    this.challenges.set(challengeId, updated);
    return updated;
  }

  /**
   * Complete a challenge with the challenger's score.
   * The challenged user's score is set when they complete it.
   */
  completeChallenge(challengeId: string, score: number): IGameChallenge | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.ACCEPTED) {
      return null;
    }

    const now = Date.now();
    let challengerScore = challenge.challengerScore;
    let challengedScore = challenge.challengedScore;
    let winner: string | null = challenge.winner;

    // First score sets the bar; second score completes the challenge
    if (challengerScore === 0 && challengedScore === 0) {
      challengerScore = score;
    } else if (challengedScore === 0 && challengerScore > 0) {
      challengedScore = score;
    } else {
      // Both scores already set — update challenger if caller is challenger
      challengerScore = score;
    }

    // Determine winner when both scores are present
    if (challengerScore > 0 && challengedScore > 0) {
      winner = challengerScore >= challengedScore
        ? challenge.fromUserId
        : challenge.toUserId;
    }

    const updated: IGameChallenge = {
      ...challenge,
      challengerScore,
      challengedScore,
      completedAt: challengerScore > 0 && challengedScore > 0 ? now : null,
      status: challengerScore > 0 && challengedScore > 0 ? ChallengeStatus.COMPLETED : ChallengeStatus.ACCEPTED,
      winner,
    };

    this.challenges.set(challengeId, updated);

    // Add to feed when fully completed
    if (updated.status === ChallengeStatus.COMPLETED && winner) {
      this.addToFeed({
        userId: winner,
        nickname: generateNickname(winner),
        avatar: generateAvatar(winner),
        type: 'challenge_won',
        gameName: challenge.gameName,
        score: Math.max(challengerScore, challengedScore),
        timestamp: now,
        likes: 0,
        comments: 0,
      });
    }

    return updated;
  }

  /**
   * Decline a pending challenge
   */
  declineChallenge(challengeId: string): IGameChallenge | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.PENDING) {
      return null;
    }

    const updated: IGameChallenge = {
      ...challenge,
      status: ChallengeStatus.DECLINED,
    };

    this.challenges.set(challengeId, updated);
    return updated;
  }

  /**
   * Get all pending challenges for a user (both sent and received)
   */
  getPendingChallenges(userId: string): IGameChallenge[] {
    return Array.from(this.challenges.values()).filter(
      (c) =>
        (c.fromUserId === userId || c.toUserId === userId) &&
        c.status === ChallengeStatus.PENDING
    );
  }

  /**
   * Get all active (accepted) challenges for a user
   */
  getActiveChallenges(userId: string): IGameChallenge[] {
    return Array.from(this.challenges.values()).filter(
      (c) =>
        (c.fromUserId === userId || c.toUserId === userId) &&
        c.status === ChallengeStatus.ACCEPTED
    );
  }

  /**
   * Get completed challenge history for a user
   */
  getChallengeHistory(userId: string): IGameChallenge[] {
    return Array.from(this.challenges.values()).filter(
      (c) =>
        (c.fromUserId === userId || c.toUserId === userId) &&
        c.status === ChallengeStatus.COMPLETED
    );
  }

  /**
   * Get challenge statistics for a user
   */
  getChallengeStats(userId: string): { sent: number; received: number; won: number; lost: number } {
    const all = Array.from(this.challenges.values()).filter(
      (c) => c.fromUserId === userId || c.toUserId === userId
    );

    const sent = all.filter((c) => c.fromUserId === userId).length;
    const received = all.filter((c) => c.toUserId === userId).length;
    const completed = all.filter((c) => c.status === ChallengeStatus.COMPLETED);
    const won = completed.filter((c) => c.winner === userId).length;
    const lost = completed.filter((c) => c.winner !== null && c.winner !== userId).length;

    return { sent, received, won, lost };
  }

  /**
   * Expire all challenges past their expiration time.
   * Returns the number of challenges that were expired.
   */
  expireChallenges(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [id, challenge] of this.challenges) {
      if (
        (challenge.status === ChallengeStatus.PENDING || challenge.status === ChallengeStatus.ACCEPTED) &&
        challenge.expiresAt <= now
      ) {
        this.challenges.set(id, {
          ...challenge,
          status: ChallengeStatus.EXPIRED,
        });
        expiredCount++;
      }
    }

    return expiredCount;
  }

  // ---- Sharing ----

  /**
   * Record a share action
   */
  shareResult(userId: string, gameName: string, score: number, type: IShareRecord['shareType']): IShareRecord {
    const record: IShareRecord = {
      id: generateSocialId(),
      userId,
      gameName,
      score,
      shareType: type,
      sharedAt: Date.now(),
      shareCount: 1,
    };

    this.shares.set(record.id, record);
    return record;
  }

  /**
   * Get all shares for a user
   */
  getShares(userId: string): IShareRecord[] {
    return Array.from(this.shares.values()).filter((s) => s.userId === userId);
  }

  // ---- Feed ----

  /**
   * Add an item to the social feed
   */
  addToFeed(item: Omit<ISocialFeedItem, 'id'>): ISocialFeedItem {
    const feedItem: ISocialFeedItem = {
      id: generateSocialId(),
      ...item,
    };

    this.feed.push(feedItem);
    return feedItem;
  }

  /**
   * Get social feed items, most recent first
   */
  getFeed(limit: number = 20, offset: number = 0): ISocialFeedItem[] {
    const sorted = [...this.feed].sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(offset, offset + limit);
  }

  /**
   * Like a feed item
   */
  likeFeedItem(itemId: string): void {
    const current = this.likeMap.get(itemId) ?? 0;
    this.likeMap.set(itemId, current + 1);

    const item = this.feed.find((f) => f.id === itemId);
    if (item) {
      item.likes = current + 1;
    }
  }

  // ---- Notifications ----

  /**
   * Add a notification for a user
   */
  addNotification(notification: Omit<ISocialNotification, 'id'>): ISocialNotification {
    const full: ISocialNotification = {
      id: generateSocialId(),
      ...notification,
    };

    const userNotifications = this.notifications.get(full.toUserId) ?? [];
    userNotifications.push(full);
    this.notifications.set(full.toUserId, userNotifications);

    return full;
  }

  /**
   * Get all notifications for a user, most recent first
   */
  getNotifications(userId: string): ISocialNotification[] {
    const userNotifications = this.notifications.get(userId) ?? [];
    return [...userNotifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Mark a notification as read
   */
  markRead(notificationId: string, userId: string): void {
    const userNotifications = this.notifications.get(userId) ?? [];
    const notification = userNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Get count of unread notifications for a user
   */
  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) ?? [];
    return userNotifications.filter((n) => !n.read).length;
  }
}
