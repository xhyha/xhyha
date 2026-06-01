/**
 * Genesis Template SDK - Open platform API for third-party game template development.
 * Provides validation, registration, search, import/export, and runtime adaptation.
 */

import {
  IGameTemplate, IGameConfig, IMicroGame, IGameInput,
  IGameResult, IGameEntity, GameType, GameState,
} from '../models/types';

/** Template SDK version */
export const SDK_VERSION = '2.0.0';

/** Template metadata for the marketplace */
export interface ITemplateMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  icon: string; // emoji
  minDifficulty: number;
  maxDifficulty: number;
  estimatedDuration: number; // seconds
  screenshot?: string; // URL
}

/** Template validation result */
export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}

export interface IValidationError {
  field: string;
  message: string;
  code: string;
}

export interface IValidationWarning {
  field: string;
  message: string;
}

/** Custom template config for SDK users */
export interface ICustomTemplateConfig {
  metadata: ITemplateMetadata;
  gameType: GameType;
  initializeFn: (config: IGameConfig) => IGameEntity[];
  inputFn: (game: IMicroGame, input: IGameInput) => IMicroGame;
  updateFn: (game: IMicroGame, dt: number) => IMicroGame;
  completeFn: (game: IMicroGame) => boolean;
  scoreFn?: (game: IMicroGame) => number;
}

/** Template registration result */
export interface IRegistrationResult {
  success: boolean;
  templateId: string;
  message: string;
}

/** Internal serialisable representation for import/export */
interface ITemplateExport {
  sdkVersion: string;
  metadata: ITemplateMetadata;
  gameType: GameType;
  exportedAt: number;
}

// ---------------------------------------------------------------------------
// Semver-like regex: allows optional leading "v" and pre-release suffix.
// ---------------------------------------------------------------------------
const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

// ---------------------------------------------------------------------------
// Adapter: wraps an ICustomTemplateConfig so it conforms to IGameTemplate.
// ---------------------------------------------------------------------------
class CustomTemplateAdapter implements IGameTemplate {
  readonly type: GameType;
  readonly name: string;

  private config: ICustomTemplateConfig;

  constructor(config: ICustomTemplateConfig) {
    this.config = config;
    this.type = config.gameType;
    this.name = config.metadata.name;
  }

  createGame(config: IGameConfig): IMicroGame {
    return {
      config,
      state: GameState.IDLE,
      score: 0,
      elapsed: 0,
      entities: this.config.initializeFn(config),
    };
  }

  handleInput(game: IMicroGame, input: IGameInput): IMicroGame {
    if (game.state === GameState.IDLE) {
      game = { ...game, state: GameState.PLAYING };
    }
    if (game.state !== GameState.PLAYING) return game;
    return this.config.inputFn(game, input);
  }

  update(game: IMicroGame, dt: number): IMicroGame {
    if (game.state !== GameState.PLAYING) return game;

    let updated = this.config.updateFn(game, dt);
    updated = { ...updated, elapsed: updated.elapsed + dt };

    if (updated.elapsed >= updated.config.maxDuration) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    if (this.config.completeFn(updated)) {
      updated = { ...updated, state: GameState.COMPLETED };
    }

    if (this.config.scoreFn) {
      updated = { ...updated, score: this.config.scoreFn(updated) };
    }

    return updated;
  }

  isComplete(game: IMicroGame): boolean {
    return this.config.completeFn(game);
  }

  getResult(game: IMicroGame): IGameResult {
    return {
      gameId: game.config.id,
      gameType: game.config.type,
      score: game.score,
      maxScore: 1000,
      duration: game.elapsed,
      completed: game.state === GameState.COMPLETED,
      difficulty: game.config.difficulty,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------------------------
// TemplateSDK
// ---------------------------------------------------------------------------

/**
 * Open platform API that allows third-party developers to create, validate,
 * register, search, import and export custom game templates.
 */
export class TemplateSDK {
  private customTemplates: Map<string, ICustomTemplateConfig>;
  private registeredMetadata: Map<string, ITemplateMetadata>;

  constructor() {
    this.customTemplates = new Map();
    this.registeredMetadata = new Map();
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  /**
   * Validate a custom template config. Returns a result with errors and
   * warnings (warnings do not prevent registration).
   */
  validate(config: ICustomTemplateConfig): IValidationResult {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];

    // --- metadata presence ---
    if (!config.metadata) {
      errors.push({
        field: 'metadata',
        message: 'Metadata is required',
        code: 'METADATA_REQUIRED',
      });
      return { valid: false, errors, warnings };
    }

    const md = config.metadata;

    // --- metadata.id ---
    if (typeof md.id !== 'string' || md.id.length === 0) {
      errors.push({
        field: 'metadata.id',
        message: 'metadata.id must be a non-empty string',
        code: 'ID_EMPTY',
      });
    } else if (!md.id.startsWith('custom_')) {
      errors.push({
        field: 'metadata.id',
        message: 'metadata.id must start with "custom_"',
        code: 'ID_PREFIX',
      });
    }

    // --- metadata.name ---
    if (typeof md.name !== 'string' || md.name.length < 3 || md.name.length > 50) {
      errors.push({
        field: 'metadata.name',
        message: 'metadata.name must be between 3 and 50 characters',
        code: 'NAME_LENGTH',
      });
    }

    // --- metadata.version ---
    if (typeof md.version !== 'string' || !SEMVER_RE.test(md.version)) {
      errors.push({
        field: 'metadata.version',
        message: 'metadata.version must follow semver format (x.y.z)',
        code: 'VERSION_FORMAT',
      });
    }

    // --- metadata.author ---
    if (typeof md.author !== 'string' || md.author.trim().length === 0) {
      errors.push({
        field: 'metadata.author',
        message: 'metadata.author must be a non-empty string',
        code: 'AUTHOR_EMPTY',
      });
    }

    // --- metadata.description ---
    if (typeof md.description !== 'string' || md.description.length < 10 || md.description.length > 500) {
      errors.push({
        field: 'metadata.description',
        message: 'metadata.description must be between 10 and 500 characters',
        code: 'DESCRIPTION_LENGTH',
      });
    }

    // --- metadata.estimatedDuration ---
    if (typeof md.estimatedDuration !== 'number' || md.estimatedDuration < 5 || md.estimatedDuration > 300) {
      errors.push({
        field: 'metadata.estimatedDuration',
        message: 'metadata.estimatedDuration must be between 5 and 300 seconds',
        code: 'DURATION_RANGE',
      });
    }

    // --- gameType ---
    const validGameTypes = new Set<string>(Object.values(GameType));
    if (!config.gameType || !validGameTypes.has(config.gameType)) {
      errors.push({
        field: 'gameType',
        message: 'gameType must be a valid GameType enum value',
        code: 'GAMETYPE_INVALID',
      });
    }

    // --- required functions ---
    if (typeof config.initializeFn !== 'function') {
      errors.push({
        field: 'initializeFn',
        message: 'initializeFn must be a function',
        code: 'INIT_FN_REQUIRED',
      });
    }
    if (typeof config.inputFn !== 'function') {
      errors.push({
        field: 'inputFn',
        message: 'inputFn must be a function',
        code: 'INPUT_FN_REQUIRED',
      });
    }
    if (typeof config.updateFn !== 'function') {
      errors.push({
        field: 'updateFn',
        message: 'updateFn must be a function',
        code: 'UPDATE_FN_REQUIRED',
      });
    }
    if (typeof config.completeFn !== 'function') {
      errors.push({
        field: 'completeFn',
        message: 'completeFn must be a function',
        code: 'COMPLETE_FN_REQUIRED',
      });
    }

    // --- optional scoreFn warning ---
    if (config.scoreFn === undefined) {
      warnings.push({
        field: 'scoreFn',
        message: 'No custom scoreFn provided; default scoring will be used',
      });
    }

    // --- optional metadata warnings ---
    if (!md.icon) {
      warnings.push({
        field: 'metadata.icon',
        message: 'No icon provided; a default icon will be used',
      });
    }
    if (!md.tags || md.tags.length === 0) {
      warnings.push({
        field: 'metadata.tags',
        message: 'No tags provided; template may be harder to discover',
      });
    }
    if (md.minDifficulty < 1 || md.minDifficulty > 4) {
      warnings.push({
        field: 'metadata.minDifficulty',
        message: 'minDifficulty should be between 1 and 4',
      });
    }
    if (md.maxDifficulty < 1 || md.maxDifficulty > 4) {
      warnings.push({
        field: 'metadata.maxDifficulty',
        message: 'maxDifficulty should be between 1 and 4',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  /**
   * Register a custom template after validation.
   */
  register(config: ICustomTemplateConfig): IRegistrationResult {
    const validation = this.validate(config);
    if (!validation.valid) {
      const msg = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      return {
        success: false,
        templateId: config.metadata?.id ?? '',
        message: `Validation failed: ${msg}`,
      };
    }

    const id = config.metadata.id;
    this.customTemplates.set(id, config);
    this.registeredMetadata.set(id, config.metadata);

    return {
      success: true,
      templateId: id,
      message: `Template "${config.metadata.name}" registered successfully`,
    };
  }

  /**
   * Unregister a previously registered template.
   */
  unregister(templateId: string): boolean {
    if (!this.customTemplates.has(templateId)) return false;
    this.customTemplates.delete(templateId);
    this.registeredMetadata.delete(templateId);
    return true;
  }

  // -----------------------------------------------------------------------
  // Querying
  // -----------------------------------------------------------------------

  /**
   * Get template metadata by id.
   */
  getMetadata(templateId: string): ITemplateMetadata | null {
    return this.registeredMetadata.get(templateId) ?? null;
  }

  /**
   * List all registered templates.
   */
  listTemplates(): ITemplateMetadata[] {
    return Array.from(this.registeredMetadata.values());
  }

  /**
   * Search templates by tags, category, and/or author.
   */
  search(query: { tags?: string[]; category?: string; author?: string }): ITemplateMetadata[] {
    let results = this.listTemplates();

    if (query.tags && query.tags.length > 0) {
      const searchTags = new Set(query.tags);
      results = results.filter(md =>
        md.tags && md.tags.some(t => searchTags.has(t)),
      );
    }

    if (query.category) {
      results = results.filter(md => md.category === query.category);
    }

    if (query.author) {
      results = results.filter(md => md.author === query.author);
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Template instantiation
  // -----------------------------------------------------------------------

  /**
   * Create an IGameTemplate implementation from a custom config.
   * The returned adapter can be used directly by the engine.
   */
  createTemplate(config: ICustomTemplateConfig): IGameTemplate {
    return new CustomTemplateAdapter(config);
  }

  // -----------------------------------------------------------------------
  // Import / Export
  // -----------------------------------------------------------------------

  /**
   * Export template metadata as shareable JSON.
   * Note: function implementations cannot be serialised; only metadata and
   * gameType are exported. Consumers must provide their own function
   * implementations when importing.
   */
  exportTemplate(templateId: string): string | null {
    const config = this.customTemplates.get(templateId);
    if (!config) return null;

    const payload: ITemplateExport = {
      sdkVersion: SDK_VERSION,
      metadata: config.metadata,
      gameType: config.gameType,
      exportedAt: Date.now(),
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import a template from JSON.
   * Because functions cannot be serialised, this creates a stub template
   * with no-op functions. The caller should replace the function
   * implementations after import if interactive behaviour is desired.
   */
  importTemplate(json: string): IRegistrationResult {
    let parsed: ITemplateExport;
    try {
      parsed = JSON.parse(json) as ITemplateExport;
    } catch {
      return {
        success: false,
        templateId: '',
        message: 'Invalid JSON: unable to parse template',
      };
    }

    if (!parsed.metadata || !parsed.gameType) {
      return {
        success: false,
        templateId: '',
        message: 'Missing required fields: metadata and/or gameType',
      };
    }

    // Build a stub config with no-op implementations.
    const stubConfig: ICustomTemplateConfig = {
      metadata: parsed.metadata,
      gameType: parsed.gameType,
      initializeFn: () => [],
      inputFn: (game: IMicroGame) => game,
      updateFn: (game: IMicroGame) => game,
      completeFn: () => false,
    };

    return this.register(stubConfig);
  }

  // -----------------------------------------------------------------------
  // Version
  // -----------------------------------------------------------------------

  /**
   * Get the current SDK version.
   */
  getVersion(): string {
    return SDK_VERSION;
  }
}
