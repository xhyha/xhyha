/**
 * Genesis AI Micro-Game Engine - Monetization Engine
 *
 * Manages virtual currency, in-app purchases, ad placements, premium tiers,
 * and revenue analytics for the micro-game platform.
 */

// ========== Enums ==========

/** Currency type */
export enum CurrencyType {
  COINS = 'COINS',       // Free earned currency
  GEMS = 'GEMS',         // Premium purchased currency
  ENERGY = 'ENERGY',     // Regenerating play energy
}

/** Premium tier */
export enum PremiumTier {
  FREE = 'FREE',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

/** Ad type */
export enum AdType {
  REWARDED = 'REWARDED',       // Watch ad for reward
  INTERSTITIAL = 'INTERSTITIAL', // Between games
  BANNER = 'BANNER',           // Small banner
}

// ========== Interfaces ==========

/** Shop item */
export interface IShopItem {
  id: string;
  name: string;
  description: string;
  type: 'currency' | 'cosmetic' | 'powerup' | 'premium';
  cost: { currency: CurrencyType; amount: number };
  premiumOnly: boolean;
  limited: boolean;
  stock?: number;
  icon: string;
}

/** Transaction record */
export interface ITransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'earn' | 'spend' | 'reward' | 'ad_reward';
  currency: CurrencyType;
  amount: number;
  itemId?: string;
  timestamp: number;
  description: string;
}

/** User wallet */
export interface IUserWallet {
  userId: string;
  balances: Record<CurrencyType, number>;
  tier: PremiumTier;
  tierExpiresAt: number | null;
  totalSpent: number;
  adWatchCount: number;
  adWatchLimit: number;
  lastAdWatch: number | null;
  energy: number;
  maxEnergy: number;
  energyRegenRate: number;
  lastEnergyUpdate: number;
}

/** Ad placement config */
export interface IAdPlacement {
  type: AdType;
  cooldown: number;
  reward?: { currency: CurrencyType; amount: number };
  skipPremium: boolean;
}

/** Revenue summary */
export interface IRevenueSummary {
  totalRevenue: number;
  totalAdRevenue: number;
  totalIAPRevenue: number;
  premiumUsers: number;
  conversionRate: number;
  arpu: number;
  arppu: number;
}

// ========== Helpers ==========

let _txIdCounter = 0;

function generateTransactionId(): string {
  _txIdCounter++;
  return `tx_${Date.now()}_${_txIdCounter}`;
}

/** Premium tier rank for comparison */
const TIER_RANK: Record<PremiumTier, number> = {
  [PremiumTier.FREE]: 0,
  [PremiumTier.BRONZE]: 1,
  [PremiumTier.SILVER]: 2,
  [PremiumTier.GOLD]: 3,
  [PremiumTier.PLATINUM]: 4,
};

// tierMeetsRequired removed — TIER_RANK is used directly where needed

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_MAX_ENERGY = 100;
const DEFAULT_ENERGY_REGEN_RATE = 1; // per minute

// ========== Default Shop Items ==========

const DEFAULT_SHOP_ITEMS: IShopItem[] = [
  {
    id: 'coin_pack_s',
    name: '💰 Coin Pack S',
    description: '100 coins to spend in the shop',
    type: 'currency',
    cost: { currency: CurrencyType.GEMS, amount: 5 },
    premiumOnly: false,
    limited: false,
    icon: '💰',
  },
  {
    id: 'coin_pack_m',
    name: '💰 Coin Pack M',
    description: '500 coins to spend in the shop',
    type: 'currency',
    cost: { currency: CurrencyType.GEMS, amount: 20 },
    premiumOnly: false,
    limited: false,
    icon: '💰',
  },
  {
    id: 'gem_pack_s',
    name: '💎 Gem Pack S',
    description: '10 gems for premium items',
    type: 'currency',
    cost: { currency: CurrencyType.COINS, amount: 200 },
    premiumOnly: true,
    limited: false,
    icon: '💎',
  },
  {
    id: 'gem_pack_l',
    name: '💎 Gem Pack L',
    description: '50 gems for premium items',
    type: 'currency',
    cost: { currency: CurrencyType.COINS, amount: 800 },
    premiumOnly: true,
    limited: false,
    icon: '💎',
  },
  {
    id: 'energy_refill',
    name: '⚡ Energy Refill',
    description: 'Full energy restore',
    type: 'powerup',
    cost: { currency: CurrencyType.COINS, amount: 50 },
    premiumOnly: false,
    limited: false,
    icon: '⚡',
  },
  {
    id: 'theme_pack',
    name: '🎨 Theme Pack',
    description: 'Custom game themes',
    type: 'cosmetic',
    cost: { currency: CurrencyType.COINS, amount: 100 },
    premiumOnly: false,
    limited: false,
    icon: '🎨',
  },
  {
    id: 'premium_weekly',
    name: '👑 Premium Weekly',
    description: '7 days GOLD tier',
    type: 'premium',
    cost: { currency: CurrencyType.GEMS, amount: 100 },
    premiumOnly: false,
    limited: false,
    icon: '👑',
  },
  {
    id: 'premium_monthly',
    name: '👑 Premium Monthly',
    description: '30 days PLATINUM tier',
    type: 'premium',
    cost: { currency: CurrencyType.GEMS, amount: 400 },
    premiumOnly: false,
    limited: false,
    icon: '👑',
  },
  {
    id: 'lucky_box',
    name: '🎲 Lucky Box',
    description: 'Random reward',
    type: 'powerup',
    cost: { currency: CurrencyType.COINS, amount: 30 },
    premiumOnly: false,
    limited: false,
    icon: '🎲',
  },
  {
    id: 'unlock_all_games',
    name: '🔓 Unlock All Games',
    description: 'All 25 games unlocked',
    type: 'powerup',
    cost: { currency: CurrencyType.GEMS, amount: 200 },
    premiumOnly: false,
    limited: false,
    icon: '🔓',
  },
];

// ========== MonetizationEngine Class ==========

/**
 * Engine that manages virtual currency, shop items, ad placements,
 * premium tiers, and revenue analytics.
 *
 * Usage:
 *   const monetization = new MonetizationEngine();
 *   monetization.createWallet('user1');
 *   monetization.earnCurrency('user1', CurrencyType.COINS, 100, 'first_login');
 *   monetization.purchaseItem('user1', 'energy_refill');
 */
export class MonetizationEngine {
  private wallets: Map<string, IUserWallet>;
  private shopItems: Map<string, IShopItem>;
  private transactions: ITransaction[];
  private adPlacements: Map<AdType, IAdPlacement>;
  private adCooldowns: Map<string, Map<AdType, number>>;

  constructor() {
    this.wallets = new Map();
    this.shopItems = new Map();
    this.transactions = [];
    this.adPlacements = new Map();
    this.adCooldowns = new Map();

    // Register default shop items
    for (const item of DEFAULT_SHOP_ITEMS) {
      this.shopItems.set(item.id, { ...item });
    }

    // Register default ad placements
    this.adPlacements.set(AdType.REWARDED, {
      type: AdType.REWARDED,
      cooldown: 60, // 60 seconds
      reward: { currency: CurrencyType.COINS, amount: 25 },
      skipPremium: true,
    });

    this.adPlacements.set(AdType.INTERSTITIAL, {
      type: AdType.INTERSTITIAL,
      cooldown: 180, // 3 minutes
      skipPremium: true,
    });

    this.adPlacements.set(AdType.BANNER, {
      type: AdType.BANNER,
      cooldown: 0,
      skipPremium: false,
    });
  }

  // ---- Wallet Management ----

  /**
   * Create a new wallet for a user with default balances.
   */
  createWallet(userId: string): IUserWallet {
    const now = Date.now();
    const wallet: IUserWallet = {
      userId,
      balances: {
        [CurrencyType.COINS]: 0,
        [CurrencyType.GEMS]: 0,
        [CurrencyType.ENERGY]: 0,
      },
      tier: PremiumTier.FREE,
      tierExpiresAt: null,
      totalSpent: 0,
      adWatchCount: 0,
      adWatchLimit: 10,
      lastAdWatch: null,
      energy: DEFAULT_MAX_ENERGY,
      maxEnergy: DEFAULT_MAX_ENERGY,
      energyRegenRate: DEFAULT_ENERGY_REGEN_RATE,
      lastEnergyUpdate: now,
    };

    this.wallets.set(userId, wallet);
    return wallet;
  }

  /**
   * Get a user's wallet, or null if not found.
   */
  getWallet(userId: string): IUserWallet | null {
    return this.wallets.get(userId) ?? null;
  }

  /**
   * Get the balance of a specific currency for a user.
   */
  getBalance(userId: string, currency: CurrencyType): number {
    const wallet = this.wallets.get(userId);
    if (!wallet) return 0;
    return wallet.balances[currency] ?? 0;
  }

  // ---- Currency Operations ----

  /**
   * Earn currency and record the transaction.
   */
  earnCurrency(userId: string, currency: CurrencyType, amount: number, reason: string): ITransaction {
    let wallet = this.wallets.get(userId);
    if (!wallet) {
      wallet = this.createWallet(userId);
    }

    wallet.balances[currency] = (wallet.balances[currency] ?? 0) + amount;

    const tx: ITransaction = {
      id: generateTransactionId(),
      userId,
      type: 'earn',
      currency,
      amount,
      timestamp: Date.now(),
      description: reason,
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Spend currency if sufficient balance. Returns transaction or null if insufficient.
   */
  spendCurrency(userId: string, currency: CurrencyType, amount: number, itemId?: string): ITransaction | null {
    const wallet = this.wallets.get(userId);
    if (!wallet) return null;

    const balance = wallet.balances[currency] ?? 0;
    if (balance < amount) return null;

    wallet.balances[currency] = balance - amount;

    const tx: ITransaction = {
      id: generateTransactionId(),
      userId,
      type: 'spend',
      currency,
      amount: -amount,
      itemId,
      timestamp: Date.now(),
      description: itemId ? `Purchased item: ${itemId}` : `Spent ${amount} ${currency}`,
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Check if a user can afford a given amount of currency.
   */
  canAfford(userId: string, currency: CurrencyType, amount: number): boolean {
    const wallet = this.wallets.get(userId);
    if (!wallet) return false;
    return (wallet.balances[currency] ?? 0) >= amount;
  }

  // ---- Energy System ----

  /**
   * Get the current energy for a user (after regeneration).
   */
  getEnergy(userId: string): number {
    const wallet = this.wallets.get(userId);
    if (!wallet) return 0;

    this.regenerateEnergy(userId);
    return wallet.energy;
  }

  /**
   * Spend energy if sufficient. Returns true if spent successfully.
   */
  spendEnergy(userId: string, amount: number): boolean {
    const wallet = this.wallets.get(userId);
    if (!wallet) return false;

    this.regenerateEnergy(userId);

    if (wallet.energy < amount) return false;

    wallet.energy -= amount;
    return true;
  }

  /**
   * Regenerate energy based on elapsed time. Returns new energy level.
   */
  regenerateEnergy(userId: string): number {
    const wallet = this.wallets.get(userId);
    if (!wallet) return 0;

    const now = Date.now();
    const elapsedMinutes = (now - wallet.lastEnergyUpdate) / 60000;

    if (elapsedMinutes > 0) {
      const regenAmount = Math.floor(elapsedMinutes * wallet.energyRegenRate);
      if (regenAmount > 0) {
        wallet.energy = Math.min(wallet.maxEnergy, wallet.energy + regenAmount);
        wallet.lastEnergyUpdate = now;
      }
    }

    return wallet.energy;
  }

  // ---- Shop ----

  /**
   * Register a new shop item.
   */
  registerShopItem(item: IShopItem): void {
    this.shopItems.set(item.id, { ...item });
  }

  /**
   * Get shop items with optional filtering.
   */
  getShopItems(filter?: { type?: string; premiumOnly?: boolean }): IShopItem[] {
    let items = Array.from(this.shopItems.values());

    if (filter) {
      if (filter.type !== undefined) {
        items = items.filter((item) => item.type === filter.type);
      }
      if (filter.premiumOnly !== undefined) {
        items = items.filter((item) => item.premiumOnly === filter.premiumOnly);
      }
    }

    return items;
  }

  /**
   * Purchase a shop item. Returns transaction or null if purchase fails.
   */
  purchaseItem(userId: string, itemId: string): ITransaction | null {
    const item = this.shopItems.get(itemId);
    if (!item) return null;

    const wallet = this.wallets.get(userId);
    if (!wallet) return null;

    // Check premium requirement
    if (item.premiumOnly && !this.isPremium(userId)) {
      return null;
    }

    // Check stock for limited items
    if (item.limited && item.stock !== undefined && item.stock <= 0) {
      return null;
    }

    // Check if user can afford
    if (!this.canAfford(userId, item.cost.currency, item.cost.amount)) {
      return null;
    }

    // Spend currency
    const spendTx = this.spendCurrency(userId, item.cost.currency, item.cost.amount, itemId);
    if (!spendTx) return null;

    // Handle item effects
    switch (item.type) {
      case 'currency':
        // Grant the currency bonus for currency-type items
        if (itemId === 'coin_pack_s') {
          wallet.balances[CurrencyType.COINS] = (wallet.balances[CurrencyType.COINS] ?? 0) + 100;
        } else if (itemId === 'coin_pack_m') {
          wallet.balances[CurrencyType.COINS] = (wallet.balances[CurrencyType.COINS] ?? 0) + 500;
        } else if (itemId === 'gem_pack_s') {
          wallet.balances[CurrencyType.GEMS] = (wallet.balances[CurrencyType.GEMS] ?? 0) + 10;
        } else if (itemId === 'gem_pack_l') {
          wallet.balances[CurrencyType.GEMS] = (wallet.balances[CurrencyType.GEMS] ?? 0) + 50;
        }
        break;

      case 'powerup':
        if (itemId === 'energy_refill') {
          wallet.energy = wallet.maxEnergy;
        } else if (itemId === 'lucky_box') {
          // Random reward: 10-100 coins or 1-5 gems
          const rand = Math.random();
          if (rand < 0.7) {
            const coins = Math.floor(Math.random() * 91) + 10;
            wallet.balances[CurrencyType.COINS] = (wallet.balances[CurrencyType.COINS] ?? 0) + coins;
          } else {
            const gems = Math.floor(Math.random() * 5) + 1;
            wallet.balances[CurrencyType.GEMS] = (wallet.balances[CurrencyType.GEMS] ?? 0) + gems;
          }
        }
        break;

      case 'premium':
        if (itemId === 'premium_weekly') {
          this.upgradeTier(userId, PremiumTier.GOLD, 7);
        } else if (itemId === 'premium_monthly') {
          this.upgradeTier(userId, PremiumTier.PLATINUM, 30);
        }
        break;

      case 'cosmetic':
        // Cosmetics are just unlocked - no balance changes needed
        break;
    }

    // Decrease stock for limited items
    if (item.limited && item.stock !== undefined) {
      item.stock -= 1;
    }

    // Record as a purchase transaction
    const tx: ITransaction = {
      id: generateTransactionId(),
      userId,
      type: 'purchase',
      currency: item.cost.currency,
      amount: item.cost.amount,
      itemId,
      timestamp: Date.now(),
      description: `Purchased ${item.name}`,
    };

    this.transactions.push(tx);
    return tx;
  }

  // ---- Ads ----

  /**
   * Show an ad to a user. Returns whether shown and optional reward transaction.
   */
  showAd(userId: string, adType: AdType): { shown: boolean; reward?: ITransaction } {
    if (!this.canShowAd(userId, adType)) {
      return { shown: false };
    }

    const wallet = this.wallets.get(userId);
    if (!wallet) return { shown: false };

    // Update ad tracking
    wallet.adWatchCount += 1;
    wallet.lastAdWatch = Date.now();

    // Update cooldown
    if (!this.adCooldowns.has(userId)) {
      this.adCooldowns.set(userId, new Map());
    }
    this.adCooldowns.get(userId)!.set(adType, Date.now());

    // Grant reward if applicable
    const placement = this.adPlacements.get(adType);
    if (placement?.reward) {
      const { currency, amount } = placement.reward;
      wallet.balances[currency] = (wallet.balances[currency] ?? 0) + amount;

      const rewardTx: ITransaction = {
        id: generateTransactionId(),
        userId,
        type: 'ad_reward',
        currency,
        amount,
        timestamp: Date.now(),
        description: `Reward for watching ${adType} ad`,
      };

      this.transactions.push(rewardTx);
      return { shown: true, reward: rewardTx };
    }

    return { shown: true };
  }

  /**
   * Check if an ad can be shown to a user.
   */
  canShowAd(userId: string, adType: AdType): boolean {
    const wallet = this.wallets.get(userId);
    if (!wallet) return false;

    // Premium users can skip certain ad types
    const placement = this.adPlacements.get(adType);
    if (!placement) return false;

    if (placement.skipPremium && this.isPremium(userId)) {
      return false;
    }

    // Check daily limit
    if (wallet.adWatchCount >= wallet.adWatchLimit) {
      return false;
    }

    // Check cooldown
    const userCooldowns = this.adCooldowns.get(userId);
    if (userCooldowns) {
      const lastShown = userCooldowns.get(adType);
      if (lastShown !== undefined && placement.cooldown > 0) {
        const elapsed = (Date.now() - lastShown) / 1000;
        if (elapsed < placement.cooldown) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get the number of ads a user has watched today.
   */
  getAdWatchCount(userId: string): number {
    const wallet = this.wallets.get(userId);
    if (!wallet) return 0;
    return wallet.adWatchCount;
  }

  // ---- Premium ----

  /**
   * Upgrade a user's premium tier for a given duration.
   */
  upgradeTier(userId: string, tier: PremiumTier, durationDays: number): IUserWallet {
    let wallet = this.wallets.get(userId);
    if (!wallet) {
      wallet = this.createWallet(userId);
    }

    const now = Date.now();

    // Only upgrade if new tier is higher than current
    if (TIER_RANK[tier] > TIER_RANK[wallet.tier]) {
      wallet.tier = tier;
    }

    // Extend or set expiration
    const currentExpiry = wallet.tierExpiresAt ?? now;
    const newExpiry = Math.max(currentExpiry, now) + durationDays * MS_PER_DAY;
    wallet.tierExpiresAt = newExpiry;

    // Premium tier bonuses
    const benefits = this.getPremiumBenefits(tier);
    wallet.maxEnergy = DEFAULT_MAX_ENERGY + Math.floor(DEFAULT_MAX_ENERGY * benefits.energyBonus);
    wallet.adWatchLimit = tier === PremiumTier.PLATINUM ? 0 : 10; // Platinum = unlimited
    wallet.energyRegenRate = DEFAULT_ENERGY_REGEN_RATE + (TIER_RANK[tier] * 0.5);

    return wallet;
  }

  /**
   * Check if a user currently has an active premium subscription.
   */
  isPremium(userId: string): boolean {
    const wallet = this.wallets.get(userId);
    if (!wallet) return false;

    if (wallet.tier === PremiumTier.FREE) return false;

    // Check expiration
    if (wallet.tierExpiresAt !== null && Date.now() > wallet.tierExpiresAt) {
      wallet.tier = PremiumTier.FREE;
      wallet.tierExpiresAt = null;
      wallet.maxEnergy = DEFAULT_MAX_ENERGY;
      wallet.energyRegenRate = DEFAULT_ENERGY_REGEN_RATE;
      wallet.adWatchLimit = 10;
      return false;
    }

    return true;
  }

  /**
   * Get the benefits for a given premium tier.
   */
  getPremiumBenefits(tier: PremiumTier): {
    adFree: boolean;
    energyBonus: number;
    coinMultiplier: number;
    exclusiveGames: string[];
  } {
    switch (tier) {
      case PremiumTier.FREE:
        return {
          adFree: false,
          energyBonus: 0,
          coinMultiplier: 1.0,
          exclusiveGames: [],
        };
      case PremiumTier.BRONZE:
        return {
          adFree: false,
          energyBonus: 0.1,
          coinMultiplier: 1.1,
          exclusiveGames: [],
        };
      case PremiumTier.SILVER:
        return {
          adFree: false,
          energyBonus: 0.25,
          coinMultiplier: 1.25,
          exclusiveGames: ['puzzle_master'],
        };
      case PremiumTier.GOLD:
        return {
          adFree: true,
          energyBonus: 0.5,
          coinMultiplier: 1.5,
          exclusiveGames: ['puzzle_master', 'speed_demon'],
        };
      case PremiumTier.PLATINUM:
        return {
          adFree: true,
          energyBonus: 1.0,
          coinMultiplier: 2.0,
          exclusiveGames: ['puzzle_master', 'speed_demon', 'zen_garden', 'boss_rush'],
        };
    }
  }

  // ---- Revenue Analytics ----

  /**
   * Get the full transaction history for a user.
   */
  getTransactionHistory(userId: string): ITransaction[] {
    return this.transactions.filter((tx) => tx.userId === userId);
  }

  /**
   * Get a revenue summary across all users.
   */
  getRevenueSummary(): IRevenueSummary {
    const uniqueUsers = new Set(this.transactions.map((tx) => tx.userId));
    const totalUsers = uniqueUsers.size;

    // Premium users count
    let premiumUsers = 0;
    for (const wallet of this.wallets.values()) {
      if (this.isPremium(wallet.userId)) {
        premiumUsers++;
      }
    }

    // Revenue estimates (simplified model)
    // Ad revenue: $0.01 per ad watched
    const adRewardTxs = this.transactions.filter((tx) => tx.type === 'ad_reward');
    const totalAdRevenue = adRewardTxs.length * 1; // 1 cent per ad

    // IAP revenue: estimated from gem purchases
    const purchaseTxs = this.transactions.filter((tx) => tx.type === 'purchase');
    let totalIAPRevenue = 0;
    for (const tx of purchaseTxs) {
      if (tx.currency === CurrencyType.GEMS) {
        totalIAPRevenue += Math.round(tx.amount * 10); // ~$0.10 per gem
      }
    }

    const totalRevenue = totalAdRevenue + totalIAPRevenue;
    const payingUsers = new Set(
      this.transactions
        .filter((tx) => tx.type === 'purchase' && tx.currency === CurrencyType.GEMS)
        .map((tx) => tx.userId),
    ).size;

    const conversionRate = totalUsers > 0 ? payingUsers / totalUsers : 0;
    const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const arppu = payingUsers > 0 ? totalIAPRevenue / payingUsers : 0;

    return {
      totalRevenue,
      totalAdRevenue,
      totalIAPRevenue,
      premiumUsers,
      conversionRate: Math.round(conversionRate * 10000) / 10000,
      arpu: Math.round(arpu * 100) / 100,
      arppu: Math.round(arppu * 100) / 100,
    };
  }

  // ---- Daily Reset ----

  /**
   * Reset daily counters for a user (ad watch count, etc.).
   */
  dailyReset(userId: string): void {
    const wallet = this.wallets.get(userId);
    if (!wallet) return;

    wallet.adWatchCount = 0;
    wallet.lastAdWatch = null;

    // Reset ad cooldowns
    this.adCooldowns.delete(userId);
  }
}
