import { Ray, Sphere, Intersection } from './geometry';
import { Point, Vector, Matrix } from './tuple';

test('Creating and querying a ray', () => {
    const origin = new Point(1, 2, 3);
    const direction = new Vector(4, 5, 6);

    const r = new Ray(origin, direction);

    expect(r.origin.equals(origin)).toBeTruthy();
    expect(r.direction.equals(direction)).toBeTruthy();
});

test('Ray equals', () => {
    const r1 = new Ray(new Point(1, 2, 3), new Vector(0, 0, -1));
    const r2 = new Ray(new Point(1, 2, 3), new Vector(0, 0, -1));

    expect(r1.equals(r2)).toBeTruthy();
});

test('Computing a point of reference', () => {
    const r = new Ray(new Point(2, 3, 4), new Vector(1, 0, 0));

    expect(r.position(0).equals(new Point(2, 3, 4))).toBeTruthy();
    expect(r.position(1).equals(new Point(3, 3, 4))).toBeTruthy();
    expect(r.position(-1).equals(new Point(1, 3, 4))).toBeTruthy();
    expect(r.position(2.5).equals(new Point(4.5, 3, 4))).toBeTruthy();
});

test('Sphere equals', () => {
    const s1 = new Sphere(new Point(1, 1, 1), 100);
    const s2 = new Sphere(new Point(1, 1, 1), 100);

    expect(s1.equals(s2)).toBeTruthy();
});

test('Intersection equals', () => {
    const i1 = new Intersection(3.2, new Sphere(new Point(1, 1, 1), 101));
    const i2 = new Intersection(3.2, new Sphere(new Point(1, 1, 1), 101));

    expect(i1.equals(i2)).toBeTruthy();
});

test('A ray intersects a sphere at two points', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));

    const xs = r.intersect(s);

    expect(xs.length).toEqual(2);
    expect(xs[0].equals(new Intersection(4.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(6.0, s))).toBeTruthy();
});

test('A ray intersects a sphere at a tangent', () => {
    const r = new Ray(new Point(0, 1, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = r.intersect(s);
    expect(xs.length).toEqual(2);
    expect(xs[0].equals(new Intersection(5.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(5.0, s))).toBeTruthy();
});

test('A ray misses a sphere', () => {
    const r = new Ray(new Point(0, 2, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = r.intersect(s);
    expect(xs.length).toEqual(0);
});

test('A ray originates inside a sphere', () => {
    const r = new Ray(new Point(0, 0, 0), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = r.intersect(s);
    expect(xs[0].equals(new Intersection(-1.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(1.0, s))).toBeTruthy();
});

test('A sphere is behind a ray', () => {
    const r = new Ray(new Point(0, 0, 5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = r.intersect(s);

    expect(xs.length).toEqual(2);
    expect(xs[0].equals(new Intersection(-6.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(-4.0, s))).toBeTruthy();
});

test('An intersection encapsulates t and object', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const i = new Intersection(3.5, s);

    expect(i.t).toEqual(3.5);
    expect(i.object.equals(s)).toBeTruthy();
});

test('Intersect sets the object on the intersection', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));

    const xs = r.intersect(s);
    expect(xs.length).toEqual(2);
    expect(xs[0].object.equals(s)).toBeTruthy();
    expect(xs[1].object.equals(s)).toBeTruthy();
});

test('The hit, when all intersections have positive t', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const i1 = new Intersection(1, s);
    const i2 = new Intersection(2, s);

    const hit = Intersection.hit([i2, i1]);

    expect(hit.equals(i1)).toBeTruthy();
});

test('The hit, when some intersections have negative t', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const i1 = new Intersection(-1, s);
    const i2 = new Intersection(1, s);
    const hit = Intersection.hit([i2, i1]);

    expect(hit.equals(i2)).toBeTruthy();
});

test('The hit, when all intersections have negative t', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const i1 = new Intersection(-2, s);
    const i2 = new Intersection(-1, s);
    const hit = Intersection.hit([i2, i1]);

    expect(hit).toBeNull();
});

test('The hit is always the lowest non-negative intersection', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const i1 = new Intersection(5, s);
    const i2 = new Intersection(7, s);
    const i3 = new Intersection(-3, s);
    const i4 = new Intersection(2, s);

    const hit = Intersection.hit([i1, i2, i3, i4]);

    expect(hit.equals(i4)).toBeTruthy();
});

test('Translating a ray', () => {
    const r = new Ray(new Point(1, 2, 3), new Vector(0, 1, 0));
    const translation = Matrix.translation(3, 4, 5);
    const r2 = r.transform(translation);

    expect(r2.origin.equals(new Point(4, 6, 8))).toBeTruthy();
    expect(r2.direction.equals(new Vector(0, 1, 0))).toBeTruthy();
});

test('Scaling a ray', () => {
    const r = new Ray(new Point(1, 2, 3), new Vector(0, 1, 0));
    const scaling = Matrix.scaling(2, 3, 4);
    const r2 = r.transform(scaling);

    expect(r2.origin.equals(new Point(2, 6, 12))).toBeTruthy();
    expect(r2.direction.equals(new Vector(0, 3, 0))).toBeTruthy();
});

test("A sphere's default transformation", () => {
    const s = new Sphere(new Point(0, 0, 0));
    expect(s.transform.equals(Matrix.identity(4))).toBeTruthy();
});

test("Changing a sphere's transformation", () => {
    const s = new Sphere(new Point(0, 0, 0));
    const t = Matrix.translation(2, 3, 4);
    s.transform = t;
    expect(s.transform.equals(t)).toBeTruthy();
});

test('Intersecting a scaled sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0), 1, Matrix.scaling(2, 2, 2));
    const xs = r.intersect(s);

    expect(xs.length).toEqual(2);
    expect(xs[0].t).toEqual(3);
    expect(xs[1].t).toEqual(7);
});

test('Intersecting a translated sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0), 1, Matrix.translation(5, 0, 0));
    const xs = r.intersect(s);

    expect(xs.length).toEqual(0);
});

test('The normal on a sphere at a point on the X axis', () => {
    const s = new Sphere(new Point(0, 0, 0));
    const n = s.normal(new Point(1, 0, 0));

    expect(n.constructor.name).toEqual('Vector');
    expect(n.equals(new Vector(1, 0, 0))).toBeTruthy();
});

test('The normal on a sphere at a point on the Y axis', () => {
    const s = new Sphere();
    const n = s.normal(new Point(0, 1, 0));
    expect(n.equals(new Vector(0, 1, 0))).toBeTruthy();
});

test('The normal on a sphere at a point on the Z axis', () => {
    const s = new Sphere();
    const n = s.normal(new Point(0, 0, 1));
    expect(n.equals(new Vector(0, 0, 1))).toBeTruthy();
});

test('The normal on a sphere at a nonaxial point', () => {
    const s = new Sphere();
    const c = Math.sqrt(3) / 3;
    const n = s.normal(new Point(c, c, c));
    expect(n.equals(new Vector(c, c, c))).toBeTruthy();
});

test('The normal is a normalized vector', () => {
    const s = new Sphere();
    const c = Math.sqrt(3) / 3;
    const n = s.normal(new Point(c, c, c));
    expect(n.equals(n.normalize())).toBeTruthy();
});

test('Computing the normal on a translated sphere', () => {
    const s = new Sphere();
    s.transform = Matrix.translation(0, 1, 0);
    const n = s.normal(new Point(0, 1.70711, -0.70711));
    expect(n.equals(new Vector(0, 0.70711, -0.70711))).toBeTruthy();
});

test('Computing the normal on a transformed sphere', () => {
    const s = new Sphere();
    const m = Matrix.scaling(1, 0.5, 1).multiply(Matrix.rotationZ(Math.PI / 5));
    s.transform = m;
    const n = s.normal(new Point(0, Math.sqrt(2) / 2, -Math.sqrt(2) / 2));
    expect(n.equals(new Vector(0, 0.97014, -0.24254))).toBeTruthy();
});

test('Reflecting a vector approaching at 45 degrees', () => {
    const n = new Vector(0, 1, 0);
    const v = new Vector(1, -1, 0);
    expect(v.reflect(n).equals(new Vector(1, 1, 0))).toBeTruthy();
});

test('Reflecting a vector off a slanted surface', () => {
    const v = new Vector(0, -1, 0);
    const n = new Vector(Math.sqrt(2) / 2, Math.sqrt(2) / 2, 0);
    const r = v.reflect(n);
    expect(r.equals(new Vector(1, 0, 0))).toBeTruthy();
});
