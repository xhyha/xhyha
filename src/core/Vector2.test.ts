import { Vector2 } from './Vector2';

describe('Vector2', () => {
  // ===== Constructor =====

  describe('constructor', () => {
    it('should default to (0, 0)', () => {
      const v = new Vector2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('should accept x and y values', () => {
      const v = new Vector2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  // ===== Static constants =====

  describe('static constants', () => {
    it('ZERO should be (0, 0)', () => {
      expect(Vector2.ZERO.x).toBe(0);
      expect(Vector2.ZERO.y).toBe(0);
    });

    it('ONE should be (1, 1)', () => {
      expect(Vector2.ONE.x).toBe(1);
      expect(Vector2.ONE.y).toBe(1);
    });

    it('UP should be (0, -1)', () => {
      expect(Vector2.UP.x).toBe(0);
      expect(Vector2.UP.y).toBe(-1);
    });

    it('DOWN should be (0, 1)', () => {
      expect(Vector2.DOWN.x).toBe(0);
      expect(Vector2.DOWN.y).toBe(1);
    });

    it('LEFT should be (-1, 0)', () => {
      expect(Vector2.LEFT.x).toBe(-1);
      expect(Vector2.LEFT.y).toBe(0);
    });

    it('RIGHT should be (1, 0)', () => {
      expect(Vector2.RIGHT.x).toBe(1);
      expect(Vector2.RIGHT.y).toBe(0);
    });
  });

  // ===== Static factory methods =====

  describe('static fromAngle()', () => {
    it('should return (1, 0) for angle 0', () => {
      const v = Vector2.fromAngle(0);
      expect(v.x).toBeCloseTo(1, 5);
      expect(v.y).toBeCloseTo(0, 5);
    });

    it('should return (0, 1) for PI/2', () => {
      const v = Vector2.fromAngle(Math.PI / 2);
      expect(v.x).toBeCloseTo(0, 5);
      expect(v.y).toBeCloseTo(1, 5);
    });

    it('should return (-1, 0) for PI', () => {
      const v = Vector2.fromAngle(Math.PI);
      expect(v.x).toBeCloseTo(-1, 5);
      expect(v.y).toBeCloseTo(0, 5);
    });
  });

  describe('static distance()', () => {
    it('should return 0 for same point', () => {
      expect(Vector2.distance(new Vector2(3, 4), new Vector2(3, 4))).toBe(0);
    });

    it('should compute 3-4-5 triangle distance', () => {
      expect(Vector2.distance(new Vector2(0, 0), new Vector2(3, 4))).toBe(5);
    });

    it('should handle negative coordinates', () => {
      const dist = Vector2.distance(new Vector2(-1, -1), new Vector2(2, 3));
      expect(dist).toBe(5);
    });
  });

  describe('static lerp()', () => {
    it('should return a at t=0', () => {
      const a = new Vector2(0, 0);
      const b = new Vector2(10, 20);
      const result = Vector2.lerp(a, b, 0);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should return b at t=1', () => {
      const a = new Vector2(0, 0);
      const b = new Vector2(10, 20);
      const result = Vector2.lerp(a, b, 1);

      expect(result.x).toBeCloseTo(10, 5);
      expect(result.y).toBeCloseTo(20, 5);
    });

    it('should return midpoint at t=0.5', () => {
      const a = new Vector2(0, 0);
      const b = new Vector2(10, 20);
      const result = Vector2.lerp(a, b, 0.5);

      expect(result.x).toBeCloseTo(5, 5);
      expect(result.y).toBeCloseTo(10, 5);
    });
  });

  // ===== Instance methods =====

  describe('add()', () => {
    it('should add two vectors', () => {
      const v = new Vector2(1, 2).add(new Vector2(3, 4));
      expect(v.x).toBe(4);
      expect(v.y).toBe(6);
    });

    it('should not mutate original', () => {
      const a = new Vector2(1, 2);
      const b = a.add(new Vector2(3, 4));
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
    });
  });

  describe('sub()', () => {
    it('should subtract two vectors', () => {
      const v = new Vector2(5, 7).sub(new Vector2(2, 3));
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('should not mutate original', () => {
      const a = new Vector2(5, 7);
      a.sub(new Vector2(2, 3));
      expect(a.x).toBe(5);
      expect(a.y).toBe(7);
    });
  });

  describe('mul()', () => {
    it('should multiply by scalar', () => {
      const v = new Vector2(2, 3).mul(4);
      expect(v.x).toBe(8);
      expect(v.y).toBe(12);
    });

    it('should return zero vector when multiplied by 0', () => {
      const v = new Vector2(5, 10).mul(0);
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('should handle negative scalar', () => {
      const v = new Vector2(2, 3).mul(-1);
      expect(v.x).toBe(-2);
      expect(v.y).toBe(-3);
    });
  });

  describe('div()', () => {
    it('should divide by scalar', () => {
      const v = new Vector2(10, 20).div(2);
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
    });

    it('should return ZERO when dividing by 0', () => {
      const v = new Vector2(10, 20).div(0);
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('should handle negative divisor', () => {
      const v = new Vector2(6, 9).div(-3);
      expect(v.x).toBe(-2);
      expect(v.y).toBe(-3);
    });
  });

  describe('magnitude()', () => {
    it('should return 0 for zero vector', () => {
      expect(new Vector2(0, 0).magnitude()).toBe(0);
    });

    it('should compute magnitude correctly (3-4-5)', () => {
      expect(new Vector2(3, 4).magnitude()).toBe(5);
    });

    it('should compute magnitude for negative values', () => {
      expect(new Vector2(-3, -4).magnitude()).toBe(5);
    });
  });

  describe('normalize()', () => {
    it('should return unit vector', () => {
      const n = new Vector2(3, 4).normalize();
      expect(n.magnitude()).toBeCloseTo(1, 5);
      expect(n.x).toBeCloseTo(0.6, 5);
      expect(n.y).toBeCloseTo(0.8, 5);
    });

    it('should return ZERO for zero vector', () => {
      const n = new Vector2(0, 0).normalize();
      expect(n.x).toBe(0);
      expect(n.y).toBe(0);
    });
  });

  describe('dot()', () => {
    it('should compute dot product of orthogonal vectors as 0', () => {
      // (1,0) · (0,1) = 0
      expect(new Vector2(1, 0).dot(new Vector2(0, 1))).toBe(0);
    });

    it('should compute dot product of parallel vectors', () => {
      // (1,2) · (3,6) = 3 + 12 = 15
      expect(new Vector2(1, 2).dot(new Vector2(3, 6))).toBe(15);
    });

    it('should compute dot product of opposite vectors as negative', () => {
      expect(new Vector2(1, 0).dot(new Vector2(-1, 0))).toBe(-1);
    });
  });

  describe('equals()', () => {
    it('should return true for identical vectors', () => {
      expect(new Vector2(1, 2).equals(new Vector2(1, 2))).toBe(true);
    });

    it('should return false for different vectors', () => {
      expect(new Vector2(1, 2).equals(new Vector2(3, 4))).toBe(false);
    });

    it('should respect custom tolerance', () => {
      expect(new Vector2(1.0, 2.0).equals(new Vector2(1.005, 2.005), 0.01)).toBe(true);
      expect(new Vector2(1.0, 2.0).equals(new Vector2(1.005, 2.005), 0.001)).toBe(false);
    });
  });

  describe('clone()', () => {
    it('should create an independent copy', () => {
      const a = new Vector2(5, 10);
      const b = a.clone();

      expect(b.x).toBe(5);
      expect(b.y).toBe(10);

      // Ensure independence
      b.x = 99;
      expect(a.x).toBe(5);
    });
  });

  describe('toJSON()', () => {
    it('should return plain object with x and y', () => {
      const v = new Vector2(3, 7);
      const json = v.toJSON();

      expect(json).toEqual({ x: 3, y: 7 });
    });

    it('should be serializable', () => {
      const v = new Vector2(1.5, 2.5);
      const str = JSON.stringify(v.toJSON());
      const parsed = JSON.parse(str);

      expect(parsed.x).toBe(1.5);
      expect(parsed.y).toBe(2.5);
    });
  });

  describe('toString()', () => {
    it('should format to 2 decimal places', () => {
      const v = new Vector2(1.23456, 7.89101);
      expect(v.toString()).toBe('Vector2(1.23, 7.89)');
    });
  });

  describe('static random()', () => {
    it('should return a unit-length vector', () => {
      for (let i = 0; i < 20; i++) {
        const v = Vector2.random();
        expect(v.magnitude()).toBeCloseTo(1, 5);
      }
    });
  });
});
