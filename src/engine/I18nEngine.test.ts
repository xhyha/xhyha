import { I18nEngine, Language, TextDirection } from './I18nEngine';

describe('I18nEngine', () => {
  let engine: I18nEngine;

  beforeEach(() => {
    engine = new I18nEngine();
  });

  // ===== setLanguage / getLanguage =====

  describe('setLanguage() / getLanguage()', () => {
    it('should default to EN_US', () => {
      expect(engine.getLanguage()).toBe(Language.EN_US);
    });

    it('should change language', () => {
      engine.setLanguage(Language.ZH_CN);
      expect(engine.getLanguage()).toBe(Language.ZH_CN);
    });

    it('should allow constructor default language', () => {
      const zhEngine = new I18nEngine(Language.ZH_CN);
      expect(zhEngine.getLanguage()).toBe(Language.ZH_CN);
    });
  });

  // ===== t() =====

  describe('t()', () => {
    it('should translate common.hello to English', () => {
      engine.setLanguage(Language.EN_US);
      expect(engine.t('common.hello')).toBe('Hello');
    });

    it('should translate common.hello to Chinese', () => {
      engine.setLanguage(Language.ZH_CN);
      expect(engine.t('common.hello')).toBe('你好');
    });

    it('should translate common.hello to Japanese', () => {
      engine.setLanguage(Language.JA_JP);
      expect(engine.t('common.hello')).toBe('こんにちは');
    });

    it('should interpolate parameters', () => {
      engine.setLanguage(Language.EN_US);
      engine.registerTranslations(Language.EN_US, 'test', {
        greeting: 'Hello, {{name}}! You have {{count}} coins.',
      });

      const result = engine.t('test.greeting', { name: 'Alice', count: 42 });
      expect(result).toBe('Hello, Alice! You have 42 coins.');
    });

    it('should fall back to English when translation missing', () => {
      engine.setLanguage(Language.KO_KR);
      // KO_KR doesn't have translations registered by default
      const result = engine.t('common.hello');
      // Should fall back to English
      expect(result).toBe('Hello');
    });

    it('should return key when no translation exists', () => {
      expect(engine.t('nonexistent.key')).toBe('nonexistent.key');
    });
  });

  // ===== registerTranslations =====

  describe('registerTranslations()', () => {
    it('should register custom translations', () => {
      engine.registerTranslations(Language.EN_US, 'custom', {
        my_key: 'My Value',
      });

      expect(engine.t('custom.my_key')).toBe('My Value');
    });

    it('should register translations for new language', () => {
      engine.registerTranslations(Language.KO_KR, 'common', {
        hello: '안녕하세요',
      });

      engine.setLanguage(Language.KO_KR);
      expect(engine.t('common.hello')).toBe('안녕하세요');
    });
  });

  // ===== formatNumber =====

  describe('formatNumber()', () => {
    it('should format with English conventions', () => {
      const result = engine.formatNumber(1234567.89, Language.EN_US);
      expect(result).toBe('1,234,567.89');
    });

    it('should format with German conventions (comma decimal, dot thousands)', () => {
      const result = engine.formatNumber(1234567.89, Language.DE_DE);
      expect(result).toBe('1.234.567,89');
    });

    it('should format with French conventions (space thousands)', () => {
      const result = engine.formatNumber(1234567.89, Language.FR_FR);
      expect(result).toBe('1 234 567,89');
    });

    it('should handle negative numbers', () => {
      const result = engine.formatNumber(-1234.56, Language.EN_US);
      expect(result).toBe('-1,234.56');
    });

    it('should handle integers without decimal', () => {
      const result = engine.formatNumber(1000, Language.EN_US);
      expect(result).toBe('1,000');
    });

    it('should handle zero', () => {
      expect(engine.formatNumber(0, Language.EN_US)).toBe('0');
    });
  });

  // ===== formatDate =====

  describe('formatDate()', () => {
    it('should format date with US format by default', () => {
      const ts = new Date(2025, 0, 15, 10, 30).getTime(); // Jan 15 2025, 10:30
      const result = engine.formatDate(ts, 'MM/DD/YYYY', Language.EN_US);
      expect(result).toContain('01/15/2025');
    });

    it('should format date with German format', () => {
      const ts = new Date(2025, 0, 15, 10, 30).getTime();
      const result = engine.formatDate(ts, 'DD.MM.YYYY', Language.DE_DE);
      expect(result).toContain('15.01.2025');
    });

    it('should include hours and minutes with HH:mm', () => {
      const ts = new Date(2025, 0, 15, 14, 5).getTime();
      const result = engine.formatDate(ts, 'YYYY-MM-DD HH:mm', Language.EN_US);
      expect(result).toContain('14:05');
    });
  });

  // ===== formatCurrency =====

  describe('formatCurrency()', () => {
    it('should format USD with $ prefix', () => {
      const result = engine.formatCurrency(99.99, 'USD', Language.EN_US);
      expect(result).toBe('$99.99');
    });

    it('should format CNY with ¥ prefix', () => {
      const result = engine.formatCurrency(100, 'CNY', Language.ZH_CN);
      expect(result).toBe('¥100');
    });

    it('should format EUR with suffix for French', () => {
      const result = engine.formatCurrency(50, 'EUR', Language.FR_FR);
      expect(result).toContain('50');
      expect(result).toContain('€');
    });

    it('should handle negative amounts', () => {
      const result = engine.formatCurrency(-25, 'USD', Language.EN_US);
      expect(result).toContain('-');
      expect(result).toContain('25');
    });

    it('should use locale default currency if not specified', () => {
      engine.setLanguage(Language.JA_JP);
      const result = engine.formatCurrency(1000);
      expect(result).toContain('¥');
      expect(result).toContain('1,000');
    });
  });

  // ===== formatRelativeTime =====

  describe('formatRelativeTime()', () => {
    it('should return "just now" for recent timestamps in English', () => {
      const result = engine.formatRelativeTime(Date.now() - 10000, Language.EN_US);
      expect(result).toBe('just now');
    });

    it('should return minutes ago in English', () => {
      const result = engine.formatRelativeTime(Date.now() - 5 * 60 * 1000, Language.EN_US);
      expect(result).toContain('5');
      expect(result).toContain('minutes ago');
    });

    it('should return hours ago in English', () => {
      const result = engine.formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000, Language.EN_US);
      expect(result).toContain('3');
      expect(result).toContain('hours ago');
    });

    it('should return days ago in English', () => {
      const result = engine.formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000, Language.EN_US);
      expect(result).toContain('2');
      expect(result).toContain('days ago');
    });

    it('should return Chinese relative time', () => {
      const result = engine.formatRelativeTime(Date.now() - 10000, Language.ZH_CN);
      expect(result).toBe('刚刚');
    });

    it('should return Japanese relative time', () => {
      const result = engine.formatRelativeTime(Date.now() - 10000, Language.JA_JP);
      expect(result).toBe('たった今');
    });

    it('should return Korean relative time', () => {
      const result = engine.formatRelativeTime(Date.now() - 10000, Language.KO_KR);
      expect(result).toBe('방금');
    });

    it('should return future time in English', () => {
      const result = engine.formatRelativeTime(Date.now() + 5 * 60 * 1000, Language.EN_US);
      expect(result).toContain('in 5');
      expect(result).toContain('minutes');
    });

    it('should use singular for 1 unit', () => {
      const result = engine.formatRelativeTime(Date.now() - 60 * 1000, Language.EN_US);
      expect(result).toContain('1 minute');
      expect(result).not.toContain('1 minutes');
    });
  });

  // ===== getGreeting =====

  describe('getGreeting()', () => {
    it('should return casual greeting for English', () => {
      const greeting = engine.getGreeting(Language.EN_US);
      // EN_US uses 'casual' style
      expect(greeting).toContain('welcome back');
    });

    it('should return cute greeting for Chinese', () => {
      const greeting = engine.getGreeting(Language.ZH_CN);
      expect(greeting).toContain('欢迎');
    });

    it('should return Japanese greeting', () => {
      const greeting = engine.getGreeting(Language.JA_JP);
      expect(greeting).toContain('おかえり');
    });

    it('should return Korean greeting', () => {
      const greeting = engine.getGreeting(Language.KO_KR);
      expect(greeting).toContain('안녕');
    });

    it('should use current language if none specified', () => {
      engine.setLanguage(Language.ZH_CN);
      const greeting = engine.getGreeting();
      expect(greeting).toContain('欢迎');
    });
  });

  // ===== Cultural Adaptation =====

  describe('cultural adaptation', () => {
    it('should return cultural rules for a language', () => {
      const rules = engine.getCulturalRules(Language.EN_US);
      expect(rules.greetingStyle).toBeDefined();
      expect(rules.emojiUsage).toBeDefined();
      expect(rules.numberSuperstition).toBeDefined();
    });

    it('should have number superstitions for Chinese (4)', () => {
      const rules = engine.getCulturalRules(Language.ZH_CN);
      expect(rules.numberSuperstition).toContain(4);
    });

    it('should have number superstitions for English (13)', () => {
      const rules = engine.getCulturalRules(Language.EN_US);
      expect(rules.numberSuperstition).toContain(13);
    });

    it('should have number superstitions for Japanese (4, 9)', () => {
      const rules = engine.getCulturalRules(Language.JA_JP);
      expect(rules.numberSuperstition).toContain(4);
      expect(rules.numberSuperstition).toContain(9);
    });

    it('should adapt game recommendations by cultural preference', () => {
      const games = [
        { name: 'reaction_challenge', weight: 1.0 },
        { name: 'puzzle_grid', weight: 1.0 },
        { name: 'zen_garden', weight: 1.0 },
      ];

      // Japanese culture prefers puzzle_grid more
      const adaptedJP = engine.adaptGameRecommendation(games, Language.JA_JP);
      const adaptedUS = engine.adaptGameRecommendation(games, Language.EN_US);

      // Japanese should weight puzzle_grid higher
      const jpPuzzle = adaptedJP.find(g => g.name === 'puzzle_grid')!;
      const usPuzzle = adaptedUS.find(g => g.name === 'puzzle_grid')!;
      expect(jpPuzzle.weight).toBeGreaterThan(usPuzzle.weight);
    });

    it('should check if a number should be avoided', () => {
      expect(engine.shouldAvoidNumber(4, Language.ZH_CN)).toBe(true);
      expect(engine.shouldAvoidNumber(13, Language.EN_US)).toBe(true);
      expect(engine.shouldAvoidNumber(7, Language.EN_US)).toBe(false);
    });

    it('should return RTL for Arabic', () => {
      const config = engine.getLocaleConfig(Language.AR_SA);
      expect(config.textDirection).toBe(TextDirection.RTL);
    });

    it('should return LTR for English', () => {
      const config = engine.getLocaleConfig(Language.EN_US);
      expect(config.textDirection).toBe(TextDirection.LTR);
    });
  });

  // ===== pluralize =====

  describe('pluralize()', () => {
    it('should use singular for count 1 in English', () => {
      expect(engine.pluralize(1, 'cat', 'cats', Language.EN_US)).toBe('1 cat');
    });

    it('should use plural for count > 1 in English', () => {
      expect(engine.pluralize(5, 'cat', 'cats', Language.EN_US)).toBe('5 cats');
    });

    it('should use plural for count 0 in English', () => {
      expect(engine.pluralize(0, 'cat', 'cats', Language.EN_US)).toBe('0 cats');
    });

    it('should not pluralize in Chinese', () => {
      expect(engine.pluralize(5, '猫', '猫们', Language.ZH_CN)).toBe('5 猫');
    });

    it('should not pluralize in Japanese', () => {
      expect(engine.pluralize(5, '猫', '猫たち', Language.JA_JP)).toBe('5 猫');
    });

    it('should not pluralize in Korean', () => {
      expect(engine.pluralize(5, '고양이', '고양이들', Language.KO_KR)).toBe('5 고양이');
    });

    it('should handle Arabic pluralization (simplified)', () => {
      // Arabic: 0 or 1 = singular, 2-10 = plural
      expect(engine.pluralize(0, 'قطة', 'قطط', Language.AR_SA)).toBe('0 قطة');
      expect(engine.pluralize(1, 'قطة', 'قطط', Language.AR_SA)).toBe('1 قطة');
      expect(engine.pluralize(5, 'قطة', 'قطط', Language.AR_SA)).toBe('5 قطط');
    });
  });

  // ===== Supported Languages =====

  describe('getSupportedLanguages()', () => {
    it('should return all supported languages', () => {
      const languages = engine.getSupportedLanguages();
      expect(languages.length).toBe(10); // 10 languages defined
      expect(languages).toContain(Language.EN_US);
      expect(languages).toContain(Language.ZH_CN);
      expect(languages).toContain(Language.JA_JP);
      expect(languages).toContain(Language.AR_SA);
    });
  });

  // ===== getLocaleConfig =====

  describe('getLocaleConfig()', () => {
    it('should return config for Chinese', () => {
      const config = engine.getLocaleConfig(Language.ZH_CN);
      expect(config.timezone).toBe('Asia/Shanghai');
      expect(config.currency).toBe('CNY');
    });

    it('should return config for Japanese', () => {
      const config = engine.getLocaleConfig(Language.JA_JP);
      expect(config.timezone).toBe('Asia/Tokyo');
      expect(config.currency).toBe('JPY');
    });

    it('should return config for Arabic with RTL', () => {
      const config = engine.getLocaleConfig(Language.AR_SA);
      expect(config.textDirection).toBe(TextDirection.RTL);
      expect(config.firstDayOfWeek).toBe(6);
    });

    it('should fall back to English for unknown language config', () => {
      // If a language has no locale config, fallback to EN_US
      const config = engine.getLocaleConfig();
      expect(config).toBeDefined();
      expect(config.numberFormat).toBeDefined();
    });
  });
});
