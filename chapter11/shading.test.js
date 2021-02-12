import { PointLight, Material, Phong, schlick } from './shading';
import { Sphere, World, Ray, Intersection, Plane, DefaultWorld, GlassSphere } from './geometry';
import { Color, Point, Vector, Matrix } from './tuple';
import { Stripe } from './patterns';
import { eqf } from './math';

test('A point light has a position and intensity', () => {
    const intensity = new Color(1, 1, 1);
    const position = new Point(0, 0, 0);

    const light = new PointLight(position, intensity);
    expect(light.position.equals(position)).toBeTruthy();
    expect(light.intensity.equals(intensity)).toBeTruthy();
});

test('The default material', () => {
    const m = new Material();
    expect(m.color.equals(new Color(1, 1, 1))).toBeTruthy();
    expect(m.ambient).toEqual(0.1);
    expect(m.diffuse).toEqual(0.9);
    expect(m.specular).toEqual(0.9);
    expect(m.shininess).toEqual(200.0);
});

test('A sphere has a default material', () => {
    const s = new Sphere();
    expect(s.material.equals(new Material())).toBeTruthy();
});

test('A sphere may be assigned a material', () => {
    const s = new Sphere();
    const m = new Material();
    m.ambient = 1;
    s.material = m;

    expect(s.material.equals(m)).toBeTruthy();
});

test('Lighting with the eye between the light and the surface', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, 0, -1);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 0, -10));
    const color = Phong.shade(m, light, position, eyev, normalv);
    // expect ambient, diffuse and specular to be at full strength
    // the total intensity should be 0.1 (ambient) + 0.9 (diffuse) + 0.9 (specular) => 1.9
    expect(color.equals(new Color(1.9, 1.9, 1.9))).toBeTruthy();
});

test('Lighting with the eye between light and surface, eye offset 45 degrees', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, Math.sqrt(2) / 2, -Math.sqrt(2) / 2);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 0, -10));
    const color = Phong.shade(m, light, position, eyev, normalv);
    // expect ambient and diffuse to be unchanged, specular should have fallen to 0
    // because the eye is offset by 45, therefore 0.1 + 0.9 + 0 => 1
    expect(color.equals(new Color(1, 1, 1))).toBeTruthy();
});

test('Lighting with eye opposite surface, light offset 45', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, 0, -1);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 10, -10));
    const color = Phong.shade(m, light, position, eyev, normalv);

    expect(color.equals(new Color(0.7364, 0.7364, 0.7364))).toBeTruthy();
});

test('Lighting with eye in the path of the reflection vector', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, -Math.sqrt(2) / 2, -Math.sqrt(2) / 2);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 10, -10));
    const color = Phong.shade(m, light, position, eyev, normalv);

    expect(color.equals(new Color(1.6364, 1.6364, 1.6364))).toBeTruthy();
});

test('Lighting with the light behind the surface', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, 0, -1);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 0, 10));
    const color = Phong.shade(m, light, position, eyev, normalv);

    expect(color.equals(new Color(0.1, 0.1, 0.1))).toBeTruthy();
});

test('Lighting with the surface in shadow', () => {
    const m = new Material();
    const position = new Point(0, 0, 0);
    const eyev = new Vector(0, 0, -1);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 0, -10));
    const in_shadow = true;
    const color = Phong.shade(m, light, position, eyev, normalv, in_shadow);
    // expect ambient, diffuse and specular to be at full strength
    // the total intensity should be 0.1 (ambient) + 0.9 (diffuse) + 0.9 (specular) => 1.9
    expect(color.equals(new Color(0.1, 0.1, 0.1))).toBeTruthy();
});

test('shadeHit() is given an intersection in shadow', () => {
    const light = new PointLight(new Point(0, 0, -10), new Color(1, 1, 1));
    const s1 = new Sphere();
    const s2 = new Sphere(undefined, undefined, Matrix.translation(0, 0, 10));
    const w = new World([s1, s2], light);

    const r = new Ray(new Point(0, 0, 5), new Vector(0, 0, 1));
    const i = new Intersection(4, s2);
    const info = i.info(r);
    const c = Phong.shadeHit(w, info);

    expect(c.equals(new Color(0.1, 0.1, 0.1))).toBeTruthy();
});

test('Lighting with a pattern applied', () => {
    const pattern = new Stripe(Color.WHITE, Color.BLACK);
    const material = new Material(pattern, 1, 0, 0);
    const eyev = new Vector(0, 0, -1);
    const normalv = new Vector(0, 0, -1);
    const light = new PointLight(new Point(0, 0, -10), Color.WHITE);
    const c1 = Phong.shade(material, light, new Point(0.9, 0, 0), eyev, normalv, false);
    const c2 = Phong.shade(material, light, new Point(1.1, 0, 0), eyev, normalv, false);
    expect(c1.equals(Color.WHITE)).toBeTruthy();
    expect(c2.equals(Color.BLACK)).toBeTruthy();
});

test('Reflectivity for the default material', () => {
    const m = new Material();
    expect(eqf(m.reflective, 0)).toBeTruthy();
});

test('Show that the info() function precomputes the reflectv vector', () => {
    const shape = new Plane();
    const ray = new Ray(new Point(0, 1, -1), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const i = new Intersection(Math.sqrt(2), shape);

    const info = i.info(ray);
    expect(info.reflectv.equals(new Vector(0, Math.sqrt(2) / 2, Math.sqrt(2) / 2))).toBeTruthy();
});

test('The reflected color for a nonreflective material', () => {
    const world = new DefaultWorld();
    const ray = new Ray(new Point(), new Vector(0, 0, 1));
    const shape = world.objects[1];
    shape.material.ambient = 1;
    const i = new Intersection(1, shape);
    const info = i.info(ray);
    const color = world.reflectedColor(info);
    expect(color.equals(Color.BLACK)).toBeTruthy();
});

test('The reflected color for a reflective material', () => {
    const world = new DefaultWorld();
    const shape = new Plane();
    shape.material.reflective = 0.5;
    shape.transform = Matrix.translation(0, -1, 0);

    world.objects.push(shape);
    const ray = new Ray(new Point(0, 0, -3), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const i = new Intersection(Math.sqrt(2), shape);
    const info = i.info(ray);
    const color = world.reflectedColor(info);
    const expectedColor = new Color(0.190332, 0.237915, 0.1427491);
    expect(color.equals(expectedColor)).toBeTruthy();
});

test('shadeHit() with a reflective material', () => {
    const world = new DefaultWorld();
    const shape = new Plane();
    shape.material.reflective = 0.5;
    shape.transform = Matrix.translation(0, -1, 0);

    world.objects.push(shape);
    const ray = new Ray(new Point(0, 0, -3), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const i = new Intersection(Math.sqrt(2), shape);
    const info = i.info(ray);
    const color = Phong.shadeHit(world, info, 1);
    const expectedColor = new Color(0.876757, 0.92434, 0.82917);
    expect(color.equals(expectedColor)).toBeTruthy();
});

test('colorAt() with mutually reflective surfaces', () => {
    const world = new World();
    world.light = new PointLight(new Point(), Color.WHITE);

    const lowerPlane = new Plane();
    lowerPlane.material.reflective = 1;
    lowerPlane.transform = Matrix.translation(0, -1, 0);
    world.objects.push(lowerPlane);

    const upperPlane = new Plane();
    upperPlane.material.reflective = 1;
    upperPlane.transform = Matrix.translation(0, 1, 0);
    world.objects.push(upperPlane);

    const ray = new Ray(new Point(), new Vector(0, 1, 0));
    try {
        const color = world.colorAt(ray);
    } catch (e) {
        // fail, infinite loop
        expect('infinite loop detected in the ray tracer').toEqual('');
    }
});

test('The reflected color at the maximum recursive depth', () => {
    const world = new DefaultWorld();
    const shape = new Plane();
    shape.material.reflective = 0.5;
    shape.transform = Matrix.translation(0, -1, 0);

    world.objects.push(shape);
    const ray = new Ray(new Point(0, 0, -3), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const i = new Intersection(Math.sqrt(2), shape);
    const info = i.info(ray);
    const color = world.reflectedColor(info, 0);
    expect(color.equals(Color.BLACK)).toBeTruthy();
});

test('Transparency and refractive index for the default material', () => {
    const material = new Material();
    expect(eqf(material.transparency, 0.0)).toBeTruthy();
    expect(eqf(material.refractive, 1.0)).toBeTruthy();
});

test('A helper for producing a sphere with a glassy material', () => {
    const sphere = new GlassSphere();
    expect(sphere.transform.equals(Matrix.identity(4))).toBeTruthy();
    expect(eqf(sphere.material.transparency, 1.0)).toBeTruthy();
    expect(eqf(sphere.material.refractive, 1.5)).toBeTruthy();
});

test('The Schlick approximation under total internal reflection', () => {
    const shape = new GlassSphere();
    const ray = new Ray(new Point(0, 0, Math.sqrt(2) / 2), new Vector(0, 1, 0));
    const xs = [new Intersection(-Math.sqrt(2) / 2, shape), new Intersection(Math.sqrt(2) / 2, shape)];
    const info = xs[1].info(ray, xs);
    const reflectance = schlick(info);
    expect(reflectance).toEqual(1.0);
});

test('The Schlick approximation with a perpendicular viewing angle', () => {
    const shape = new GlassSphere();
    const ray = new Ray(new Point(0, 0, 0), new Vector(0, 1, 0));
    const xs = [new Intersection(-1, shape), new Intersection(1, shape)];
    const info = xs[1].info(ray, xs);
    const reflectance = schlick(info);
    expect(eqf(reflectance, 0.04)).toBeTruthy();
});

test('The Schlick approximation with small angle and n2 > n1', () => {
    const shape = new GlassSphere();
    const ray = new Ray(new Point(0, 0.99, -2), new Vector(0, 0, 1));
    const xs = [new Intersection(1.8589, shape)];
    const info = xs[0].info(ray, xs);
    const reflectance = schlick(info);
    expect(eqf(reflectance, 0.48873)).toBeTruthy();
});

test('shadeHit() with a transparent material', () => {
    const world = new DefaultWorld();
    const floor = new Plane(Matrix.translation(0, -1, 0));
    floor.material.transparency = 0.5;
    floor.material.refractive = 1.5;

    world.objects.push(floor);

    const ball = new Sphere();
    ball.material.color = Color.RED;
    ball.material.ambient = 0.5;
    ball.transform = Matrix.translation(0, -3.5, -0.5);

    world.objects.push(ball);

    const ray = new Ray(new Point(0, 0, -3), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const xs = [new Intersection(Math.sqrt(2), floor)];

    const info = xs[0].info(ray, xs);
    const color = Phong.shadeHit(world, info, 5);
    expect(color.equals(new Color(0.93642, 0.68642, 0.68642))).toBeTruthy();
});

test('shadeHit() with a reflective, transparent material', () => {
    const world = new DefaultWorld();
    const ray = new Ray(new Point(0, 0, -3), new Vector(0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    const floor = new Plane(Matrix.translation(0, -1, 0));
    floor.material.reflective = 0.5;
    floor.material.transparency = 0.5;
    floor.material.refractive = 1.5;

    world.objects.push(floor);

    const sphere = new Sphere();
    sphere.material.color = Color.RED;
    sphere.material.ambient = 0.5;
    sphere.transform = Matrix.translation(0, -3.5, -0.5);

    world.objects.push(sphere);

    const xs = [new Intersection(Math.sqrt(2), floor)];
    const info = xs[0].info(ray, xs);
    const color = Phong.shadeHit(world, info, 5);
    expect(color.equals(new Color(0.93391, 0.69643, 0.69243))).toBeTruthy();
});
