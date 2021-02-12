import { Ray } from './geometry';
import { Matrix, Point } from './tuple';
import { Canvas } from './canvas';

export class View {
    /**
     * Returns a Matrix representing a view transformation (moves the world away from the camera)
     */
    static transform(from, to, up) {
        const forward = to.minus(from).normalize();
        const left = forward.cross(up.normalize());
        const true_up = left.cross(forward);

        this.from = from;
        this.to = to;
        this.up = up;

        // magic
        const orientation = new Matrix([
            [left.x, left.y, left.z, 0],
            [true_up.x, true_up.y, true_up.z, 0],
            [-forward.x, -forward.y, -forward.z, 0],
            [0, 0, 0, 1]
        ]);

        return orientation.multiply(Matrix.translation(-from.x, -from.y, -from.z));
    }
}

export class Camera {
    // angle in radians
    constructor(hsize, vsize, fovAngle, transform) {
        this.hsize = hsize;
        this.vsize = vsize;
        this.fovAngle = fovAngle;
        this.transform = transform === undefined ? Matrix.identity(4) : transform;

        const halfView = Math.tan(fovAngle / 2.0); //rads
        const aspect = hsize / vsize;

        this.halfWidth = halfView;
        this.halfHeight = this.halfWidth / aspect;

        if (aspect < 1) {
            this.halfHeight = halfView;
            this.halfWidth = this.halfHeight * aspect;
            
        }

        this.pixelSize = (this.halfWidth * 2) / hsize;
    }

    rayAt(x, y) {
        // the offset from the edge of the canvas to the pixel's center
        // this converts the center of the pixel into a point in the world
        // expressed as an offset from the left side of the camera canvas in the world.
        const offsetX = (x + 0.5) * this.pixelSize;
        const offsetY = (y + 0.5) * this.pixelSize;

        // the untransformed coordinates of the pixel in world space (the point on the canvas in the world)
        // (remember that the camera looks toward -z, so +x is to the left)
        // halfWidth ends up being the left most edge on the positive side of the X axis so subtracting offsetX from it
        // will subtract the position from the left edge of the triangle and move the point to the right (towards -X)
        // so it just magically works out.
        // the result is a real coordinate (X, Y) of the point in the world, 
        // and since we know that the camera canvas's Z coordinate is -1 (in world units), 
        // we now know the X,Y,Z coordinate of the point in the world where the ray is supposed to pass through (untransformed yet)
        const worldX = this.halfWidth - offsetX;
        const worldY = this.halfHeight - offsetY;

        // using the camera matrix, transform the canvas point and the origin,
        // and then compute the ray's direction vector
        // (remember that the canvas is at z = -1)
        const point = this.transform.inverse().multiply(new Point(worldX, worldY, -1));
        const origin = this.transform.inverse().multiply(new Point(0,0,0));

        // after we transformed the origin and the point using the camera's transform (effectively pushing them away from the world origin)
        // we compute a vector going from the transformed origin to the transformed point on the canvas in the camera's coordinate system
        // and we normalize that vector.
        const direction = point.minus(origin).normalize();


        // the ray is then a vector that starts at the transformed origin going into the computed unit direction
        return new Ray(origin, direction);
    }

    render(world) {
        const image  = new Canvas(this.hsize, this.vsize);

        for (let y = 0; y < this.vsize; y++) {
            for (let x = 0; x < this.hsize; x++) {
                const ray = this.rayAt(x, y);
                const color = world.colorAt(ray);
                if (!image.drawPixel(x, y, color)) {
                    throw Error(`Failed to draw pixel at ${x}, ${y} with color ${color}`);
                }
            }
        }

        return image;
    }
}
