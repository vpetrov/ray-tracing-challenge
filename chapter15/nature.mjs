import { Point, Color, Vector, Matrix, srt } from './tuple.mjs';
import { World, Sphere, Cube, BoundsCube, Cylinder } from './geometry.mjs';
import { PointLight, Material } from './shading.mjs';
import { Checkers } from './patterns.mjs';
import { Group } from './groups.mjs';
import { RayTracer } from './raytracer.mjs';
import { ObjDirParser } from './obj.mjs';
import { BoundingBox } from './bounds.mjs';
import cluster from 'cluster';

// args
const objDir = '/home/victor/assets/kenney/3/3D assets/Nature Kit/Models/OBJ format/';
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

// Parse OBJ
const parser = new ObjDirParser();
const objects = parser.parse(objDir);

console.log(`Loaded OBJ dir ${objDir}`);

if (cluster.isMaster) {
    // console.log(' - bounds: ', objGroup.bounds.minPoint, objGroup.bounds.maxPoint);
    // console.log(' - children:', objGroup.children.length);
    // const namedGroups = [];
    // objGroup.forEach((child) => !(child.id) || namedGroups.push(child.id));
    // console.log(' - groups:', namedGroups);
    // console.log(' - materials:', Object.keys(parser.materials).length);
}

const root = new Group();
showAllOnGrid(root, objects, 1);

const box = new BoundingBox(new Point(-6, 0, -1), new Point(6, 6, 6));
const room = new BoundsCube(
    new BoundingBox(new Point(-10, 0, -10), new Point(10, 10, 10)),
    Matrix.translation(0, 5, 0),
    new Material(new Checkers(new Color(0.5, 0.5, 0.5), new Color(0.9, 0.9, 0.9), Matrix.scaling(0.2, 0.2, 0.2)))
);

// light shining from above and to the left
const light = new PointLight(new Point(0, 3, -3), new Color(1, 1, 1));

// world
//const world = new World([objGroup], light);
const world = new World([root, room, axes()], light);

// camera
const up = new Vector(0, 1, 0);
const cameras = {
    topLeft: {
        size: imageSize,
        from: box.corners.objects[1],
        to: new Point(0, 0, 0),
        up: up,
    },
    topRight: {
        size: imageSize,
        from: box.corners.objects[2],
        to: new Point(0, 0, 0),
        up: up,
    },
    botLeft: {
        size: imageSize,
        from: box.corners.objects[0],
        to: new Point(0, 0, 0),
        up: up,
    },
    botRight: {
        size: imageSize,
        from: box.corners.objects[3],
        to: new Point(0, 0, 0),
        up: up,
    },
};

const raytracer = new RayTracer(world, cameras);

if (renderAllCameras) {
    raytracer.render();
} else {
    raytracer.render(['topLeft']);
}

function showAllOnGrid(group, objects, limit) {
    let x = 0;
    let z = 0;
    limit = limit || Object.keys(objects).length;
    let i = 0;

    for (const key in objects) {
        if (!objects.hasOwnProperty(key)) {
            continue;
        }

        const object = objects[key].clone();
        group.add(object);
        group.add(new BoundsCube(object.bounds));
        // enforce a limit
        i++;
        if (i >= limit) {
            break;
        }
    }
}

function axes() {
    const xAxis = new Cylinder(
        undefined,
        undefined,
        false,
        srt(Matrix.scaling(0.05, 1, 0.05), Matrix.rotationZ(Math.PI / 2)),
        new Material(Color.RED)
    );
    const yAxis = new Cylinder(undefined, undefined, false, Matrix.scaling(0.05, 1, 0.05), new Material(Color.GREEN));
    const zAxis = new Cylinder(
        undefined,
        undefined,
        false,
        srt(Matrix.scaling(0.05, 1, 0.05), Matrix.rotationX(Math.PI / 2)),
        new Material(Color.BLUE)
    );
    // no shadows for the coordinate axes
    xAxis.castShadow = yAxis.castShadow = zAxis.castShadow = false;

    const group = new Group();
    group.add(xAxis);
    group.add(yAxis);
    group.add(zAxis);
    return group;
}
