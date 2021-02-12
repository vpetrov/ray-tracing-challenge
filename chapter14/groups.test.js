import { Group } from './groups';
import { Shape, Ray, Sphere, Plane, Cube, Cylinder, Cone } from './geometry';
import { Point, Vector, Matrix, srt } from './tuple';

test('Creating a new group', () => {
    const group = new Group();
    expect(group.transform.equals(Matrix.identity(4))).toBeTruthy();
    expect(group.size).toEqual(0);
});

test('A shape has a parent attribute', () => {
    const shape = new Shape();
    expect(shape.hasOwnProperty('parent')).toBeTruthy();
    expect(shape.parent).toBeFalsy();
});

test('Adding a child to a group', () => {
    const group = new Group();
    const shape = new Shape();
    group.add(shape);
    expect(group.size).toEqual(1);
    expect(group.contains(shape)).toBeTruthy();
    expect(shape.parent).toEqual(group);
});

test('Intersecting a ray with an empty group', () => {
    const group = new Group();
    const ray = new Ray(new Point(), new Vector(0, 0, 1));
    const xs = group.localIntersect(ray);
    expect(xs.length).toEqual(0);
});

test('Intersecting a ray with a non-empty group', () => {
    const group = new Group();
    const s1 = new Sphere();
    const s2 = new Sphere(undefined, undefined, Matrix.translation(0, 0, -3));
    const s3 = new Sphere(undefined, undefined, Matrix.translation(5, 0, 0));
    group.add(s1, s2, s3);

    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const xs = group.localIntersect(ray);

    expect(xs.length).toEqual(4);
    expect(xs[0].object.equals(s2)).toBeTruthy();
    expect(xs[1].object.equals(s2)).toBeTruthy();
    expect(xs[2].object.equals(s1)).toBeTruthy();
    expect(xs[3].object.equals(s1)).toBeTruthy();
});

test('Intersecting a transformed group', () => {
    const group = new Group(Matrix.scaling(2, 2, 2));
    const sphere = new Sphere(undefined, undefined, Matrix.translation(5, 0, 0));
    group.add(sphere);

    const ray = new Ray(new Point(10, 0, -10), new Vector(0, 0, 1));
    const xs = group.intersect(ray);
    expect(xs.length).toEqual(2);
});

test('Converting a point from world to object space', () => {
    const group1 = new Group(Matrix.rotationY(Math.PI / 2));
    const group2 = new Group(Matrix.scaling(2, 2, 2));
    group1.add(group2);
    const sphere = new Sphere(undefined, undefined, Matrix.translation(5, 0, 0));
    group2.add(sphere);
    const p = sphere.localPoint(new Point(-2, 0, -10));
    expect(p.equals(new Point(0, 0, -1))).toBeTruthy();
});

test('Converting a normal from object to world space', () => {
    const group1 = new Group(Matrix.rotationY(Math.PI / 2));
    const group2 = new Group(Matrix.scaling(1, 2, 3));
    group1.add(group2);
    const sphere = new Sphere(undefined, undefined, Matrix.translation(5, 0, 0));
    group2.add(sphere);
    const normal = sphere.worldNormal(new Vector(Math.sqrt(3) / 3, Math.sqrt(3) / 3, Math.sqrt(3) / 3));
    expect(normal.equals(new Vector(0.2857, 0.4286, -0.8571)));
});

test('Finding the normal on a child object', () => {
    const group1 = new Group(Matrix.rotationY(Math.PI / 2));
    const group2 = new Group(Matrix.scaling(1, 2, 3));
    group1.add(group2);
    const sphere = new Sphere(undefined, undefined, Matrix.translation(5, 0, 0));
    group2.add(sphere);

    const normal = sphere.normal(new Point(1.7321, 1.1547, -5.5774));
    expect(normal.equals(new Vector(0.2857, 0.4286, -0.8571)));
});

test('An empty group has a zero bounding box at the origin', () => {
    const group = new Group();
    const bounds = group.bounds;

    expect(bounds.minPoint.equals(new Point())).toBeTruthy();
    expect(bounds.maxPoint.equals(new Point())).toBeTruthy();
});

test("A group bounding box with a single object is the same as the object's bounding box", () => {
    const objects = [
        new Sphere(),
        new Plane(),
        new Cube(),
        new Cylinder(),
        new Cylinder(-10, 24),
        new Cone(),
        new Cone(-10, 10, true),
    ];

    for (const object of objects) {
        const group = new Group();
        group.add(object);
        expect(group.bounds.equals(object.bounds)).toBeTruthy();
    }
});

test("A group bounding box takes into account the object's transformation matrix", () => {
    const sqrt2 = Math.sqrt(2);
    const sqrt8 = Math.sqrt(8);
    const tests = [
        {
            object: new Sphere(undefined, undefined, Matrix.translation(0, 1, 0)),
            minPoint: new Point(-1, 0, -1),
            maxPoint: new Point(1, 2, 1),
        },
        {
            // 90 degree sphere rotations don't change the bounds because the corners are in the same place
            object: new Sphere(undefined, undefined, Matrix.rotationZ(Math.PI / 2)),
            minPoint: new Point(-1, -1, -1),
            maxPoint: new Point(1, 1, 1),
        },
        {
            object: new Cube(Matrix.scaling(2, 3, 2)),
            minPoint: new Point(-2, -3, -2),
            maxPoint: new Point(2, 3, 2),
        },
        {
            // unbounded cylinder rotated about Z by 90 degrees so it goes along the X axis to infinity
            object: new Cylinder(undefined, undefined, false, Matrix.rotationZ(Math.PI / 2)),
            minPoint: new Point(-Infinity, -1, -1),
            maxPoint: new Point(Infinity, 1, 1),
        },
        {
            // bounded cylinder scaled to twice the default size, rotated about Z axis by 45 degrees and translated 1 unit up
            object: new Cylinder(
                -1,
                1,
                true,
                srt(Matrix.scaling(2, 2, 2), Matrix.rotationZ(Math.PI / 4), Matrix.translation(0, 1, 0))
            ),
            minPoint: new Point(-sqrt8, 1 - sqrt8, -2),
            maxPoint: new Point(sqrt8, 1 + sqrt8, 2),
        },
        {
            // cube rotated on Z axis by 45 degrees
            object: new Cube(Matrix.rotationZ(Math.PI / 4)),
            minPoint: new Point(-sqrt2, -sqrt2, -1),
            maxPoint: new Point(sqrt2, sqrt2, 1),
        },
    ];

    for (const test of tests) {
        const group = new Group();
        group.add(test.object);
        expect(group.bounds.minPoint.equals(test.minPoint)).toBeTruthy();
        expect(group.bounds.maxPoint.equals(test.maxPoint)).toBeTruthy();
    }
});

test('A group bounding box includes the bounding box of all its children', () => {
    const objects = [
        new Sphere(),
        new Cube(Matrix.translation(-1, 0, 0)),
        new Cylinder(-1, 1, true, Matrix.rotationZ(Math.PI / 4)),
        new Cone(-1, 0, true, Matrix.translation(0, 0, -4)),
    ];

    const group = new Group();
    group.add(...objects);
    const sqrt2 = Math.sqrt(2);

    expect(group.bounds.minPoint.equals(new Point(-2, -sqrt2, -5))).toBeTruthy();
    expect(group.bounds.maxPoint.equals(new Point(sqrt2, sqrt2, 1))).toBeTruthy();
});

test('AABB intersection should intersect a group with 1 cube', () => {
    const group = new Group();
    group.add(new Cube());
    // ray coincides exactly with the Y axis
    const ray_origin = new Point(0, -2, 0);
    const ray_direction = new Vector(0, 1, 0);
    const ray = new Ray(ray_origin, ray_direction);

    const xs = group.aabbIntersect(ray, group.bounds);
    expect(xs.length).toEqual(2);
    expect(xs[0].t).toEqual(1);
    expect(xs[1].t).toEqual(3);
});

test('AABB intersections from various angles with 1 cube', () => {
    const group = new Group();
    group.add(new Cube(Matrix.scaling(2, 2, 2)));
    const sqrt8 = Math.sqrt(8);

    const tests = [
        { origin: new Point(0, 0, 0), direction: new Vector(1, 0, 0), t0: -2, t1: 2 },
        { origin: new Point(0, 10, 0), direction: new Vector(0, -1, 0), t0: 8, t1: 12 },
    ];

    for (const test of tests) {
        const ray = new Ray(test.origin, test.direction.normalize());
        const xs = group.aabbIntersect(ray, group.bounds);
        expect(xs[0].t).toEqual(test.t0);
        expect(xs[1].t).toEqual(test.t1);
    }
});

test('AABB intersection misses', () => {
    const group = new Group();
    group.add(new Cube());

    const ray = new Ray(new Point(-3, 0, 0), new Vector(0, 1, 0));
    const xs = group.aabbIntersect(ray, group.bounds);
    expect(xs.length).toEqual(0);
});
