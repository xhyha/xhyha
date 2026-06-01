/**
 * Genesis AI Micro-Game Engine - Internationalization Engine
 *
 * Multi-language support with timezone awareness, cultural adaptation,
 * pluralization, and formatting utilities for 10+ languages.
 */

// ========== Enums ==========

/** Supported language */
export enum Language {
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  EN_US = 'en-US',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  ES_ES = 'es-ES',
  FR_FR = 'fr-FR',
  DE_DE = 'de-DE',
  PT_BR = 'pt-BR',
  AR_SA = 'ar-SA',
}

/** Text direction */
export enum TextDirection {
  LTR = 'LTR',
  RTL = 'RTL',
}

// ========== Interfaces ==========

/** Localized string set */
export interface ILocalizedString {
  [key: string]: string;
}

/** Locale config */
export interface ILocaleConfig {
  language: Language;
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: { decimal: string; thousands: string };
  textDirection: TextDirection;
  firstDayOfWeek: 0 | 1 | 6;
}

/** Cultural rule */
export interface ICulturalRule {
  language: Language;
  gamePreferences: Record<string, number>;
  colorSchemes: Record<string, string>;
  greetingStyle: 'formal' | 'casual' | 'cute';
  emojiUsage: 'heavy' | 'moderate' | 'minimal';
  numberSuperstition: number[];
}

/**
 * I18nEngine - Internationalization engine with multi-language support,
 * timezone awareness, and cultural adaptation.
 */
export class I18nEngine {
  private translations: Map<string, Map<string, string>> = new Map();
  private localeConfigs: Map<string, ILocaleConfig> = new Map();
  private culturalRules: Map<string, ICulturalRule> = new Map();
  private currentLanguage: Language;

  constructor(defaultLanguage: Language = Language.EN_US) {
    this.currentLanguage = defaultLanguage;
    this.registerDefaultLocaleConfigs();
    this.registerDefaultCulturalRules();
    this.registerDefaultTranslations();
  }

  // ========== Language Management ==========

  /**
   * Set the current language.
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language.
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get all supported languages.
   */
  getSupportedLanguages(): Language[] {
    return Object.values(Language);
  }

  // ========== Translation ==========

  /**
   * Translate a key with optional interpolation parameters.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const langKey = this.currentLanguage as string;
    const langTranslations = this.translations.get(langKey);

    let text: string;

    if (langTranslations && langTranslations.has(key)) {
      text = langTranslations.get(key)!;
    } else {
      // Fallback to English
      const enTranslations = this.translations.get(Language.EN_US as string);
      if (enTranslations && enTranslations.has(key)) {
        text = enTranslations.get(key)!;
      } else {
        // Return the key itself as last resort
        return key;
      }
    }

    // Interpolate parameters
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue));
      }
    }

    return text;
  }

  /**
   * Register translations for a language and category.
   */
  registerTranslations(
    language: Language,
    category: string,
    translations: Record<string, string>,
  ): void {
    const langKey = language as string;

    if (!this.translations.has(langKey)) {
      this.translations.set(langKey, new Map());
    }

    const langMap = this.translations.get(langKey)!;
    for (const [key, value] of Object.entries(translations)) {
      // Store with category prefix
      langMap.set(`${category}.${key}`, value);
    }
  }

  // ========== Locale ==========

  /**
   * Get the locale configuration for a language.
   */
  getLocaleConfig(language?: Language): ILocaleConfig {
    const lang = (language ?? this.currentLanguage) as string;
    const config = this.localeConfigs.get(lang);
    if (config) return config;

    // Fallback to English
    const enConfig = this.localeConfigs.get(Language.EN_US as string);
    if (enConfig) return enConfig;

    // Ultimate fallback
    return {
      language: Language.EN_US,
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: { decimal: '.', thousands: ',' },
      textDirection: TextDirection.LTR,
      firstDayOfWeek: 0,
    };
  }

  /**
   * Format a number according to locale conventions.
   */
  formatNumber(value: number, language?: Language): string {
    const config = this.getLocaleConfig(language);
    const { decimal, thousands } = config.numberFormat;

    const parts = Math.abs(value).toString().split('.');
    const intPart = parts[0];
    const decPart = parts[1];

    // Add thousands separators
    let formatted = '';
    for (let i = intPart.length - 1, count = 0; i >= 0; i--, count++) {
      if (count > 0 && count % 3 === 0) {
        formatted = thousands + formatted;
      }
      formatted = intPart[i] + formatted;
    }

    if (value < 0) {
      formatted = '-' + formatted;
    }

    if (decPart) {
      formatted += decimal + decPart;
    }

    return formatted;
  }

  /**
   * Format a timestamp as a date string.
   */
  formatDate(timestamp: number, format?: string, language?: Language): string {
    const config = this.getLocaleConfig(language);
    const dateFmt = format ?? config.dateFormat;
    const date = new Date(timestamp);

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return dateFmt
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes);
  }

  /**
   * Format a number as currency.
   */
  formatCurrency(amount: number, currency?: string, language?: Language): string {
    const config = this.getLocaleConfig(language);
    const curr = currency ?? config.currency;
    const formatted = this.formatNumber(Math.abs(amount), language);

    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CNY: '¥',
      JPY: '¥',
      KRW: '₩',
      BRL: 'R$',
      SAR: '﷼',
    };

    const symbol = currencySymbols[curr] ?? curr;
    const sign = amount < 0 ? '-' : '';

    // Different placement conventions
    const lang = (language ?? this.currentLanguage) as string;
    if (lang === Language.ZH_CN || lang === Language.ZH_TW || lang === Language.JA_JP) {
      return `${sign}${symbol}${formatted}`;
    }
    if (lang === Language.DE_DE || lang === Language.FR_FR || lang === Language.ES_ES) {
      return `${sign}${formatted} ${symbol}`;
    }
    return `${sign}${symbol}${formatted}`;
  }

  /**
   * Format a timestamp as a relative time string (e.g., "3 hours ago", "2天前").
   */
  formatRelativeTime(timestamp: number, language?: Language): string {
    const now = Date.now();
    const diff = now - timestamp;
    const absDiff = Math.abs(diff);
    const lang = (language ?? this.currentLanguage) as string;
    const isPast = diff > 0;

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Chinese
    if (lang === Language.ZH_CN || lang === Language.ZH_TW) {
      if (seconds < 60) return '刚刚';
      if (minutes < 60) return isPast ? `${minutes}分钟前` : `${minutes}分钟后`;
      if (hours < 24) return isPast ? `${hours}小时前` : `${hours}小时后`;
      return isPast ? `${days}天前` : `${days}天后`;
    }

    // Japanese
    if (lang === Language.JA_JP) {
      if (seconds < 60) return 'たった今';
      if (minutes < 60) return isPast ? `${minutes}分前` : `${minutes}分後`;
      if (hours < 24) return isPast ? `${hours}時間前` : `${hours}時間後`;
      return isPast ? `${days}日前` : `${days}日後`;
    }

    // Korean
    if (lang === Language.KO_KR) {
      if (seconds < 60) return '방금';
      if (minutes < 60) return isPast ? `${minutes}분 전` : `${minutes}분 후`;
      if (hours < 24) return isPast ? `${hours}시간 전` : `${hours}시간 후`;
      return isPast ? `${days}일 전` : `${days}일 후`;
    }

    // English and other RTL/Latin languages
    if (seconds < 60) return 'just now';
    if (minutes < 60) {
      const unit = minutes === 1 ? 'minute' : 'minutes';
      return isPast ? `${minutes} ${unit} ago` : `in ${minutes} ${unit}`;
    }
    if (hours < 24) {
      const unit = hours === 1 ? 'hour' : 'hours';
      return isPast ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
    }
    {
      const unit = days === 1 ? 'day' : 'days';
      return isPast ? `${days} ${unit} ago` : `in ${days} ${unit}`;
    }
  }

  // ========== Cultural Adaptation ==========

  /**
   * Get cultural rules for a language.
   */
  getCulturalRules(language?: Language): ICulturalRule {
    const lang = (language ?? this.currentLanguage) as string;
    const rules = this.culturalRules.get(lang);
    if (rules) return rules;

    // Fallback to English
    const enRules = this.culturalRules.get(Language.EN_US as string);
    if (enRules) return enRules;

    // Ultimate fallback
    return {
      language: Language.EN_US,
      gamePreferences: {},
      colorSchemes: {},
      greetingStyle: 'casual',
      emojiUsage: 'moderate',
      numberSuperstition: [],
    };
  }

  /**
   * Adapt game recommendations based on cultural preferences.
   * Re-weights games according to cultural preference scores.
   */
  adaptGameRecommendation(
    games: Array<{ name: string; weight: number }>,
    language?: Language,
  ): Array<{ name: string; weight: number }> {
    const rules = this.getCulturalRules(language);

    return games.map(game => {
      const culturalWeight = rules.gamePreferences[game.name] ?? 1.0;
      return {
        name: game.name,
        weight: game.weight * culturalWeight,
      };
    }).sort((a, b) => b.weight - a.weight);
  }

  /**
   * Get a culturally appropriate greeting.
   */
  getGreeting(language?: Language): string {
    const rules = this.getCulturalRules(language);
    const lang = (language ?? this.currentLanguage) as string;

    const greetings: Record<string, Record<string, string>> = {
      'zh-CN': {
        formal: '您好，欢迎回来',
        casual: '嗨，欢迎回来！',
        cute: '嗨嗨～欢迎回来呀～✨',
      },
      'zh-TW': {
        formal: '您好，歡迎回來',
        casual: '嗨，歡迎回來！',
        cute: '嗨嗨～歡迎回來呀～✨',
      },
      'en-US': {
        formal: 'Welcome back',
        casual: 'Hey, welcome back!',
        cute: 'Hey there! Welcome back~ 💫',
      },
      'ja-JP': {
        formal: 'おかえりなさい',
        casual: 'おかえり！',
        cute: 'おかえりなさい～✨',
      },
      'ko-KR': {
        formal: '안녕하세요, 돌아오셨군요',
        casual: '안녕! 돌아왔어?',
        cute: '안녕～ 돌아왔구나! ✨',
      },
    };

    const langGreetings = greetings[lang] ?? greetings[Language.EN_US as string];
    if (!langGreetings) return 'Welcome back';

    return langGreetings[rules.greetingStyle] ?? langGreetings['casual'];
  }

  /**
   * Check if a number should be avoided due to cultural superstitions.
   */
  shouldAvoidNumber(num: number, language?: Language): boolean {
    const rules = this.getCulturalRules(language);
    return rules.numberSuperstition.includes(num);
  }

  // ========== Pluralization ==========

  /**
   * Pluralize a word based on count and language rules.
   */
  pluralize(count: number, singular: string, plural: string, language?: Language): string {
    const lang = (language ?? this.currentLanguage) as string;

    // East Asian languages generally don't use plural forms
    const noPluralLanguages = [
      Language.ZH_CN, Language.ZH_TW, Language.JA_JP, Language.KO_KR,
    ];

    if (noPluralLanguages.includes(lang as Language)) {
      return `${count} ${singular}`;
    }

    // Arabic has complex plural rules
    if (lang === Language.AR_SA) {
      // Simplified Arabic plural: 0/1 singular, 2-10 plural, 11-99 singular-ish
      if (count === 0 || count === 1) return `${count} ${singular}`;
      if (count >= 2 && count <= 10) return `${count} ${plural}`;
      return `${count} ${singular}`;
    }

    // Standard English/European pluralization
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${plural}`;
  }

  // ========== Private: Default Registration ==========

  /**
   * Register default locale configurations.
   */
  private registerDefaultLocaleConfigs(): void {
    const configs: ILocaleConfig[] = [
      {
        language: Language.ZH_CN,
        timezone: 'Asia/Shanghai',
        currency: 'CNY',
        dateFormat: 'YYYY年MM月DD日',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 1,
      },
      {
        language: Language.ZH_TW,
        timezone: 'Asia/Taipei',
        currency: 'TWD',
        dateFormat: 'YYYY年MM月DD日',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 0,
      },
      {
        language: Language.EN_US,
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 0,
      },
      {
        language: Language.JA_JP,
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        dateFormat: 'YYYY年MM月DD日',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 0,
      },
      {
        language: Language.KO_KR,
        timezone: 'Asia/Seoul',
        currency: 'KRW',
        dateFormat: 'YYYY.MM.DD',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 0,
      },
      {
        language: Language.ES_ES,
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: ',', thousands: '.' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 1,
      },
      {
        language: Language.FR_FR,
        timezone: 'Europe/Paris',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: ',', thousands: ' ' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 1,
      },
      {
        language: Language.DE_DE,
        timezone: 'Europe/Berlin',
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: { decimal: ',', thousands: '.' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 1,
      },
      {
        language: Language.PT_BR,
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: ',', thousands: '.' },
        textDirection: TextDirection.LTR,
        firstDayOfWeek: 0,
      },
      {
        language: Language.AR_SA,
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: '.', thousands: ',' },
        textDirection: TextDirection.RTL,
        firstDayOfWeek: 6,
      },
    ];

    for (const config of configs) {
      this.localeConfigs.set(config.language as string, config);
    }
  }

  /**
   * Register default cultural rules.
   */
  private registerDefaultCulturalRules(): void {
    const rules: ICulturalRule[] = [
      {
        language: Language.ZH_CN,
        gamePreferences: {
          reaction_challenge: 1.2,
          puzzle_grid: 1.3,
          strategy_game: 1.2,
          zen_garden: 0.9,
          competitive_sprint: 1.1,
        },
        colorSchemes: {
          default: '#FF4444',
          festive: '#FF0000',
          calm: '#4A90D9',
        },
        greetingStyle: 'cute',
        emojiUsage: 'heavy',
        numberSuperstition: [4],
      },
      {
        language: Language.ZH_TW,
        gamePreferences: {
          reaction_challenge: 1.1,
          puzzle_grid: 1.2,
          strategy_game: 1.1,
          zen_garden: 1.0,
          competitive_sprint: 0.9,
        },
        colorSchemes: {
          default: '#FF6644',
          festive: '#FF0000',
          calm: '#4A90D9',
        },
        greetingStyle: 'cute',
        emojiUsage: 'heavy',
        numberSuperstition: [4],
      },
      {
        language: Language.EN_US,
        gamePreferences: {
          reaction_challenge: 1.0,
          puzzle_grid: 1.0,
          strategy_game: 1.0,
          zen_garden: 1.0,
          competitive_sprint: 1.2,
        },
        colorSchemes: {
          default: '#4A90D9',
          festive: '#FFD700',
          calm: '#2ECC71',
        },
        greetingStyle: 'casual',
        emojiUsage: 'moderate',
        numberSuperstition: [13],
      },
      {
        language: Language.JA_JP,
        gamePreferences: {
          reaction_challenge: 1.1,
          puzzle_grid: 1.4,
          strategy_game: 1.2,
          zen_garden: 1.3,
          competitive_sprint: 1.0,
        },
        colorSchemes: {
          default: '#FF6B9D',
          festive: '#FF1493',
          calm: '#87CEEB',
        },
        greetingStyle: 'cute',
        emojiUsage: 'heavy',
        numberSuperstition: [4, 9],
      },
      {
        language: Language.KO_KR,
        gamePreferences: {
          reaction_challenge: 1.3,
          puzzle_grid: 1.2,
          strategy_game: 1.1,
          zen_garden: 0.8,
          competitive_sprint: 1.4,
        },
        colorSchemes: {
          default: '#4A90D9',
          festive: '#FF4444',
          calm: '#87CEEB',
        },
        greetingStyle: 'casual',
        emojiUsage: 'moderate',
        numberSuperstition: [4],
      },
    ];

    for (const rule of rules) {
      this.culturalRules.set(rule.language as string, rule);
    }
  }

  /**
   * Register default translations for common, games, and emotions categories.
   */
  private registerDefaultTranslations(): void {
    // ===== ZH_CN (Simplified Chinese) =====
    this.registerTranslations(Language.ZH_CN, 'common', {
      hello: '你好',
      goodbye: '再见',
      yes: '是',
      no: '否',
      loading: '加载中...',
      error: '出错了',
      success: '成功',
      cancel: '取消',
      confirm: '确认',
      retry: '重试',
      settings: '设置',
      back: '返回',
      next: '下一步',
      done: '完成',
    });

    this.registerTranslations(Language.ZH_CN, 'games', {
      game_over: '游戏结束',
      score: '得分',
      time: '时间',
      best_score: '最高分',
      new_high_score: '新纪录！',
      play_again: '再来一局',
      share_result: '分享成绩',
    });

    this.registerTranslations(Language.ZH_CN, 'emotions', {
      happy: '开心',
      sad: '难过',
      frustrated: '沮丧',
      excited: '兴奋',
      calm: '平静',
      bored: '无聊',
      anxious: '焦虑',
      angry: '生气',
    });

    // ===== EN_US (English) =====
    this.registerTranslations(Language.EN_US, 'common', {
      hello: 'Hello',
      goodbye: 'Goodbye',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      error: 'Something went wrong',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      retry: 'Retry',
      settings: 'Settings',
      back: 'Back',
      next: 'Next',
      done: 'Done',
    });

    this.registerTranslations(Language.EN_US, 'games', {
      game_over: 'Game Over',
      score: 'Score',
      time: 'Time',
      best_score: 'Best Score',
      new_high_score: 'New High Score!',
      play_again: 'Play Again',
      share_result: 'Share Result',
    });

    this.registerTranslations(Language.EN_US, 'emotions', {
      happy: 'Happy',
      sad: 'Sad',
      frustrated: 'Frustrated',
      excited: 'Excited',
      calm: 'Calm',
      bored: 'Bored',
      anxious: 'Anxious',
      angry: 'Angry',
    });

    // ===== JA_JP (Japanese) =====
    this.registerTranslations(Language.JA_JP, 'common', {
      hello: 'こんにちは',
      goodbye: 'さようなら',
      yes: 'はい',
      no: 'いいえ',
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      success: '成功',
      cancel: 'キャンセル',
      confirm: '確認',
      retry: 'リトライ',
      settings: '設定',
      back: '戻る',
      next: '次へ',
      done: '完了',
    });

    this.registerTranslations(Language.JA_JP, 'games', {
      game_over: 'ゲームオーバー',
      score: 'スコア',
      time: '時間',
      best_score: 'ベストスコア',
      new_high_score: '新記録！',
      play_again: 'もう一度プレイ',
      share_result: '結果をシェア',
    });

    this.registerTranslations(Language.JA_JP, 'emotions', {
      happy: '嬉しい',
      sad: '悲しい',
      frustrated: 'イライラ',
      excited: 'ワクワク',
      calm: '穏やか',
      bored: '退屈',
      anxious: '不安',
      angry: '怒り',
    });
  }
}
