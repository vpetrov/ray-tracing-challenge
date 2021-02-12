import { Ray, Shape, Sphere, Plane, Intersection, World, DefaultWorld, GlassSphere, Cube } from './geometry';
import { Point, Vector, Matrix, Color } from './tuple';
import { PointLight, Material, Phong } from './shading';
import { EPSILON } from './math';
import { TestPattern } from './patterns';

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

    const xs = s.intersect(r);

    expect(xs.length).toEqual(2);
    expect(xs[0].equals(new Intersection(4.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(6.0, s))).toBeTruthy();
});

test('A ray intersects a sphere at a tangent', () => {
    const r = new Ray(new Point(0, 1, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = s.intersect(r);
    expect(xs.length).toEqual(2);
    expect(xs[0].equals(new Intersection(5.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(5.0, s))).toBeTruthy();
});

test('A ray misses a sphere', () => {
    const r = new Ray(new Point(0, 2, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = s.intersect(r);
    expect(xs.length).toEqual(0);
});

test('A ray originates inside a sphere', () => {
    const r = new Ray(new Point(0, 0, 0), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = s.intersect(r);
    expect(xs[0].equals(new Intersection(-1.0, s))).toBeTruthy();
    expect(xs[1].equals(new Intersection(1.0, s))).toBeTruthy();
});

test('A sphere is behind a ray', () => {
    const r = new Ray(new Point(0, 0, 5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0));
    const xs = s.intersect(r);

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

    const xs = s.intersect(r);
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

test('The default transformation', () => {
    const s = new Shape(new Point(0, 0, 0));
    expect(s.transform.equals(Matrix.identity(4))).toBeTruthy();
});

test('Assigning a transformation', () => {
    const s = new Shape(new Point(0, 0, 0));
    const t = Matrix.translation(2, 3, 4);
    s.transform = t;
    expect(s.transform.equals(t)).toBeTruthy();
});

test('The default material', () => {
    const s = new Shape();
    expect(s.material.equals(new Material())).toBeTruthy();
});

test('Assigning a material', () => {
    const material = new Material(undefined, 1); // 1 = ambient
    const shape = new Shape();
    shape.material = material;
    expect(shape.material.equals(material)).toBeTruthy();
});

test('Intersecting a scaled sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0), 1, Matrix.scaling(2, 2, 2));
    const xs = s.intersect(r);

    expect(xs.length).toEqual(2);
    expect(xs[0].t).toEqual(3);
    expect(xs[1].t).toEqual(7);
});

test('Intersecting a translated sphere with a ray', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const s = new Sphere(new Point(0, 0, 0), 1, Matrix.translation(5, 0, 0));
    const xs = s.intersect(r);

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

test('Computing the normal on a translated shape', () => {
    const s = new Shape();
    s.transform = Matrix.translation(0, 1, 0);
    try {
        const n = s.normal(new Point(0, 1.70711, -0.70711));
    } catch (e) {
        // ignore
    } finally {
        expect(s.savedNormal.equals(new Vector(0, 0.70711, -0.70711))).toBeTruthy();
    }
});

test('Computing the normal on a transformed shape', () => {
    const s = new Shape();
    const m = Matrix.scaling(1, 0.5, 1).multiply(Matrix.rotationZ(Math.PI / 5));
    s.transform = m;
    try {
        const n = s.normal(new Point(0, Math.sqrt(2) / 2, -Math.sqrt(2) / 2));
    } catch (e) {
        // ignore
    } finally {
        expect(s.savedNormal.equals(new Vector(0.83125, 1.14412, -0.7071))).toBeTruthy();
    }
});

test('A sphere is a shape', () => {
    expect(new Sphere() instanceof Shape).toBeTruthy();
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

test('Creating a world', () => {
    const w = new World();
    11;
    expect(w.objects.length).toEqual(0);
    expect(w.light).toBeNull();
});

test('The default world', () => {
    const light = new PointLight(new Point(-10, 10, -10));
    const s1 = new Sphere(new Point(), 1.0, undefined, new Material(new Color(0.8, 1.0, 0.6), undefined, 0.7, 0.2));
    const s2 = new Sphere(new Point(), 1.0, Matrix.scaling(0.5, 0.5, 0.5));

    const defaultWorld = new DefaultWorld();

    expect(defaultWorld.objects[0].equals(s1)).toBeTruthy();
    expect(defaultWorld.objects[1].equals(s2)).toBeTruthy();
    expect(defaultWorld.light.equals(light)).toBeTruthy();
});

test('Intersect a world with a ray', () => {
    const w = new DefaultWorld();
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));

    const xs = w.intersect(r);

    expect(xs.length).toEqual(4);
    expect(xs[0].t).toEqual(4);
    expect(xs[1].t).toEqual(4.5);
    expect(xs[2].t).toEqual(5.5);
    expect(xs[3].t).toEqual(6);
});

test('Intersecting a scaled shape with a ray', () => {
    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = new Shape(new Point(), Matrix.scaling(2, 2, 2));

    try {
        const xs = shape.intersect(ray);
    } catch (e) {
        // ignore
    } finally {
        expect(shape.savedRay.equals(new Ray(new Point(0, 0, -2.5), new Vector(0, 0, 0.5)))).toBeTruthy();
    }
});

test('Intersecting a translated shape with a ray', () => {
    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = new Shape(new Point(), Matrix.translation(5, 0, 0));

    try {
        const xs = ray.intersect(shape);
    } catch (e) {
        // ignore
    } finally {
        expect(shape.savedRay.equals(new Ray(new Point(-5, 0, -5), new Vector(0, 0, 1)))).toBeTruthy();
    }
});

test('Precomputing the state of an intersection', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = new Sphere();

    const i = new Intersection(4, shape);

    const info = i.info(r);

    expect(info.t).toEqual(i.t);
    expect(info.object.equals(i.object)).toBeTruthy();
    expect(info.point.equals(new Point(0, 0, -1))).toBeTruthy();
    expect(info.eyev.equals(new Vector(0, 0, -1))).toBeTruthy();
    expect(info.normalv.equals(new Vector(0, 0, -1))).toBeTruthy();
});

test('The hit, when an intersection occurs on the outside', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = new Sphere();
    const i = new Intersection(4, shape);

    const info = i.info(r);

    expect(info.inside).toBeFalsy();
});

test('The hit, when an intersection occurs on the inside', () => {
    const r = new Ray(new Point(0, 0, 0), new Vector(0, 0, 1));
    const shape = new Sphere();
    const i = new Intersection(1, shape);

    const info = i.info(r);
    expect(info.point.equals(new Point(0, 0, 1)));
    expect(info.eyev.equals(new Vector(0, 0, -1)));
    expect(info.inside).toBeTruthy();
    expect(info.normalv.equals(new Vector(0, 0, -1)));
});

test('Shading an intersection', () => {
    const w = new DefaultWorld();
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = w.objects[0];
    const i = new Intersection(4, shape);

    const info = i.info(r);
    const c = Phong.shadeHit(w, info);

    expect(c.equals(new Color(0.38066, 0.47583, 0.2855))).toBeTruthy();
});

test('Shading an intersection from the inside', () => {
    const w = new DefaultWorld();
    w.light = new PointLight(new Point(0, 0.25, 0));

    const r = new Ray(new Point(), new Vector(0, 0, 1));
    const shape = w.objects[1];
    const i = new Intersection(0.5, shape);

    const info = i.info(r);
    const c = Phong.shadeHit(w, info);

    expect(c.equals(new Color(0.90498, 0.90498, 0.90498))).toBeTruthy();
});

test('The color when a ray misses', () => {
    const w = new DefaultWorld();
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 1, 0));
    const c = w.colorAt(r);

    expect(c.equals(new Color(0, 0, 0))).toBeTruthy();
});

test('The color when a ray hits', () => {
    const w = new DefaultWorld();
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const c = w.colorAt(r);

    expect(c.equals(new Color(0.38066, 0.47583, 0.2855))).toBeTruthy();
});

test('The color with an intersection behind the ray', () => {
    const w = new DefaultWorld();
    const outer = w.objects[0];
    outer.material.ambient = 1.0;
    const inner = w.objects[1];
    inner.material.ambient = 1.0;

    const r = new Ray(new Point(0, 0, 0.75), new Vector(0, 0, -1));
    const c = w.colorAt(r);
    expect(c.equals(inner.material.color)).toBeTruthy();
});

test('There is no shadow when nothing is collinear with point and light', () => {
    const w = new DefaultWorld();
    const p = new Point(0, 10, 0);
    const is_shadowed = w.isShadowed(p);

    expect(is_shadowed).toBeFalsy();
});

test('The shadow when an obejct is bewteen the point and the light', () => {
    const w = new DefaultWorld();
    const p = new Point(10, -10, 10);
    const is_shadowed = w.isShadowed(p);

    expect(is_shadowed).toBeTruthy();
});

test('There is no shadow when an object is behind the light', () => {
    const w = new DefaultWorld();
    const p = new Point(-20, 20, -20);
    const is_shadowed = w.isShadowed(p);

    expect(is_shadowed).toBeFalsy();
});

test('There is no shadow when an object is behind the point', () => {
    const w = new DefaultWorld();
    const p = new Point(-2, 2, -2);
    const is_shadowed = w.isShadowed(p);

    expect(is_shadowed).toBeFalsy();
});

test('The hit should offset the point', () => {
    const r = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const shape = new Sphere(undefined, undefined, Matrix.translation(0, 0, 1));
    const i = new Intersection(5, shape);
    const info = i.info(r);

    expect(info.overPoint.z).toBeLessThan(-EPSILON / 2);
    expect(info.point.z).toBeGreaterThan(info.overPoint.z);
});

test('The normal of a plane is constant everywhere', () => {
    const p = new Plane();
    const n1 = p.localNormal(new Point());
    const n2 = p.localNormal(new Point(10, 0, -10));
    const n3 = p.localNormal(new Point(-5, 0, 150));

    const Y = new Vector(0, 1, 0);
    expect(n1.equals(Y)).toBeTruthy();
    expect(n2.equals(Y)).toBeTruthy();
    expect(n3.equals(Y)).toBeTruthy();
});

test('Intersect with a ray parallel to the plane', () => {
    const plane = new Plane();
    const ray = new Ray(new Point(0, 10, 0), new Vector(0, 0, 1));
    const xs = plane.localIntersect(ray);
    expect(xs.length).toEqual(0);
});

test('Intersect with a coplanar ray', () => {
    const plane = new Plane();
    const ray = new Ray(new Point(), new Vector(0, 0, 1));
    const xs = plane.localIntersect(ray);
    expect(xs.length).toEqual(0);
});

test('A ray intersecting a plane from above', () => {
    const plane = new Plane();
    const ray = new Ray(new Point(0, 1, 0), new Vector(0, -1, 0));
    const xs = plane.localIntersect(ray);
    expect(xs.length).toEqual(1);
    expect(xs[0].t).toEqual(1);
    expect(xs[0].object.equals(plane)).toBeTruthy();
});

test('A ray intersecting a plane from below', () => {
    const plane = new Plane();
    const ray = new Ray(new Point(0, -1, 0), new Vector(0, 1, 0));
    const xs = plane.localIntersect(ray);
    expect(xs.length).toEqual(1);
    expect(xs[0].t).toEqual(1);
    expect(xs[0].object.equals(plane)).toBeTruthy();
});

test('Finding n1 and n2 at various intersections', () => {
    const sphere1 = new GlassSphere(undefined, undefined, Matrix.scaling(2, 2, 2));
    const sphere2 = new GlassSphere(undefined, undefined, Matrix.translation(0, 0, -0.25));
    const sphere3 = new GlassSphere(undefined, undefined, Matrix.translation(0, 0, 0.25));
    sphere1.material.refractive = 1.5;
    sphere2.material.refractive = 2.0;
    sphere3.material.refractive = 2.5;

    const r = new Ray(new Point(0, 0, -4), new Vector(0, 0, 1));
    const xs = [
        new Intersection(2, sphere1),
        new Intersection(2.75, sphere2),
        new Intersection(3.25, sphere3),
        new Intersection(4.75, sphere2),
        new Intersection(5.25, sphere3),
        new Intersection(6, sphere1)
    ];

    // expected refraction values
    const ri = [
        { n1: 1.0, n2: 1.5 },
        { n1: 1.5, n2: 2.0 },
        { n1: 2.0, n2: 2.5 },
        { n1: 2.5, n2: 2.5 },
        { n1: 2.5, n2: 1.5 },
        { n1: 1.5, n2: 1.0 }
    ];

    for (let i = 0; i < xs.length; i++) {
        const info = xs[i].info(r, xs);
        expect(info.n1).toEqual(ri[i].n1);
        expect(info.n2).toEqual(ri[i].n2);
    }
});

test('The underpoint is offset below the surface', () => {
    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const sphere = new GlassSphere();
    sphere.transform = Matrix.translation(0, 0, 1);

    const intersection = new Intersection(5, sphere);
    const intersections = [intersection];

    const info = intersection.info(ray, intersections);

    expect(info.underPoint.z).toBeGreaterThan(EPSILON / 2.0);
    expect(info.point.z).toBeLessThan(info.underPoint.z);
});

test('The refracted color with an opaque surface', () => {
    const world = new DefaultWorld();
    const shape = world.objects[0];

    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const xs = [new Intersection(4, shape), new Intersection(6, shape)];
    const info = xs[0].info(ray, xs);
    const c = world.refractedColor(info, 5);
    expect(c.equals(Color.BLACK)).toBeTruthy();
});

test('The refracted color at the maximum recursive depth', () => {
    const world = new DefaultWorld();
    const shape = world.objects[0];
    shape.material.transparency = 1.0;
    shape.material.refractive = 1.5;
    const ray = new Ray(new Point(0, 0, -5), new Vector(0, 0, 1));
    const xs = [new Intersection(4, shape), new Intersection(6, shape)];
    const info = xs[0].info(ray, xs);
    const c = world.refractedColor(info, 0);

    expect(c.equals(Color.BLACK)).toBeTruthy();
});

test('The refracted coilor under total internal reflection', () => {
    const world = new DefaultWorld();
    const shape = world.objects[0];
    shape.material.transparency = 1.0;
    shape.material.refractive = 1.5;
    const ray = new Ray(new Point(0, 0, Math.sqrt(2) / 2), new Vector(0, 1, 0));
    const xs = [new Intersection(-Math.sqrt(2) / 2, shape), new Intersection(Math.sqrt(2) / 2, shape)];
    // this time you're inside the sphere so you need to look at the second intersection, xs[1], not xs[0]
    const info = xs[1].info(ray, xs);
    const c = world.refractedColor(info, xs);
    expect(c.equals(Color.BLACK)).toBeTruthy();
});

test('The refracted color with a refracted ray', () => {
    const world = new DefaultWorld();
    const A = world.objects[0];
    A.material.ambient = 1.0;
    A.material.pattern = new TestPattern();

    const B = world.objects[1];
    B.material.transparency = 1.0;
    B.material.refractive = 1.5;

    const ray = new Ray(new Point(0, 0, 0.1), new Vector(0, 1, 0));
    const xs = [
        new Intersection(-0.9899, A),
        new Intersection(-0.4899, B),
        new Intersection(0.4899, B),
        new Intersection(0.9899, A)
    ];
    const info = xs[2].info(ray, xs);
    const c = world.refractedColor(info, 5);
    expect(c.equals(new Color(0, 0.99887, 0.04721))).toBeTruthy();
});

test('A ray intersects a cube', () => {
    const cube = new Cube();
    const tests = [
        { name: '+x', origin: new Point(5, 0.5, 0), direction: new Vector(-1, 0, 0), t1: 4, t2: 6 },
        { name: '-x', origin: new Point(-5, 0.5, 0), direction: new Vector(1, 0, 0), t1: 4, t2: 6 },
        { name: '+y', origin: new Point(0.5, 5, 0), direction: new Vector(0, -1, 0), t1: 4, t2: 6 },
        { name: '-y', origin: new Point(0.5, -5, 0), direction: new Vector(0, 1, 0), t1: 4, t2: 6 },
        { name: '+z', origin: new Point(0.5, 0, 5), direction: new Vector(0, 0, -1), t1: 4, t2: 6 },
        { name: '-z', origin: new Point(0.5, 0, -5), direction: new Vector(0, 0, 1), t1: 4, t2: 6 },
        { name: 'inside', origin: new Point(0, 0.5, 0), direction: new Vector(0, 0, 1), t1: -1, t2: 1 }
    ];

    for (const test of tests) {
        const ray = new Ray(test.origin, test.direction);
        const xs = cube.localIntersect(ray);
        expect(xs[0].t).toEqual(test.t1);
        expect(xs[1].t).toEqual(test.t2);
    }
});

test('A ray misses a cube', () => {
    const cube = new Cube();
    const tests = [
        { origin: new Point(-2, 0, 0), direction: new Vector(0.2673, 0.5345, 0.8018) },
        { origin: new Point(0, -2, 0), direction: new Vector(0.8018, 0.2673, 0.5345) },
        { origin: new Point(0, 0, -2), direction: new Vector(0.5345, 0.8018, 0.2673) },
        { origin: new Point(2, 0, 2), direction: new Vector(0, 0, -1) },
        { origin: new Point(0, 2, 2), direction: new Vector(0, -1, 0) },
        { origin: new Point(2, 2, 0), direction: new Vector(-1, 0, 0) }
    ];

    for (const test of tests) {
        const ray = new Ray(test.origin, test.direction);
        const xs = cube.localIntersect(ray);
        expect(xs.length).toEqual(0);
    }
});

test('The normal on the surface of a cube', () => {
    const cube = new Cube();

    const tests = [
        { point: new Point(1, 0.5, -0.8), normal: new Vector(1, 0, 0) },
        { point: new Point(-1, -0.2, 0.9), normal: new Vector(-1, 0, 0) },
        { point: new Point(-0.4, 1, -0.1), normal: new Vector(0, 1, 0) },
        { point: new Point(0.3, -1, -0.7), normal: new Vector(0, -1, 0) },
        { point: new Point(-0.6, 0.3, 1), normal: new Vector(0, 0, 1) },
        { point: new Point(0.4, 0.4, -1), normal: new Vector(0, 0, -1) },
        { point: new Point(1, 1, 1), normal: new Vector(1, 0, 0) },
        { point: new Point(-1, -1, -1), normal: new Vector(-1, 0, 0) }
    ];

    for (const test of tests) {
        const point = test.point;
        const normal = cube.localNormal(point);
        expect(normal.equals(test.normal)).toBeTruthy();
    }
});
