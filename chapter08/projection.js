import { View, Camera } from './view';
import { World, Sphere } from './geometry';
import { Point, Vector, Matrix, Color } from './tuple';
import { PointLight, Material } from './shading';

// camera
const from = new Point(0, 1.5, -5);
const to = new Point(0, 1, 0);
const up = new Vector(0, 1, 0);
const camera = new Camera(1200, 1200, Math.PI / 3, View.transform(from, to, up));

// materials
const wallMaterial = new Material(new Color(1, 0.9, 0.9), undefined, undefined, 0);

// floor
const floor = new Sphere(undefined, undefined, Matrix.scaling(10, 0.01, 10), wallMaterial);

// left wall
const leftWall = new Sphere(
    undefined,
    undefined,
    Matrix.translation(0, 0, 5).multiply(
        Matrix.rotationY(-Math.PI / 4).multiply(Matrix.rotationX(Math.PI / 2).multiply(Matrix.scaling(10, 0.01, 10)))
    ),
    wallMaterial
);

// right wall
const rightWall = new Sphere(
    undefined,
    undefined,
    Matrix.translation(0, 0, 5).multiply(
        Matrix.rotationY(Math.PI / 4).multiply(Matrix.rotationX(Math.PI / 2).multiply(Matrix.scaling(10, 0.01, 10)))
    ),
    wallMaterial
);

// Large center sphere| olor, ambient, diffuse, specular, shininess
const middleSphere = new Sphere(
    undefined,
    undefined,
    Matrix.translation(-0.5, 1, 0.5),
    new Material(new Color(0.1, 1, 0.5), undefined, 0.7, 0.3)
);

const rightSphere = new Sphere(
    undefined,
    undefined,
    Matrix.translation(1.5, 0.5, -0.5).multiply(Matrix.scaling(0.5, 0.5, 0.5)),
    new Material(new Color(0.5, 1, 0.1), undefined, 0.7, 0.3)
);

const leftSphere = new Sphere(
    undefined,
    undefined,
    Matrix.translation(-1.5, 0.33, -0.75).multiply(Matrix.scaling(0.33, 0.33, 0.33)),
    new Material(new Color(1, 0.8, 0.1), undefined, 0.7, 0.3)
);

// light shining from above and to the left
const light = new PointLight(new Point(-10, 10, -10), new Color(1, 1, 1));

// world
const world = new World([floor, leftWall, rightWall, middleSphere, rightSphere, leftSphere], light);

const image = camera.render(world);
image.savePPM('screenshot.ppm');
