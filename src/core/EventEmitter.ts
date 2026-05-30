/**
 * Lightweight typed event emitter for Genesis engine
 */
export type EventCallback = (data: Record<string, unknown>) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, callback: EventCallback): () => void {
    const wrapper: EventCallback = (data) => {
      unsubscribe();
      callback(data);
    };
    const unsubscribe = this.on(event, wrapper);
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  emit(event: string, data: Record<string, unknown> = {}): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (err) {
          console.error(`EventEmitter error in "${event}":`, err);
        }
      }
    }
  }

  /**
   * Remove all listeners for an event, or all events
   */
  off(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Destroy emitter - remove all listeners
   */
  destroy(): void {
    this.listeners.clear();
  }
}
