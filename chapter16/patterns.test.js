import { Pattern, ColorPattern, TwoColorPattern, Stripe, Gradient, RingPattern, Checkers, Perturbed } from './patterns.mjs';
import { Color, Point, Matrix } from './tuple.mjs';
import { Sphere } from './geometry.mjs';

test('Creating a stripe pattern', () => {
    const pattern = new Stripe(Color.WHITE, Color.BLACK);
    expect(pattern.color1.equals(Color.WHITE)).toBeTruthy();
    expect(pattern.color2.equals(Color.BLACK)).toBeTruthy();
});

test('A stripe pattern in constant in y', () => {
    const stripe = new Stripe(Color.WHITE, Color.BLACK);
    expect(stripe.colorAt(new Point(0, 0, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(0, 1, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(0, 2, 0)).equals(Color.WHITE)).toBeTruthy();
});

test('A stripe pattern is constant in z', () => {
    const stripe = new Stripe(Color.WHITE, Color.BLACK);
    expect(stripe.colorAt(new Point(0, 0, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(0, 0, 1)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(0, 0, 2)).equals(Color.WHITE)).toBeTruthy();
});

test('A stripe pattern alternates in X', () => {
    const stripe = new Stripe(Color.WHITE, Color.BLACK);
    expect(stripe.colorAt(new Point(0, 0, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(0.9, 0, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(stripe.colorAt(new Point(1, 0, 0)).equals(Color.BLACK)).toBeTruthy();
    expect(stripe.colorAt(new Point(-0.1, 0, 0)).equals(Color.BLACK)).toBeTruthy();
    expect(stripe.colorAt(new Point(-1, 0, 0)).equals(Color.BLACK)).toBeTruthy();
    expect(stripe.colorAt(new Point(-1.1, 0, 0)).equals(Color.WHITE)).toBeTruthy();
});

test('A pattern with an object transformation', () => {
    const sphere = new Sphere();
    sphere.transform = Matrix.scaling(2, 2, 2);
    const stripe = new Stripe(Color.WHITE, Color.BLACK);
    const c = stripe.shapeColorAt(sphere, new Point(1.5, 0, 0));
    expect(c.equals(Color.WHITE)).toBeTruthy();
});

test('Stripes with a pattern transformation', () => {
    const object = new Sphere();
    const pattern = new Stripe(Color.WHITE, Color.BLACK);
    pattern.transform = Matrix.scaling(2, 2, 2);
    const c = pattern.shapeColorAt(object, new Point(1.5, 0, 0));
    expect(c.equals(Color.WHITE)).toBeTruthy();
});

test('Stripes with both an object and a pattern transformation', () => {
    const object = new Sphere();
    object.transform = Matrix.scaling(2, 2, 2);
    const pattern = new Stripe(Color.WHITE, Color.BLACK);
    pattern.transform = Matrix.translation(0.5, 0, 0);
    const c = pattern.shapeColorAt(object, new Point(2.5, 0, 0));
    expect(c.equals(Color.WHITE)).toBeTruthy();
});

test('The default pattern transformation', () => {
    const pattern = new Pattern();
    expect(pattern.transform.equals(Matrix.identity(4))).toBeTruthy();
});

test('Assigning a transform to a pattern', () => {
    const pattern = new Pattern();
    pattern.transform = Matrix.translation(1, 2, 3);
    expect(pattern.transform.equals(Matrix.translation(1, 2, 3))).toBeTruthy();
});

test('A gradient linearly interpolates between colors', () => {
    const pattern = new Gradient(Color.WHITE, Color.BLACK);
    const originX = new Point();
    const quarterX = new Point(0.25, 0, 0);
    const halfX = new Point(0.5, 0, 0);
    const twoThirdsX = new Point(0.75, 0, 0);
    const almostOneX = new Point(0.9999999, 0, 0);

    const lightGray = new Color(0.75, 0.75, 0.75);
    const mediumGray = new Color(0.5, 0.5, 0.5);
    const darkGray = new Color(0.25, 0.25, 0.25);

    expect(pattern.colorAt(originX).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(quarterX).equals(lightGray)).toBeTruthy();
    expect(pattern.colorAt(halfX).equals(mediumGray)).toBeTruthy();
    expect(pattern.colorAt(almostOneX).equals(Color.BLACK)).toBeTruthy();
});

test('A ring should extend in both x and z', () => {
    const pattern = new RingPattern(Color.WHITE, Color.BLACK);
    expect(pattern.colorAt(new Point()).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(1, 0, 0)).equals(Color.BLACK)).toBeTruthy();
    expect(pattern.colorAt(new Point(0, 0, 1)).equals(Color.BLACK)).toBeTruthy();
    expect(pattern.colorAt(new Point(0.708, 0, 0.708)).equals(Color.BLACK)).toBeTruthy();
});

test('Checkers should repeat in X', () => {
    const pattern = new Checkers();
    expect(pattern.colorAt(new Point()).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(0.99, 0, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(1.01, 0, 0)).equals(Color.BLACK)).toBeTruthy();
});

test('Checkers should repeat in Y', () => {
    const pattern = new Checkers();
    expect(pattern.colorAt(new Point()).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(0, 0.99, 0)).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(0, 1.01, 0)).equals(Color.BLACK)).toBeTruthy();
});

test('Checkers should repeat in Z', () => {
    const pattern = new Checkers();
    expect(pattern.colorAt(new Point()).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(0, 0, 0.99)).equals(Color.WHITE)).toBeTruthy();
    expect(pattern.colorAt(new Point(0, 0, 1.01)).equals(Color.BLACK)).toBeTruthy();
});

test('Color pattern defaults', () => {
    const pattern = new ColorPattern(Color.WHITE);
    expect(pattern.color.equals(Color.WHITE)).toBeTruthy();
    expect(pattern.transform.equals(Matrix.identity(4))).toBeTruthy();
});

test('Color pattern with another color pattern', () => {
    const pattern1 = new ColorPattern(Color.BLACK);
    const pattern2 = new ColorPattern(pattern1);

    expect(pattern2.colorAt(new Point()).equals(Color.BLACK)).toBeTruthy();
    expect(pattern2.colorAt(new Point(1, 1, 1)).equals(Color.BLACK)).toBeTruthy();
});

test('Checkers pattern with color pattern', () => {
    const pattern1 = new ColorPattern(Color.RED);
    const pattern2 = new ColorPattern(Color.BLUE);
    const pattern3 = new Checkers(pattern1, pattern2);

    expect(pattern3.colorAt(new Point()).equals(Color.RED)).toBeTruthy();
    expect(pattern3.colorAt(new Point(0, 0.99, 0)).equals(Color.RED)).toBeTruthy();
    expect(pattern3.colorAt(new Point(0, 1.01, 0)).equals(Color.BLUE)).toBeTruthy();
});

test('Test equality', () => {
    const p1 = new ColorPattern(Color.BLACK);
    const p2 = new ColorPattern(Color.WHITE);
    const p3 = new TwoColorPattern(Color.RED, Color.BLUE);
    const p4 = new TwoColorPattern(Color.GREEN, Color.BLUE);

    expect(p1.equals(p1)).toBeTruthy();
    expect(p1.equals(p2)).toBeFalsy();
    expect(p3.equals(p3)).toBeTruthy();
    expect(p3.equals(p4)).toBeFalsy();
});

test('Test pattern clone', () => {
    let p = new ColorPattern(Color.RED);
    expect(p.equals(p.clone())).toBeTruthy();

    p = new TwoColorPattern(Color.BLUE, Color.GREEN, Matrix.scaling(1, 1, 3));
    expect(p.equals(p.clone())).toBeTruthy();

    p = new Stripe();
    expect(p.equals(p.clone())).toBeTruthy();

    p = new Gradient();
    expect(p.equals(p.clone())).toBeTruthy();

    p = new RingPattern();
    expect(p.equals(p.clone())).toBeTruthy();

    p = new Checkers();
    expect(p.equals(p.clone())).toBeTruthy();

    p = new Perturbed(Color.RED, Matrix.rotationX(-0.4));
    expect(p.equals(p.clone())).toBeTruthy();
});
