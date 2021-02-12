import cluster from 'cluster';
import os from 'os';
import { View, Camera } from './view';
import { Stats } from './stats';

export class RayTracer {
    constructor(world, cameras, filename_prefix) {
        this.DEFAULT_IMAGE_SIZE = 300;
        this.DEFAULT_FOV = Math.PI / 3;
        this.prefix = filename_prefix || 'screenshot_';

        this.world = world;
        this.cameras = this.createCameras(cameras);
    }

    render(cameraIds) {
        const self = this;
        // render all cameras if none specified
        if (!cameraIds) {
            cameraIds = Object.keys(this.cameras);
        } else if (typeof cameraIds === 'string') {
            cameraIds = [cameraIds]; // single camera id
        }

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
                worker.send({ cameraId: cameraIds[i], filename: `${self.prefix}${cameraIds[i]}.ppm` });
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
                self.renderCamera(message.cameraId, message.filename);
            });
        }
    }

    createCameras(cameras) {
        const result = {};
        for (const cameraId in cameras) {
            if (!cameras.hasOwnProperty(cameraId)) {
                continue;
            }
            const info = cameras[cameraId];
            const imageSize = info.size > 0 ? info.size : this.DEFAULT_IMAGE_SIZE;
            const fov = info.fov > 0 ? info.fov : this.DEFAULT_FOV;
            result[cameraId] = new Camera(imageSize, imageSize, fov, View.transform(info.from, info.to, info.up));
        }
        return result;
    }

    renderCamera(cameraId, filename) {
        let camera = this.cameras[cameraId];
        if (!camera) {
            throw Error(`[${process.pid}] ERROR: Unknown camera id: ${cameraId}`);
        }
        filename = filename ? filename : this.prefix + process.pid + '.ppm';

        console.log(`[${process.pid}] Rendering ${cameraId}`);
        const image = camera.render(this.world);
        image.savePPM(filename);
        console.log(
            `[${
                process.pid
            }] (${new Date().toLocaleString()}) Done rendering ${cameraId} camera to image ${filename}\n - Stats:`,
            Stats
        );
        process.exit(0);
    }
}
