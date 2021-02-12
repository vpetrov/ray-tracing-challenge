import { PointLight, Material, Phong } from './shading';
import { Sphere, World, Ray, Intersection } from './geometry';
import { Color, Point, Vector, Matrix } from './tuple';

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
    const s2 = new Sphere(undefined, undefined, Matrix.translation(0,0,10));
    const w = new World([s1, s2], light);

    const r = new Ray(new Point(0,0,5), new Vector(0,0,1));
    const i = new Intersection(4, s2);
    const info = i.info(r);
    const c = Phong.shadeHit(w, info);

    expect(c.equals(new Color(0.1, 0.1, 0.1))).toBeTruthy();
});
