export function eqf(f1, f2) {
    if ((f1 === undefined && f2 === undefined) || (f1 === null && f2 === null)) {
        return true;
    }

    return Math.abs(f2 - f1) < 0.00001;
}
