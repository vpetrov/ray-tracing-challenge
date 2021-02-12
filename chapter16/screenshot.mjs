import { Point, Color, Vector, Matrix, srt } from './tuple.mjs';
import { World, Sphere, Cube, Cylinder, BoundsCube } from './geometry.mjs';
import { BoundingBox } from './bounds.mjs';
import { PointLight, Material } from './shading.mjs';
import { Group } from './groups.mjs';
import { RayTracer } from './raytracer.mjs';
import { CSG, DIFFERENCE, INTERSECT, UNION, Dice } from './csg.mjs';
import { EPSILON } from './math.mjs';
import { Checkers } from './patterns.mjs';

// args
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

// materials
const redMat = new Material(Color.RED);
redMat.reflective = 0.1;
redMat.refractive = 0;

const greenMat = new Material(Color.GREEN);
greenMat.reflective = 0.1;
greenMat.refractive = 0;

const blueMat = new Material(Color.BLUE);
blueMat.reflective = 0.1;

const bubbleMat = new Material(Color.WHITE, 0.3);
const roomMat = new Material(
    new Checkers(new Color(0.4, 0.4, 0.4), new Color(0.8, 0.8, 0.8), Matrix.scaling(0.2, 0.2, 0.2))
);
roomMat.specular = 0;

const greenDice = new Dice(0.1, srt(Matrix.rotationY(Math.PI / 3), Matrix.translation(0, 2, 0)), greenMat, bubbleMat);
const blueDice = new Dice(0.1, srt(Matrix.rotationY(-Math.PI / 3), Matrix.translation(-1.5, 0, 0)), blueMat, bubbleMat);
const redDice = new Dice(
    0.1,
    srt(Matrix.rotationY(Math.PI - Math.PI / 4), Matrix.translation(1.5, 0, 0)),
    redMat,
    bubbleMat
);

const cubeGroup = new Group();
cubeGroup.add(greenDice, blueDice, redDice);

const room = new BoundsCube(
    new BoundingBox(new Point(-10, -10, -10), new Point(10, 10, 10)),
    Matrix.translation(0, 9, 0),
    roomMat
);

const worldGroup = new Group();

worldGroup.add(cubeGroup);
worldGroup.add(room);

// light shining from above and to the left
const light = new PointLight(new Point(-3, 8, -3), new Color(1, 1, 1));

// world
const world = new World([worldGroup], light);

// camera
const up = new Vector(0, 1, 0);
const cameras = {
    perspective: {
        size: imageSize,
        from: new Point(),
        to: new Point(0, 1, 0),
        up: up,
        frames: 1,
        animate: (frameId, info) => {
            info.from = Matrix.rotationY(((2 * Math.PI) / info.frames) * frameId).multiply(new Point(-1, 2.5, -6));
        },
    },
};

const raytracer = new RayTracer(world, cameras, { prefix: 'output/' });

if (renderAllCameras) {
    raytracer.render();
} else {
    raytracer.render('perspective');
}
