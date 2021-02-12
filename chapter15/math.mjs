export const EPSILON = 0.00001;

export function eqf(f1, f2) {
    if (
        (f1 === undefined && f2 === undefined) ||
        (f1 === null && f2 === null) ||
        (f1 === Number.POSITIVE_INFINITY && f1 === Number.POSITIVE_INFINITY) ||
        (f1 === Number.NEGATIVE_INFINITY && f2 === Number.NEGATIVE_INFINITY)
    ) {
        return true;
    }

    return Math.abs(f2 - f1) < EPSILON;
}

export function sin(rad) {
    const result = Math.sin(rad);
    return Math.abs(result) <= EPSILON ? 0 : result;
}

export function cos(rad) {
    const result = Math.cos(rad);
    return Math.abs(result) <= EPSILON ? 0 : result;
}

export function randomFloat(from, to) {
    return (Math.random() * (to - from)) + from;
}

export function randomInt(from, to) {
    return Math.trunc(randomFloat(from, to))
}

export function randomItem(array) {
    if (!array || !array.length) {
        return null;
    }

    return array[randomInt(0, array.length)];
}