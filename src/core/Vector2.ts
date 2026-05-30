/**
 * 2D Vector utility class
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  /** Zero vector */
  static readonly ZERO = new Vector2(0, 0);
  /** One vector */
  static readonly ONE = new Vector2(1, 1);
  /** Up vector */
  static readonly UP = new Vector2(0, -1);
  /** Down vector */
  static readonly DOWN = new Vector2(0, 1);
  /** Left vector */
  static readonly LEFT = new Vector2(-1, 0);
  /** Right vector */
  static readonly RIGHT = new Vector2(1, 0);

  /**
   * Create from angle (radians)
   */
  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  /**
   * Create from random direction
   */
  static random(): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    return Vector2.fromAngle(angle);
  }

  /**
   * Distance between two points
   */
  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Lerp between two vectors
   */
  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  /** Add vector */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** Subtract vector */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** Multiply by scalar */
  mul(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  /** Divide by scalar */
  div(s: number): Vector2 {
    if (s === 0) return Vector2.ZERO;
    return new Vector2(this.x / s, this.y / s);
  }

  /** Magnitude */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Normalized */
  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return Vector2.ZERO;
    return this.div(mag);
  }

  /** Dot product */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** Clone */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /** Check equality */
  equals(v: Vector2, tolerance: number = 0.001): boolean {
    return Math.abs(this.x - v.x) < tolerance && Math.abs(this.y - v.y) < tolerance;
  }

  /** Convert to plain object */
  toJSON(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** String representation */
  toString(): string {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
