import { Point, Vector, Matrix, Color } from './tuple';
import { Material, PointLight, Phong } from './shading';
import { EPSILON } from './math';

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

    transform(matrix) {
        const newOrigin = matrix.multiply(this.origin);
        const newDirection = matrix.multiply(this.direction);
        return new Ray(newOrigin, newDirection);
    }

    // for convenience - actual intersection is implemented by the object
    intersect(o) {
        return o.intersect(this);
    }
}

/** Base class for all shapes (spheres, planes, etc)
 * Don't forget to override .equals() and .localIntersect()
 */
export class Shape {
    /** Default shape is at (0,0,0) with identity transform and default (white) material */
    constructor(origin, transform, material) {
        this.origin = origin === undefined ? new Point(0, 0, 0) : origin;
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
        this.material = material === undefined ? new Material() : material;
    }

    equals(that) {
        return (
            that !== null &&
            this.origin.equals(that.origin) &&
            this.transform.equals(that.transform) &&
            this.material.equals(that.material)
        );
    }

    /** Child classes are expected to override .localIntersect() instead of .intersect() */
    intersect(ray) {
        const localRay = ray.transform(this.transform.inverse());
        return this.localIntersect(localRay);
    }

    // abstract
    localIntersect(ray) {
        this.savedRay = ray; // for testing purposes
        throw Error(`Derived shape (${this.constructor.name}) does not implement required method .localIntersect()!`);
    }

    normal(worldPoint) {
        const localPoint = this.transform.inverse().multiply(worldPoint);
        const localNormal = this.localNormal(localPoint);
        const worldNormal = this.transform
            .inverse()
            .transpose()
            .multiply(localNormal);
        return worldNormal.normalize();
    }

    localNormal(localPoint) {
        this.savedNormal = new Vector(localPoint.x, localPoint.y, localPoint.z); // for testing purposes
        throw Error(`Derived shape (${this.constructor.name}) does not implement required method .locaNormal()!`);
    }
}

export class Sphere extends Shape {
    constructor(origin, radius, transform, material) {
        super(origin, transform, material);
        this.radius = radius === undefined ? 1 : radius;
    }

    equals(that) {
        return super.equals(that) && this.radius === that.radius;
    }

    localNormal(localPoint) {
        return localPoint.minus(new Point(0, 0, 0));
    }

    localIntersect(ray) {
        const sphere_to_ray = ray.origin.minus(this.origin);
        const a = ray.direction.dot(ray.direction);
        const b = 2 * ray.direction.dot(sphere_to_ray);
        const c = sphere_to_ray.dot(sphere_to_ray) - 1;
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return [];
        } else {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

            const i1 = new Intersection(t1, this);
            const i2 = new Intersection(t2, this);

            return t1 <= t2 ? [i1, i2] : [i2, i1];
        }
    }
}

export class Plane extends Shape {
    constructor(transform, material) {
        super(undefined, transform, material);
    }

    localNormal() {
        return new Vector(0, 1, 0);
    }

    localIntersect(localRay) {
        if (Math.abs(localRay.direction.y) < EPSILON) {
            return [];
        }
        
        const t = -localRay.origin.y / localRay.direction.y;
        return [new Intersection(t, this)];
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

        const overPoint = point.plus(normalv.multiply(EPSILON));

        return new IntersectionInfo(t, object, point, eyev, normalv, inside, overPoint);
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
    constructor(t, object, point, eyev, normalv, inside, overPoint) {
        this.t = t;
        this.object = object;
        this.point = point;
        this.eyev = eyev;
        this.normalv = normalv;
        this.inside = !!inside;
        this.overPoint = overPoint;
    }
}

export class World {
    constructor(objects, light) {
        this.objects = objects !== undefined ? objects : [];
        this.light = light !== undefined ? light : null;
    }

    intersect(ray) {
        let result = [];

        for (let shape of this.objects) {
            result.push(...shape.intersect(ray));
        }

        return result.sort((a, b) => a.t - b.t);
    }

    colorAt(ray) {
        const intersections = this.intersect(ray);
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

    isShadowed(point) {
        const distancev = this.light.position.minus(point);
        const distance = distancev.magnitude();

        const ray = new Ray(point, distancev.normalize());
        const intersections = this.intersect(ray);
        const hit = Intersection.hit(intersections);

        return hit && hit.t < distance;
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
