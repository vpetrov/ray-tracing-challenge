import { Point } from './tuple';
import { ObjectArray } from './geometry';

export class BoundingBox {
    constructor(...points) {
        // if nothing was passed, use the origin
        // if an array was passed, use the array
        // if a list of points was passed, use the list
        points = !points.length ? [new Point()] : Array.isArray(points[0]) ? points[0] : points;

        this.minPoint = this.getMin(points);
        this.maxPoint = this.getMax(points);
        this.cachedCorners = null;
    }

    getMin(points) {
        const x_coords = this.extractCoords(points, 'x');
        const y_coords = this.extractCoords(points, 'y');
        const z_coords = this.extractCoords(points, 'z');

        return new Point(Math.min(...x_coords), Math.min(...y_coords), Math.min(...z_coords));
    }

    getMax(points) {
        const x_coords = this.extractCoords(points, 'x');
        const y_coords = this.extractCoords(points, 'y');
        const z_coords = this.extractCoords(points, 'z');

        return new Point(Math.max(...x_coords), Math.max(...y_coords), Math.max(...z_coords));
    }

    // builds a list of values and calls Math.min() on them
    extractCoords(points, axis) {
        let values = [];
        for (let coord of points) {
            values.push(coord[axis]);
        }
        return values;
    }

    equals(that) {
        return !!that && this.minPoint.equals(that.minPoint) && this.maxPoint.equals(that.maxPoint);
    }

    clone() {
        return new BoundingBox(this.minPoint, this.maxPoint);
    }

    get corners() {
        if (!this.cachedCorners) {
            this.cachedCorners = new ObjectArray([
                // left bottom front
                new Point(this.minPoint.x, this.minPoint.y, this.minPoint.z),
                // left top front
                new Point(this.minPoint.x, this.maxPoint.y, this.minPoint.z),
                // right top front
                new Point(this.maxPoint.x, this.maxPoint.y, this.minPoint.z),
                // right bottom front
                new Point(this.maxPoint.x, this.minPoint.y, this.minPoint.z),

                // left bottom back
                new Point(this.minPoint.x, this.minPoint.y, this.maxPoint.z),
                // left top back
                new Point(this.minPoint.x, this.maxPoint.y, this.maxPoint.z),
                // right top back
                new Point(this.maxPoint.x, this.maxPoint.y, this.maxPoint.z),
                // right bottom back
                new Point(this.maxPoint.x, this.minPoint.y, this.maxPoint.z),
            ]);
        }

        return this.cachedCorners;
    }
}
