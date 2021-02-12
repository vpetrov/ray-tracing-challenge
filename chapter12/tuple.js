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

    toArray() {
        let values = [this.x, this.y, this.z, this.w];
        let result = [];

        for (let v of values) {
            if (v === undefined || v === null) {
                break;
            }

            result.push(v);
        }

        return result;
    }

    at(index) {
        if (index < 0 || index >= 4) {
            return null;
        }
        return this.toArray()[index];
    }

    sum() {
        return (
            (this.x === undefined ? 0 : this.x) +
            (this.y === undefined ? 0 : this.y) +
            (this.z === undefined ? 0 : this.z) +
            (this.w === undefined ? 0 : this.w)
        );
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
        x = x === undefined ? 0 : x;
        y = y === undefined ? 0 : y;
        z = z === undefined ? 0 : z;
        super(x, y, z, 1.0);
    }

    toString() {
        return 'Point(' + this.x + ',' + this.y + ',' + this.z + ')';
    }

    clone() {
        return new Point(this.x, this.y, this.z);
    }

    invokeTupleFunction(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error(`super.${name} is not a function. args=${args}`);
        }

        const result = fn.apply(this, args);
        return new Point(result.x, result.y, result.z);
    }

    plus(that) {
        const result = super.plus(that);
        if (result.w === 1.0) {
            return new Point(result.x, result.y, result.z);
        } else {
            return new Vector(result.x, result.y, result.z);
        }
    }

    minus(that) {
        const result = super.minus(that);
        if (result.w === 1.0) {
            return new Point(result.x, result.y, result.z);
        } else {
            return new Vector(result.x, result.y, result.z);
        }
    }

    negate() {
        return this.invokeTupleFunction(super.negate);
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

    reflect(normal) {
        const dot = this.dot(normal);
        return this.minus(normal.multiply(2 * dot));
    }

    minus(that) {
        const result = super.minus(that);
        return new Vector(result.x, result.y, result.z);
    }

    negate() {
        const result = super.negate();
        return new Vector(result.x, result.y, result.z);
    }

    multiply(scalar) {
        const result = super.multiply(scalar);
        return new Vector(result.x, result.y, result.z);
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

    static get BLACK() {
        return BLACK;
    }

    static get WHITE() {
        return WHITE;
    }

    static get RED() {
        return RED;
    }

    static get GREEN() {
        return GREEN;
    }

    static get BLUE() {
        return BLUE;
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

    scale(v, alpha) {
        return new Color(this.red * v, this.green * v, this.blue * v, alpha === undefined ? this.alpha * v : alpha);
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

    plus(that, alpha) {
        const result = super.plus(that);
        return new Color(result.x, result.y, result.z, alpha === undefined ? result.w : alpha);
    }

    multiply(v, alpha) {
        const result = super.multiply(v);
        return new Color(result.x, result.y, result.z, alpha === undefined ? result.w : alpha);
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

const BLACK = new Color(0, 0, 0);
const WHITE = new Color(1, 1, 1);
const RED = new Color(1, 0, 0);
const GREEN = new Color(0, 1, 0);
const BLUE = new Color(0, 0, 1);

export class Matrix {
    constructor(seed) {
        this.cells = [];
        this.size = 0;
        // clone?
        if (seed instanceof Matrix) {
            this.size = seed.size;
            this.cells = this.fromArrays(seed.cells);
        } else {
            for (let arg of seed) {
                if (!arg) {
                    throw new Error(`Invalid Matrix constructor argument: ${arg}`);
                }
                ++this.size;
            }

            if (!this.size || this.size > 4) {
                throw new Error(`Invalid matrix size: ${this.size}`);
            }

            if (Array.isArray(seed[0])) {
                this.cells = this.fromArrays(seed);
            } else {
                this.cells = this.fromVectors(seed);
            }
        }
    }

    fromVectors(vectors) {
        let result = [];

        for (let row = 0; row < this.size; ++row) {
            let rowcells = [];
            for (let col = 0; col < this.size; ++col) {
                let value = vectors[col].at(row);
                if (value === null) {
                    throw new Error(`Invalid value at index ${row} in ${vectors[col].toString()}`);
                }

                rowcells.push(value);
            }
            result.push(rowcells);
        }

        return result;
    }

    // each array is a row (i.e. horizontal specification)
    fromArrays(arrays) {
        let result = [];
        for (let a of arrays) {
            if (a.length !== this.size) {
                throw new Error(`Array size (${a.length}) does not match matrix size (${this.size}): ${a}`);
            }
            result.push(a);
        }
        return result;
    }

    // returns a Tuple
    row(index) {
        return new Tuple(...this.cells[index]);
    }

    // returns a Tuple
    column(index) {
        if (index < 0 || index >= this.size) {
            throw new Error(`Invalid column index ${index}`);
        }
        let result = [];
        for (let row = 0; row < this.size; ++row) {
            result.push(this.cells[row][index]);
        }
        return new Tuple(...result);
    }

    at(row, col) {
        return this.cells[row][col];
    }

    set(row, col, value) {
        this.cells[row][col] = value;
    }

    equals(that) {
        if (that == null || this.size != that.size || !that.cells || that.cells.length != this.size) {
            return false;
        }

        for (let row = 0; row < this.size; ++row) {
            if (!that.cells[row] || that.cells[row].length != this.size) {
                return false;
            }

            for (let col = 0; col < this.size; ++col) {
                if (that.cells[row][col] === undefined || !eqf(this.cells[row][col], that.cells[row][col])) {
                    return false;
                }
            }
        }

        return true;
    }

    multiply(that) {
        switch (that.constructor.name) {
            case 'Matrix':
                return this.multiplyMatrix(that);
            case 'Vector':
                return this.multiplyVector(that);
            case 'Point':
                return this.multiplyPoint(that);
            default:
                return this.multiplyTuple(that);
        }
    }

    multiplyMatrix(that) {
        if (this.size != that.size) {
            throw new Error(`Matrix sizes are not equal: ${this.size} != ${that.size}`);
        }

        let result = [];

        for (let i = 0; i < this.size; ++i) {
            let row = [];
            for (let j = 0; j < this.size; ++j) {
                row.push(
                    this.row(i)
                        .multiply(that.column(j))
                        .sum()
                );
            }
            result.push(row);
        }

        return new Matrix(result);
    }

    multiplyVector(vector) {
        const result = this.multiplyTuple(vector);
        return new Vector(result.x, result.y, result.z);
    }

    multiplyPoint(point) {
        const result = this.multiplyTuple(point);
        return new Point(result.x, result.y, result.z);
    }

    multiplyTuple(tuple) {
        let tuple_size = tuple.toArray().length;
        if (tuple_size !== this.size) {
            throw new Error(`Tuple of size ${tuple_size} does not match matrix of size ${this.size}`);
        }

        let result = [];
        for (let i = 0; i < this.size; ++i) {
            result.push(
                this.row(i)
                    .multiply(tuple)
                    .sum()
            );
        }
        return new Tuple(...result);
    }

    static identity(size) {
        if (!size || size < 0) {
            throw new Error(`Invalid identity matrix size ${size}`);
        }

        let cells = [];

        for (let row = 0; row < size; ++row) {
            let row_cells = [];
            for (let col = 0; col < size; ++col) {
                row_cells.push(row === col ? 1 : 0);
            }
            cells.push(row_cells);
        }

        return new Matrix(cells);
    }

    transpose() {
        let columns = [];
        for (let i = 0; i < this.size; ++i) {
            columns.push(this.column(i).toArray());
        }
        return new Matrix(columns);
    }

    determinant() {
        if (this.size < 2) {
            throw new Error(`Invalid matrix size ${this.size}`);
        }

        if (this.size === 2) {
            return this.cells[0][0] * this.cells[1][1] - this.cells[0][1] * this.cells[1][0];
        } else {
            const row = this.cells[0];
            let result = 0;
            for (let i = 0; i < this.size; ++i) {
                const cell = row[i];
                const cofactor = this.cofactor(0, i);
                result += cell * cofactor;
            }
            return result;
        }

        throw new Exception('Not implemented');
    }

    // returns a new Matrix with the 'row' and 'column' _removed_
    submatrix(row, column) {
        if (row < 0 || row >= this.size) {
            throw new Error(`Invalid row: ${row}`);
        }

        if (column < 0 || column >= this.size) {
            throw new Erro(`Invalid column: ${column}`);
        }

        let cells = [];

        for (let r = 0; r < this.size; ++r) {
            if (r === row) {
                continue;
            }
            let row_cells = [];
            for (let c = 0; c < this.size; ++c) {
                if (c === column) {
                    continue;
                }
                row_cells.push(this.cells[r][c]);
            }
            cells.push(row_cells);
        }
        return new Matrix(cells);
    }

    minor(row, column) {
        if (row < 0 || row >= this.size) {
            throw new Error(`Invalid row: ${row}`);
        }

        if (column < 0 || column >= this.size) {
            throw new Erro(`Invalid column: ${column}`);
        }

        return this.submatrix(row, column).determinant();
    }

    cofactor(row, column) {
        if (row < 0 || row >= this.size) {
            throw new Error(`Invalid row: ${row}`);
        }

        if (column < 0 || column >= this.size) {
            throw new Erro(`Invalid column: ${column}`);
        }

        const minor = this.minor(row, column);

        return (row + column) % 2 === 0 ? minor : -minor;
    }

    isInvertible() {
        return this.determinant() !== 0;
    }

    inverse() {
        if (!this.isInvertible()) {
            throw new Error('This matrix is not invertible');
        }

        // allocate matrix of zeroes
        let result = Matrix.of(this.size);
        let determinant = this.determinant();

        for (let row = 0; row < this.size; ++row) {
            for (let col = 0; col < this.size; ++col) {
                const cofactor = this.cofactor(row, col);
                result.set(col, row, cofactor / determinant);
            }
        }

        return result;
    }

    static of(size, value) {
        let result = [];

        if (value === undefined || value === null) {
            value = 0;
        }

        for (let row = 0; row < size; ++row) {
            let row_cells = [];
            for (let col = 0; col < size; ++col) {
                row_cells.push(value);
            }
            result.push(row_cells);
        }

        return new Matrix(result);
    }

    static translation(x, y, z) {
        let result = Matrix.identity(4);
        result.set(0, 3, x);
        result.set(1, 3, y);
        result.set(2, 3, z);
        return result;
    }

    static scaling(x, y, z) {
        let result = Matrix.identity(4);
        result.set(0, 0, x);
        result.set(1, 1, y);
        result.set(2, 2, z);
        return result;
    }

    static rotationX(radAngle) {
        const sinR = Math.sin(radAngle);
        const cosR = Math.cos(radAngle);

        let result = Matrix.identity(4);
        result.set(1, 1, cosR);
        result.set(1, 2, -sinR);
        result.set(2, 1, sinR);
        result.set(2, 2, cosR);
        return result;
    }

    static rotationY(radAngle) {
        const sinR = Math.sin(radAngle);
        const cosR = Math.cos(radAngle);

        let result = Matrix.identity(4);
        result.set(0, 0, cosR);
        result.set(2, 0, -sinR);
        result.set(0, 2, sinR);
        result.set(2, 2, cosR);
        return result;
    }

    static rotationZ(radAngle) {
        const sinR = Math.sin(radAngle);
        const cosR = Math.cos(radAngle);

        let result = Matrix.identity(4);
        result.set(0, 0, cosR);
        result.set(0, 1, -sinR);
        result.set(1, 0, sinR);
        result.set(1, 1, cosR);
        return result;
    }

    static shear(Xy, Xz, Yx, Yz, Zx, Zy) {
        const result = Matrix.identity(4);
        result.set(0, 1, Xy);
        result.set(0, 2, Xz);
        result.set(1, 0, Yx);
        result.set(1, 2, Yz);
        result.set(2, 0, Zx);
        result.set(2, 1, Zy);
        return result;
    }

    clone() {
        return this.multiply(Matrix.identity(this.size));
    }

    toString() {
        let out = '';
        for (let row = 0; row < this.size; ++row) {
            out += this.row(row).toArray() + '\n';
        }
        return out;
    }
}

// helps with multiplying transformations together
// pass in transforms in thsi order: Scale, Rotation, Translations
// this function will apply the transformations in reverse order: Translations, Rotations, Scales
// example: srt(Matrix.scaling(1,2,3), Matrix.scaling(2,4,5), Matrix.rotationX(12), Matrix.translation(1,2,3), Matrix.translation(3,4,5))
export function srt(...transforms) {
    let result = Matrix.identity(4);

    for (let i = transforms.length - 1; i >= 0; --i) {
        result = result.multiply(transforms[i]);
    }

    return result;
}
