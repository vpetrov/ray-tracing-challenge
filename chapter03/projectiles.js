import { Canvas } from './canvas';
import { Point, Vector, Color } from './tuple';
import { eqf } from './math';

class Projectile {
    constructor(position, velocity, color) {
        this.position = position;
        this.velocity = velocity;
        this.color = color;
    }
}

class Environment {
    constructor(gravity, wind) {
        this.gravity = gravity;
        this.wind = wind;
    }
}

class Game {
    constructor(canvas, environment, projectile) {
        this.canvas = canvas;
        this.environment = environment;
        this.projectile = projectile;
    }

    tick() {
        const position = this.projectile.position.plus(this.projectile.velocity);
        const velocity = this.projectile.velocity.plus(this.environment.gravity).plus(this.environment.wind);

        return new Projectile(position, velocity, this.projectile.color);
    }

    run(callback) {
        let timeout;

        const onTick = game => {
            const projectile = game.tick();

            console.log(projectile);

            const x = Math.floor(projectile.position.x);
            const y = Math.floor(canvas.height - projectile.position.y);
            canvas.drawPixel(x, y, projectile.color);

            game.projectile = projectile;

            if (projectile.position.y < 0.0) {
                clearInterval(timeout);
                callback();
            }
        };

        timeout = setInterval(onTick, 100, game);
    }
}

const gravity = new Vector(0, -0.1, 0),
    wind = new Vector(-0.01, 0, 0),
    env = new Environment(gravity, wind),
    projectile_position = new Point(0, 1, 0),
    projectile_velocity = (new Vector(1, 1.8, 0)).normalize().multiply(11.25),
    projectile_color = new Color(0.5, 0.5, 0.5),
    projectile = new Projectile(projectile_position, projectile_velocity, projectile_color),
    canvas = new Canvas(900, 550),
    game = new Game(canvas, env, projectile);

game.run(() => {
    canvas.savePPM("screenshot.png");
    console.log('\nDone');
});
