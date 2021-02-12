import { Tuple, Point, Vector, Color, Matrix } from './tuple';
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

test('tuple.toArray() returns an array', () => {
    const t = new Tuple(3, 2, 1, 4);
    const a = t.toArray();

    expect(Array.isArray(a)).toEqual(true);
    expect(a.length).toEqual(4);
    expect(a).toEqual([3, 2, 1, 4]);
});

test('A 2-item tuple.toArray() returns the first 2 elements only', () => {
    const t = new Tuple(3, 2);
    const a = t.toArray();

    expect(a).toEqual([3, 2]);
});

test('tupLe.at() returns correct numbers', () => {
    const t = new Tuple(4, 3, 2, 1);
    expect(t.at(0)).toEqual(4);
    expect(t.at(1)).toEqual(3);
    expect(t.at(2)).toEqual(2);
    expect(t.at(3)).toEqual(1);
});

test('tuple.sum() returns correct sum', () => {
    const t1 = new Tuple(1, 10, 100, 1000);

    expect(t1.sum()).toEqual(1111);
});

test('tuple.sum() works with fewer than 4 elements', () => {
    const t1 = new Tuple(2, 4);

    expect(t1.sum()).toEqual(6);
});

test('point() creates tuples with w=1', () => {
    const point = new Point(4, -4, 3);
    const tuple = new Tuple(4, -4, 3, 1);

    expect(tuple.equals(point));
});

test('default point is at origin', () => {
    const point = new Point();

    expect(point.x).toEqual(0);
    expect(point.y).toEqual(0);
    expect(point.z).toEqual(0);
    expect(point.w).toEqual(1);
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

test('adding colors with alpha set to 1.0', () => {
    const c1 = new Color(0.9, 0.6, 0.75);
    const c2 = new Color(0.7, 0.1, 0.25);
    const result = new Color(1.6, 0.7, 1.0);

    expect(c1.plus(c2, 1.0).equals(result)).toBeTruthy();
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

test('Multiplying with alpha set to 1', () => {
    const c = new Color(0.2, 0.3, 0.4);
    const result = new Color(0.4, 0.6, 0.8);
    const scalar = 2;

    expect(c.multiply(scalar, 1.0).equals(result)).toBeTruthy();
    expect(result.alpha).toEqual(1.0);
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

test('Constructing a 2x2 matrix from 3d vectors', () => {
    const v1 = new Vector(1, 5.5, 9);
    const v2 = new Vector(2, 6.5, 10);
    const m1 = new Matrix([v1, v2]);

    expect(m1.size).toEqual(2);

    expect(m1.cells).toEqual([
        [1, 2],
        [5.5, 6.5]
    ]);
});

test('Constructing a 4x4 matrix from tuples', () => {
    const t1 = new Tuple(1, 5.5, 9, 13.5);
    const t2 = new Tuple(2, 6.5, 10, 14.5);
    const t3 = new Tuple(3, 7.5, 11, 15.5);
    const t4 = new Tuple(4, 8.5, 12, 16.5);

    const m1 = new Matrix([t1, t2, t3, t4]);
    expect(m1.size).toEqual(4);
    expect(m1.cells).toEqual([
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5]
    ]);
});

test('constructing a 4x4 matrix from arrays', () => {
    const m1 = new Matrix([
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5]
    ]);
    expect(m1.size).toEqual(4);
    expect(m1.cells).toEqual([
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5]
    ]);
});

test('indexing a matrix with .at(row,col)', () => {
    const m1 = new Matrix([
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5]
    ]);

    expect(m1.at(0, 0)).toEqual(1);
    expect(m1.at(0, 3)).toEqual(4);
    expect(m1.at(1, 0)).toEqual(5.5);
    expect(m1.at(1, 2)).toEqual(7.5);
    expect(m1.at(2, 2)).toEqual(11);
    expect(m1.at(3, 0)).toEqual(13.5);
    expect(m1.at(3, 2)).toEqual(15.5);
});

test('indexing a matrix with .cells[row][col]', () => {
    const m1 = new Matrix([
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5]
    ]);

    expect(m1.cells[0][0]).toEqual(1);
    expect(m1.cells[0][3]).toEqual(4);
    expect(m1.cells[1][0]).toEqual(5.5);
    expect(m1.cells[1][2]).toEqual(7.5);
    expect(m1.cells[2][2]).toEqual(11);
    expect(m1.cells[3][0]).toEqual(13.5);
    expect(m1.cells[3][2]).toEqual(15.5);
});

test('A 2x2 matrix ought to be representable', () => {
    const m1 = new Matrix([
        [-3, 5],
        [1, -2]
    ]);

    expect(m1.at(0, 0)).toEqual(-3);
    expect(m1.at(0, 1)).toEqual(5);
    expect(m1.at(1, 0)).toEqual(1);
    expect(m1.at(1, 1)).toEqual(-2);
});

test('A 3x3 matrix ought to be representable', () => {
    const m = new Matrix([
        [-3, 5, 0],
        [1, -2, -7],
        [0, 1, 1]
    ]);

    expect(m.at(0, 0)).toEqual(-3);
    expect(m.at(1, 1)).toEqual(-2);
    expect(m.at(2, 2)).toEqual(1);
});

test('Matrix row() returns a Tuple', () => {
    const m = new Matrix([
        [-3, 5, 0],
        [1, -2, -7],
        [0, 1, 1]
    ]);

    const t1 = new Tuple(-3, 5, 0);
    const t2 = new Tuple(1, -2, -7);
    const t3 = new Tuple(0, 1, 1);

    expect(t1.equals(m.row(0))).toBeTruthy();
    expect(t2.equals(m.row(1))).toBeTruthy();
    expect(t3.equals(m.row(2))).toBeTruthy();
});

test('Matrix column() returns a Tuple', () => {
    const m = new Matrix([
        [-3, 5, 0],
        [1, -2, -7],
        [0, 1, 1]
    ]);

    const t1 = new Tuple(-3, 1, 0);
    const t2 = new Tuple(5, -2, 1);
    const t3 = new Tuple(0, -7, 1);

    expect(t1.equals(m.column(0))).toBeTruthy();
    expect(t2.equals(m.column(1))).toBeTruthy();
    expect(t3.equals(m.column(2))).toBeTruthy();
});

test('Matrix equality with identical matrices', () => {
    const mA = new Matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2]
    ]);

    const mB = new Matrix([new Tuple(1, 5, 9, 5), new Tuple(2, 6, 8, 4), new Tuple(3, 7, 7, 3), new Tuple(4, 8, 6, 2)]);

    expect(mA.equals(mB)).toBeTruthy();
});

test('Matrix equality with different matrices', () => {
    const mA = new Matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2]
    ]);

    const mB = new Matrix([
        [2, 3, 4, 5],
        [6, 7, 8, 9],
        [8, 7, 6, 5],
        [4, 3, 2, 1]
    ]);

    expect(mA.equals(mB)).toBeFalsy();
});

test('multiplying two matrices', () => {
    const mA = new Matrix([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2]
    ]);

    const mB = new Matrix([
        [-2, 1, 2, 3],
        [3, 2, 1, -1],
        [4, 3, 6, 5],
        [1, 2, 7, 8]
    ]);

    const mC = new Matrix([
        [20, 22, 50, 48],
        [44, 54, 114, 108],
        [40, 58, 110, 102],
        [16, 26, 46, 42]
    ]);

    expect(mA.multiply(mB).cells).toEqual(mC.cells);
    expect(mA.multiply(mB).equals(mC)).toBeTruthy();
});

test('A matrix multiplied by a Tuple', () => {
    const m = new Matrix([
        [1, 2, 3, 4],
        [2, 4, 4, 2],
        [8, 6, 4, 1],
        [0, 0, 0, 1]
    ]);
    const t1 = new Tuple(1, 2, 3, 1);
    const t2 = new Tuple(18, 24, 33, 1);

    expect(m.multiply(t1).toArray()).toEqual(t2.toArray());
    expect(m.multiply(t1).equals(t2)).toBeTruthy();
});

test('Identity matrix', () => {
    const identity = Matrix.identity(4);
    const identity2 = new Matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);

    expect(identity.cells).toEqual(identity2.cells);
    expect(identity.equals(identity2)).toBeTruthy();
});

test('Multiplying a matrix by the identity matrix', () => {
    const id = Matrix.identity(4);
    const m = new Matrix([
        [0, 1, 2, 4],
        [1, 2, 4, 8],
        [2, 4, 8, 16],
        [4, 8, 16, 32]
    ]);

    expect(m.multiply(id).cells).toEqual(m.cells);
    expect(m.multiply(id).equals(m)).toBeTruthy();
});

test('Transposing a 4x4 matrix', () => {
    const m = new Matrix([
        [0, 9, 3, 0],
        [9, 8, 0, 8],
        [1, 8, 5, 3],
        [0, 0, 5, 8]
    ]);

    const mT = new Matrix([
        [0, 9, 1, 0],
        [9, 8, 8, 0],
        [3, 0, 5, 5],
        [0, 8, 3, 8]
    ]);

    const result = m.transpose();

    expect(result.cells).toEqual(mT.cells);
    expect(result.equals(mT)).toBeTruthy();
});

test('Transposing a 3x3 matrix', () => {
    const m = new Matrix([
        [0, 9, 3],
        [9, 8, 0],
        [1, 8, 5]
    ]);

    const mT = new Matrix([
        [0, 9, 1],
        [9, 8, 8],
        [3, 0, 5]
    ]);

    const result = m.transpose();

    expect(result.cells).toEqual(mT.cells);
    expect(result.equals(mT)).toBeTruthy();
});

test('Transposing the identity matrix', () => {
    expect(Matrix.identity(4).transpose().cells).toEqual(Matrix.identity(4).cells);
});

test('Calculating the determinant of a 2x2 matrix', () => {
    const m = new Matrix([
        [1, 5],
        [-3, 2]
    ]);

    const d = m.determinant();

    expect(d).toEqual(17);
});

test('A submatrix of a 3x3 matrix is a 2x2 matrix', () => {
    const m = new Matrix([
        [1, 5, 0],
        [-3, 2, 7],
        [0, 6, -3]
    ]);

    const submatrix = new Matrix([
        [-3, 2],
        [0, 6]
    ]);

    const result = m.submatrix(0, 2);

    expect(result.cells).toEqual(submatrix.cells);
});

test('A submatrix of a 4x4 matrix is a 3x3 matrix', () => {
    const m = new Matrix([
        [-6, 1, 1, 6],
        [-8, 5, 8, 6],
        [-1, 0, 8, 2],
        [-7, 1, -1, 1]
    ]);

    const submatrix = new Matrix([
        [-6, 1, 6],
        [-8, 8, 6],
        [-7, -1, 1]
    ]);

    expect(m.submatrix(2, 1).cells).toEqual(submatrix.cells);
});

test('Calculating the minor of a 3x3 matrix', () => {
    const m = new Matrix([
        [3, 5, 0],
        [2, -1, -7],
        [6, -1, 5]
    ]);

    const submatrix = m.submatrix(1, 0);
    const minor = m.minor(1, 0);

    expect(submatrix.determinant()).toEqual(25);
    expect(minor).toEqual(25);
});

test('Calculating a cofactor of a 3x3 matrix', () => {
    const m = new Matrix([
        [3, 5, 0],
        [2, -1, -7],
        [6, -1, 5]
    ]);

    expect(m.minor(0, 0)).toEqual(-12);
    expect(m.cofactor(0, 0)).toEqual(-12);
    expect(m.minor(1, 0)).toEqual(25);
    expect(m.cofactor(1, 0)).toEqual(-25);
});

test('Calculating the determinant of a 3x3 matrix', () => {
    const m = new Matrix([
        [1, 2, 6],
        [-5, 8, -4],
        [2, 6, 4]
    ]);

    expect(m.cofactor(0, 0)).toEqual(56);
    expect(m.cofactor(0, 1)).toEqual(12);
    expect(m.cofactor(0, 2)).toEqual(-46);
    expect(m.determinant()).toEqual(-196);
});

test('Calculating the determinant of a 4x4 matrix', () => {
    const m = new Matrix([
        [-2, -8, 3, 5],
        [-3, 1, 7, 3],
        [1, 2, -9, 6],
        [-6, 7, 7, -9]
    ]);

    expect(m.cofactor(0, 0)).toEqual(690);
    expect(m.cofactor(0, 1)).toEqual(447);
    expect(m.cofactor(0, 2)).toEqual(210);
    expect(m.determinant()).toEqual(-4071);
});

test('Testing an invertible matrix for invertibility', () => {
    const m = new Matrix([
        [6, 4, 4, 4],
        [5, 5, 7, 6],
        [4, -9, 3, -7],
        [9, 1, 7, -6]
    ]);

    expect(m.determinant()).toEqual(-2120);
    expect(m.isInvertible()).toBeTruthy();
});

test('Testing a noninvertible matrix for invertibility', () => {
    const m = new Matrix([
        [-4, 2, -2, -3],
        [9, 6, 2, 6],
        [0, -5, 1, -5],
        [0, 0, 0, 0]
    ]);

    expect(m.determinant()).toEqual(0);
    expect(m.isInvertible()).toBeFalsy();
});

test('Calculating the inverse of a matrix', () => {
    const mA = new Matrix([
        [-5, 2, 6, -8],
        [1, -5, 1, 8],
        [7, 7, -6, -7],
        [1, -3, 7, 4]
    ]);

    const mB = mA.inverse();
    const mX = new Matrix([
        [0.21805, 0.45113, 0.2406, -0.04511],
        [-0.80827, -1.45677, -0.44361, 0.52068],
        [-0.07895, -0.22368, -0.05263, 0.19737],
        [-0.52256, -0.81391, -0.30075, 0.30639]
    ]);

    expect(mA.determinant()).toEqual(532);
    expect(mA.cofactor(2, 3)).toEqual(-160);
    expect(mB.at(3, 2)).toEqual(-160 / 532);
    expect(mA.cofactor(3, 2)).toEqual(105);
    expect(mB.at(2, 3)).toEqual(105 / 532);
    expect(mB.equals(mX)).toBeTruthy();
});

test('Calculating the inverse of another matrix', () => {
    const mA = new Matrix([
        [8, -5, 9, 2],
        [7, 5, 6, 1],
        [-6, 0, 9, 6],
        [-3, 0, -9, -4]
    ]);

    const mX = new Matrix([
        [-0.15385, -0.15385, -0.28205, -0.53846],
        [-0.07692, 0.12308, 0.02564, 0.03077],
        [0.35897, 0.35897, 0.4359, 0.92308],
        [-0.69231, -0.69231, -0.76923, -1.92308]
    ]);

    const mI = mA.inverse();

    expect(mI.equals(mX)).toBeTruthy();
});

test('Calculating the inverse of a third matrix', () => {
    const mA = new Matrix([
        [9, 3, 0, 9],
        [-5, -2, -6, -3],
        [-4, 9, 6, 4],
        [-7, 6, 6, 2]
    ]);

    const mX = new Matrix([
        [-0.04074, -0.07778, 0.14444, -0.22222],
        [-0.07778, 0.03333, 0.36667, -0.33333],
        [-0.02901, -0.1463, -0.10926, 0.12963],
        [0.17778, 0.06667, -0.26667, 0.33333]
    ]);

    const mI = mA.inverse();

    expect(mI.equals(mX)).toBeTruthy();
});

test('Multiplying a product by its inverse', () => {
    const mA = new Matrix([
        [3, -9, 7, 3],
        [3, -8, 2, -9],
        [-4, 4, 4, 1],
        [-6, 5, -1, 1]
    ]);

    const mB = new Matrix([
        [8, 2, 2, 2],
        [3, -1, 7, 0],
        [7, 0, 5, 4],
        [6, -2, 0, 5]
    ]);

    const mC = mA.multiply(mB);
    const mD = mC.multiply(mB.inverse());

    expect(mD.equals(mA)).toBeTruthy();
});

test('Inverting identity', () => {
    const mI = Matrix.identity(4);
    expect(mI.inverse().equals(mI)).toBeTruthy();
});

test('Multiplying a matrix by its inverse', () => {
    const mA = new Matrix([
        [3, -9, 7, 3],
        [3, -8, 2, -9],
        [-4, 4, 4, 1],
        [-6, 5, -1, 1]
    ]);

    const mI = Matrix.identity(4);

    expect(mA.multiply(mA.inverse()).equals(mI)).toBeTruthy();
});

test('Inverse of a transpose of a matrix vs Transpose of inverse of a matrix', () => {
    const mA = new Matrix([
        [3, -9, 7, 3],
        [3, -8, 2, -9],
        [-4, 4, 4, 1],
        [-6, 5, -1, 1]
    ]);

    const mInverseOfTranspose = mA.transpose().inverse();
    const mTransposeOfInverse = mA.inverse().transpose();

    expect(mInverseOfTranspose.equals(mTransposeOfInverse)).toBeTruthy();
});

test('Multiplying by a translation matrix', () => {
    const transform = Matrix.translation(5, -3, 2);
    const p = new Point(-3, 4, 5);

    const result = transform.multiply(p);
    const expected = new Point(2, 1, 7);

    expect(result.equals(expected)).toBeTruthy();
});

test('Multiplying by the inverse of a translation matrix', () => {
    const transform = Matrix.translation(5, -3, 2);
    const inverse = transform.inverse();
    const p = new Point(-3, 4, 5);
    const result = inverse.multiply(p);
    const expected = new Point(-8, 7, 3);

    expect(result.equals(expected)).toBeTruthy();
});

test('Translation does not affect vectors', () => {
    const transform = Matrix.translation(5, -3, 2);
    const v = new Vector(-3, 4, 5);
    const result = transform.multiply(v);

    expect(result.equals(v)).toBeTruthy();
});

test('A scaling matrix applied to a point', () => {
    const transform = Matrix.scaling(2, 3, 4);
    const p = new Point(-4, 6, 8);
    const expected = new Point(-8, 18, 32);
    const result = transform.multiply(p);

    expect(result.equals(expected)).toBeTruthy();
});

test('A scaling matrix applied to a vector', () => {
    const transform = Matrix.scaling(2, 3, 4);
    const v = new Vector(-4, 6, 8);
    const expected = new Vector(-8, 18, 32);
    const result = transform.multiply(v);

    expect(result.equals(expected)).toBeTruthy();
});

test('Multiplying by the inverse of a scaling matrix', () => {
    const transform = Matrix.scaling(2, 3, 4);
    const inverse = transform.inverse();
    const v = new Vector(-4, 6, 8);
    const expected = new Vector(-2, 2, 2);
    const result = inverse.multiply(v);

    expect(result.equals(expected)).toBeTruthy();
});

test('Cloning matrix via constructor', () => {
    const m1 = new Matrix([
        [1, 2, 3, 4],
        [4, 3, 2, 1],
        [1.1, 2.2, 3.3, 4.4],
        [4.3, 3.2, 2.1, 1.0]
    ]);

    const m2 = new Matrix(m1);

    expect(m2.cells).toEqual(m1.cells);
});

test('Reflection is scaling by a negative value', () => {
    const transform = Matrix.scaling(-1, 1, 1);
    const p = new Point(2, 3, 4);
    const expected = new Point(-2, 3, 4);
    const result = transform.multiply(p);

    expect(result.equals(expected)).toBeTruthy();
});

test('Rotating a point around the X axis', () => {
    const p = new Point(0, 1, 0);
    const pH = new Point(0, Math.sqrt(2) / 2, Math.sqrt(2) / 2);
    const pF = new Point(0, 0, 1);
    const half_quarter = Matrix.rotationX(Math.PI / 4);
    const full_quarter = Matrix.rotationX(Math.PI / 2);

    const half_result = half_quarter.multiply(p);
    const full_result = full_quarter.multiply(p);

    expect(half_result.equals(pH)).toBeTruthy();
    expect(full_result.equals(pF)).toBeTruthy();
});

test('The inverse of an x-rotation rotates in the opposite direction', () => {
    const p = new Point(0, 1, 0);
    const half_quarter = Matrix.rotationX(Math.PI / 4);
    const inv = half_quarter.inverse();
    const expected = new Point(0, Math.sqrt(2) / 2, -(Math.sqrt(2) / 2));

    const result = inv.multiply(p);

    expect(result.equals(expected)).toBeTruthy();
});

test('Rotating a point around the Y axis', () => {
    const p = new Point(0, 0, 1);
    const mHQ = Matrix.rotationY(Math.PI / 4);
    const mFQ = Matrix.rotationY(Math.PI / 2);
    const pH = new Point(Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2);
    const pF = new Point(1, 0, 0);

    expect(mHQ.multiply(p).equals(pH)).toBeTruthy();
    expect(mFQ.multiply(p).equals(pF)).toBeTruthy();
});

test('Rotating a point around the Z axis', () => {
    const p = new Point(0, 1, 0);
    const mHQ = Matrix.rotationZ(Math.PI / 4);
    const mFQ = Matrix.rotationZ(Math.PI / 2);
    const pH = new Point(-(Math.sqrt(2) / 2), Math.sqrt(2) / 2, 0);
    const pF = new Point(-1, 0, 0);

    expect(mHQ.multiply(p).equals(pH)).toBeTruthy();
    expect(mFQ.multiply(p).equals(pF)).toBeTruthy();
});

test('A shearing transformation moves X in proportion to Y', () => {
    const transform = Matrix.shear(1, 0, 0, 0, 0, 0);
    const p = new Point(2, 3, 4);
    const expected = new Point(5, 3, 4);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('A shearing transformation moves X in proportion to Z', () => {
    const transform = Matrix.shear(0, 1, 0, 0, 0, 0);
    const p = new Point(2, 3, 4);
    const expected = new Point(6, 3, 4);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('A shearing transformation moves Y in proportion to X', () => {
    const transform = Matrix.shear(0, 0, 1, 0, 0, 0);
    const p = new Point(2, 3, 4);
    const expected = new Point(2, 5, 4);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('A shearing transformation moves Y in proportion to Z', () => {
    const transform = Matrix.shear(0, 0, 0, 1, 0, 0);
    const p = new Point(2, 3, 4);
    const expected = new Point(2, 7, 4);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('A shearing transformation moves Z in proportion to X', () => {
    const transform = Matrix.shear(0, 0, 0, 0, 1, 0);
    const p = new Point(2, 3, 4);
    const expected = new Point(2, 3, 6);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('A shearing transformation moves Y in proportion to X', () => {
    const transform = Matrix.shear(0, 0, 0, 0, 0, 1);
    const p = new Point(2, 3, 4);
    const expected = new Point(2, 3, 7);

    expect(transform.multiply(p).equals(expected)).toBeTruthy();
});

test('Individual transformations are applied in sequence', () => {
    const p = new Point(1, 0, 1);
    const mA = Matrix.rotationX(Math.PI / 2);
    const mB = Matrix.scaling(5, 5, 5);
    const mC = Matrix.translation(10, 5, 7);

    //apply rotation first
    const p2 = mA.multiply(p);
    expect(p2.equals(new Point(1, -1, 0))).toBeTruthy();

    // apply scaling
    const p3 = mB.multiply(p2);
    expect(p3.equals(new Point(5, -5, 0))).toBeTruthy();

    // apply translation
    const p4 = mC.multiply(p3);
    expect(p4.equals(new Point(15, 0, 7))).toBeTruthy();
});

test('Chained transformations must be applied in reverse order', () => {
    const p = new Point(1, 0, 1);
    const mA = Matrix.rotationX(Math.PI / 2);
    const mB = Matrix.scaling(5, 5, 5);
    const mC = Matrix.translation(10, 5, 7);

    const mT = mC.multiply(mB).multiply(mA);
    const result = mT.multiply(p);

    expect(result.equals(new Point(15, 0, 7))).toBeTruthy();
});

test('Cloning a matrix returns the same matrix', () => {
    const m1 = Matrix.scaling(3, 4, 5);
    const m2 = m1.clone();

    expect(m1.equals(m2)).toBeTruthy();
});
