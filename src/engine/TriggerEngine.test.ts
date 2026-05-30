import { TriggerEngine, ITriggerResult } from './TriggerEngine';
import { EventEmitter } from '../core/EventEmitter';
import { ITrigger, ITriggerContext, TriggerCategory, EmotionState } from '../models/types';
import { TriggerContextFactory } from '../models/TriggerContext';

describe('TriggerEngine', () => {
  let engine: TriggerEngine;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    engine = new TriggerEngine(eventEmitter);
  });

  afterEach(() => {
    eventEmitter.destroy();
  });

  // ===== Helpers =====

  function makeTrigger(overrides: Partial<ITrigger> = {}): ITrigger {
    return {
      id: overrides.id ?? 'test-trigger',
      category: overrides.category ?? TriggerCategory.BEHAVIOR,
      name: overrides.name ?? 'Test Trigger',
      description: overrides.description ?? 'A test trigger',
      cooldown: overrides.cooldown ?? 60,
      priority: overrides.priority ?? 5,
      condition: overrides.condition ?? (() => true),
    };
  }

  // ===== registerTrigger / registerTriggers =====

  describe('registerTrigger()', () => {
    it('should register a single trigger', () => {
      engine.registerTrigger(makeTrigger({ id: 't1' }));
      expect(engine.getTriggerCount()).toBe(1);
    });

    it('should overwrite a trigger with the same id', () => {
      engine.registerTrigger(makeTrigger({ id: 't1', name: 'First' }));
      engine.registerTrigger(makeTrigger({ id: 't1', name: 'Second' }));
      expect(engine.getTriggerCount()).toBe(1);
    });
  });

  describe('registerTriggers()', () => {
    it('should register multiple triggers at once', () => {
      engine.registerTriggers([
        makeTrigger({ id: 't1' }),
        makeTrigger({ id: 't2' }),
        makeTrigger({ id: 't3' }),
      ]);
      expect(engine.getTriggerCount()).toBe(3);
    });
  });

  // ===== removeTrigger =====

  describe('removeTrigger()', () => {
    it('should remove a registered trigger', () => {
      engine.registerTrigger(makeTrigger({ id: 't1' }));
      engine.removeTrigger('t1');
      expect(engine.getTriggerCount()).toBe(0);
    });

    it('should not throw when removing non-existent trigger', () => {
      expect(() => engine.removeTrigger('nonexistent')).not.toThrow();
    });
  });

  // ===== evaluate =====

  describe('evaluate()', () => {
    it('should return triggered=true when condition matches', () => {
      engine.registerTrigger(makeTrigger({
        id: 'download-trigger',
        condition: (ctx) => ctx.isDownloading,
      }));

      const context = TriggerContextFactory.createDownloadWaiting(50);
      const result = engine.evaluate(context);

      expect(result.triggered).toBe(true);
      expect(result.trigger).not.toBeNull();
      expect(result.trigger!.id).toBe('download-trigger');
    });

    it('should return triggered=false when no conditions match', () => {
      engine.registerTrigger(makeTrigger({
        id: 'never-fires',
        condition: () => false,
      }));

      const context = TriggerContextFactory.createDefault();
      const result = engine.evaluate(context);

      expect(result.triggered).toBe(false);
      expect(result.trigger).toBeNull();
      expect(result.reason).toBe('No matching triggers');
    });

    it('should return triggered=false when no triggers registered', () => {
      const context = TriggerContextFactory.createDefault();
      const result = engine.evaluate(context);

      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('No matching triggers');
    });

    it('should pick the highest priority trigger when multiple match', () => {
      engine.registerTriggers([
        makeTrigger({ id: 'low', priority: 1, name: 'Low Priority' }),
        makeTrigger({ id: 'high', priority: 10, name: 'High Priority' }),
        makeTrigger({ id: 'mid', priority: 5, name: 'Mid Priority' }),
      ]);

      const context = TriggerContextFactory.createDefault();
      const result = engine.evaluate(context);

      expect(result.triggered).toBe(true);
      expect(result.trigger!.id).toBe('high');
      expect(result.reason).toBe('High Priority');
    });

    it('should enforce cooldown between fires', () => {
      engine.registerTrigger(makeTrigger({
        id: 'cooldown-test',
        cooldown: 60, // 60 seconds
      }));

      // Use large timestamps so initial (timestamp - 0) / 1000 > 60
      const context1 = TriggerContextFactory.createDefault({ timestamp: 120000 });
      const result1 = engine.evaluate(context1);
      expect(result1.triggered).toBe(true);

      // Fire again almost immediately (within cooldown: only 1s passed)
      const context2 = TriggerContextFactory.createDefault({ timestamp: 121000 });
      const result2 = engine.evaluate(context2);
      expect(result2.triggered).toBe(false);
      expect(result2.reason).toBe('No matching triggers');
    });

    it('should allow re-firing after cooldown expires', () => {
      engine.registerTrigger(makeTrigger({
        id: 'cooldown-test',
        cooldown: 5, // 5 seconds
      }));

      // Use large timestamps so initial (timestamp - 0) / 1000 > 5
      const context1 = TriggerContextFactory.createDefault({ timestamp: 60000 });
      const result1 = engine.evaluate(context1);
      expect(result1.triggered).toBe(true);

      // After cooldown: 60s + 10s = 70s; (70000 - 60000)/1000 = 10 > 5
      const context2 = TriggerContextFactory.createDefault({ timestamp: 70000 });
      const result2 = engine.evaluate(context2);
      expect(result2.triggered).toBe(true);
    });

    it('should skip triggers whose condition throws an error', () => {
      engine.registerTriggers([
        makeTrigger({
          id: 'bad-trigger',
          priority: 10,
          condition: () => { throw new Error('condition error'); },
        }),
        makeTrigger({
          id: 'good-trigger',
          priority: 5,
          condition: () => true,
        }),
      ]);

      const context = TriggerContextFactory.createDefault();
      const result = engine.evaluate(context);

      // Should skip bad and use good
      expect(result.triggered).toBe(true);
      expect(result.trigger!.id).toBe('good-trigger');
    });
  });

  // ===== suppression =====

  describe('suppress()', () => {
    it('should suppress all triggers during suppression period', () => {
      engine.registerTrigger(makeTrigger({
        id: 'always',
        condition: () => true,
      }));

      engine.suppress(60000); // suppress for 60 seconds

      const context = TriggerContextFactory.createDefault();
      const result = engine.evaluate(context);

      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('Globally suppressed');
    });
  });

  // ===== getTriggersByCategory =====

  describe('getTriggersByCategory()', () => {
    it('should return triggers matching category', () => {
      engine.registerTriggers([
        makeTrigger({ id: 't1', category: TriggerCategory.BEHAVIOR }),
        makeTrigger({ id: 't2', category: TriggerCategory.TIME }),
        makeTrigger({ id: 't3', category: TriggerCategory.BEHAVIOR }),
      ]);

      const behavior = engine.getTriggersByCategory(TriggerCategory.BEHAVIOR);
      expect(behavior).toHaveLength(2);
      expect(behavior.map(t => t.id)).toEqual(
        expect.arrayContaining(['t1', 't3'])
      );
    });

    it('should return empty array for category with no triggers', () => {
      const emotion = engine.getTriggersByCategory(TriggerCategory.EMOTION);
      expect(emotion).toHaveLength(0);
    });
  });

  // ===== Event emission =====

  describe('event emission', () => {
    it('should emit TRIGGER_FIRED event when trigger fires', () => {
      const listener = jest.fn();
      eventEmitter.on('TRIGGER_FIRED', listener);

      engine.registerTrigger(makeTrigger({ id: 'evt-test', name: 'Event Test' }));

      const context = TriggerContextFactory.createDefault();
      engine.evaluate(context);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerId: 'evt-test',
          triggerName: 'Event Test',
        })
      );
    });

    it('should not emit when suppressed', () => {
      const listener = jest.fn();
      eventEmitter.on('TRIGGER_FIRED', listener);

      engine.registerTrigger(makeTrigger());
      engine.suppress(60000);

      const context = TriggerContextFactory.createDefault();
      engine.evaluate(context);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
