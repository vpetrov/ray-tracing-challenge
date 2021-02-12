import { eqf } from './math.mjs';

test('eqf() works', () => {
    expect(eqf(1.0, 1.0)).toBeTruthy();
    expect(eqf(1.0, 1.01)).toBeFalsy();
    expect(eqf(1.0000001, 1.000003)).toBeTruthy(); // precision
});
