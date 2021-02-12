import { Color } from './tuple.mjs';
import fs from 'fs';

export class Canvas {
    constructor(width, height, background) {
        this.width = width;
        this.height = height;
        this.background = background === undefined ? new Color(0, 0, 0) : background;
        this.pixels = new Array(height);

        for (let i = 0; i < height; ++i) {
            this.pixels[i] = new Array(width);
        }

        this.clear();
    }

    clear(color) {
        const clear_color = color === undefined ? this.background : color;
        for (let row = 0; row < this.height; ++row) {
            for (let col = 0; col < this.width; ++col) {
                this.pixels[row][col] = clear_color.clone();
            }
        }
    }

    drawPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        this.pixels[y][x] = color.clone();
        return true;
    }

    pixelAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        return this.pixels[y][x];
    }

    toPPM() {
        let result = 'P3\n' + `${this.width} ${this.height}\n` + `255\n`;

        function commitLine(line) {
            result += line + '\n';
            return '';
        }

        for (let row = 0; row < this.height; ++row) {
            let line = '';

            for (let col = 0; col < this.width; ++col) {
                const pixel = this.pixels[row][col].to255();
                const red = `${pixel.red}`;
                const green = `${pixel.green}`;
                const blue = `${pixel.blue}`;

                // red
                let suffix = ' ';
                if (line.length + red.length + suffix.length > 70) {
                    line = commitLine(line);
                }
                line += red + suffix;

                // green
                if (line.length + green.length + suffix.length > 70) {
                    line = commitLine(line);
                }
                line += green + suffix;

                // blue
                suffix = col === this.width - 1 ? '' : ' ';
                if (line.length + blue.length + suffix.length > 70) {
                    line = commitLine(line);
                }

                line += blue + suffix;
            }

            result += line + '\n';
        }

        if (result[result.length - 1] !== '\n') {
            result += '\n';
        }

        return result;
    }

    /**
     * Transfers the color from the source canvas to this canvas.
     * startRow, endRow and offsetX are all zero-based indices.
     */
    blit(source, startRow, endRow, offsetX) {
        startRow = startRow === undefined ? 0 : startRow;
        endRow = endRow === undefined ? source.height : endRow;
        offsetX = offsetX === undefined ? 0 : offsetX;

        for (let row = startRow; row < endRow; row++) {
            for (let col = offsetX; col < source.width; col++) {
                const c = source.pixels[row][col];
                this.drawPixel(col, row, new Color(c.x, c.y, c.z, c.w));
            }
        }
    }

    savePPM(filename) {
        fs.writeFileSync(filename, this.toPPM());
    }

    equals(that) {
        if (
            that == null ||
            this.width !== that.width ||
            this.height !== that.height ||
            !this.background.equals(that.background)
        ) {
            return false;
        }

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.pixelAt(col, row).equals(that.pixelAt(col, row))) {
                    return false;
                }
            }
        }

        return true;
    }
}
