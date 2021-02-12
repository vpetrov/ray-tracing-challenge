import { Shape, BoundsCube, ObjectArray, Intersection } from './geometry';
import { Matrix } from './tuple';
import { BoundingBox } from './bounds';

export class Group extends Shape {
    constructor(transform, drawBounds) {
        super(undefined, transform);
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
        this.size = 0;
        this.children = [];
        this.cachedBounds = null;
        this.drawBounds = !!drawBounds;
        this.boundsCube = null;
    }

    add(...children) {
        for (const child of children) {
            this.children.push(child);
            child.parent = this;
            this.size++;
        }
        this.cachedBounds = null; //invalidate the bounds because a child has been added
    }

    // searches by reference
    contains(child) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i] === child) {
                return true;
            }

            if (this.children[i] instanceof Group && this.children[i].contains(child)) {
                return true;
            }
        }

        return false;
    }

    localIntersect(localRay) {
        if (!this.aabbIntersect(localRay, this.bounds).length) {
            return [];
        }
        const result = [];
        for (const child of this.children) {
            const xs = child.intersect(localRay);
            if (xs.length) {
                result.push(...xs);
            }
        }

        return result.sort((a, b) => a.t - b.t);
    }

    localNormal() {
        throw new Error(`Group.localNormal() was invoked. This is a bug. See page 200.`);
    }

    get bounds() {
        if (this.cachedBounds) {
            return this.cachedBounds;
        }

        if (!this.children.length) {
            return new BoundingBox();
        }

        const transformedCorners = new ObjectArray();

        for (const child of this.children) {
            const transformedChildCorners = child.bounds.corners.apply((point) => child.transform.multiply(point));
            transformedCorners.append(transformedChildCorners);
        }

        this.cachedBounds = new BoundingBox(transformedCorners.objects);
        this.boundsCube = new BoundsCube(this.cachedBounds, Matrix.identity(4));
        if (this.drawBounds) {
            this.children.push(this.boundsCube);
        }
        return this.cachedBounds;
    }

    aabbIntersect(localRay, aabb) {
        const { min: xtmin, max: xtmax } = this.checkAxis(
            localRay.origin.x,
            localRay.direction.x,
            aabb.minPoint.x,
            aabb.maxPoint.x
        );
        const { min: ytmin, max: ytmax } = this.checkAxis(
            localRay.origin.y,
            localRay.direction.y,
            aabb.minPoint.y,
            aabb.maxPoint.y
        );
        const { min: ztmin, max: ztmax } = this.checkAxis(
            localRay.origin.z,
            localRay.direction.z,
            aabb.minPoint.z,
            aabb.maxPoint.z
        );

        const tmin = Math.max(xtmin, ytmin, ztmin);
        const tmax = Math.min(xtmax, ytmax, ztmax);

        if (tmin > tmax) {
            return [];
        }

        return [new Intersection(tmin, this), new Intersection(tmax, this)];
    }

    checkAxis(originP, directionP, aabb_min, aabb_max) {
        const tmin_numerator = aabb_min - originP;
        const tmax_numerator = aabb_max - originP;

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
