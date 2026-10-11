import test from 'node:test';
import assert from 'node:assert/strict';
import { filmSurface } from '../src/utils/filmRail.js';

for (const width of [320, 390, 768, 1440, 1920, 2560]) {
  test(`cylinder remains connected and symmetric at ${width}px`, () => {
    const radius = Math.max(320, width * .9);
    const middle = filmSurface(width / 2, width);
    assert.equal(middle.angle, 0);
    assert.equal(middle.z, 0);
    assert.equal(middle.scale, 1);
    let previous = -Infinity;
    for (let x = 0; x <= width; x += width / 100) {
      const point = filmSurface(x, width);
      const mirror = filmSurface(width - x, width);
      assert.ok(point.x > previous, 'projection must never fold over itself');
      previous = point.x;
      assert.ok(Math.abs(point.x + mirror.x - width) < 1e-8);
      assert.ok(Math.abs(point.scale - mirror.scale) < 1e-8);
      assert.ok(point.scale > .8 && point.scale <= 1);
      const worldX = (point.x - width / 2) / point.scale;
      assert.ok(Math.abs(worldX ** 2 + (point.z + radius) ** 2 - radius ** 2) < .001,
        'projected artwork and borders must lie on one cylinder');
      const derivative = (filmSurface(x + .001, width).x - filmSurface(x - .001, width).x) / .002;
      assert.ok(Math.abs(derivative - point.horizontal) < 1e-6,
        'hit target widths and sprocket widths must agree with the surface tangent');
    }
    assert.ok(filmSurface(-width * .25, width).x < 0);
    assert.ok(filmSurface(width * 1.25, width).x > width);
  });
}
