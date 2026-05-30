/**
 * Game loop with fixed timestep update and variable rendering
 */
export class GameLoop {
  private running: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number = 0;
  private onUpdate: ((dt: number) => void) | null = null;
  private onRender: ((alpha: number) => void) | null = null;

  /** Fixed timestep in milliseconds */
  private readonly FIXED_DT: number;

  /** Maximum delta time to prevent spiral of death */
  private readonly MAX_DT: number;

  constructor(fixedDtMs: number = 16.67, maxDtMs: number = 100) {
    this.FIXED_DT = fixedDtMs;
    this.MAX_DT = maxDtMs;
  }

  /**
   * Set the update callback (called at fixed rate)
   */
  setUpdateCallback(callback: (dt: number) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set the render callback (called every frame)
   */
  setRenderCallback(callback: (alpha: number) => void): void {
    this.onRender = callback;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Main tick function
   */
  private tick(currentTime: number): void {
    if (!this.running) return;

    let dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp delta time
    if (dt > this.MAX_DT) {
      dt = this.MAX_DT;
    }

    this.accumulator += dt;

    // Fixed timestep updates
    while (this.accumulator >= this.FIXED_DT) {
      if (this.onUpdate) {
        this.onUpdate(this.FIXED_DT / 1000); // convert to seconds
      }
      this.accumulator -= this.FIXED_DT;
    }

    // Render with interpolation
    const alpha = this.accumulator / this.FIXED_DT;
    if (this.onRender) {
      this.onRender(alpha);
    }

    this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  /**
   * Destroy the game loop
   */
  destroy(): void {
    this.stop();
    this.onUpdate = null;
    this.onRender = null;
  }
}
