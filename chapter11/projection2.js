import { View, Camera } from './view';
import { World, Sphere, Plane } from './geometry';
import { Point, Vector, Matrix, Color } from './tuple';
import { PointLight, Material } from './shading';
import { Checkers, ConstPattern, ColorPattern } from './patterns';

// camera
const from = new Point(0, 0, -3);
const to = new Point(0, 0, 0);
const up = new Vector(0, 1, 0);
const camera = new Camera(300, 300, Math.PI / 3, View.transform(from, to, up));

const sphereMaterial = new Material(Color.BLACK);
// sphereMaterial.ambient = 0.1;
// sphereMaterial.diffuse = 0.1;
// sphereMaterial.specular = 1.0;
// sphereMaterial.shininess = 300;
// sphereMaterial.reflective = 0.0;
sphereMaterial.refractive = 1.0;
sphereMaterial.transparency = 0.5;

// light shining from above and to the left
const light = new PointLight(new Point(0, 2, -2), new Color(1, 1, 1));
const sphere = new Sphere(undefined, undefined, Matrix.translation(0, 0, 0), sphereMaterial);

// Box
const frontWall = new Plane(Matrix.translation(0, 0, 3).multiply(Matrix.rotationX(Math.PI / 2)), new Material(new Checkers()));

// world
const world = new World([frontWall, sphere], light);

const image = camera.render(world);
image.savePPM('screenshot2.ppm');

