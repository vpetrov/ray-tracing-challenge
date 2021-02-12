import { View, Camera } from './view';
import { World, Sphere, Plane } from './geometry';
import { Point, Vector, Matrix, Color } from './tuple';
import { PointLight, Material } from './shading';

// camera
const from = new Point(0, 1.5, -5);
const to = new Point(0, 1, 0);
const up = new Vector(0, 1, 0);
const camera = new Camera(1200, 1200, Math.PI / 3, View.transform(from, to, up));

// light shining from above and to the left
const light = new PointLight(new Point(-10, 10, -10), new Color(1, 1, 1));

// sphere
const sphere1 = new Sphere(
    undefined,
    undefined,
    Matrix.translation(-1, 0, 1).multiply(Matrix.scaling(1, 1, 1)),
    new Material(new Color(0.5, 0.1, 0.1))
);
const sphere2 = new Sphere(
    undefined,
    undefined,
    Matrix.translation(1, 1, -2).multiply(Matrix.scaling(1, 1, 1)),
    new Material(new Color(0.1, 0.4, 0.9))
);

// plane
const plane = new Plane();
const backWall = new Plane(
    Matrix.translation(0, 0, 10).multiply(Matrix.rotationX(Math.PI / 4)),
    new Material(new Color(0.5, 1.0, 0.5))
);

// world
const world = new World([plane, backWall, sphere1, sphere2], light);

const image = camera.render(world);
image.savePPM('screenshot.ppm');
