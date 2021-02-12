import cluster from 'cluster';
import os from 'os';
import { View, Camera } from './view.mjs';
import { Canvas } from './canvas.mjs';
import { Stats } from './stats.mjs';
import { Color } from './tuple.mjs';

export class RayTracer {
    constructor(world, cameras, options) {
        this.DEFAULT_IMAGE_SIZE = 300;
        this.DEFAULT_FOV = Math.PI / 3;
        options = options || {};
        this.prefix = options.prefix || 'screenshot_';
        this.progressMs = options.progressMs || 10000; // update once every 10 seconds
        this.world = world;
        this.cameras = this.createCameras(cameras);
        this.canvases = {};
        this.jobs = [];
        this.cameraJobs = {};
        this.completed = [];
        this.nextJob = 0;
        this.renderProgress = {};
        this.workerToJob = {};
        this.completedJobs = 0;
        this.startTime = 0;

        if (cluster.isMaster) {
            cluster.on('exit', this.onWorkerExited.bind(this));
            cluster.on('disconnect', this.onWorkerDisconnected.bind(this));
            cluster.on('message', this.onMessageFromWorker.bind(this));
        } else {
            process.on('message', this.onMessageFromMaster.bind(this));
            process.on('error', this.onError.bind(this));
        }
    }

    onWorkerReady(worker) {
        if (this.nextJob >= this.jobs.length) {
            console.log(`[master] Worker ${worker.id}: no more jobs to run.`);
            worker.send({ type: 'to-the-other-side' });
            return;
        }
        if (this.startTime == 0) {
            this.startTime = Date.now();
        }
        const jobId = this.nextJob++;
        const message = this.jobs[jobId];
        message.jobId = jobId;
        this.workerToJob[worker.id] = jobId;
        worker.send(message);
    }

    onMessageFromWorker(worker, message, handle) {
        switch (message.type) {
            case 'ready-to-work': {
                this.onWorkerReady(worker);
                break;
            }
            case 'job-progress': {
                this.onJobProgress(worker, handle, message);
                break;
            }
            case 'jobs-done': {
                this.onJobComplete(worker, handle, message.jobId, message.result);
                this.completedJobs++;
                if (this.completedJobs >= this.jobs.length) {
                    this.onAllJobsCompleted();
                }
                break;
            }
            default:
                throw new Error(`Unknown message from worker ${worker.id}: ${message.type}`);
        }
    }

    onJobProgress(worker, handle, info) {
        const jobId = this.workerToJob[worker.id];
        const cameraId = this.jobs[jobId].cameraId;
        const camera = this.cameras[cameraId];
        const now = Date.now();
        const progress = this.renderProgress[cameraId];

        if (!progress) {
            this.renderProgress[cameraId] = {
                renderStartTime: now,
                lastUpdate: 0,
                intersections: 0,
                pixels: 0,
                npixels: camera.hsize * camera.vsize,
                showDelayMs: 10000,
            };
            return;
        }

        // add the stats from the current worker to the overall camera progress stats
        progress.intersections += info.intersections;
        progress.pixels += info.progressPixels;
        const totalElapsed = now - progress.renderStartTime;
        progress.pixelsPerMs = progress.pixels / totalElapsed;
        const pixelsPerSecond = Math.floor(progress.pixelsPerMs * 1000);
        progress.eta = new Date((progress.npixels - progress.pixels) / progress.pixelsPerMs);
        progress.percent = Math.floor((progress.pixels / progress.npixels) * 100);
        const intersectionsPerSecond = Math.floor((progress.intersections / totalElapsed) * 1000);

        //console.log(`[worker ${worker.id}] speed: ${info.pixelsPerSecond}`);

        // only update once in a while or when the job is done.
        // progress is called per batch of pixels which depends on how fast the rendering is going
        if (info.totalPixels !== info.renderedPixels && now - progress.lastUpdate < progress.showDelayMs) {
            return;
        }

        progress.lastUpdate = now;

        if (progress.pixels > 0) {
            console.log(
                `[master] ${cameraId} progress: ${progress.percent}% (${progress.pixels}/${
                    progress.npixels
                }) (${pixelsPerSecond} px/s) (${progress.intersections} xs, ${intersectionsPerSecond} xs/s) (ETA: ${this.toETA(progress.eta)})`
            );
        }
    }

    onJobComplete(worker, handle, jobId, result) {
        const job = this.jobs[jobId];
        switch (job.type) {
            case 'render': {
                this.cameraJobs[job.cameraId]--;
                console.log(
                    `[master] [job #${jobId}] image rendered (rows ${job.from} - ${job.to - 1}) (${
                        this.cameraJobs[job.cameraId]
                    } jobs left)`
                );
                const canvas = this.canvases[job.cameraId];
                if (!canvas) {
                    throw new Error(
                        `[master] No canvas found for render job #${jobId} completed by worker ${worker.id}`
                    );
                }
                canvas.blit(result, job.from, job.to);

                if (this.cameraJobs[job.cameraId] <= 0) {
                    canvas.savePPM(job.filename);
                    console.log(`[master] Saved ${job.cameraId} rendering to ${job.filename}`);
                }
                break;
            }
            default:
                throw new Error(`[master] [job #${jobId}] Unknown job type ${job.type}`);
        }

        // no rest for the weary!
        this.onWorkerReady(worker);
    }

    onAllJobsCompleted() {
        console.log(
            `[master] All ${this.completedJobs} jobs completed in ${this.toETA(
                new Date(Date.now() - this.startTime)
            )}.\nHave a nice day!`
        );
        process.exit(0);
    }

    onMessageFromMaster(message) {
        const jobId = message.jobId;
        switch (message.type) {
            case 'render': {
                const cameraId = message.cameraId;
                const from = message.from;
                const to = message.to;

                const image = this.renderCamera(cameraId, from, to);
                process.send({
                    type: 'jobs-done',
                    jobId: jobId,
                    result: image,
                });
                break;
            }
            case 'to-the-other-side': {
                process.exit();
                break;
            }
            default:
                throw new Error(`[worker ${cluster.worker.id}] Unknown message type ${message.type}`);
        }
    }

    onWorkerExited(worker, code, signal) {
        console.log('[master] Worker', worker.id, 'exited');
    }

    onWorkerDisconnected(worker) {
        // nothing to do here at this time
    }

    onError(err) {
        console.log(`[worker ${cluster.worker.id}] ERROR: ${err}`);
    }

    render(cameraIds) {
        if (cluster.isMaster) {
            const self = this;
            // render all cameras if none specified
            if (!cameraIds) {
                cameraIds = Object.keys(this.cameras);
            } else if (typeof cameraIds === 'string') {
                cameraIds = [cameraIds];
            }

            const nworkers = os.cpus().length;
            this.createCanvases(cameraIds);
            this.scheduleJobs(cameraIds, nworkers);

            console.log(
                `[main] (${new Date().toLocaleString()}) Spawning ${nworkers} processes for parallel rendering`
            );
            for (let i = 0; i < nworkers; i++) {
                cluster.fork();
            }
        } else {
            // tell master we're ready
            process.send({ type: 'ready-to-work' });
        }
    }

    createCanvases(cameraIds) {
        for (const cameraId of cameraIds) {
            const camera = this.cameras[cameraId];
            if (!camera) {
                throw new Error('Unknown camera:', cameraId);
            }
            this.canvases[cameraId] = new Canvas(camera.hsize, camera.vsize, Color.RED);
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
            result[cameraId] = new Camera(
                imageSize,
                imageSize,
                fov,
                View.transform(info.from, info.to, info.up),
                this.onProgress.bind(this)
            );
        }
        return result;
    }
    //divide number of rows by ncpus and instantiate one process per cpu to render its block, return the canvas and then send it to the master process for final assembly.
    //compute the aggregate speed in the master process
    renderCamera(cameraId, startRow, endRow) {
        let camera = this.cameras[cameraId];
        if (!camera) {
            throw Error(`[${process.pid}] ERROR: Unknown camera id: ${cameraId}`);
        }
        // record worker start time
        this.renderStartTime = Date.now();
        const worker_id = cluster.worker ? cluster.worker.id : '-1';
        console.log(
            `[worker ${worker_id}] Rendering ${cameraId}`,
            startRow || endRow ? `rows ${startRow} - ${endRow ? endRow - 1 : 'all'}` : ''
        );
        const image = camera.render(this.world, 5, startRow, endRow);
        return image;
    }

    onProgress(progressPixels, renderedPixels, totalPixels, col, row, ncols, nrows) {
        const elapsed = Date.now() - this.renderStartTime;
        const pixelsPerMs = renderedPixels / elapsed;
        const pixelsPerSecond = Math.round(pixelsPerMs * 1000);
        const intersections = Stats.intersections;
        Stats.intersections = 0; // since they get added up per thread, per progress, it's easier to send deltas

        process.send({
            type: 'job-progress',
            intersections: intersections,
            elapsed: elapsed,
            pixelsPerSecond: pixelsPerSecond,
            progressPixels: progressPixels,
            renderedPixels: renderedPixels,
            totalPixels: totalPixels,
            col: col,
            row: row,
            ncols: ncols,
            nrows: nrows,
        });
    }

    scheduleJobs(cameraIds, nworkers) {
        nworkers = nworkers || os.cpus().length;

        for (const cameraId of cameraIds) {
            const camera = this.cameras[cameraId];
            let rowsPerWorker = Math.ceil(camera.vsize / nworkers);
            let from = 0;
            let to = rowsPerWorker;

            while (from < camera.vsize) {
                this.jobs.push({
                    workers: nworkers,
                    type: 'render',
                    filename: `${this.prefix}${cameraId}.ppm`,
                    cameraId: cameraId,
                    from: from,
                    to: to,
                });

                if (!this.cameraJobs[cameraId]) {
                    this.cameraJobs[cameraId] = 1;
                } else {
                    this.cameraJobs[cameraId]++;
                }

                from = to;
                to += rowsPerWorker;
                if (to > camera.vsize) {
                    to = camera.vsize;
                }
            }
        }
    }

    toETA(date) {
        return date.toISOString().substr(11, 8);
    }
}
