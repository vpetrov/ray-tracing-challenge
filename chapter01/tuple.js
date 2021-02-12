import { eqf } from './math';

export class Tuple {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    equals(that) {
        return that != null && eqf(this.x, that.x) && eqf(this.y, that.y) && eqf(this.z, that.z) && eqf(this.w, that.w);
    }

    plus(that) {
        const result = new Tuple(this.x + that.x, this.y + that.y, this.z + that.z, this.w + that.w);
        this.assertW(result, 'plus', this, that);
        return result;
    }

    minus(that) {
        const result = new Tuple(this.x - that.x, this.y - that.y, this.z - that.z, this.w - that.w);
        this.assertW(result, 'minus', this, that);
        return result;
    }

    negate() {
        return new Tuple(-this.x, -this.y, -this.z, -this.w);
    }

    multiply(scalar) {
        return new Tuple(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }

    divide(scalar) {
        return new Tuple(this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar);
    }

    toString() {
        return 'Tuple(' + this.x + ',' + this.y + ',' + this.z + ',' + this.w + ')';
    }

    assertW(result, operation, op1, op2) {
        if (result.w > 1.0 || result.w < 0) {
            throw Error(
                "operation '" +
                    operation +
                    "': invalid W coordinate value " +
                    result.w +
                    '. op1=' +
                    op1.toString() +
                    ' op2=' +
                    op2.toString()
            );
        }
    }
}

export class Point extends Tuple {
    constructor(x, y, z) {
        super(x, y, z, 1.0);
    }

    toString() {
        return 'Point(' + this.x + ',' + this.y + ',' + this.z + ')';
    }
}

export class Vector extends Tuple {
    constructor(x, y, z) {
        super(x, y, z, 0.0);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w); // pythagora
    }

    normalize() {
        const length = this.magnitude();
        if (eqf(length, 0.0)) {
            throw new Error('Vector with zero magnitude cannot be normalized: ' + this.toString());
        }
        return new Vector(this.x / length, this.y / length, this.z / length, this.w / length);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    cross(v) {
        return new Vector(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
    }

    toString() {
        return 'Vector(' + this.x + ',' + this.y + ',' + this.z + ')';
    }
}
