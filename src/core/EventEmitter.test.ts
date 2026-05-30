import { EventEmitter } from './EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  afterEach(() => {
    emitter.destroy();
  });

  // ===== on() + emit() =====

  describe('on()', () => {
    it('should subscribe a callback that fires on emit', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.emit('test', { value: 42 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support multiple listeners on the same event', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.emit('test');

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      const listener = jest.fn();
      const unsub = emitter.on('test', listener);

      unsub();
      emitter.emit('test');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow re-subscribing after unsubscribe', () => {
      const listener = jest.fn();
      const unsub = emitter.on('test', listener);

      unsub();
      emitter.on('test', listener);
      emitter.emit('test');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle the same callback added twice (Set dedup)', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.on('test', listener); // same fn reference

      emitter.emit('test');
      // Set prevents duplicates, so only one call
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // ===== once() =====

  describe('once()', () => {
    it('should fire the callback exactly once', () => {
      const listener = jest.fn();
      emitter.once('test', listener);

      emitter.emit('test', { a: 1 });
      emitter.emit('test', { a: 2 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ a: 1 });
    });

    it('should return an unsubscribe function that works before emit', () => {
      const listener = jest.fn();
      const unsub = emitter.once('test', listener);

      unsub();
      emitter.emit('test');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should not interfere with other listeners on same event', () => {
      const onceListener = jest.fn();
      const permanentListener = jest.fn();

      emitter.once('evt', onceListener);
      emitter.on('evt', permanentListener);

      emitter.emit('evt');
      emitter.emit('evt');

      expect(onceListener).toHaveBeenCalledTimes(1);
      expect(permanentListener).toHaveBeenCalledTimes(2);
    });
  });

  // ===== emit() =====

  describe('emit()', () => {
    it('should not throw when emitting with no listeners', () => {
      expect(() => emitter.emit('nonexistent')).not.toThrow();
    });

    it('should pass empty object as default data', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.emit('test');

      expect(listener).toHaveBeenCalledWith({});
    });

    it('should catch errors in listeners and not propagate', () => {
      const badListener = jest.fn(() => {
        throw new Error('boom');
      });
      const goodListener = jest.fn();

      emitter.on('test', badListener);
      emitter.on('test', goodListener);

      // Should not throw despite bad listener
      expect(() => emitter.emit('test')).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should emit to correct event only', () => {
      const listenerA = jest.fn();
      const listenerB = jest.fn();

      emitter.on('A', listenerA);
      emitter.on('B', listenerB);
      emitter.emit('A');

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).not.toHaveBeenCalled();
    });
  });

  // ===== off() =====

  describe('off()', () => {
    it('should remove all listeners for a specific event', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();

      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.off('test');

      emitter.emit('test');

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('should clear all events when called with no argument', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();

      emitter.on('A', fn1);
      emitter.on('B', fn2);
      emitter.off();

      emitter.emit('A');
      emitter.emit('B');

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('should not throw when removing a nonexistent event', () => {
      expect(() => emitter.off('nonexistent')).not.toThrow();
    });
  });

  // ===== listenerCount() =====

  describe('listenerCount()', () => {
    it('should return 0 for events with no listeners', () => {
      expect(emitter.listenerCount('nonexistent')).toBe(0);
    });

    it('should return correct count after adding listeners', () => {
      emitter.on('test', jest.fn());
      emitter.on('test', jest.fn());

      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('should decrease after unsubscribe', () => {
      const unsub = emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(1);

      unsub();
      expect(emitter.listenerCount('test')).toBe(0);
    });

    it('should decrease after off(event)', () => {
      emitter.on('test', jest.fn());
      emitter.off('test');

      expect(emitter.listenerCount('test')).toBe(0);
    });
  });

  // ===== destroy() =====

  describe('destroy()', () => {
    it('should remove all listeners', () => {
      emitter.on('A', jest.fn());
      emitter.on('B', jest.fn());

      emitter.destroy();

      expect(emitter.listenerCount('A')).toBe(0);
      expect(emitter.listenerCount('B')).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      emitter.on('test', jest.fn());
      emitter.destroy();
      emitter.destroy();

      expect(emitter.listenerCount('test')).toBe(0);
    });
  });
});
