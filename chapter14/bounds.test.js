import { Point } from './tuple';
import { BoundingBox } from './bounds';
import { ObjectArray } from './geometry';

test('A bounding box can be constructed with no points', () => {
    const aabb = new BoundingBox();
    expect(aabb.minPoint.equals(new Point())).toBeTruthy();
    expect(aabb.maxPoint.equals(new Point())).toBeTruthy();
});

test('A bounding box can be constructed from a single point', () => {
    const point = new Point(1, 2, 3);
    const aabb = new BoundingBox(point);
    expect(aabb.minPoint.equals(point)).toBeTruthy();
    expect(aabb.maxPoint.equals(point)).toBeTruthy();
});

test('A bounding box can be constructed from 2 points as arguments', () => {
    const bottomLeft = new Point(-1, -1, -1);
    const topRight = new Point(1, 1, 1);
    const aabb = new BoundingBox(bottomLeft, topRight);

    expect(aabb.minPoint.equals(bottomLeft)).toBeTruthy();
    expect(aabb.maxPoint.equals(topRight)).toBeTruthy();
});

test('A bounding box can be constructed from an array of points', () => {
    const cuboid = [
        new Point(-2, 1, -1), // leftTopFront
        new Point(-2, 1, 1), // leftTopBack
        new Point(2, 1, 1), // rightTopBack
        new Point(2, 1, -1), // rightTopFront

        new Point(-2, -1, -1), // leftBotFront
        new Point(-2, -1, 1), // leftBotBack
        new Point(2, -1, 1), // rightBotBack
        new Point(2, -1, -1), // rightBotFront
    ];

    const aabb = new BoundingBox(cuboid);
    expect(aabb.minPoint.equals(new Point(-2, -1, -1))).toBeTruthy();
    expect(aabb.maxPoint.equals(new Point(2, 1, 1))).toBeTruthy();
});

test('Two bounding boxes with the same min and max should be equal', () => {
    const aabb1 = new BoundingBox(new Point(-1, -1, -1), new Point(1, 1, 1), new Point(2, 3, 4));
    const aabb2 = new BoundingBox(new Point(-1, -1, -1), new Point(1, 1, 1), new Point(2, 3, 4));
    const aabb3 = new BoundingBox(new Point(-1, -1, -1), new Point(1, 1, 1), new Point(4, 3, 2));

    expect(aabb1.equals(aabb2)).toBeTruthy();
    expect(aabb2.equals(aabb3)).toBeFalsy();
    expect(aabb1.equals(aabb3)).toBeFalsy();
});

test('Clones of a bounding box should be equal', () => {
    const aabb1 = new BoundingBox(new Point(1, 2, 3), new Point(4, 5, 6), new Point(-1, -2, -3));
    const aabb2 = aabb1.clone();

    expect(aabb1.equals(aabb2)).toBeTruthy();
});

test('Corners of a unit bounding box', () => {
    const aabb = new BoundingBox(new Point(-1, -1, -1), new Point(1, 1, 1));
    const corners = aabb.corners;

    const points = [
        new Point(-1, -1, -1),
        new Point(-1, 1, -1),
        new Point(1, 1, -1),
        new Point(1, -1, -1),

        new Point(-1, -1, 1),
        new Point(-1, 1, 1),
        new Point(1, 1, 1),
        new Point(1, -1, 1),
    ];

    expect(corners instanceof ObjectArray).toBeTruthy();
    expect(corners.length).toEqual(8);

    for (const point of points) {
        expect(corners.contains(point)).toBeTruthy();
    }

    // sanity check
    expect(corners.contains(new Point(1, 2, 3))).toBeFalsy();
});
