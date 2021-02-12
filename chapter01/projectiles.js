import { Point, Vector } from './tuple';
import { eqf } from './math';

class Projectile {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }
}

class Environment {
    constructor(gravity, wind) {
        this.gravity = gravity;
        this.wind = wind;
    }
}

class Game {
    constructor(environment, projectile) {
        this.environment = environment;
        this.projectile = projectile;
    }

    tick() {
        const position = this.projectile.position.plus(this.projectile.velocity);
        const velocity = this.projectile.velocity.plus(this.environment.gravity).plus(this.environment.wind);

        return new Projectile(position, velocity);
    }

    run(callback) {
        let timeout;

        const onTick = game => {
            const projectile = game.tick();

            console.log(projectile);

            game.projectile = projectile;

            if (projectile.position.y < 0.0) {
                clearInterval(timeout);
            }
        };

        timeout = setInterval(onTick, 1000, game);
    }
}

const gravity = new Vector(0, -0.1, 0),
    wind = new Vector(-0.01, 0, 0),
    env = new Environment(gravity, wind),
    projectile_position = new Point(0, 1, 0),
    projectile_velocity = new Vector(1, 1, 0),
    projectile = new Projectile(projectile_position, projectile_velocity),
    game = new Game(env, projectile);

game.run(() => {
    console.log('\nDone');
});
