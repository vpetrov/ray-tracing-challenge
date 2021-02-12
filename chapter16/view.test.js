import { View, Camera } from './view.mjs';
import { Point, Vector, Matrix, Color } from './tuple.mjs';
import { eqf } from './math.mjs';
import { DefaultWorld } from './geometry.mjs';

test('The transformation matrix for the default orientation', () => {
    const from = new Point();
    const to = new Point(0, 0, -1);
    const up = new Vector(0, 1, 0);

    const t = View.transform(from, to, up);

    expect(t.equals(Matrix.identity(4))).toBeTruthy();
});

test('A view transformation matrix looking in the +Z direction', () => {
    const from = new Point();
    const to = new Point(0, 0, 1);
    const up = new Vector(0, 1, 0);

    const t = View.transform(from, to, up);
    expect(t.equals(Matrix.scaling(-1, 1, -1))).toBeTruthy();
});

test('The view transformation moves the world', () => {
    const from = new Point(0, 0, 8);
    const to = new Point();
    const up = new Vector(0, 1, 0);

    const t = View.transform(from, to, up);

    expect(t.equals(Matrix.translation(0, 0, -8))).toBeTruthy();
});

test('An arbitrary view transformation', () => {
    const from = new Point(1, 3, 2);
    const to = new Point(4, -2, 8);
    const up = new Vector(1, 1, 0);
    const t = View.transform(from, to, up);

    expect(
        t.equals(
            new Matrix([
                [-0.50709, 0.50709, 0.67612, -2.36643],
                [0.76772, 0.60609, 0.12122, -2.82843],
                [-0.35857, 0.59761, -0.71714, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ])
        )
    ).toBeTruthy();
});

test('Constructing a camera', () => {
    const hsize = 160;
    const vsize = 120;
    const fovAngle = Math.PI / 2;

    const c = new Camera(hsize, vsize, fovAngle);

    expect(c.hsize).toEqual(160);
    expect(c.vsize).toEqual(120);
    expect(c.fovAngle).toEqual(fovAngle);
    expect(c.transform.equals(Matrix.identity(4))).toBeTruthy();
});

test('The pixel size for a horizontal canvas', () => {
    const c = new Camera(200, 125, Math.PI / 2);

    expect(eqf(c.pixelSize, 0.01)).toBeTruthy();
});

test('The pixel size for a vertical canvas', () => {
    const c = new Camera(125, 200, Math.PI / 2);
    expect(eqf(c.pixelSize, 0.01)).toBeTruthy();
});

test('Constructing a ray through the center of the canvas', () => {
    const c = new Camera(201, 101, Math.PI / 2);
    const r = c.rayAt(100, 50);
    expect(r.origin.equals(new Point(0, 0, 0))).toBeTruthy();
    expect(r.direction.equals(new Vector(0, 0, -1))).toBeTruthy();
});

test('Constructing a ray through a corner of the canvas', () => {
    const c = new Camera(201, 101, Math.PI / 2);
    const r = c.rayAt(0, 0);
    expect(r.origin.equals(new Point(0, 0, 0))).toBeTruthy();
    expect(r.direction.equals(new Vector(0.66519, 0.33259, -0.66851))).toBeTruthy();
});

test('Constructing a ray when the camera is transformed', () => {
    const transform = Matrix.rotationY(Math.PI / 4).multiply(Matrix.translation(0, -2, 5));
    const c = new Camera(201, 101, Math.PI / 2, transform);
    const r = c.rayAt(100, 50);

    expect(r.origin.equals(new Point(0, 2, -5))).toBeTruthy();
    expect(r.direction.equals(new Vector(Math.sqrt(2) / 2.0, 0, -Math.sqrt(2) / 2))).toBeTruthy();
});

test('Rendering a world with a camera', () => {
    const w = new DefaultWorld();
    const from = new Point(0, 0, -5);
    const to = new Point();
    const up = new Vector(0, 1, 0);
    const transform = View.transform(from, to, up);
    const c = new Camera(11, 11, Math.PI / 2, transform);

    const image = c.render(w);

    expect(image.pixelAt(5, 5).equals(new Color(0.38066, 0.47583, 0.2855))).toBeTruthy();
});

test('Partial rendering of a world with a camera', () => {
    const w = new DefaultWorld();
    const from = new Point(0, 0, -5);
    const to = new Point();
    const up = new Vector(0, 1, 0);
    const transform = View.transform(from, to, up);
    const camera = new Camera(11, 11, Math.PI / 2, transform);
    const image = camera.render(w, 1, 5, 6);

    // 0-4, 6 - 10 should have nothing rendered
    // row 5 should have something
    for (let row = 0; row < 11; row++) {
        if (row === 5) {
            continue;
        }
        for (let col = 0; col < 11; col++) {
            expect(image.pixelAt(col, row).equals(Color.BLACK)).toBeTruthy();
        }
    }

    expect(image.pixelAt(5, 5).equals(new Color(0.38066, 0.47583, 0.2855))).toBeTruthy();
});
