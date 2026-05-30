import {
  ITrigger, ITriggerContext, TriggerCategory,
} from '../models/types';
import { EventEmitter } from '../core/EventEmitter';

/** Trigger evaluation result */
export interface ITriggerResult {
  triggered: boolean;
  trigger: ITrigger | null;
  reason: string;
}

/**
 * Engine that evaluates trigger conditions and decides
 * when to generate micro-games.
 */
export class TriggerEngine {
  private triggers: Map<string, ITrigger> = new Map();
  private lastFireTime: Map<string, number> = new Map();
  private eventEmitter: EventEmitter;
  private suppressUntil: number = 0;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Register a trigger
   */
  registerTrigger(trigger: ITrigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  /**
   * Register multiple triggers
   */
  registerTriggers(triggers: ITrigger[]): void {
    for (const trigger of triggers) {
      this.registerTrigger(trigger);
    }
  }

  /**
   * Remove a trigger
   */
  removeTrigger(id: string): void {
    this.triggers.delete(id);
    this.lastFireTime.delete(id);
  }

  /**
   * Evaluate all triggers against the current context
   * Returns the highest priority matching trigger
   */
  evaluate(context: ITriggerContext): ITriggerResult {
    // Check global suppression
    if (Date.now() < this.suppressUntil) {
      return { triggered: false, trigger: null, reason: 'Globally suppressed' };
    }

    const candidates: ITrigger[] = [];

    for (const [id, trigger] of this.triggers) {
      // Check cooldown
      const lastFire = this.lastFireTime.get(id) ?? 0;
      const timeSinceLastFire = (context.timestamp - lastFire) / 1000;
      if (timeSinceLastFire < trigger.cooldown) {
        continue;
      }

      // Check condition
      try {
        if (trigger.condition(context)) {
          candidates.push(trigger);
        }
      } catch {
        // Trigger condition error, skip
      }
    }

    if (candidates.length === 0) {
      return { triggered: false, trigger: null, reason: 'No matching triggers' };
    }

    // Sort by priority (highest first)
    candidates.sort((a, b) => b.priority - a.priority);
    const winner = candidates[0];

    // Record fire time
    this.lastFireTime.set(winner.id, context.timestamp);

    // Emit event
    this.eventEmitter.emit('TRIGGER_FIRED', {
      triggerId: winner.id,
      triggerName: winner.name,
      category: winner.category,
    });

    return { triggered: true, trigger: winner, reason: winner.name };
  }

  /**
   * Suppress all triggers for a duration
   */
  suppress(durationMs: number): void {
    this.suppressUntil = Date.now() + durationMs;
  }

  /**
   * Get registered trigger count
   */
  getTriggerCount(): number {
    return this.triggers.size;
  }

  /**
   * Get all triggers in a category
   */
  getTriggersByCategory(category: TriggerCategory): ITrigger[] {
    return Array.from(this.triggers.values())
      .filter(t => t.category === category);
  }
}
