import { Color, Matrix, Point } from './tuple.mjs';

import SimplexNoise from 'simplex-noise';

export class Pattern {
    constructor(transform) {
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
    }

    shapeColorAt(shape, worldPoint) {
        const shapePoint = shape.localPoint(worldPoint);
        return this.patternColorAt(shapePoint);
    }

    patternColorAt(shapePoint) {
        const patternPoint = this.transform.inverse().multiply(shapePoint);
        return this.colorAt(patternPoint);
    }

    colorAt(point) {
        throw Error(`Class ${this.constructor.name} does not implement required method .colorAt()!`);
    }

    clone() {
        throw Error(`Class ${this.constructor.name} does not implement required method .clone()`);
    }

    equals(that) {
        throw Error(`Class ${this.constructor.name} does not implement required method .equals()`);
    }
}

export class ColorPattern extends Pattern {
    constructor(color, transform) {
        super(transform);
        this.color = color;
    }

    static color(color, point) {
        if (color instanceof Pattern) {
            return color.patternColorAt(point);
        }
        return color;
    }

    colorAt(point) {
        return ColorPattern.color(this.color, point);
    }

    equals(that) {
        return (
            that !== undefined &&
            this.constructor.name === that.constructor.name &&
            this.color.equals(that.color) &&
            this.transform.equals(that.transform)
        );
    }

    clone() {
        return new ColorPattern(this.color, this.transform);
    }
}

export class TwoColorPattern extends ColorPattern {
    constructor(color1, color2, transform) {
        super(color1, transform);
        this.color1 = color1 === undefined ? Color.WHITE : color1;
        this.color2 = color2 === undefined ? Color.BLACK : color2;
    }

    equals(that) {
        return (
            that !== undefined &&
            this.constructor.name === that.constructor.name &&
            this.color1.equals(that.color1) &&
            this.color2.equals(that.color2) &&
            this.transform.equals(that.transform)
        );
    }

    clone() {
        return new TwoColorPattern(this.color1, this.color2, this.transform);
    }
}

export class Stripe extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
    }

    colorAt(point) {
        const c1 = Stripe.color(this.color1, point);
        const c2 = Stripe.color(this.color2, point);

        return Math.floor(point.x) % 2 === 0 ? c1 : c2;
    }

    clone() {
        return new Stripe(this.color1, this.color2, this.transform);
    }
}

export class RingPattern extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
    }

    colorAt(point) {
        const c1 = RingPattern.color(this.color1, point);
        const c2 = RingPattern.color(this.color2, point);
        if (Math.floor(Math.sqrt(point.x * point.x + point.z * point.z)) % 2 === 0) {
            return c1;
        }

        return c2;
    }

    clone() {
        return new RingPattern(this.color1, this.color2, this.transform);
    }
}

export class Checkers extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
    }

    colorAt(point) {
        const x_squared = Math.floor(point.x);
        const y_squared = Math.floor(point.y);
        const z_squared = Math.floor(point.z);

        const c1 = Checkers.color(this.color1, point);
        const c2 = Checkers.color(this.color2, point);

        if ((x_squared + y_squared + z_squared) % 2 === 0) {
            return c1;
        }

        return c2;
    }

    clone() {
        return new Checkers(this.color1, this.color2, this.transform);
    }
}

export class Gradient extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
    }

    colorAt(point) {
        const c1 = Gradient.color(this.color1, point);
        const c2 = Gradient.color(this.color2, point);
        const distance = c2.minus(c1);
        const fraction = point.x - Math.floor(point.x);

        return c1.plus(distance.scale(fraction));
    }

    clone() {
        return new Gradient(this.color1, this.color2, this.transform);
    }
}

export class RadialGradient extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
        this.origin = new Point();
    }

    colorAt(point) {
        const c1 = RadialGradient.color(this.color1, point);
        const c2 = RadialGradient.color(this.color2, point);
        const colorDistance = c2.minus(c1);
        const magnitude = point.minus(this.origin).magnitude();
        const fraction = magnitude - Math.floor(magnitude);
        return c1.plus(colorDistance.scale(fraction));
    }

    clone() {
        return new RadialGradient(this.color1, this.color2, this.transform);
    }
}

export class BlendedPattern extends TwoColorPattern {
    constructor(color1, color2, transform) {
        super(color1, color2, transform);
    }

    colorAt(point) {
        const c1 = BlendedPattern.color(this.color1, point);
        const c2 = BlendedPattern.color(this.color2, point);

        return c1.plus(c2).scale(0.5, 1.0);
    }

    clone() {
        return new BlendedPattern(this.color1, this.color2, this.transform);
    }
}

export class Perturbed extends ColorPattern {
    constructor(color, transform) {
        super(color, transform);
        this.noise = new SimplexNoise();
    }

    shapeColorAt(shape, point) {
        const noiseXYZ = 0.15 * this.noise.noise3D(point.x, point.y, point.z);

        const jitteredPoint = new Point(point.x + noiseXYZ, point.y + noiseXYZ, point.z + noiseXYZ, point.w);
        return super.shapeColorAt(shape, jitteredPoint);
    }

    clone() {
        return new Perturbed(this.color, this.transform);
    }
}

// used in tests
export class TestPattern extends Pattern {
    constructor(transform) {
        super(transform);
    }

    colorAt(point) {
        return new Color(point.x, point.y, point.z, 1.0);
    }

    equals(that) {
        return (
            that !== undefined &&
            this.constructor.name === that.constructor.name &&
            this.transform.equals(that.transform)
        );
    }

    clone() {
        return new TestPattern(this.transform);
    }
}
