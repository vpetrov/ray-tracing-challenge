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

    multiply(v) {
        return v instanceof Tuple ? this.multiplyTuple(v) : this.scale(v);
    }

    scale(v) {
        return new Tuple(this.x * v, this.y * v, this.z * v, this.w * v);
    }

    multiplyTuple(v) {
        return new Tuple(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
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

    clone() {
        return new Tuple(this.x, this.y, this.z, this.w);
    }
}

export class Point extends Tuple {
    constructor(x, y, z) {
        super(x, y, z, 1.0);
    }

    toString() {
        return 'Point(' + this.x + ',' + this.y + ',' + this.z + ')';
    }

    clone() {
        return new Point(this.x, this.y, this.z);
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

    clone() {
        return new Vector(this.x, this.y, this.z);
    }
}

export class Color extends Tuple {
    constructor(red, green, blue, alpha) {
        super(red, green, blue, alpha === undefined ? 1.0 : alpha);
    }

    get red() {
        return this.x;
    }

    set red(c) {
        this.x = c;
    }

    get green() {
        return this.y;
    }

    set green(c) {
        this.y = c;
    }

    get blue() {
        return this.z;
    }

    set blue(c) {
        this.z = c;
    }

    get alpha() {
        return this.w;
    }

    set alpha(c) {
        this.w = c;
    }

    scale(v) {
        return new Color(this.red * v, this.green * v, this.blue * v, this.alpha * v);
    } 

    to255() {
        return this.scale(255).clamp(0, 255);
    }

    clamp(lo, hi) {
        const red = this.red < lo ? lo : this.red > hi ? hi : Math.ceil(this.red);
        const green = this.green < lo ? lo : this.green > hi ? hi : Math.ceil(this.green);
        const blue = this.blue < lo ? lo : this.blue > hi ? hi : Math.ceil(this.blue);
        const alpha = this.alpha < lo ? lo : this.alpha > hi ? hi : Math.ceil(this.alpha);

        return new Color(red, green, blue, alpha);
    }


    assertW() {
        return true;
    }

    toString() {
        return `Color(${this.red},${this.green},${this.blue},${this.alpha})`;
    }

    clone() {
        return new Color(this.red, this.green, this.blue, this.alpha);
    }
}
