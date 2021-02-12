import { Color, Matrix, Point } from './tuple';

import SimplexNoise from 'simplex-noise';

export class Pattern {
    constructor(transform) {
        this.transform = transform === undefined ? Matrix.identity(4) : transform;
    }

    shapeColorAt(shape, worldPoint) {
        const shapePoint = shape.transform
            .transpose()
            .inverse()
            .multiply(worldPoint);

        return this.patternColorAt(shapePoint);
    }

    patternColorAt(shapePoint) {
        const patternPoint = this.transform.inverse().multiply(shapePoint);
        return this.colorAt(patternPoint);
    }

    colorAt(point) {
        throw Error(`Class ${this.constructor.name} does not implement required method .colorAt()!`);
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
}

export class TwoColorPattern extends ColorPattern {
    constructor(color1, color2, transform) {
        super(color1, transform);
        this.color1 = color1 === undefined ? Color.WHITE : color1;
        this.color2 = color2 === undefined ? Color.BLACK : color2;
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
}

export class Perturbed extends ColorPattern {
    constructor(color, transform) {
        super(color, transform);
        //this.size = 1000 * 1000;
        // this.noise = perlin.generatePerlinNoise(1000, 1000);
        // this.ix = 0;
        // this.iy = 0;
        // this.iz = 0;

        this.noise = new SimplexNoise();
    }

    shapeColorAt(shape, point) {
        const noiseXYZ = 0.15 * this.noise.noise3D(point.x, point.y, point.z);

        const jitteredPoint = new Point(point.x + noiseXYZ, point.y + noiseXYZ, point.z + noiseXYZ, point.w);
        return super.shapeColorAt(shape, jitteredPoint);
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
}
