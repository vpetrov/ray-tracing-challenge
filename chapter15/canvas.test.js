import { Canvas } from './canvas.mjs';
import { Color } from './tuple.mjs';

test('Creating a canvas', () => {
    const c = new Canvas(10, 20);

    expect(c.width).toEqual(10);
    expect(c.height).toEqual(20);

    const black = new Color(0, 0, 0);
    for (let row = 0; row < c.pixels.length; ++row) {
        for (let col = 0; col < row.length; ++col) {
            const pixel = row[col];
            expect(pixel.equals(black)).toBeTruthy();
        }
    }
});

test('Writing pixels to canvas', () => {
    const c = new Canvas(10, 20);
    const red = new Color(1, 0, 0);
    c.drawPixel(2, 3, red);
    const pixel = c.pixelAt(2, 3);

    expect(pixel.equals(red)).toBeTruthy();
});

test('PPM pixel data', () => {
    const c = new Canvas(5, 3);
    const c1 = new Color(1.5, 0, 0);
    const c2 = new Color(0, 0.5, 0);
    const c3 = new Color(-0.5, 0, 1);

    c.drawPixel(0, 0, c1);
    c.drawPixel(2, 1, c2);
    c.drawPixel(4, 2, c3);

    const ppm = c.toPPM();

    expect(ppm).toEqual(
        'P3\n' +
            '5 3\n' +
            '255\n' +
            '255 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            '0 0 0 0 0 0 0 128 0 0 0 0 0 0 0\n' +
            '0 0 0 0 0 0 0 0 0 0 0 0 0 0 255\n'
    );
});

test('Splitting long lines in PPM', () => {
    const canvas = new Canvas(10, 2);
    canvas.clear(new Color(1, 0.8, 0.6));
    const ppm = canvas.toPPM();

    expect(ppm).toEqual(
        'P3\n' +
            '10 2\n' +
            '255\n' +
            '255 204 153 255 204 153 255 204 153 255 204 153 255 204 153 255 204 \n' +
            '153 255 204 153 255 204 153 255 204 153 255 204 153\n' +
            '255 204 153 255 204 153 255 204 153 255 204 153 255 204 153 255 204 \n' +
            '153 255 204 153 255 204 153 255 204 153 255 204 153\n'
    );
});

test('PPM files are terminated by a newline character', () => {
    const canvas = new Canvas(5, 3);
    const ppm = canvas.toPPM();

    expect(ppm[ppm.length - 1]).toEqual('\n');
});

test('Two identical canvases should be equal', () => {
    const canvas1 = new Canvas(10, 10);
    canvas1.clear(Color.RED);
    const canvas2 = new Canvas(10, 10);
    canvas2.clear(Color.RED);
    const canvas3 = new Canvas(10, 10);
    canvas3.clear(Color.GREEN);

    expect(canvas1.equals(canvas2)).toBeTruthy();
    expect(canvas2.equals(canvas3)).toBeFalsy();
});

test('Blit should transfer all the colors', () => {
    const canvas1 = new Canvas(3, 3);
    canvas1.clear(Color.RED);

    const canvas2 = new Canvas(3, 3);
    canvas2.clear(Color.BLUE);

    canvas1.blit(canvas2);

    expect(canvas1.equals(canvas2)).toBeTruthy();
});

test('Blit should transfer the colors from selected rows', () => {
    const canvas1 = new Canvas(10, 20);
    canvas1.clear(Color.RED);
    const canvas2 = new Canvas(10, 20);
    canvas2.clear(Color.BLUE);

    canvas1.blit(canvas2, 5, 10);

    canvas1.savePPM('wtf.ppm');

    for (let row = 0; row < canvas1.height; row++) {
        for (let col = 0; col < canvas1.width; col++) {
            if (row < 5 || row >= 10) {
                expect(canvas1.pixelAt(col, row).equals(Color.RED)).toBeTruthy();
            } else {
                expect(canvas1.pixelAt(col, row).equals(Color.BLUE)).toBeTruthy();
            }
        }
    }
});

test('Blit should transfer the colors from selected rows with an offset', () => {
    const canvas1 = new Canvas(10, 20);
    canvas1.clear(Color.RED);
    const canvas2 = new Canvas(10, 20);
    canvas2.clear(Color.BLUE);

    canvas1.blit(canvas2, 5, 10, 5);

    for (let row = 0; row < canvas1.height; row++) {
        for (let col = 0; col < canvas1.width; col++) {
            if (row < 5 || row >= 10 || col < 5) {
                expect(canvas1.pixelAt(col, row).equals(Color.RED)).toBeTruthy();
            } else {
                expect(canvas1.pixelAt(col, row).equals(Color.BLUE)).toBeTruthy();
            }
        }
    }
});