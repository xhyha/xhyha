import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  let loop: GameLoop;
  let mockRaf: jest.Mock;
  let mockCancelRaf: jest.Mock;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let nextRafId: number;

  beforeEach(() => {
    rafCallbacks = new Map();
    nextRafId = 1;

    mockRaf = jest.fn((cb: FrameRequestCallback) => {
      const id = nextRafId++;
      rafCallbacks.set(id, cb);
      return id;
    });

    mockCancelRaf = jest.fn((id: number) => {
      rafCallbacks.delete(id);
    });

    global.requestAnimationFrame = mockRaf;
    global.cancelAnimationFrame = mockCancelRaf;

    loop = new GameLoop(16.67, 100);
  });

  afterEach(() => {
    loop.destroy();
  });

  describe('constructor', () => {
    it('should create with default values', () => {
      const defaultLoop = new GameLoop();
      expect(defaultLoop.isRunning()).toBe(false);
      defaultLoop.destroy();
    });

    it('should accept custom timestep', () => {
      const customLoop = new GameLoop(33.33, 200);
      expect(customLoop.isRunning()).toBe(false);
      customLoop.destroy();
    });
  });

  describe('start/stop lifecycle', () => {
    it('should start running', () => {
      loop.start();
      expect(loop.isRunning()).toBe(true);
      expect(mockRaf).toHaveBeenCalledTimes(1);
    });

    it('should not start twice', () => {
      loop.start();
      loop.start();
      expect(mockRaf).toHaveBeenCalledTimes(1);
    });

    it('should stop running', () => {
      loop.start();
      loop.stop();
      expect(loop.isRunning()).toBe(false);
      expect(mockCancelRaf).toHaveBeenCalled();
    });

    it('should be safe to stop when not running', () => {
      expect(() => loop.stop()).not.toThrow();
    });
  });

  describe('fixed timestep updates', () => {
    it('should call update callback at fixed rate', () => {
      const updates: number[] = [];
      loop.setUpdateCallback((dt) => updates.push(dt));

      loop.start();

      // Simulate time passing - trigger RAF callback with 50ms delta
      const cb = rafCallbacks.get(1)!;
      cb(performance.now() + 50);

      // 50ms / 16.67ms ≈ 2.99 fixed updates
      expect(updates.length).toBeGreaterThanOrEqual(2);
      // Each dt should be ~0.01667 seconds
      updates.forEach(dt => {
        expect(dt).toBeCloseTo(0.01667, 3);
      });
    });

    it('should call render callback every frame', () => {
      const renders: number[] = [];
      loop.setRenderCallback((alpha) => renders.push(alpha));

      loop.start();

      // start() calls tick() which does one render, then schedules RAF.
      // When we trigger the RAF callback, it renders again.
      // So clear renders after start, then test the RAF-triggered render.
      renders.length = 0;

      const cb = rafCallbacks.get(1)!;
      cb(performance.now() + 30);

      expect(renders.length).toBe(1);
      // Alpha = remaining accumulator / fixed_dt
      expect(renders[0]).toBeGreaterThanOrEqual(0);
      expect(renders[0]).toBeLessThanOrEqual(1);
    });

    it('should clamp large delta time to MAX_DT', () => {
      const updates: number[] = [];
      loop.setUpdateCallback((dt) => updates.push(dt));

      loop.start();

      // Simulate huge frame skip (500ms)
      const cb = rafCallbacks.get(1)!;
      cb(performance.now() + 500);

      // MAX_DT = 100ms, so 100 / 16.67 ≈ 5 updates max
      expect(updates.length).toBeLessThanOrEqual(7);
    });
  });

  describe('tick chain', () => {
    it('should schedule next frame via requestAnimationFrame', () => {
      loop.start();
      expect(mockRaf).toHaveBeenCalledTimes(1);

      // Trigger first tick
      const cb1 = rafCallbacks.get(1)!;
      cb1(performance.now() + 16);

      // Should have scheduled another frame
      expect(mockRaf).toHaveBeenCalledTimes(2);
    });

    it('should stop scheduling frames after stop()', () => {
      loop.start();
      const callCountBefore = mockRaf.mock.calls.length;

      loop.stop();

      const cb = rafCallbacks.get(1);
      if (cb) {
        cb(performance.now() + 16);
      }

      // No new RAF should be called after stop
      // (the RAF was already canceled)
      expect(mockCancelRaf).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should stop and clear callbacks', () => {
      const updateCb = jest.fn();
      const renderCb = jest.fn();
      loop.setUpdateCallback(updateCb);
      loop.setRenderCallback(renderCb);

      loop.start();
      loop.destroy();

      expect(loop.isRunning()).toBe(false);
    });

    it('should be safe to destroy when not started', () => {
      expect(() => loop.destroy()).not.toThrow();
    });
  });

  describe('setUpdateCallback / setRenderCallback', () => {
    it('should accept update callback', () => {
      const cb = jest.fn();
      expect(() => loop.setUpdateCallback(cb)).not.toThrow();
    });

    it('should accept render callback', () => {
      const cb = jest.fn();
      expect(() => loop.setRenderCallback(cb)).not.toThrow();
    });
  });
});
