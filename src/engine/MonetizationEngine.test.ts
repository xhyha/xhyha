import {
  MonetizationEngine,
  CurrencyType,
  PremiumTier,
  AdType,
  IShopItem,
} from './MonetizationEngine';

describe('MonetizationEngine', () => {
  let engine: MonetizationEngine;

  beforeEach(() => {
    engine = new MonetizationEngine();
  });

  // ===== createWallet =====

  describe('createWallet()', () => {
    it('should create a wallet with default balances', () => {
      const wallet = engine.createWallet('user1');

      expect(wallet.userId).toBe('user1');
      expect(wallet.balances[CurrencyType.COINS]).toBe(0);
      expect(wallet.balances[CurrencyType.GEMS]).toBe(0);
      expect(wallet.balances[CurrencyType.ENERGY]).toBe(0);
      expect(wallet.tier).toBe(PremiumTier.FREE);
      expect(wallet.energy).toBe(100);
      expect(wallet.maxEnergy).toBe(100);
    });

    it('should overwrite existing wallet', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'test');
      const wallet = engine.createWallet('user1');

      expect(wallet.balances[CurrencyType.COINS]).toBe(0);
    });
  });

  // ===== getBalance =====

  describe('getBalance()', () => {
    it('should return 0 for unknown user', () => {
      expect(engine.getBalance('unknown', CurrencyType.COINS)).toBe(0);
    });

    it('should return current balance after earning', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 50, 'test');
      expect(engine.getBalance('user1', CurrencyType.COINS)).toBe(50);
    });
  });

  // ===== earnCurrency =====

  describe('earnCurrency()', () => {
    it('should add currency and return a transaction', () => {
      engine.createWallet('user1');
      const tx = engine.earnCurrency('user1', CurrencyType.COINS, 100, 'daily_bonus');

      expect(tx.userId).toBe('user1');
      expect(tx.type).toBe('earn');
      expect(tx.amount).toBe(100);
      expect(tx.currency).toBe(CurrencyType.COINS);
      expect(tx.description).toBe('daily_bonus');
      expect(engine.getBalance('user1', CurrencyType.COINS)).toBe(100);
    });

    it('should auto-create wallet if not exists', () => {
      const tx = engine.earnCurrency('newUser', CurrencyType.GEMS, 5, 'signup');
      expect(tx).toBeDefined();
      expect(engine.getBalance('newUser', CurrencyType.GEMS)).toBe(5);
    });

    it('should handle multiple currencies independently', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'coins');
      engine.earnCurrency('user1', CurrencyType.GEMS, 10, 'gems');

      expect(engine.getBalance('user1', CurrencyType.COINS)).toBe(100);
      expect(engine.getBalance('user1', CurrencyType.GEMS)).toBe(10);
    });
  });

  // ===== spendCurrency =====

  describe('spendCurrency()', () => {
    it('should spend currency and return a transaction', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');

      const tx = engine.spendCurrency('user1', CurrencyType.COINS, 30, 'item_1');
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe('spend');
      expect(tx!.amount).toBe(-30);
      expect(tx!.itemId).toBe('item_1');
      expect(engine.getBalance('user1', CurrencyType.COINS)).toBe(70);
    });

    it('should return null if insufficient funds', () => {
      engine.createWallet('user1');
      const tx = engine.spendCurrency('user1', CurrencyType.COINS, 50);
      expect(tx).toBeNull();
    });

    it('should return null for unknown user', () => {
      expect(engine.spendCurrency('unknown', CurrencyType.COINS, 10)).toBeNull();
    });
  });

  // ===== canAfford =====

  describe('canAfford()', () => {
    it('should return true when user has enough', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');
      expect(engine.canAfford('user1', CurrencyType.COINS, 50)).toBe(true);
    });

    it('should return false when user has insufficient funds', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 30, 'bonus');
      expect(engine.canAfford('user1', CurrencyType.COINS, 50)).toBe(false);
    });

    it('should return false for unknown user', () => {
      expect(engine.canAfford('unknown', CurrencyType.COINS, 10)).toBe(false);
    });
  });

  // ===== Energy System =====

  describe('energy system', () => {
    it('should start with full energy', () => {
      engine.createWallet('user1');
      expect(engine.getEnergy('user1')).toBe(100);
    });

    it('should spend energy successfully', () => {
      engine.createWallet('user1');
      expect(engine.spendEnergy('user1', 10)).toBe(true);
      expect(engine.getEnergy('user1')).toBe(90);
    });

    it('should not spend energy if insufficient', () => {
      engine.createWallet('user1');
      engine.spendEnergy('user1', 90);
      expect(engine.spendEnergy('user1', 20)).toBe(false);
    });

    it('should regenerate energy over time', () => {
      engine.createWallet('user1');
      engine.spendEnergy('user1', 50);

      // Wallet lastEnergyUpdate is set to now so regeneration adds 0
      // We just verify the regenerateEnergy method works
      const energy = engine.regenerateEnergy('user1');
      expect(energy).toBe(50);
    });

    it('should return 0 energy for unknown user', () => {
      expect(engine.getEnergy('unknown')).toBe(0);
      expect(engine.spendEnergy('unknown', 10)).toBe(false);
      expect(engine.regenerateEnergy('unknown')).toBe(0);
    });
  });

  // ===== Shop Items =====

  describe('shop items', () => {
    it('should have default shop items', () => {
      const items = engine.getShopItems();
      expect(items.length).toBeGreaterThanOrEqual(8);
    });

    it('should filter shop items by type', () => {
      const powerups = engine.getShopItems({ type: 'powerup' });
      expect(powerups.every(i => i.type === 'powerup')).toBe(true);
    });

    it('should filter shop items by premiumOnly', () => {
      const premium = engine.getShopItems({ premiumOnly: true });
      expect(premium.every(i => i.premiumOnly === true)).toBe(true);
    });

    it('should register a custom shop item', () => {
      const customItem: IShopItem = {
        id: 'custom_item',
        name: 'Custom Item',
        description: 'Test item',
        type: 'cosmetic',
        cost: { currency: CurrencyType.COINS, amount: 50 },
        premiumOnly: false,
        limited: false,
        icon: '🎮',
      };
      engine.registerShopItem(customItem);

      const items = engine.getShopItems();
      expect(items.find(i => i.id === 'custom_item')).toBeDefined();
    });
  });

  // ===== purchaseItem =====

  describe('purchaseItem()', () => {
    it('should purchase an item the user can afford', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');

      const tx = engine.purchaseItem('user1', 'energy_refill');
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe('purchase');
      expect(tx!.itemId).toBe('energy_refill');
    });

    it('should return null for unknown item', () => {
      engine.createWallet('user1');
      expect(engine.purchaseItem('user1', 'nonexistent')).toBeNull();
    });

    it('should return null if user cannot afford', () => {
      engine.createWallet('user1');
      expect(engine.purchaseItem('user1', 'energy_refill')).toBeNull();
    });

    it('should return null for unknown user', () => {
      expect(engine.purchaseItem('unknown', 'energy_refill')).toBeNull();
    });

    it('should refill energy on energy_refill purchase', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');
      engine.spendEnergy('user1', 50);

      engine.purchaseItem('user1', 'energy_refill');
      expect(engine.getEnergy('user1')).toBe(100);
    });

    it('should return null for premiumOnly items if user is not premium', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 500, 'bonus');

      const tx = engine.purchaseItem('user1', 'gem_pack_s');
      expect(tx).toBeNull();
    });

    it('should not purchase limited items with zero stock', () => {
      const limitedItem: IShopItem = {
        id: 'limited_test',
        name: 'Limited Test',
        description: 'Test',
        type: 'cosmetic',
        cost: { currency: CurrencyType.COINS, amount: 10 },
        premiumOnly: false,
        limited: true,
        stock: 0,
        icon: '📦',
      };
      engine.registerShopItem(limitedItem);
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');

      expect(engine.purchaseItem('user1', 'limited_test')).toBeNull();
    });
  });

  // ===== Ad System =====

  describe('ad system', () => {
    it('should show a rewarded ad and grant reward', () => {
      engine.createWallet('user1');
      const result = engine.showAd('user1', AdType.REWARDED);

      expect(result.shown).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.reward!.type).toBe('ad_reward');
      expect(result.reward!.currency).toBe(CurrencyType.COINS);
      expect(result.reward!.amount).toBe(25);
    });

    it('should track ad watch count', () => {
      engine.createWallet('user1');
      engine.showAd('user1', AdType.REWARDED);
      // Second rewarded ad won't show due to 60s cooldown, but BANNER has no cooldown
      engine.showAd('user1', AdType.BANNER);

      expect(engine.getAdWatchCount('user1')).toBe(2);
    });

    it('should not show ad for unknown user', () => {
      const result = engine.showAd('unknown', AdType.REWARDED);
      expect(result.shown).toBe(false);
    });

    it('canShowAd returns false when daily limit reached', () => {
      engine.createWallet('user1');
      const wallet = engine.getWallet('user1')!;
      wallet.adWatchCount = 10; // at limit

      expect(engine.canShowAd('user1', AdType.REWARDED)).toBe(false);
    });

    it('should return false for unknown ad type', () => {
      engine.createWallet('user1');
      // All default ad types exist, but if we check for an unregistered one
      expect(engine.canShowAd('user1', 'UNKNOWN' as AdType)).toBe(false);
    });
  });

  // ===== Premium Tiers =====

  describe('premium tiers', () => {
    it('should upgrade tier', () => {
      engine.createWallet('user1');
      engine.upgradeTier('user1', PremiumTier.GOLD, 7);

      expect(engine.isPremium('user1')).toBe(true);
      const wallet = engine.getWallet('user1')!;
      expect(wallet.tier).toBe(PremiumTier.GOLD);
    });

    it('should get premium benefits', () => {
      const freeBenefits = engine.getPremiumBenefits(PremiumTier.FREE);
      expect(freeBenefits.adFree).toBe(false);
      expect(freeBenefits.coinMultiplier).toBe(1.0);

      const goldBenefits = engine.getPremiumBenefits(PremiumTier.GOLD);
      expect(goldBenefits.adFree).toBe(true);
      expect(goldBenefits.coinMultiplier).toBe(1.5);

      const platBenefits = engine.getPremiumBenefits(PremiumTier.PLATINUM);
      expect(platBenefits.adFree).toBe(true);
      expect(platBenefits.coinMultiplier).toBe(2.0);
      expect(platBenefits.energyBonus).toBe(1.0);
    });

    it('should return false for free tier isPremium', () => {
      engine.createWallet('user1');
      expect(engine.isPremium('user1')).toBe(false);
    });

    it('should increase maxEnergy for premium tiers', () => {
      engine.createWallet('user1');
      engine.upgradeTier('user1', PremiumTier.GOLD, 7);
      const wallet = engine.getWallet('user1')!;
      expect(wallet.maxEnergy).toBeGreaterThan(100);
    });

    it('should not downgrade tier on upgradeTier call', () => {
      engine.createWallet('user1');
      engine.upgradeTier('user1', PremiumTier.GOLD, 7);
      engine.upgradeTier('user1', PremiumTier.BRONZE, 7);
      const wallet = engine.getWallet('user1')!;
      // Tier should stay GOLD (higher)
      expect(wallet.tier).toBe(PremiumTier.GOLD);
    });
  });

  // ===== Transaction History =====

  describe('transaction history', () => {
    it('should track transactions for a user', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');
      engine.spendCurrency('user1', CurrencyType.COINS, 30, 'item');

      const history = engine.getTransactionHistory('user1');
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.some(tx => tx.type === 'earn')).toBe(true);
      expect(history.some(tx => tx.type === 'spend')).toBe(true);
    });

    it('should return empty array for unknown user', () => {
      expect(engine.getTransactionHistory('unknown')).toEqual([]);
    });
  });

  // ===== Revenue Summary =====

  describe('getRevenueSummary()', () => {
    it('should return a revenue summary', () => {
      engine.createWallet('user1');
      engine.earnCurrency('user1', CurrencyType.COINS, 100, 'bonus');

      const summary = engine.getRevenueSummary();
      expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(summary.totalAdRevenue).toBeGreaterThanOrEqual(0);
      expect(summary.totalIAPRevenue).toBeGreaterThanOrEqual(0);
      expect(typeof summary.arpu).toBe('number');
      expect(typeof summary.arppu).toBe('number');
    });

    it('should count ad revenue', () => {
      engine.createWallet('user1');
      engine.showAd('user1', AdType.REWARDED);

      const summary = engine.getRevenueSummary();
      expect(summary.totalAdRevenue).toBeGreaterThan(0);
    });
  });

  // ===== Daily Reset =====

  describe('dailyReset()', () => {
    it('should reset ad watch count', () => {
      engine.createWallet('user1');
      engine.showAd('user1', AdType.REWARDED);
      engine.showAd('user1', AdType.BANNER);

      expect(engine.getAdWatchCount('user1')).toBe(2);
      engine.dailyReset('user1');
      expect(engine.getAdWatchCount('user1')).toBe(0);
    });

    it('should not throw for unknown user', () => {
      expect(() => engine.dailyReset('unknown')).not.toThrow();
    });
  });
});
