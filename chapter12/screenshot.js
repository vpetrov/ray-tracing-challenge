import cluster from 'cluster';
import os from 'os';
import { View, Camera } from './view';
import { Point, Color, Vector, Matrix, srt } from './tuple';
import { Plane, Sphere, Cube, World } from './geometry';
import { PointLight, Material } from './shading';
import { Checkers, Stripe, Perturbed, RingPattern, Gradient } from './patterns';

// args
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

// materials
const unitCubeM = new Material(Color.RED);
unitCubeM.transparency = 0.9;

const tableM = new Material(
    new Perturbed(new Stripe(new Color(0.6, 0.2, 0.2), new Color(0.5, 0.2, 0.2), Matrix.scaling(0.1, 0.1, 0.1)))
);
tableM.reflective = 0.2;

const roomM = new Material(new Color(0.7, 0.6, 0.6));

const mirrorM = new Material(Color.BLACK);
mirrorM.reflective = 1.0;

const sphere1M = new Material(new Color(0.9, 0.3, 0.3));
sphere1M.transparency = 1.0;
sphere1M.refractive = 1.0;

const cube2M = new Material(new Color(0.1, 0.9, 0.1));

const cube3M = new Material(new Color(0.3, 0.3, 0.8));

const cube4M = new Material(new Checkers(Color.WHITE, Color.BLACK, Matrix.scaling(0.5, 0.5, 0.5)));

const floorM = new Material(
    new Checkers(new Color(0.1, 0.1, 0.1), new Color(0.8, 0.8, 0.8), Matrix.scaling(0.5, 0.5, 0.5))
);
floorM.reflective = 0.2;

const columnM = new Material(
    new Stripe(
        new Color(0.1, 0.1, 0.1),
        new Color(0.8, 0.8, 0.8),
        Matrix.scaling(0.01, 0.01, 0.01).multiply(Matrix.rotationZ(Math.PI / 2))
    )
);
columnM.reflective = 0.3;
columnM.transparency = 0.2;

const portraitM = new Material(
    new Perturbed(new RingPattern(new Color(0.3, 0.3, 0.9), new Color(0.8, 0.8, 0.9), Matrix.scaling(0.1, 0.1, 0.1)))
);

/* objects */

// room

const spacingRight = 3;
const spacingBack = 5;
const spacingDown = 1;
const boxHeight = 10;
const boxWidth = 20;
const boxLength = 20;

const roomS = Matrix.scaling(boxWidth / 2, boxHeight / 2, boxLength / 2);
const roomR = Matrix.identity(4);
const roomT = Matrix.translation(
    -boxWidth / 2 + spacingRight,
    boxHeight / 2 - spacingDown,
    -boxLength / 2 + spacingBack
);
const room = new Cube(srt(roomS, roomR, roomT), roomM);

const roomWallZ = -6;
const roomWallX = -6;
const roomWallY = 6;

// unit cube
const unitCube = new Cube(undefined, unitCubeM);

// table
const tableS = Matrix.scaling(1, 1, 1);
const tableT = Matrix.translation(0, 0, 0);
const tableWidth = 2;
const tableLength = 4;
const surfaceHeight = 0.05;
const legWidth = 0.15;
const legHeight = 1;
const pad = legWidth;
const legS = Matrix.scaling(legWidth / 2, legHeight / 2, legWidth / 2).multiply(tableS);
const legT = srt(tableT, Matrix.translation(0, -legHeight / 2 - surfaceHeight / 2, 0));
const leg1 = new Cube(srt(legS, legT, Matrix.translation(-tableWidth / 2 + pad, 0, -tableLength / 2 + pad)), tableM); // left front
const leg2 = new Cube(srt(legS, legT, Matrix.translation(tableWidth / 2 - pad, 0, -tableLength / 2 + pad)), tableM); // right front
const leg3 = new Cube(srt(legS, legT, Matrix.translation(tableWidth / 2 - pad, 0, tableLength / 2 - pad)), tableM); // right back
const leg4 = new Cube(srt(legS, legT, Matrix.translation(-tableWidth / 2 + pad, 0, tableLength / 2 - pad)), tableM); // left back
const surfaceS = Matrix.scaling(tableWidth / 2, surfaceHeight / 2, tableLength / 2).multiply(tableS);
const surface = new Cube(surfaceS, tableM);
const tableObject = [leg1, leg2, leg3, leg4, surface];

// mirror on right wall
const mirrorWidth = 4;
const mirrorHeight = 2;
const mirrorDepth = 0.1;

const mirrorS = Matrix.scaling(mirrorHeight / 2, mirrorDepth / 2, mirrorWidth / 2);
const mirrorR = Matrix.rotationZ(Math.PI / 2);
const mirrorT = Matrix.translation(spacingRight, 1.5, 0);
const mirror = new Cube(srt(mirrorS, mirrorR, mirrorT), mirrorM);

// sphere on table
const sphere1R = 0.33;
const sphere1S = Matrix.scaling(sphere1R, sphere1R, sphere1R);
const sphere1T = Matrix.translation(0, sphere1R, -0.5);
const sphere1 = new Sphere(undefined, undefined, srt(sphere1S, sphere1T), sphere1M);

// cube on the ground
const cube2S = Matrix.scaling(0.15, 0.15, 0.15);
const cube2R = Matrix.rotationZ(Math.PI / 8);
const cube2T = Matrix.translation(-1, -0.8, 0);
const cube2 = new Cube(srt(cube2S, cube2R, cube2T), cube2M);

// cube on table
const cube3S = Matrix.scaling(0.15, 0.15, 0.15);
const cube3R = Matrix.rotationY(Math.PI / 4);
const cube3T = Matrix.translation(-0.4, 0.15, 0.25);
const cube3 = new Cube(srt(cube3S, cube3R, cube3T), cube3M);

// cube on top of cube on table
const cube4S = Matrix.scaling(0.1, 0.1, 0.1);
const cube4R = Matrix.rotationX(Math.PI / 4).multiply(Matrix.rotationZ(Math.PI / 3));
const cube4T = Matrix.translation(-0.4, 0.45, 0.25);
const cube4 = new Cube(srt(cube4S, cube4R, cube4T), cube4M);

// floor plane
const floor = new Plane(Matrix.translation(0, -0.99, 0), floorM);

// corner column
const columnSize = 0.2;
const columnS = Matrix.scaling(columnSize, boxHeight, columnSize);
const columnT = Matrix.translation(spacingRight - columnSize, 0, spacingBack - columnSize);
const column = new Cube(srt(columnS, columnT), columnM);

// small rectangle on table
const cube5S = Matrix.scaling(0.04, 0.04, 0.1);
const cube5R = Matrix.rotationY(Math.PI / 6);
const cube5T = Matrix.translation(0.5, 0.04, -1.5);
const cube5 = new Cube(srt(cube5S, cube5R, cube5T), cube2M);

// portrait
const portraitSize = 2;
const portraitS = Matrix.scaling(portraitSize / 2, 0.05, portraitSize / 2);
const portraitR = Matrix.rotationX(Math.PI / 2);
const portraitT = Matrix.translation(0, portraitSize / 2, spacingBack - 0.1);
const portrait = new Cube(srt(portraitS, portraitR, portraitT), portraitM);

// light shining from above and to the left
const light = new PointLight(new Point(-3, 3, -3), new Color(1, 1, 1));

// world
const world = new World([...tableObject, room, mirror, sphere1, cube2, cube3, cube4, cube5, floor, column], light);

// camera
const perspectiveFrom = new Point(roomWallX / 2, roomWallY / 3, roomWallZ / 3);
const frontFrom = new Point(0, 0, roomWallZ); // looking along +Z
const leftFrom = new Point(roomWallX, 0, 0); //  looking along +X
const topFrom = new Point(0, roomWallY, 0); // looking along -Y

const to = new Point(0, 0, 0);
const up = new Vector(0, 1, 0);
const topUp = new Vector(0, 0, 1);

const perspectiveCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(perspectiveFrom, to, up));
const frontCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(frontFrom, to, up));
const leftCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(leftFrom, to, up));
const topCamera = new Camera(imageSize, imageSize, Math.PI / 3, View.transform(topFrom, to, topUp));

if (renderAllCameras) {
    const cameraIds = ['perspective', 'front', 'left', 'top'];
    const ncpus = os.cpus().length;

    if (ncpus < cameraIds.length) {
        throw Error(`Number of cores (${ncpus}) is less than number of cameras (${cameraIds.length})`);
    }

    if (cluster.isMaster) {
        console.log(`[main] (${new Date().toLocaleString()}) Spawning ${cameraIds.length} processes for parallel rendering (${ncpus} cores available)`);

        for (let i = 0; i < cameraIds.length; i++) {
            const worker = cluster.fork();
            worker.send({ cameraId: cameraIds[i], filename: `screenshot_${cameraIds[i]}.ppm` });
        }

        let remainingProcesses = cameraIds.length;
        cluster.on('exit', (worker, code, signal) => {
            remainingProcesses--;
            console.log(`[main] Worker ${worker.process.pid} exited with code ${code} (${remainingProcesses} workers left)`);
            // kill the master
            if (remainingProcesses <= 0) {
                console.log('[main] All workers have finished. Exiting program.');
                process.exit(0);
            }
        });
    } else {
        //worker logic
        process.on('message', message => {
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
    console.log(`[${process.pid}] (${new Date().toLocaleString()}) Done rendering ${cameraId} camera to image ${filename}`);
    process.exit(0);
}
