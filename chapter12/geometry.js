import { Point, Vector, Matrix, Color } from './tuple';
import { Material, PointLight, Phong } from './shading';
import { eqf, EPSILON } from './math';

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

export class GlassSphere extends Sphere {
    constructor(origin, radius, transform, material) {
        super(origin, transform, material);

        // change default material to glass
        if (material === undefined) {
            this.material.transparency = 1.0;
            this.material.refractive = 1.5;
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

export class Cube extends Shape {
    constructor(transform, material) {
        super(undefined, transform, material);
    }

    clone() {
        return new Cube(this.transform.clone(), this.material);
    }

    localNormal(localPoint) {
        const absx = Math.abs(localPoint.x);
        const absy = Math.abs(localPoint.y);
        const absz = Math.abs(localPoint.z);

        const maxc = Math.max(absx, absy, absz);

        return maxc === absx
            ? new Vector(localPoint.x, 0, 0)
            : maxc === absy
            ? new Vector(0, localPoint.y, 0)
            : new Vector(0, 0, localPoint.z);
    }

    localIntersect(localRay) {
        const { min: xtmin, max: xtmax } = this.checkAxis(localRay.origin.x, localRay.direction.x);
        const { min: ytmin, max: ytmax } = this.checkAxis(localRay.origin.y, localRay.direction.y);
        const { min: ztmin, max: ztmax } = this.checkAxis(localRay.origin.z, localRay.direction.z);

        const tmin = Math.max(xtmin, ytmin, ztmin);
        const tmax = Math.min(xtmax, ytmax, ztmax);

        if (tmin > tmax) {
            return [];
        }

        return [new Intersection(tmin, this), new Intersection(tmax, this)];
    }

    checkAxis(originP, directionP) {
        const tmin_numerator = -1 - originP;
        const tmax_numerator = 1 - originP;

        let min, max;

        min = tmin_numerator / directionP;
        max = tmax_numerator / directionP;

        if (min > max) {
            // swap
            let temp = min;
            min = max;
            max = temp;
        }

        return { min, max };
    }
}

export class Intersection {
    constructor(t, object) {
        this.t = t;
        this.object = object;
    }

    info(ray, intersections) {
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
        const underPoint = point.minus(normalv.multiply(EPSILON));
        let reflectv = ray.direction.reflect(normalv);

        const { n1, n2 } = this.getN1N2(intersections);

        return new IntersectionInfo(t, object, point, eyev, normalv, inside, overPoint, reflectv, underPoint, n1, n2);
    }

    getN1N2(intersections) {
        let n1, n2;
        const containers = [];

        if (intersections) {
            for (const intersection of intersections) {
                if (this.equals(intersection)) {
                    if (!containers.length) {
                        n1 = 1.0;
                    } else {
                        n1 = containers[containers.length - 1].material.refractive;
                    }
                }

                const intersectionObject = containers.indexOf(intersection.object);
                if (intersectionObject > -1) {
                    containers.splice(intersectionObject, 1);
                } else {
                    containers.push(intersection.object);
                }

                if (this.equals(intersection)) {
                    if (!containers.length) {
                        n2 = 1.0;
                    } else {
                        n2 = containers[containers.length - 1].material.refractive;
                    }

                    break;
                }
            }
        }

        return {
            n1: n1,
            n2: n2
        };
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
    constructor(t, object, point, eyev, normalv, inside, overPoint, reflectv, underPoint, n1, n2) {
        this.t = t;
        this.object = object;
        this.point = point;
        this.eyev = eyev;
        this.normalv = normalv;
        this.inside = !!inside;
        this.overPoint = overPoint;
        this.reflectv = reflectv;
        this.underPoint = underPoint;
        this.n1 = n1; // refraction values
        this.n2 = n2;
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

    colorAt(ray, remaining) {
        const intersections = this.intersect(ray);
        if (intersections.length === 0) {
            return new Color(0, 0, 0); // black
        }

        const hit = Intersection.hit(intersections);
        if (!hit) {
            return new Color(0, 0, 0);
        }

        const info = hit.info(ray, intersections);

        return Phong.shadeHit(this, info, remaining);
    }

    isShadowed(point) {
        const distancev = this.light.position.minus(point);
        const distance = distancev.magnitude();

        const ray = new Ray(point, distancev.normalize());
        const intersections = this.intersect(ray);
        const hit = Intersection.hit(intersections);

        return hit && hit.t < distance;
    }

    reflectedColor(hitInfo, remaining) {
        if ((remaining !== undefined && remaining < 1) || eqf(hitInfo.object.material.reflective, 0.0)) {
            return Color.BLACK;
        }

        const reflectRay = new Ray(hitInfo.overPoint, hitInfo.reflectv);
        const hitColor = this.colorAt(reflectRay, remaining - 1);
        const reflectedColor = hitColor.scale(hitInfo.object.material.reflective, 1.0);

        return reflectedColor;
    }

    refractedColor(hitInfo, remaining) {
        const { sin2_t, direction } = this.getRefractionAngle(hitInfo);
        if (remaining <= 0 || eqf(hitInfo.object.material.transparency, 0) || sin2_t > 1) {
            return Color.BLACK;
        }

        const refractRay = new Ray(hitInfo.underPoint, direction);
        const hitColor = this.colorAt(refractRay, remaining - 1);
        const refractedColor = hitColor.scale(hitInfo.object.material.transparency, 1.0);

        return refractedColor;
    }

    // applies Snell's Law to establish the angle
    getRefractionAngle(hitInfo) {
        // find the ratio of first index of refraction
        const n_ratio = hitInfo.n1 / hitInfo.n2;
        const cos_i = hitInfo.eyev.dot(hitInfo.normalv);
        const sin2_t = n_ratio * n_ratio * (1.0 - cos_i * cos_i); // magic trigonometry spell

        const cos_t = Math.sqrt(1.0 - sin2_t);
        const direction = hitInfo.normalv.multiply(n_ratio * cos_i - cos_t).minus(hitInfo.eyev.multiply(n_ratio));

        return {
            sin2_t: sin2_t,
            direction: direction
        };
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
