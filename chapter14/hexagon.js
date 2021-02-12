import { Point, Color, Vector, Matrix, srt } from './tuple';
import { Plane, Sphere, Cylinder, World } from './geometry';
import { PointLight } from './shading';
import { Group } from './groups';
import { RayTracer } from './raytracer';

// args
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

// groups to render
const rootGroup = new Group();
rootGroup.add(hexagon());

// light shining from above and to the left
const light = new PointLight(new Point(-3, 3, -3), new Color(1, 1, 1));

// world
const world = new World([rootGroup], light);

// camera
const up = new Vector(0, 1, 0);
const cameras = {
    perspective: {
        size: imageSize,
        from: new Point(0, 1.5, -1),
        to: new Point(0, 0, 0),
        up: up,
    },
    front: {
        size: imageSize,
        from: new Point(0, 1, -1), // looking along +Z
        to: new Point(0, 0, 10),
        up: up,
    },
    left: {
        size: imageSize,
        from: new Point(-2, 0.5, 2), //  looking along +X
        to: new Point(0, 0.5, 2),
        up: up,
    },
    top: {
        size: imageSize,
        from: new Point(0, 3, 2), // looking along -Y
        to: new Point(0, 0, 2),
        up: new Vector(0, 0, 1),
    },
};

const raytracer = new RayTracer(world, cameras, 'hexagon_');

if (renderAllCameras) {
    raytracer.render();
} else {
    raytracer.render('perspective');
}

function hexagon_corner() {
    const corner = new Sphere();
    corner.transform = srt(Matrix.scaling(0.25, 0.25, 0.25), Matrix.translation(0, 0, -1));
    return corner;
}

function hexagon_edge() {
    return new Cylinder(
        0,
        1,
        false,
        srt(
            Matrix.scaling(0.25, 1, 0.25),
            Matrix.rotationZ(-Math.PI / 2),
            Matrix.rotationY(-Math.PI / 6),
            Matrix.translation(0, 0, -1)
        )
    );
}

function hexagon_side(transform) {
    const group = new Group(transform);
    group.add(hexagon_corner());
    group.add(hexagon_edge());
    return group;
}

function hexagon() {
    const hex = new Group();

    for (let i = 0; i < 6; i++) {
        const side = hexagon_side(Matrix.rotationY((i * Math.PI) / 3));
        hex.add(side);
    }

    return hex;
}
