import { Shape, BoundsCube, ObjectArray, Intersection } from './geometry.mjs';
import { Matrix } from './tuple.mjs';
import { BoundingBox } from './bounds.mjs';

let groupId = 1;

export class Group extends Shape {
    constructor(id, transform, drawBounds) {
        super(undefined, transform, null);
        this.id = id === undefined ? 'Group ' + groupId++ : id;
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
        this.size = 0;
        this.children = [];
        this.cachedBounds = null;
        this.drawBounds = !!drawBounds;
        this.boundsCube = null;
    }

    set material(value) {
        super.material = value;

        // update child material
        if (value) {
            for (const child of this.children) {
                child.material = value;
            }
        }
    }

    add(...children) {
        for (const child of children) {
            this.children.push(child);
            child.parent = this;
            if (this.material) {
                child.material = this.material;
            }
            this.size++;
        }
        this.cachedBounds = null; //invalidate the bounds because a child has been added
    }

    /**
     * Find child by numeric index or by id
     * @returns the child if found, null otherwise
     */
    child(arg) {
        if (typeof arg === 'number') {
            return this.childAt(arg);
        }

        return this.childById(arg);
    }

    // returns the child at the specified index
    childAt(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(`Invalid group child index: ${index}`);
        }

        return this.children[index];
    }

    // returns the child with the specified id or null
    // searches recursively in all child groups (BFS)
    childById(id) {
        const groupsToSearch = [this];

        while (groupsToSearch.length > 0) {
            const currentGroup = groupsToSearch.shift();
            for (const child of currentGroup.children) {
                if (child.id && child.id === id) {
                    return child;
                }

                if (child instanceof Group) {
                    groupsToSearch.push(child);
                }
            }
        }

        return null;
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

    forEach(f) {
        for (let i = 0; i < this.children.length; i++) {
            f(this.children[i], i);
        }
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
            const childBounds = child.bounds;
            if (!childBounds) {
                continue;
            }
            const transformedChildCorners = childBounds.corners.apply((point) => child.transform.multiply(point));
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

    equals(that) {
        if (
            !(
                that !== null &&
                this.origin.equals(that.origin) &&
                this.transform.equals(that.transform) &&
                this.material === that.material &&
                (this.material ? this.material.equals(that.material) : true)
            )
        ) {
            return false;
        }

        // check number of children
        if (this.children.length != that.children.length) {
            return false;
        }

        // check all children for equality, including subgroups
        // this could get expensive
        for (let i = 0; i < this.children.length; i++) {
            if (!this.children[i].equals(that.children[i])) {
                return false;
            }
        }

        return true;
    }

    clone() {
        const result = new Group(null, this.transform.clone(), this.drawBounds);
        result.material = this.material ? this.material.clone() : null;
        for (const child of this.children) {
            result.add(child.clone());
        }
        return result;
    }
}
