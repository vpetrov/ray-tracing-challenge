import { Point, Color, Vector, Matrix, srt } from './tuple.mjs';
import { World, Sphere } from './geometry.mjs';
import { PointLight, Material } from './shading.mjs';
import { Group } from './groups.mjs';
import { RayTracer } from './raytracer.mjs';
import { ObjParser } from './obj.mjs';
import cluster from 'cluster';

// args
const objFile = process.argv.length > 2 ? process.argv[2] : 'assets/teddy.obj';
//const objFile = "/home/victor/assets/kenney/3/3D assets/Mini Car Kit/Models/OBJ format/carPolice.obj";
const imageSize = process.argv.length > 2 ? parseInt(process.argv[3]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[4] === 'all';

// Parse OBJ
const parser = new ObjParser();
parser.parse(objFile);
const objGroup = parser.toGroup();

console.log(`Loaded OBJ ${objFile}`);

if (cluster.isMaster) {
    console.log(' - bounds: ', objGroup.bounds.minPoint, objGroup.bounds.maxPoint);
    console.log(' - children:', objGroup.children.length);
    const namedGroups = [];
    objGroup.forEach((child) => !(child.id) || namedGroups.push(child.id));
    console.log(' - groups:', namedGroups);
    console.log(' - materials:', Object.keys(parser.materials).length);
}
objGroup.transform = srt(Matrix.scaling(0.1, 0.1, 0.1), Matrix.rotationY(Math.PI/6), Matrix.translation(0.25, -0.1, 0));

// light shining from above and to the left
const light = new PointLight(new Point(0, 3, -3), new Color(1, 1, 1));

// world
//const world = new World([objGroup], light);
const world = new World([objGroup], light);

// camera
const up = new Vector(0, 1, 0);
const cameras = {
    perspective: {
        size: imageSize,
        from: new Point(0.5, 0.5, -1.5),
        to: new Point(0, 0, 0),
        up: up,
    },
    front: {
        size: imageSize,
        from: new Point(0, 1, -1), // looking along +Z
        to: new Point(0, 0, 0),
        up: up,
    },
    left: {
        size: imageSize,
        from: new Point(-2, 0.5, 0), //  looking along +X
        to: new Point(0, 0, 0),
        up: up,
    },
    top: {
        size: imageSize,
        from: new Point(0, 3, 0), // looking along -Y
        to: new Point(0, 0, 0),
        up: new Vector(0, 0, 1),
    },
};

const raytracer = new RayTracer(world, cameras);

if (renderAllCameras) {
    raytracer.render();
} else {
    raytracer.render(['perspective']);
}