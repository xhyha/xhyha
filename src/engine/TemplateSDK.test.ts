import {
  TemplateSDK,
  SDK_VERSION,
  ICustomTemplateConfig,
} from './TemplateSDK';
import { GameType, GameState } from '../models/types';

function makeValidConfig(overrides: Partial<ICustomTemplateConfig> = {}): ICustomTemplateConfig {
  return {
    metadata: {
      id: 'custom_test',
      name: 'Test Template',
      version: '1.0.0',
      author: 'Test Author',
      description: 'A test template for unit testing the SDK',
      category: 'reaction',
      tags: ['test', 'demo'],
      icon: '🎮',
      minDifficulty: 1,
      maxDifficulty: 4,
      estimatedDuration: 30,
      ...overrides.metadata,
    },
    gameType: GameType.REACTION,
    initializeFn: () => [],
    inputFn: (game) => game,
    updateFn: (game) => game,
    completeFn: () => false,
    ...overrides,
  };
}

describe('TemplateSDK', () => {
  let sdk: TemplateSDK;

  beforeEach(() => {
    sdk = new TemplateSDK();
  });

  // ===== validate =====

  describe('validate()', () => {
    it('should validate a valid config', () => {
      const config = makeValidConfig();
      const result = sdk.validate(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should warn when no scoreFn provided', () => {
      const config = makeValidConfig();
      const result = sdk.validate(config);

      const scoreWarning = result.warnings.find(w => w.field === 'scoreFn');
      expect(scoreWarning).toBeDefined();
    });

    it('should error on missing metadata', () => {
      const config = makeValidConfig({ metadata: undefined as any });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata')).toBe(true);
    });

    it('should error on empty id', () => {
      const config = makeValidConfig({ metadata: { id: '', name: 'Test', version: '1.0.0', author: 'Author', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'ID_EMPTY')).toBe(true);
    });

    it('should error on id without custom_ prefix', () => {
      const config = makeValidConfig({ metadata: { id: 'wrong_prefix', name: 'Test', version: '1.0.0', author: 'Author', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'ID_PREFIX')).toBe(true);
    });

    it('should error on name too short', () => {
      const config = makeValidConfig({ metadata: { id: 'custom_test', name: 'AB', version: '1.0.0', author: 'Author', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'NAME_LENGTH')).toBe(true);
    });

    it('should error on invalid version format', () => {
      const config = makeValidConfig({ metadata: { id: 'custom_test', name: 'Test', version: '1.0', author: 'Author', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'VERSION_FORMAT')).toBe(true);
    });

    it('should error on empty author', () => {
      const config = makeValidConfig({ metadata: { id: 'custom_test', name: 'Test', version: '1.0.0', author: '  ', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'AUTHOR_EMPTY')).toBe(true);
    });

    it('should error on description too short', () => {
      const config = makeValidConfig({ metadata: { id: 'custom_test', name: 'Test', version: '1.0.0', author: 'Author', description: 'Too short', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DESCRIPTION_LENGTH')).toBe(true);
    });

    it('should error on invalid estimatedDuration', () => {
      const config = makeValidConfig({ metadata: { id: 'custom_test', name: 'Test', version: '1.0.0', author: 'Author', description: 'A valid description for testing', category: 'test', tags: [], icon: '🎮', minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 2 } });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DURATION_RANGE')).toBe(true);
    });

    it('should error on invalid gameType', () => {
      const config = makeValidConfig({ gameType: 'INVALID' as any });
      const result = sdk.validate(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'GAMETYPE_INVALID')).toBe(true);
    });

    it('should error on missing functions', () => {
      const config = {
        metadata: {
          id: 'custom_test', name: 'Test', version: '1.0.0',
          author: 'Author', description: 'A valid description for testing',
          category: 'test', tags: [], icon: '🎮',
          minDifficulty: 1, maxDifficulty: 4, estimatedDuration: 30,
        },
        gameType: GameType.REACTION,
      } as any;

      const result = sdk.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INIT_FN_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'INPUT_FN_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'UPDATE_FN_REQUIRED')).toBe(true);
      expect(result.errors.some(e => e.code === 'COMPLETE_FN_REQUIRED')).toBe(true);
    });
  });

  // ===== register =====

  describe('register()', () => {
    it('should register a valid config', () => {
      const config = makeValidConfig();
      const result = sdk.register(config);

      expect(result.success).toBe(true);
      expect(result.templateId).toBe('custom_test');
      expect(result.message).toContain('registered successfully');
    });

    it('should reject an invalid config', () => {
      const config = makeValidConfig({ metadata: undefined as any });
      const result = sdk.register(config);

      expect(result.success).toBe(false);
    });
  });

  // ===== unregister =====

  describe('unregister()', () => {
    it('should unregister a registered template', () => {
      const config = makeValidConfig();
      sdk.register(config);

      const removed = sdk.unregister('custom_test');
      expect(removed).toBe(true);
      expect(sdk.getMetadata('custom_test')).toBeNull();
    });

    it('should return false for non-existent template', () => {
      expect(sdk.unregister('non-existent')).toBe(false);
    });
  });

  // ===== getMetadata =====

  describe('getMetadata()', () => {
    it('should return metadata for registered template', () => {
      const config = makeValidConfig();
      sdk.register(config);

      const metadata = sdk.getMetadata('custom_test');
      expect(metadata).not.toBeNull();
      expect(metadata!.name).toBe('Test Template');
      expect(metadata!.version).toBe('1.0.0');
    });

    it('should return null for non-existent template', () => {
      expect(sdk.getMetadata('non-existent')).toBeNull();
    });
  });

  // ===== listTemplates =====

  describe('listTemplates()', () => {
    it('should return empty array initially', () => {
      expect(sdk.listTemplates()).toEqual([]);
    });

    it('should list registered templates', () => {
      sdk.register(makeValidConfig());
      sdk.register(makeValidConfig({
        metadata: {
          id: 'custom_test2',
          name: 'Second Template',
          version: '1.0.0',
          author: 'Author',
          description: 'Another test template for listing',
          category: 'puzzle',
          tags: ['test'],
          icon: '🧩',
          minDifficulty: 1,
          maxDifficulty: 4,
          estimatedDuration: 30,
        },
      }));

      const list = sdk.listTemplates();
      expect(list.length).toBe(2);
    });
  });

  // ===== search =====

  describe('search()', () => {
    beforeEach(() => {
      sdk.register(makeValidConfig());
      sdk.register(makeValidConfig({
        metadata: {
          id: 'custom_puzzle',
          name: 'Puzzle Game',
          version: '1.0.0',
          author: 'PuzzleMaker',
          description: 'A puzzle game template for search testing',
          category: 'puzzle',
          tags: ['puzzle', 'brain'],
          icon: '🧩',
          minDifficulty: 2,
          maxDifficulty: 4,
          estimatedDuration: 45,
        },
        gameType: GameType.PUZZLE,
      }));
    });

    it('should search by tags', () => {
      const results = sdk.search({ tags: ['puzzle'] });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('custom_puzzle');
    });

    it('should search by category', () => {
      const results = sdk.search({ category: 'puzzle' });
      expect(results.length).toBe(1);
    });

    it('should search by author', () => {
      const results = sdk.search({ author: 'PuzzleMaker' });
      expect(results.length).toBe(1);
    });

    it('should return empty for no matches', () => {
      const results = sdk.search({ tags: ['nonexistent'] });
      expect(results.length).toBe(0);
    });
  });

  // ===== createTemplate =====

  describe('createTemplate()', () => {
    it('should create an IGameTemplate adapter', () => {
      const config = makeValidConfig();
      const template = sdk.createTemplate(config);

      expect(template).toBeDefined();
      expect(template.type).toBe(GameType.REACTION);
      expect(template.name).toBe('Test Template');
    });

    it('should create a game with correct state', () => {
      const config = makeValidConfig();
      const template = sdk.createTemplate(config);
      const game = template.createGame({
        id: 'test',
        name: 'Test',
        type: GameType.REACTION,
        description: 'desc',
        estimatedDuration: 30,
        maxDuration: 60,
        difficulty: 2,
        parameters: {},
        theme: {
          primaryColor: '#fff',
          secondaryColor: '#000',
          backgroundColor: '#333',
          fontFamily: 'system',
          particleEffect: false,
        },
      });

      expect(game.state).toBe(GameState.IDLE);
      expect(game.score).toBe(0);
    });
  });

  // ===== getVersion =====

  describe('getVersion()', () => {
    it('should return the SDK version', () => {
      expect(sdk.getVersion()).toBe('2.0.0');
      expect(sdk.getVersion()).toBe(SDK_VERSION);
    });
  });

  // ===== importTemplate / exportTemplate =====

  describe('importTemplate / exportTemplate', () => {
    it('should export a registered template as JSON', () => {
      sdk.register(makeValidConfig());
      const json = sdk.exportTemplate('custom_test');

      expect(json).not.toBeNull();
      const parsed = JSON.parse(json!);
      expect(parsed.sdkVersion).toBe('2.0.0');
      expect(parsed.metadata.id).toBe('custom_test');
      expect(parsed.gameType).toBe(GameType.REACTION);
    });

    it('should return null for non-existent template export', () => {
      expect(sdk.exportTemplate('non-existent')).toBeNull();
    });

    it('should import a template from JSON', () => {
      sdk.register(makeValidConfig());
      const json = sdk.exportTemplate('custom_test')!;
      sdk.unregister('custom_test');

      const result = sdk.importTemplate(json);
      expect(result.success).toBe(true);
      expect(result.templateId).toBe('custom_test');
    });

    it('should reject invalid JSON', () => {
      const result = sdk.importTemplate('not valid json');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });

    it('should reject JSON with missing fields', () => {
      const result = sdk.importTemplate(JSON.stringify({ foo: 'bar' }));
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
    });
  });
});
