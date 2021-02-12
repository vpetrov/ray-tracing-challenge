import { Ray, Sphere, Intersection } from './geometry';
import { Canvas } from './canvas';
import { Point, Color, Vector, Matrix } from './tuple';

const canvas = new Canvas(300, 300);
const color = new Color(1, 0, 0);
const transform = Matrix.rotationZ(Math.PI/4).multiply(Matrix.scaling(0.5, 1, 1));
//const transform = Matrix.shear(1,0,0,0,0,0).multiply(Matrix.scaling(0.5, 1, 1));
const sphere = new Sphere(new Point(0,0,0), 1, transform);

function castRays(canvas, sphere, color, wall_size, wall_z) {
    const ray_origin = new Point(0, 0, -5);
    const half_wall_size = wall_size / 2;
    const pixel_size = wall_size / canvas.width;

    for (let pixel_y = 0; pixel_y < canvas.height; ++pixel_y) {
        const world_y = half_wall_size - pixel_size * pixel_y;

        for (let pixel_x = 0; pixel_x < canvas.width; ++pixel_x) {
            const world_x = -half_wall_size + pixel_size * pixel_x;
            const wall_point = new Point(world_x, world_y, wall_z);

            const ray = new Ray(ray_origin, wall_point.minus(ray_origin).normalize());
            const hit = Intersection.hit(ray.intersect(sphere));
            if (hit) {
                canvas.drawPixel(pixel_x, pixel_y, color);
            }
        }
    }
}

castRays(canvas, sphere, color, 7.0, 10.0);
canvas.savePPM('screenshot.ppm');
