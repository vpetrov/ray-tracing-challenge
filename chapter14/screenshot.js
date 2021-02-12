import cluster from 'cluster';
import os from 'os';
import { View, Camera } from './view';
import { Point, Color, Vector, Matrix, srt } from './tuple';
import { Plane, Sphere, Cube, Cylinder, Cone, World } from './geometry';
import { PointLight, Material } from './shading';
import { randomInt, randomFloat, randomItem } from './math';
import { Checkers } from './patterns';
import { Group } from './groups';
import { Stats } from './stats';

// args
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

// materials
const materials = generateMaterials(10);

// groups to render
const rootGroup = new Group();

// other groups
const ngroups = 20;
const nspheres_per_group = 20;
const startx = -Math.floor(ngroups / 2);
const offsetx = 1;
for (let row = 0; row < ngroups; row++) {
    const spheres = generateSpheres(nspheres_per_group, materials);
    const group = new Group(Matrix.translation(startx + row * offsetx, 0, 0));
    group.add(...spheres);
    rootGroup.add(group);
}

const floor = new Plane(undefined, new Material(new Checkers()));
rootGroup.add(floor);

// light shining from above and to the left
const light = new PointLight(new Point(-3, 3, -3), new Color(1, 1, 1));

// world
const world = new World([rootGroup], light);

// camera
const up = new Vector(0, 1, 0);
const perspective = {
    from: new Point(-1, 2, -0.1),
    to: new Point(0, 0, 1),
    up: up,
};

const front = {
    from: new Point(0, 1, -1), // looking along +Z
    to: new Point(0, 0, 10),
    up: up,
};

const left = {
    from: new Point(-2, 0.5, 2), //  looking along +X
    to: new Point(0, 0.5, 2),
    up: up,
};

const top = {
    from: new Point(0, 3, 2), // looking along -Y
    to: new Point(0, 0, 2),
    up: new Vector(0, 0, 1),
};

const perspectiveCamera = new Camera(
    imageSize,
    imageSize,
    Math.PI / 3,
    View.transform(perspective.from, perspective.to, perspective.up)
);
const frontCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(front.from, front.to, front.up));
const leftCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(left.from, left.to, left.up));
const topCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(top.from, top.to, top.up));

if (renderAllCameras) {
    const cameraIds = ['perspective', 'front', 'left', 'top'];
    const ncpus = os.cpus().length;

    if (ncpus < cameraIds.length) {
        throw Error(`Number of cores (${ncpus}) is less than number of cameras (${cameraIds.length})`);
    }

    if (cluster.isMaster) {
        console.log(
            `[main] (${new Date().toLocaleString()}) Spawning ${
                cameraIds.length
            } processes for parallel rendering (${ncpus} cores available)`
        );

        for (let i = 0; i < cameraIds.length; i++) {
            const worker = cluster.fork();
            worker.send({ cameraId: cameraIds[i], filename: `screenshot_${cameraIds[i]}.ppm` });
        }

        let remainingProcesses = cameraIds.length;
        cluster.on('exit', (worker, code, signal) => {
            remainingProcesses--;
            console.log(
                `[main] Worker ${worker.process.pid} exited with code ${code} (${remainingProcesses} workers left)`
            );
            // kill the master
            if (remainingProcesses <= 0) {
                console.log('[main] All workers have finished. Exiting program.');
                process.exit(0);
            }
        });
    } else {
        //worker logic
        process.on('message', (message) => {
            renderCamera(message.cameraId, message.filename);
        });
    }
} else {
    renderCamera('perspective', 'screenshot_perspective.ppm');
}

function renderCamera(cameraId, filename) {
    let camera = null;
    filename = filename ? filename : 'screenshot_' + process.pid + '.ppm';

    switch (cameraId) {
        case 'perspective':
            camera = perspectiveCamera;
            break;
        case 'front':
            camera = frontCamera;
            break;
        case 'left':
            camera = leftCamera;
            break;
        case 'top':
            camera = topCamera;
            break;
        default:
            throw Error(`Unknown camera id: ${cameraId}`);
    }

    console.log(`[${process.pid}] Rendering ${cameraId}`);
    const image = camera.render(world);
    image.savePPM(filename);
    console.log(
        `[${
            process.pid
        }] (${new Date().toLocaleString()}) Done rendering ${cameraId} camera to image ${filename}\n - Stats:`,
        Stats
    );
    process.exit(0);
}

function generateMaterials(nmaterials) {
    const colors = [Color.BLACK, Color.WHITE, Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW];
    const result = [];

    for (let i = 0; i < nmaterials; i++) {
        const material = new Material(randomItem(colors));
        // glass?
        if (randomInt(0, 100) > 60) {
            material.ambient = 0.1;
            material.diffuse = 0.1;
            material.specular = 0;
            material.shininess = 0;
            material.reflective = 0.1;
            material.refractive = 1.0;
            material.transparency = 1.0;
        } else {
            // random materials
            material.ambient = randomFloat(0.1, 0.3);
            material.diffuse = randomFloat(0.1, 1.0);
            material.specular = randomFloat();
            material.shininess = randomInt(0, 1000);
            material.reflective = randomFloat(0.4, 1.0);
            material.refractive = randomFloat();
            material.transparency = randomFloat() < 0.3 ? 1.0 : 0;
        }
        result.push(material);
    }

    return result;
}

function generateSpheres(nspheres, materials) {
    const result = [];

    for (let i = 0; i < nspheres; i++) {
        const matIndex = randomInt(0, materials.length);
        const material = materials[matIndex];
        const scaleFactor = randomFloat(0.03, 0.4);

        const x = randomFloat(-0.2, 0.2);
        const y = scaleFactor;
        const z = i === 0 ? i : i - randomFloat(-0.5, -0.5);

        const transform = srt(Matrix.scaling(scaleFactor, scaleFactor, scaleFactor), Matrix.translation(x, y, z));

        const sphere = new Sphere(undefined, undefined, transform, material);
        result.push(sphere);
    }

    return result;
}
