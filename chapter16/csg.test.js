import { CSG, UNION, INTERSECT, DIFFERENCE } from './csg.mjs';
import { Sphere, Cube, Intersection, Ray } from './geometry.mjs';
import { Matrix, Point, Vector } from './tuple.mjs';

test('CSG is created with an operation and two shapes', () => {
    const s1 = new Sphere();
    const s2 = new Cube();

    const c = new CSG(UNION, s1, s2);
    expect(c.operation).toEqual(UNION);
    expect(c.left.equals(s1)).toBeTruthy();
    expect(c.right.equals(s2)).toBeTruthy();
    expect(s1.parent.equals(c)).toBeTruthy();
    expect(s2.parent.equals(c)).toBeTruthy();
});

test('Evaluating the rule for a CSG operation', () => {
    const tests = [
        // union
        { op: UNION, left_hit: true, in_left: true, in_right: true, result: false },
        { op: UNION, left_hit: true, in_left: true, in_right: false, result: true },
        { op: UNION, left_hit: true, in_left: false, in_right: true, result: false },
        { op: UNION, left_hit: true, in_left: false, in_right: false, result: true },
        { op: UNION, left_hit: false, in_left: true, in_right: true, result: false },
        { op: UNION, left_hit: false, in_left: true, in_right: false, result: false },
        { op: UNION, left_hit: false, in_left: false, in_right: true, result: true },
        { op: UNION, left_hit: false, in_left: false, in_right: false, result: true },
        // intersection
        { op: INTERSECT, left_hit: true, in_left: true, in_right: true, result: true },
        { op: INTERSECT, left_hit: true, in_left: true, in_right: false, result: false },
        { op: INTERSECT, left_hit: true, in_left: false, in_right: true, result: true },
        { op: INTERSECT, left_hit: true, in_left: false, in_right: false, result: false },
        { op: INTERSECT, left_hit: false, in_left: true, in_right: true, result: true },
        { op: INTERSECT, left_hit: false, in_left: true, in_right: false, result: true },
        { op: INTERSECT, left_hit: false, in_left: false, in_right: true, result: false },
        { op: INTERSECT, left_hit: false, in_left: false, in_right: false, result: false },
        // difference
        { op: DIFFERENCE, left_hit: true, in_left: true, in_right: true, result: false },
        { op: DIFFERENCE, left_hit: true, in_left: true, in_right: false, result: true },
        { op: DIFFERENCE, left_hit: true, in_left: false, in_right: true, result: false },
        { op: DIFFERENCE, left_hit: true, in_left: false, in_right: false, result: true },
        { op: DIFFERENCE, left_hit: false, in_left: true, in_right: true, result: true },
        { op: DIFFERENCE, left_hit: false, in_left: true, in_right: false, result: true },
        { op: DIFFERENCE, left_hit: false, in_left: false, in_right: true, result: false },
        { op: DIFFERENCE, left_hit: false, in_left: false, in_right: false, result: false },
    ];

    for (const test of tests) {
        expect(CSG.canIntersect(test.op, test.left_hit, test.in_left, test.in_right)).toEqual(test.result);
    }
});

test('Filtering a list of intersections', () => {
    const s1 = new Sphere();
    const s2 = new Cube();

    const tests = [
        { operation: UNION, x0: 0, x1: 3 },
        { operation: INTERSECT, x0: 1, x1: 2 },
        { operation: DIFFERENCE, x0: 0, x1: 1 },
    ];

    for (const test of tests) {
        const c = new CSG(test.operation, s1, s2);
        const xs = [new Intersection(1, s1), new Intersection(2, s2), new Intersection(3, s1), new Intersection(4, s2)];
        const result = c.filterIntersections(xs);
        expect(result.length).toEqual(2);
        expect(result[0].equals(xs[test.x0])).toBeTruthy();
        expect(result[1].equals(xs[test.x1])).toBeTruthy();
    }
});

test('A ray misses a CSG object', () => {
    const csg = new CSG(UNION, new Sphere(), new Cube());
    const ray = new Ray(new Point(0, 2, -5), new Vector(0, 0, 1));
    const xs = csg.localIntersect(ray);
    expect(xs.length).toBeFalsy();
});

test('A ray hits a CSG object', () => {
    const s1 = new Sphere();
    const s2 = new Sphere();
    s2.transform = Matrix.translation(0, 0, 0.5);

    const csg = new CSG(UNION, s1, s2);
    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const xs = csg.localIntersect(ray);

    expect(xs.length).toEqual(2);
    expect(xs[0].t).toEqual(4);
    expect(xs[0].object.equals(s1)).toBeTruthy();
    expect(xs[1].t).toEqual(6.5);
    expect(xs[1].object.equals(s2)).toBeTruthy();
});

test('Combining objects into a CSG tree', () => {
    const s1 = new Sphere();
    const c2 = new Cube();
    const s3 = new Sphere();
    const csg = CSG.combine(UNION, s1, c2, s3);

    expect(CSG.includes(csg, s1)).toBeTruthy();
    expect(CSG.includes(csg, c2)).toBeTruthy();
    expect(CSG.includes(csg, s3)).toBeTruthy();
});
