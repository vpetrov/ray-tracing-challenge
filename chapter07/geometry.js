import { Point, Matrix, Color } from './tuple';
import { Material, PointLight, Phong } from './shading';

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

    intersect(o) {
        if (o instanceof Sphere) {
            return this.intersectSphere(o);
        }

        if (o instanceof World) {
            return this.intersectWorld(o);
        }

        throw Error('Unsupported intersection argument: ' + o);
    }

    intersectSphere(sphere) {
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

    intersectWorld(world) {
        let result = [];

        for (let sphere of world.objects) {
            result.push(...this.intersectSphere(sphere));
        }

        return result.sort((a, b) => a.t - b.t);
    }

    transform(matrix) {
        const newOrigin = matrix.multiply(this.origin);
        const newDirection = matrix.multiply(this.direction);
        return new Ray(newOrigin, newDirection);
    }
}

export class Sphere {
    constructor(origin, radius, transform, material) {
        this.origin = origin === undefined ? new Point(0, 0, 0) : origin;
        this.radius = radius === undefined ? 1 : radius;
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
        this.material = material === undefined ? new Material() : material;
    }

    equals(that) {
        return (
            that !== null &&
            this.origin.equals(that.origin) &&
            this.radius === that.radius &&
            this.transform.equals(that.transform) &&
            this.material.equals(that.material)
        );
    }

    normal(worldPoint) {
        const objectPoint = this.transform.inverse().multiply(worldPoint);
        const objectNormal = objectPoint.minus(new Point(0, 0, 0));
        const worldNormal = this.transform
            .inverse()
            .transpose()
            .multiply(objectNormal);

        return worldNormal.normalize();
    }
}

export class Intersection {
    constructor(t, object) {
        this.t = t;
        this.object = object;
    }

    info(ray) {
        const t = this.t;
        const object = this.object;
        const point = ray.position(this.t);
        const eyev = ray.direction.negate();
        let normalv = object.normal(point);
        let inside = false;

        if (normalv.dot(eyev) < 0) {
            inside = true;
            normalv = normalv.negate();
        }

        return new IntersectionInfo(t, object, point, eyev, normalv, inside);
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

export class IntersectionInfo {
    constructor(t, object, point, eyev, normalv, inside) {
        this.t = t;
        this.object = object;
        this.point = point;
        this.eyev = eyev;
        this.normalv = normalv;
        this.inside = !!inside;
    }
}

export class World {
    constructor(objects, light) {
        this.objects = objects !== undefined ? objects : [];
        this.light = light !== undefined ? light : null;
    }

    colorAt(ray) {
        const intersections = ray.intersect(this);
        if (intersections.length === 0) {
            return new Color(0, 0, 0); // black
        }

        const hit = Intersection.hit(intersections);
        if (!hit) {
            return new Color(0, 0, 0);
        }

        const info = hit.info(ray);

        return Phong.shadeHit(this, info);
    }
}

export class DefaultWorld extends World {
    constructor() {
        super(
            [
                // add a unit sphere with a material
                new Sphere(new Point(), 1.0, undefined, new Material(new Color(0.8, 1.0, 0.6), undefined, 0.7, 0.2)),
                // add a 0.5 radius sphere without a material
                new Sphere(new Point(), 1.0, Matrix.scaling(0.5, 0.5, 0.5))
            ],
            new PointLight(new Point(-10, 10, -10))
        );
    }
}
