import { Color, Matrix, Point } from './tuple';
import { Canvas } from './canvas';

class Clock {
    constructor(size, color) {
        this.size = size;
        this.color = color;
    }

    draw(canvas, x, y) {
        let twelve = new Point(0, this.size, 0);
        let increment = (2 * Math.PI) / 12;

        for (let i = 0; i < 12; ++i) {
            let rotation = Matrix.rotationZ(-Math.PI + increment * i);
            let translation = Matrix.translation(x, y, 0);
            let point = translation.multiply(rotation).multiply(twelve);

            canvas.drawPixel(Math.floor(point.x), Math.floor(point.y), this.color);
        }
    }
}

const canvas = new Canvas(1000, 1000),
    clock = new Clock(300, new Color(1, 1, 1));

clock.draw(canvas, 500, 500);

canvas.savePPM('screenshot.ppm');
