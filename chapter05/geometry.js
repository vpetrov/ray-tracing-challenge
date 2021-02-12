import { Point, Matrix } from './tuple';

export class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }

    equals(that) {
        return that !== null && this.origin.equals(that.origin) && this.direction.equals(that.direction);
    }

    position(t) {
        return this.origin.plus(this.direction.multiply(t));
    }

    intersect(sphere) {
        const ray = this.transform(sphere.transform.inverse());
        const sphere_to_ray = ray.origin.minus(sphere.origin);
        const a = ray.direction.dot(ray.direction);
        const b = 2 * ray.direction.dot(sphere_to_ray);
        const c = sphere_to_ray.dot(sphere_to_ray) - 1;
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return [];
        } else {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

            const i1 = new Intersection(t1, sphere);
            const i2 = new Intersection(t2, sphere);

            return t1 <= t2 ? [i1, i2] : [i2, i1];
        }
    }

    transform(matrix) {
        const newOrigin = matrix.multiply(this.origin);
        const newDirection = matrix.multiply(this.direction);
        return new Ray(newOrigin, newDirection);
    }
}

export class Sphere {
    constructor(origin, radius, transform) {
        this.origin = origin;
        this.radius = radius === undefined ? 0 : radius;
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
    }

    equals(that) {
        return that !== null && this.origin.equals(that.origin) && this.radius === that.radius;
    }
}

export class Intersection {
    constructor(t, object) {
        this.t = t;
        this.object = object;
    }

    equals(that) {
        return that !== null && this.t === that.t && this.object.equals(that.object);
    }

    static hit(intersections) {
        if (!intersections || intersections.length === 0) {
            return null;
        }

        let result = null;

        for (let intersection of intersections) {
            // find lowest non-negative intersection
            if (intersection.t >= 0 && (result === null || intersection.t < result.t)) {
                result = intersection;
            }
        }

        return result;
    }
}
