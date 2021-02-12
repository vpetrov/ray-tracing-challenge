import { Shape, Cube, Cylinder, Sphere } from './geometry.mjs';
import { Group } from './groups.mjs';
import { BoundingBox } from './bounds.mjs';
import { Matrix, srt } from './tuple.mjs';
import { EPSILON } from './math.mjs';
import { Material } from './shading.mjs';

export const UNION = 'union';
export const INTERSECT = 'intersect';
export const DIFFERENCE = 'difference';

export class CSG extends Shape {
    constructor(operation, left, right) {
        super();
        this.operation = operation;
        this.left = left;
        this.right = right;
        if (left) {
            this.left.parent = this;
        }
        if (right) {
            this.right.parent = this;
        }
    }

    localIntersect(localRay) {
        const xs_left = this.left.intersect(localRay);
        const xs_right = this.right.intersect(localRay);

        const xs = xs_left.concat(xs_right);
        const xs_sorted = xs.sort((a, b) => a.t - b.t);

        return this.filterIntersections(xs_sorted);
    }

    filterIntersections(intersections) {
        const result = [];

        if (!intersections || !intersections.length) {
            return result;
        }

        let in_left = false;
        let in_right = false;

        for (const intersection of intersections) {
            const left_hit = CSG.includes(this.left, intersection.object);

            if (CSG.canIntersect(this.operation, left_hit, in_left, in_right)) {
                result.push(intersection);
            }

            if (left_hit) {
                in_left = !in_left;
            } else {
                in_right = !in_right;
            }
        }

        return result;
    }

    equals(that) {
        return (
            super.equals(that) &&
            this.operation === that.operation &&
            this.left.equals(that.left) &&
            this.right.equals(that.right)
        );
    }

    get bounds() {
        const leftBounds = this.left.bounds;
        const rightBounds = this.right.bounds;

        return new BoundingBox(leftBounds.minPoint, leftBounds.maxPoint, rightBounds.minPoint, rightBounds.maxPoint);
    }

    static includes(a, b) {
        if (!a || !b) {
            return false;
        }

        if (a instanceof Group) {
            return a.contains(b);
        }

        if (a instanceof CSG) {
            return CSG.includes(a.left, b) || CSG.includes(a.right, b);
        }

        return a.equals(b);
    }

    static canIntersect(operation, left_hit, in_left, in_right) {
        switch (operation) {
            case UNION:
                return (left_hit && !in_right) || (!left_hit && !in_left);
            case INTERSECT:
                return (left_hit && in_right) || (!left_hit && in_left);
            case DIFFERENCE:
                return (left_hit && !in_right) || (!left_hit && in_left);
            default:
                throw new Error('Invalid operation: ' + operation);
        }

        return false;
    }

    static combine(...items) {
        if (!items || items.length < 3) {
            throw new Error('Expected at least 2 items');
        }

        // check first argument, must be valid operation
        if ([UNION, INTERSECT, DIFFERENCE].indexOf(items[0]) < 0) {
            throw new Error('Invalid operation: ' + items[0]);
        }

        let result = new CSG(items[0], items[1], items[2]);

        for (let i = 3; i < items.length; i++) {
            result = new CSG(items[0], result, items[i]);
        }

        return result;
    }
}

export class Dice extends CSG {
    constructor(cornerRadius, transform, material, bubbleMaterial) {
        super();
        this.cornerRadius = cornerRadius || 0.1;
        this.transform = transform || Matrix.identity(4);
        this.material = material || new Material();
        this.bubbleSize = 0.15;
        this.bubbleMaterial = bubbleMaterial || new Material();
        this.create();
        this.left.parent = this;
        this.right.parent = this;
    }

    create() {
        const cube = new Cube(undefined, this.material);
        const CVS = Matrix.scaling(this.cornerRadius, 1.01, this.cornerRadius); // vertical thin cube
        const CHS = Matrix.scaling(1.01, this.cornerRadius, this.cornerRadius); // horizontal thin cube
        const CSS = Matrix.scaling(this.cornerRadius, this.cornerRadius, 1.01); // side thin cube
        const CM = this.material;

        let left = -1 - EPSILON + this.cornerRadius;
        let right = 1 + EPSILON - this.cornerRadius;
        let front = -1 - EPSILON + this.cornerRadius;
        let back = 1 + EPSILON - this.cornerRadius;
        let top = 1 + EPSILON - this.cornerRadius;
        let bot = -1 - EPSILON + this.cornerRadius;

        // front
        const vflCorner = new Cube(srt(CVS, Matrix.translation(left, 0, front)), CM);
        const vfrCorner = new Cube(srt(CVS, Matrix.translation(right, 0, front)), CM);
        const hftCorner = new Cube(srt(CHS, Matrix.translation(0, top, front)), CM);
        const hfbCorner = new Cube(srt(CHS, Matrix.translation(0, bot, front)), CM);

        // back
        const vblCorner = new Cube(srt(CVS, Matrix.translation(left, 0, back)), CM);
        const vbrCorner = new Cube(srt(CVS, Matrix.translation(right, 0, back)), CM);
        const hbtCorner = new Cube(srt(CHS, Matrix.translation(0, top, back)), CM);
        const hbbCorner = new Cube(srt(CHS, Matrix.translation(0, bot, back)), CM);

        // sides
        const hsltCorner = new Cube(srt(CSS, Matrix.translation(left, top, 0)), CM);
        const hslbCorner = new Cube(srt(CSS, Matrix.translation(left, bot, 0)), CM);
        const hsrtCorner = new Cube(srt(CSS, Matrix.translation(right, top, 0)), CM);
        const hsrbCorner = new Cube(srt(CSS, Matrix.translation(right, bot, 0)), CM);

        const corners = CSG.combine(
            UNION,
            vflCorner,
            vfrCorner,
            hftCorner,
            hfbCorner,
            vblCorner,
            vbrCorner,
            hbtCorner,
            hbbCorner,
            hsltCorner,
            hslbCorner,
            hsrtCorner,
            hsrbCorner
        );
        const csgEmptyCorners = new CSG(DIFFERENCE, cube, corners);

        // -- CYLINDERS --
        const cr2 = this.cornerRadius * 2;
        const m = -1 + cr2; // cylinder min
        const n = 1 - cr2; // cylinder max
        const CYS = Matrix.scaling(cr2, 1, cr2);
        const MXT = Matrix.translation;
        const CYHR = Matrix.rotationZ(Math.PI / 2);
        const CYSR = Matrix.rotationX(Math.PI / 2);
        left = -1 + cr2;
        right = 1 - cr2;
        front = -1 + cr2;
        back = 1 - cr2;
        top = 1 - cr2;
        bot = -1 + cr2;
        // front
        const vflCyl = new Cylinder(m, n, true, srt(CYS, MXT(left, 0, front)), CM);
        const vfrCyl = new Cylinder(m, n, true, srt(CYS, MXT(right, 0, front)), CM);
        const hftCyl = new Cylinder(m, n, true, srt(CYS, CYHR, MXT(0, top, front)), CM);
        const hfbCyl = new Cylinder(m, n, true, srt(CYS, CYHR, MXT(0, bot, front)), CM);

        // back
        const vblCyl = new Cylinder(m, n, true, srt(CYS, MXT(left, 0, back)), CM);
        const vbrCyl = new Cylinder(m, n, true, srt(CYS, MXT(right, 0, back)), CM);
        const hbtCyl = new Cylinder(m, n, true, srt(CYS, CYHR, MXT(0, top, back)), CM);
        const hbbCyl = new Cylinder(m, n, true, srt(CYS, CYHR, MXT(0, bot, back)), CM);

        // sides
        const hsltCyl = new Cylinder(m, n, true, srt(CYS, CYSR, MXT(left, top, 0)), CM);
        const hslbCyl = new Cylinder(m, n, true, srt(CYS, CYSR, MXT(left, bot, 0)), CM);
        const hsrtCyl = new Cylinder(m, n, true, srt(CYS, CYSR, MXT(right, top, 0)), CM);
        const hsrbCyl = new Cylinder(m, n, true, srt(CYS, CYSR, MXT(right, bot, 0)), CM);

        const csgCylinders = CSG.combine(
            UNION,
            vflCyl,
            vfrCyl,
            hftCyl,
            hfbCyl,
            vblCyl,
            vbrCyl,
            hbtCyl,
            hbbCyl,
            hsltCyl,
            hslbCyl,
            hsrtCyl,
            hsrbCyl
        );

        const SS = Matrix.scaling(cr2, cr2, cr2);
        const ftlSphere = new Sphere(undefined, undefined, srt(SS, MXT(left, top, front)), CM);
        const ftrSphere = new Sphere(undefined, undefined, srt(SS, MXT(right, top, front)), CM);
        const fblSphere = new Sphere(undefined, undefined, srt(SS, MXT(left, bot, front)), CM);
        const fbrSphere = new Sphere(undefined, undefined, srt(SS, MXT(right, bot, front)), CM);

        const btlSphere = new Sphere(undefined, undefined, srt(SS, MXT(left, top, back)), CM);
        const btrSphere = new Sphere(undefined, undefined, srt(SS, MXT(right, top, back)), CM);
        const bblSphere = new Sphere(undefined, undefined, srt(SS, MXT(left, bot, back)), CM);
        const bbrSphere = new Sphere(undefined, undefined, srt(SS, MXT(right, bot, back)), CM);

        const csgCornerSpheres = CSG.combine(
            UNION,
            ftlSphere,
            ftrSphere,
            fblSphere,
            fbrSphere,
            btlSphere,
            btrSphere,
            bblSphere,
            bbrSphere
        );

        const br = this.bubbleSize;
        const P = 0.5;
        const BTBS = Matrix.scaling(br, br / 2, br);
        const BFBS = Matrix.scaling(br, br, br / 2);
        const BSS = Matrix.scaling(br / 2, br, br);
        const BM = this.bubbleMaterial;

        // 1
        const bubble1 = new Sphere(undefined, undefined, srt(BSS, MXT(-1, 0, 0)), BM);

        // 2
        const bubble21 = new Sphere(undefined, undefined, srt(BFBS, MXT(-P, P, 1)), BM);
        const bubble22 = new Sphere(undefined, undefined, srt(BFBS, MXT(P, -P, 1)), BM);

        // 3
        const bubble31 = new Sphere(undefined, undefined, srt(BFBS, MXT(-P, P, -1)), BM);
        const bubble32 = new Sphere(undefined, undefined, srt(BFBS, MXT(0, 0, -1)), BM);
        const bubble33 = new Sphere(undefined, undefined, srt(BFBS, MXT(P, -P, -1)), BM);

        // 4
        const bubble41 = new Sphere(undefined, undefined, srt(BTBS, MXT(-P, -1, -P)), BM);
        const bubble42 = new Sphere(undefined, undefined, srt(BTBS, MXT(-P, -1, P)), BM);
        const bubble43 = new Sphere(undefined, undefined, srt(BTBS, MXT(P, -1, -P)), BM);
        const bubble44 = new Sphere(undefined, undefined, srt(BTBS, MXT(P, -1, P)), BM);

        // 5
        const bubble51 = new Sphere(undefined, undefined, srt(BTBS, MXT(-P, 1, -P)), BM);
        const bubble52 = new Sphere(undefined, undefined, srt(BTBS, MXT(-P, 1, P)), BM);
        const bubble53 = new Sphere(undefined, undefined, srt(BTBS, MXT(P, 1, -P)), BM);
        const bubble54 = new Sphere(undefined, undefined, srt(BTBS, MXT(P, 1, P)), BM);
        const bubble55 = new Sphere(undefined, undefined, srt(BTBS, MXT(0, 1, 0)), BM);

        // 6
        const bubble61 = new Sphere(undefined, undefined, srt(BSS, MXT(1, -P, -P)), BM);
        const bubble62 = new Sphere(undefined, undefined, srt(BSS, MXT(1, -P, P)), BM);
        const bubble63 = new Sphere(undefined, undefined, srt(BSS, MXT(1, P, -P)), BM);
        const bubble64 = new Sphere(undefined, undefined, srt(BSS, MXT(1, P, P)), BM);
        const bubble65 = new Sphere(undefined, undefined, srt(BSS, MXT(1, P, 0)), BM);
        const bubble66 = new Sphere(undefined, undefined, srt(BSS, MXT(1, -P, 0)), BM);

        const csgBubbles = CSG.combine(
            UNION,
            bubble1,
            bubble21,
            bubble22,
            bubble31,
            bubble32,
            bubble33,
            bubble41,
            bubble42,
            bubble43,
            bubble44,
            bubble51,
            bubble52,
            bubble53,
            bubble54,
            bubble55,
            bubble61,
            bubble62,
            bubble63,
            bubble64,
            bubble65,
            bubble66
        );

        this.operation = DIFFERENCE;
        this.left = CSG.combine(UNION, csgEmptyCorners, csgCylinders, csgCornerSpheres);
        this.right = csgBubbles;
    }
}
