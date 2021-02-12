import { Tuple, Point, Vector, Color } from './tuple';
import { eqf } from './math';

test('tuple.equals() works', () => {
    const tuple1 = new Tuple(1.3, -2.4, 1.0001, 1.0);
    const tuple1a = new Tuple(1.3, -2.4, 1.0001, 1.0);
    const tuple2 = new Tuple(2.0, 3.4, -145.4, 0.0);

    expect(tuple1.equals(tuple1)).toBeTruthy();
    expect(tuple1.equals(tuple1a)).toBeTruthy();
    expect(tuple2.equals(tuple1)).toBeFalsy();
});

test('tuple with w=1.0 is a point', () => {
    const tuple = new Tuple(4.3, -4.2, 3.1, 1.0);

    expect(tuple.x).toBe(4.3);
    expect(tuple.y).toBe(-4.2);
    expect(tuple.z).toBe(3.1);
    expect(tuple.w).toBe(1.0);
});

test('tuple with w=0 is a vector', () => {
    const tuple = new Tuple(4.3, -4.2, 3.1, 0.0);

    expect(tuple.x).toBe(4.3);
    expect(tuple.y).toBe(-4.2);
    expect(tuple.z).toBe(3.1);
    expect(tuple.w).toBe(0.0);
});

test('point() creates tuples with w=1', () => {
    const point = new Point(4, -4, 3);
    const tuple = new Tuple(4, -4, 3, 1);

    expect(tuple.equals(point));
});

test('vector() creates tuples with w=0', () => {
    const vector = new Vector(4, -4, 3);
    const tuple = new Tuple(4, -4, 3, 0);

    expect(tuple.equals(vector));
});

test('adding two tuples', () => {
    const a1 = new Tuple(3, -2, 5, 1);
    const a2 = new Tuple(-2, 3, 1, 0);
    const a3 = new Tuple(1, 1, 6, 1);

    const result = a1.plus(a2);

    expect(result.equals(a1.plus(a2))).toBeTruthy();
    expect(result.equals(a2.plus(a1))).toBeTruthy();
});

test('adding vectors and points works', () => {
    const p1 = new Point(3, 4, 5);
    const p2 = new Point(6, 8, 10);

    const v1 = new Vector(3, 4, 5);
    const v2 = new Vector(4, 5, 6);
    const v3 = new Vector(7, 9, 11);

    expect(p1.plus(v1).equals(p2)).toBeTruthy();
    expect(v1.plus(v2).equals(v3)).toBeTruthy();
});

test('adding two points throws error', () => {
    const p1 = new Point(1, -1, 2);
    const p2 = new Point(2, 3, 1.1);

    expect(() => {
        return p1.plus(p2);
    }).toThrow();
});

test('subtracting two points yields a vector', () => {
    const p1 = new Point(3, 2, 1);
    const p2 = new Point(5, 6, 7);
    const v3 = new Vector(-2, -4, -6);

    const result = p1.minus(p2);

    expect(v3.equals(result)).toBeTruthy();
});

test('subtracting a vector from a point yields a point', () => {
    const p1 = new Point(3, 2, 1);
    const v1 = new Vector(5, 6, 7);
    const p2 = new Point(-2, -4, -6);

    const result = p1.minus(v1);

    expect(p2.equals(result)).toBeTruthy();
});

test('subtracting two vectors', () => {
    const v1 = new Vector(3, 2, 1);
    const v2 = new Vector(5, 6, 7);
    const v3 = new Vector(-2, -4, -6);

    const result = v1.minus(v2);

    expect(v3.equals(result)).toBeTruthy();
});

test('subtracting a point from a vector throws error', () => {
    const p1 = new Point(3, 2, 1);
    const v1 = new Vector(4, 5, 6);

    expect(() => {
        return v1.minus(p1);
    }).toThrow();
});

test('subtracting a vector from the zero vector', () => {
    const v0 = new Vector(0, 0, 0);
    const v1 = new Vector(1, -2, 3);
    const inverse = new Vector(-1, 2, -3);
    const result = v0.minus(v1);

    expect(inverse.equals(result)).toBeTruthy();
});

test('negating a tuple', () => {
    const a = new Tuple(1, -2, 3, -4);
    const b = new Tuple(-1, 2, -3, 4);
    const result = a.negate();

    expect(b.equals(result)).toBeTruthy();
});

test('multiplying a tuple by a scalar scales it', () => {
    const a = new Tuple(1, -2, 3, -4);
    const a2 = new Tuple(3.5, -7, 10.5, -14);
    const result = a.multiply(3.5);

    expect(a2.equals(result)).toBeTruthy();
});

test('multiplying a tuple by a fraction works', () => {
    const a = new Tuple(1, -2, 3, -4);
    const b = new Tuple(0.5, -1, 1.5, -2);
    const result = a.multiply(0.5);

    expect(b.equals(result)).toBeTruthy();
});

test('dividing a tuple by a scalar works', () => {
    const a = new Tuple(1, -2, 3, -4);
    const b = new Tuple(0.5, -1, 1.5, -2);
    const result = a.divide(2);

    expect(b.equals(result)).toBeTruthy();
});

test('computing the magnitude of vector(1,0,0)', () => {
    const v = new Vector(1, 0, 0);

    expect(v.magnitude()).toEqual(1);
});

test('computing the magnitude of vector(0,1,0)', () => {
    const v = new Vector(0, 1, 0);
    expect(v.magnitude()).toEqual(1);
});

test('computing the magnitude of vector(0,0,1)', () => {
    const v = new Vector(0, 0, 1);
    expect(v.magnitude()).toEqual(1);
});

test('computing the magnitude of vector(1,2,3)', () => {
    const v = new Vector(1, 2, 3);
    expect(eqf(v.magnitude(), Math.sqrt(14))).toBeTruthy();
});

test('computing the magnitude of vector(1,2,3)', () => {
    const v = new Vector(-1, -2, -3);
    expect(eqf(v.magnitude(), Math.sqrt(14))).toBeTruthy();
});

test('normalizing vector(4, 0, 0) gives (1, 0, 0)', () => {
    const v = new Vector(4, 0, 0);
    const v2 = new Vector(1, 0, 0);

    expect(v2.equals(v.normalize())).toBeTruthy();
});

test('normalizing vector(1, 2, 3)', () => {
    const v = new Vector(1, 2, 3);
    const v2 = new Vector(0.26726, 0.53452, 0.80178);

    expect(v2.equals(v.normalize())).toBeTruthy();
});

test('magnitude of a normalized vector is 1', () => {
    const v = new Vector(1, 2, 3);
    const v2 = v.normalize();

    expect(eqf(v2.magnitude(), 1.0)).toBeTruthy();
});

test('normalizing the zero vector throws', () => {
    const v = new Vector(0, 0, 0);
    expect(() => {
        v.normalize();
    }).toThrow();
});

test('the dot product of two tuples', () => {
    const a = new Vector(1, 2, 3);
    const b = new Vector(2, 3, 4);

    expect(a.dot(b)).toEqual(20);
});

test('the cross product of two vectors', () => {
    const a = new Vector(1, 2, 3);
    const b = new Vector(2, 3, 4);
    const c1 = new Vector(-1, 2, -1);
    const c2 = new Vector(1, -2, 1);

    expect(c1.equals(a.cross(b))).toBeTruthy();
    expect(c2.equals(b.cross(a))).toBeTruthy();
});

test('colors are (red, green, blue) tuples', () => {
    const c = new Color(-0.5, 0.4, 1.7);

    expect(c.red).toEqual(-0.5);
    expect(c.green).toEqual(0.4);
    expect(c.blue).toEqual(1.7);
});

test('adding colors', () => {
    const c1 = new Color(0.9, 0.6, 0.75);
    const c2 = new Color(0.7, 0.1, 0.25);
    const result = new Color(1.6, 0.7, 1.0, 2); // unconstrained alpha

    expect(c1.plus(c2).equals(result)).toBeTruthy();
});

test('subtracting colors', () => {
    const c1 = new Color(0.9, 0.6, 0.75);
    const c2 = new Color(0.7, 0.1, 0.25);
    const result = new Color(0.2, 0.5, 0.5, 0);
    expect(c1.minus(c2).equals(result)).toBeTruthy();
});

test('multiplying a color by a scalar', () => {
    const c = new Color(0.2, 0.3, 0.4);
    const result = new Color(0.4, 0.6, 0.8, 2);
    const scalar = 2;

    expect(c.multiply(scalar).equals(result)).toBeTruthy();
});

test('multiplying colors', () => {
    const c1 = new Color(1, 0.2, 0.4);
    const c2 = new Color(0.9, 1, 0.1);
    const result = new Color(0.9, 0.2, 0.04);

    expect(c1.multiply(c2).equals(result)).toBeTruthy();
});

test('Tuple.clone() works', () => {
    const t1 = new Tuple(1, 2, 3, 4);
    const t2 = t1.clone();

    expect(t1.equals(t2)).toBeTruthy();
});

test('Point.clone() works', () => {
    const p1 = new Point(1, 2, 3);
    const p2 = p1.clone();

    expect(p1.equals(p2)).toBeTruthy();
});

test('Vector.clone() works', () => {
    const v1 = new Vector(1, 2, 3);
    const v2 = v1.clone();

    expect(v1.equals(v2)).toBeTruthy();
});

test('Color.clone() works', () => {
    const c1 = new Color(0.2, 0.3, 0.4);
    const c2 = c1.clone();

    expect(c1.equals(c2)).toBeTruthy();
});