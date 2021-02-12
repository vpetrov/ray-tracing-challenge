import cluster from 'cluster';
import os from 'os';

function render(id) {}

if (cluster.isMaster) {
    console.log('I am the master');

    const workers = [];

    for (let i = 0; i < os.cpus().length; i++) {
        const worker = cluster.fork();
        workers.push(worker);

        worker.on('online', () => console.log('Worker', worker.id, 'is online'));
        worker.on('exit', () => console.log('Worker', worker.id, ' has disconnected'));
        worker.on('message', (message) => console.log('Worker', worker.id, ' says:', message));
    }
} else {
    console.log('I am worker', cluster.worker.id, 'with pid', process.pid);
    process.exit();
}
