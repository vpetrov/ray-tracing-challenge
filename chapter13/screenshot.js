import cluster from 'cluster';
import os from 'os';
import { View, Camera } from './view';
import { Point, Color, Vector, Matrix, srt } from './tuple';
import { Plane, Sphere, Cube, Cylinder, Cone, World } from './geometry';
import { PointLight, Material } from './shading';

// args
const imageSize = process.argv.length > 2 ? parseInt(process.argv[2]) : 300;
const renderAllCameras = process.argv.length > 3 && process.argv[3] === 'all';

/* axes */

const axisRadius = 0.05;
const axisLength = 3;
const axisT = Matrix.translation(0, 0, 0);
const axisS = Matrix.scaling(axisRadius, 1, axisRadius);

// x
const axisXR = Matrix.rotationZ(-Math.PI / 2);
const axisX = new Cylinder(-axisLength / 2, axisLength / 2, true, srt(axisS, axisXR, axisT), new Material(Color.RED));

// y
const axisYR = Matrix.identity(4);
const axisY = new Cylinder(-axisLength / 2, axisLength / 2, true, srt(axisS, axisYR, axisT), new Material(Color.GREEN));

// z
const axisZR = Matrix.rotationX(Math.PI / 2);
const axisZ = new Cylinder(-axisLength / 2, axisLength / 2, true, srt(axisS, axisZR, axisT), new Material(Color.BLUE));

/* arrows */
const arrowRadius = 0.3;
const arrowLength = 0.5;
const arrowS = Matrix.scaling(arrowRadius, 1, arrowRadius);

// x arrow
const arrowXR = Matrix.rotationZ(-Math.PI / 2);
const arrowXT = Matrix.translation(axisLength / 2 + arrowLength, 0, 0);
const arrowX = new Cone(-arrowLength, 0, true, srt(arrowS, arrowXR, arrowXT), axisX.material);

// y arrow
const arrowYT = Matrix.translation(0, axisLength / 2 + arrowLength, 0);
const arrowY = new Cone(-arrowLength, 0, true, srt(arrowS, arrowYT), axisY.material);

// z arrow
const arrowZR = Matrix.rotationX(Math.PI / 2);
const arrowZT = Matrix.translation(0, 0, axisLength / 2 + arrowLength);
const arrowZ = new Cone(-arrowLength, 0, true, srt(arrowS, arrowZR, arrowZT), axisZ.material);

// light shining from above and to the left
const light = new PointLight(new Point(-3, 3, -3), new Color(1, 1, 1));

// world
const world = new World([axisX, axisY, axisZ, arrowX, arrowY, arrowZ], light);

// camera
const corner = new Point(-2, 2, -2);
const perspectiveFrom = corner;
const frontFrom = new Point(0, 0, corner.z); // looking along +Z
const leftFrom = new Point(corner.x, 0, 0); //  looking along +X
const topFrom = new Point(0, corner.y, 0); // looking along -Y

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
    console.log(
        `[${process.pid}] (${new Date().toLocaleString()}) Done rendering ${cameraId} camera to image ${filename}`
    );
    process.exit(0);
}
