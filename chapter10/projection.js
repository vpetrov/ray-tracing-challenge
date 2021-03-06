import { View, Camera } from './view';
import { World, Sphere, Plane } from './geometry';
import { Point, Vector, Matrix, Color } from './tuple';
import { PointLight, Material } from './shading';
import { Stripe, Gradient, RadialGradient, RingPattern, Checkers, BlendedPattern, Perturbed } from './patterns';

// camera
const from = new Point(0, 1.5, -5);
const to = new Point(0, 1, 0);
const up = new Vector(0, 1, 0);
const camera = new Camera(1200, 1200, Math.PI / 3, View.transform(from, to, up));

// materials
const backMaterial = new Material(new Checkers(new Color(0.1, 0.5, 0.1), Color.WHITE));

const floorMaterial = new Material(
    new Perturbed(new RadialGradient(Color.WHITE, new Color(0.5, 0.5, 1), Matrix.translation(-2, 0.5, 1)))
);
const sphereMaterial1 = new Material(
    new Perturbed(new RingPattern(Color.WHITE, new Color(0.1, 0.1, 0.1), Matrix.scaling(0.1, 0.1, 0.1)))
);
const sphereMaterial2 = new Material(
    new Perturbed(
        new Stripe(
            new Color(0.3, 0.8, 0.8),
            new Color(0.5, 0.9, 0.9),
            Matrix.scaling(0.2, 0.2, 0.2).multiply(Matrix.rotationZ(Math.PI))
        )
    )
);

// light shining from above and to the left
const light = new PointLight(new Point(-10, 10, -10), new Color(1, 1, 1));

// sphere
const sphere1 = new Sphere(
    undefined,
    undefined,
    Matrix.translation(-2, 0.5, 1).multiply(Matrix.rotationZ(Math.PI * 1.1)),
    sphereMaterial1
);
const sphere2 = new Sphere(
    undefined,
    undefined,
    Matrix.translation(1, 1, -2).multiply(Matrix.scaling(1, 1, 1).multiply(Matrix.rotationY(Math.PI / 6))),
    sphereMaterial2
);

// plane
const floor = new Plane(undefined, floorMaterial);
const backWall = new Plane(Matrix.translation(0, 0, 10).multiply(Matrix.rotationX(Math.PI / 4)), backMaterial);

// world
const world = new World([floor, backWall, sphere1, sphere2], light);

const image = camera.render(world);
image.savePPM('screenshot.ppm');
