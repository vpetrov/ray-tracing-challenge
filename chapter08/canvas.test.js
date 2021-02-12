import { Canvas } from './canvas';
import { Color } from './tuple';

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

    expect(ppm).toEqual('P3\n' + 
    '10 2\n' + 
    '255\n' + 
    '255 204 153 255 204 153 255 204 153 255 204 153 255 204 153 255 204 \n' + 
    '153 255 204 153 255 204 153 255 204 153 255 204 153\n' + 
    '255 204 153 255 204 153 255 204 153 255 204 153 255 204 153 255 204 \n' + 
    '153 255 204 153 255 204 153 255 204 153 255 204 153\n');
});

test('PPM files are terminated by a newline character', () => {
    const canvas = new Canvas(5, 3);
    const ppm = canvas.toPPM();

    expect(ppm[ppm.length - 1]).toEqual("\n");
});