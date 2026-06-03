/**
 * Genesis AI Micro-Game Engine - Cloud Sync Engine
 *
 * Cross-device state synchronization with conflict resolution.
 * Supports device registration, push/pull sync, backup/restore,
 * and multiple conflict resolution strategies.
 */

import * as crypto from 'crypto';

// ========== Enums ==========

/** Sync status */
export enum SyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  CONFLICT = 'CONFLICT',
  SYNCED = 'SYNCED',
  ERROR = 'ERROR',
}

/** Conflict resolution strategy */
export enum ConflictStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  MERGE = 'MERGE',
  MANUAL = 'MANUAL',
  SERVER_WINS = 'SERVER_WINS',
}

// ========== Interfaces ==========

/** Syncable data */
export interface ISyncData {
  userProfile: Record<string, unknown>;
  gameHistory: Array<Record<string, unknown>>;
  achievements: string[];
  leaderboardScores: Array<Record<string, unknown>>;
  settings: Record<string, unknown>;
  wallet: Record<string, unknown>;
}

/** Sync data packet */
export interface ISyncPacket {
  userId: string;
  deviceId: string;
  timestamp: number;
  version: number;
  data: ISyncData;
  checksum: string;
}

/** Sync result */
export interface ISyncResult {
  status: SyncStatus;
  syncedAt: number;
  conflicts: ISyncConflict[];
  version: number;
}

/** Sync conflict */
export interface ISyncConflict {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  resolved: boolean;
  resolvedValue: unknown;
}

/** Device registration */
export interface IDeviceRegistration {
  deviceId: string;
  userId: string;
  deviceName: string;
  platform: string;
  lastSyncAt: number;
  registeredAt: number;
}

/**
 * CloudSyncEngine - Manages cross-device state synchronization
 * with automatic conflict resolution and backup support.
 */
export class CloudSyncEngine {
  private cloudData: Map<string, ISyncPacket> = new Map();
  private localData: Map<string, ISyncPacket> = new Map();
  private devices: Map<string, IDeviceRegistration[]> = new Map();
  private versionCounter: number = 0;
  private backups: Map<string, { data: ISyncData; timestamp: number }> = new Map();
  private syncStatuses: Map<string, SyncStatus> = new Map();

  constructor() {
    // Initialize with idle statuses
  }

  // ========== Device Management ==========

  /**
   * Register a device for a user.
   */
  registerDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    platform: string,
  ): IDeviceRegistration {
    const registration: IDeviceRegistration = {
      deviceId,
      userId,
      deviceName,
      platform,
      lastSyncAt: 0,
      registeredAt: Date.now(),
    };

    const userDevices = this.devices.get(userId) ?? [];

    // Check if device already registered — update instead
    const existingIndex = userDevices.findIndex(d => d.deviceId === deviceId);
    if (existingIndex >= 0) {
      userDevices[existingIndex] = {
        ...userDevices[existingIndex],
        deviceName,
        platform,
      };
    } else {
      userDevices.push(registration);
    }

    this.devices.set(userId, userDevices);
    return registration;
  }

  /**
   * Get all registered devices for a user.
   */
  getDevices(userId: string): IDeviceRegistration[] {
    return this.devices.get(userId) ?? [];
  }

  /**
   * Remove a device registration.
   */
  removeDevice(userId: string, deviceId: string): boolean {
    const userDevices = this.devices.get(userId);
    if (!userDevices) return false;

    const initialLength = userDevices.length;
    const filtered = userDevices.filter(d => d.deviceId !== deviceId);

    if (filtered.length === initialLength) return false;

    this.devices.set(userId, filtered);
    return true;
  }

  // ========== Sync Operations ==========

  /**
   * Push local data to the cloud.
   */
  pushLocal(userId: string, deviceId: string, data: ISyncData): ISyncResult {
    this.syncStatuses.set(userId, SyncStatus.SYNCING);

    const now = Date.now();
    const version = ++this.versionCounter;
    const checksum = this.generateChecksum(data);

    const packet: ISyncPacket = {
      userId,
      deviceId,
      timestamp: now,
      version,
      data,
      checksum,
    };

    // Check for conflicts with existing cloud data
    const existingCloud = this.cloudData.get(userId);
    const conflicts: ISyncConflict[] = [];

    if (existingCloud) {
      // Detect field-level conflicts
      const fieldConflicts = this.detectConflicts(
        this.localData.get(userId) ?? packet,
        existingCloud,
      );
      conflicts.push(...fieldConflicts);
    }

    if (conflicts.length > 0 && conflicts.some(c => !c.resolved)) {
      // Auto-resolve conflicts
      const resolvedConflicts = conflicts.map(c =>
        this.resolveConflict(c, ConflictStrategy.LAST_WRITE_WINS),
      );

      this.cloudData.set(userId, packet);
      this.localData.set(userId, packet);

      // Update device last sync time
      this.updateDeviceSyncTime(userId, deviceId, now);

      this.syncStatuses.set(userId, SyncStatus.CONFLICT);

      return {
        status: SyncStatus.CONFLICT,
        syncedAt: now,
        conflicts: resolvedConflicts,
        version,
      };
    }

    this.cloudData.set(userId, packet);
    this.localData.set(userId, packet);

    // Update device last sync time
    this.updateDeviceSyncTime(userId, deviceId, now);

    this.syncStatuses.set(userId, SyncStatus.SYNCED);

    return {
      status: SyncStatus.SYNCED,
      syncedAt: now,
      conflicts: [],
      version,
    };
  }

  /**
   * Pull remote data from the cloud.
   */
  pullRemote(userId: string, deviceId: string): ISyncResult {
    this.syncStatuses.set(userId, SyncStatus.SYNCING);

    const cloudPacket = this.cloudData.get(userId);

    if (!cloudPacket) {
      this.syncStatuses.set(userId, SyncStatus.IDLE);
      return {
        status: SyncStatus.IDLE,
        syncedAt: Date.now(),
        conflicts: [],
        version: 0,
      };
    }

    // Check for conflicts with local data
    const localPacket = this.localData.get(userId);
    const conflicts: ISyncConflict[] = [];

    if (localPacket && localPacket.version !== cloudPacket.version) {
      const fieldConflicts = this.detectConflicts(localPacket, cloudPacket);
      conflicts.push(...fieldConflicts);
    }

    // Update local with cloud data
    this.localData.set(userId, cloudPacket);
    this.updateDeviceSyncTime(userId, deviceId, Date.now());

    if (conflicts.length > 0) {
      this.syncStatuses.set(userId, SyncStatus.CONFLICT);
      return {
        status: SyncStatus.CONFLICT,
        syncedAt: Date.now(),
        conflicts,
        version: cloudPacket.version,
      };
    }

    this.syncStatuses.set(userId, SyncStatus.SYNCED);
    return {
      status: SyncStatus.SYNCED,
      syncedAt: Date.now(),
      conflicts: [],
      version: cloudPacket.version,
    };
  }

  /**
   * Perform a full bidirectional sync.
   */
  fullSync(userId: string, deviceId: string, localSyncData: ISyncData): ISyncResult {
    this.syncStatuses.set(userId, SyncStatus.SYNCING);

    const now = Date.now();
    const cloudPacket = this.cloudData.get(userId);

    // No cloud data yet — just push local
    if (!cloudPacket) {
      return this.pushLocal(userId, deviceId, localSyncData);
    }

    // Detect conflicts between local and cloud
    const localChecksum = this.generateChecksum(localSyncData);
    const localPacket: ISyncPacket = {
      userId,
      deviceId,
      timestamp: now,
      version: this.versionCounter + 1,
      data: localSyncData,
      checksum: localChecksum,
    };

    const conflicts = this.detectConflicts(localPacket, cloudPacket);
    const unresolvedConflicts = conflicts.filter(c => !c.resolved);

    if (unresolvedConflicts.length > 0) {
      // Auto-resolve using merge strategy
      const resolved = conflicts.map(c =>
        this.resolveConflict(c, ConflictStrategy.MERGE),
      );

      // Merge data (merged data used via mergedPacket below)
      this.mergeSyncData(localSyncData, cloudPacket.data);
      const mergedPacket = this.autoResolve(localPacket, cloudPacket);

      this.cloudData.set(userId, mergedPacket);
      this.localData.set(userId, mergedPacket);
      this.updateDeviceSyncTime(userId, deviceId, now);

      this.syncStatuses.set(userId, SyncStatus.CONFLICT);

      return {
        status: SyncStatus.CONFLICT,
        syncedAt: now,
        conflicts: resolved,
        version: mergedPacket.version,
      };
    }

    // No conflicts — push local as latest
    const version = ++this.versionCounter;
    const newPacket: ISyncPacket = {
      userId,
      deviceId,
      timestamp: now,
      version,
      data: localSyncData,
      checksum: localChecksum,
    };

    this.cloudData.set(userId, newPacket);
    this.localData.set(userId, newPacket);
    this.updateDeviceSyncTime(userId, deviceId, now);

    this.syncStatuses.set(userId, SyncStatus.SYNCED);

    return {
      status: SyncStatus.SYNCED,
      syncedAt: now,
      conflicts: [],
      version,
    };
  }

  // ========== Conflict Resolution ==========

  /**
   * Resolve a single conflict using the specified strategy.
   */
  resolveConflict(conflict: ISyncConflict, strategy: ConflictStrategy): ISyncConflict {
    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        return {
          ...conflict,
          resolved: true,
          resolvedValue: conflict.localValue,
        };

      case ConflictStrategy.SERVER_WINS:
        return {
          ...conflict,
          resolved: true,
          resolvedValue: conflict.remoteValue,
        };

      case ConflictStrategy.MERGE:
        return {
          ...conflict,
          resolved: true,
          resolvedValue: this.mergeValues(conflict.localValue, conflict.remoteValue),
        };

      case ConflictStrategy.MANUAL:
        return {
          ...conflict,
          resolved: false,
          resolvedValue: null,
        };

      default:
        return {
          ...conflict,
          resolved: true,
          resolvedValue: conflict.localValue,
        };
    }
  }

  /**
   * Auto-resolve between two packets, producing a merged packet.
   */
  autoResolve(local: ISyncPacket, remote: ISyncPacket): ISyncPacket {
    const mergedData = this.mergeSyncData(local.data, remote.data);
    const version = ++this.versionCounter;

    return {
      userId: local.userId,
      deviceId: local.deviceId,
      timestamp: Date.now(),
      version,
      data: mergedData,
      checksum: this.generateChecksum(mergedData),
    };
  }

  // ========== Data Management ==========

  /**
   * Get the current cloud data for a user.
   */
  getCloudData(userId: string): ISyncPacket | null {
    return this.cloudData.get(userId) ?? null;
  }

  /**
   * Create a backup of a user's cloud data.
   * Returns the backup ID.
   */
  createBackup(userId: string): string {
    const cloudPacket = this.cloudData.get(userId);
    if (!cloudPacket) {
      // Create empty backup
      const backupId = `backup_${userId}_${Date.now()}`;
      this.backups.set(backupId, {
        data: this.createEmptySyncData(),
        timestamp: Date.now(),
      });
      return backupId;
    }

    const backupId = `backup_${userId}_${Date.now()}`;
    this.backups.set(backupId, {
      data: { ...cloudPacket.data },
      timestamp: Date.now(),
    });

    return backupId;
  }

  /**
   * Restore a user's data from a backup.
   */
  restoreBackup(userId: string, backupId: string): ISyncData | null {
    const backup = this.backups.get(backupId);
    if (!backup) return null;

    // Create packet from backup data
    const version = ++this.versionCounter;
    const packet: ISyncPacket = {
      userId,
      deviceId: 'restore',
      timestamp: Date.now(),
      version,
      data: { ...backup.data },
      checksum: this.generateChecksum(backup.data),
    };

    this.cloudData.set(userId, packet);
    this.localData.set(userId, packet);

    return { ...backup.data };
  }

  // ========== Utility ==========

  /**
   * Generate a checksum for sync data.
   */
  generateChecksum(data: ISyncData): string {
    const serialized = JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 16);
  }

  /**
   * Get the current sync status for a user.
   */
  getSyncStatus(userId: string): SyncStatus {
    return this.syncStatuses.get(userId) ?? SyncStatus.IDLE;
  }

  /**
   * Estimate the data size in bytes for a user's cloud data.
   */
  getDataSize(userId: string): number {
    const packet = this.cloudData.get(userId);
    if (!packet) return 0;

    return Buffer.byteLength(JSON.stringify(packet.data), 'utf-8');
  }

  // ========== Private Methods ==========

  /**
   * Detect field-level conflicts between local and remote packets.
   */
  private detectConflicts(local: ISyncPacket, remote: ISyncPacket): ISyncConflict[] {
    const conflicts: ISyncConflict[] = [];

    // Compare top-level data fields
    const localData = local.data;
    const remoteData = remote.data;

    // Compare userProfile
    if (JSON.stringify(localData.userProfile) !== JSON.stringify(remoteData.userProfile)) {
      conflicts.push({
        field: 'userProfile',
        localValue: localData.userProfile,
        remoteValue: remoteData.userProfile,
        resolved: false,
        resolvedValue: null,
      });
    }

    // Compare achievements
    if (JSON.stringify(localData.achievements) !== JSON.stringify(remoteData.achievements)) {
      conflicts.push({
        field: 'achievements',
        localValue: localData.achievements,
        remoteValue: remoteData.achievements,
        resolved: false,
        resolvedValue: null,
      });
    }

    // Compare settings
    if (JSON.stringify(localData.settings) !== JSON.stringify(remoteData.settings)) {
      conflicts.push({
        field: 'settings',
        localValue: localData.settings,
        remoteValue: remoteData.settings,
        resolved: false,
        resolvedValue: null,
      });
    }

    // Compare wallet
    if (JSON.stringify(localData.wallet) !== JSON.stringify(remoteData.wallet)) {
      conflicts.push({
        field: 'wallet',
        localValue: localData.wallet,
        remoteValue: remoteData.wallet,
        resolved: false,
        resolvedValue: null,
      });
    }

    return conflicts;
  }

  /**
   * Merge two ISyncData objects using a merge strategy.
   */
  private mergeSyncData(local: ISyncData, remote: ISyncData): ISyncData {
    // Merge user profiles (local overrides for conflict fields)
    const mergedProfile = {
      ...remote.userProfile,
      ...local.userProfile,
    };

    // Merge game history (union by unique entries)
    const historyMap = new Map<string, Record<string, unknown>>();
    for (const entry of remote.gameHistory) {
      const key = JSON.stringify(entry);
      historyMap.set(key, entry);
    }
    for (const entry of local.gameHistory) {
      const key = JSON.stringify(entry);
      historyMap.set(key, entry);
    }

    // Merge achievements (union)
    const achievementSet = new Set([
      ...remote.achievements,
      ...local.achievements,
    ]);

    // Merge leaderboard scores (local takes precedence for same game)
    const scoreMap = new Map<string, Record<string, unknown>>();
    for (const entry of remote.leaderboardScores) {
      const gameId = String(entry['gameId'] ?? entry['id'] ?? JSON.stringify(entry));
      scoreMap.set(gameId, entry);
    }
    for (const entry of local.leaderboardScores) {
      const gameId = String(entry['gameId'] ?? entry['id'] ?? JSON.stringify(entry));
      scoreMap.set(gameId, entry);
    }

    // Merge settings (deep merge, local overrides)
    const mergedSettings = {
      ...remote.settings,
      ...local.settings,
    };

    // Merge wallet (local overrides)
    const mergedWallet = {
      ...remote.wallet,
      ...local.wallet,
    };

    return {
      userProfile: mergedProfile,
      gameHistory: Array.from(historyMap.values()),
      achievements: Array.from(achievementSet),
      leaderboardScores: Array.from(scoreMap.values()),
      settings: mergedSettings,
      wallet: mergedWallet,
    };
  }

  /**
   * Merge two values — attempts intelligent merge based on type.
   */
  private mergeValues(localValue: unknown, remoteValue: unknown): unknown {
    // Arrays → union
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      const combined = [...remoteValue, ...localValue];
      if (localValue.length > 0 && typeof localValue[0] === 'string') {
        return Array.from(new Set(combined as string[]));
      }
      // For object arrays, deduplicate by JSON string
      const seen = new Set<string>();
      return combined.filter(item => {
        const key = JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Objects → shallow merge, local wins
    if (typeof localValue === 'object' && localValue !== null
      && typeof remoteValue === 'object' && remoteValue !== null
      && !Array.isArray(localValue) && !Array.isArray(remoteValue)) {
      return { ...(remoteValue as Record<string, unknown>), ...(localValue as Record<string, unknown>) };
    }

    // Primitives → local wins
    return localValue;
  }

  /**
   * Update the last sync time for a device.
   */
  private updateDeviceSyncTime(userId: string, deviceId: string, timestamp: number): void {
    const userDevices = this.devices.get(userId);
    if (!userDevices) return;

    const device = userDevices.find(d => d.deviceId === deviceId);
    if (device) {
      device.lastSyncAt = timestamp;
    }
  }

  /**
   * Create an empty sync data object.
   */
  private createEmptySyncData(): ISyncData {
    return {
      userProfile: {},
      gameHistory: [],
      achievements: [],
      leaderboardScores: [],
      settings: {},
      wallet: {},
    };
  }
}
