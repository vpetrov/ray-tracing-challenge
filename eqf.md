Evolution of the `eqf` function for comparing two 'floats':

### Chapter 1:

```
export function eqf(f1, f2) {
    return Math.abs(f2 - f1) < 0.00001;
}
```

### Chapter 3:
```
export function eqf(f1, f2) {
    if ((f1 === undefined && f2 === undefined) || (f1 === null && f2 === null)) {
        return true;
    }

    return Math.abs(f2 - f1) < 0.00001;
}
```

### Chapter 8:
```
export const EPSILON = 0.00001;

export function eqf(f1, f2) {
    if ((f1 === undefined && f2 === undefined) || (f1 === null && f2 === null)) {
        return true;
    }

    return Math.abs(f2 - f1) < EPSILON;
}
```

### Chapter 13:

```
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
