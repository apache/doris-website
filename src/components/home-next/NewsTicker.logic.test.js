const assert = require('node:assert/strict');
const test = require('node:test');

const { getRandomStartIndex, rotateItems } = require('./NewsTicker.logic');

test('maps random values to a valid starting announcement', () => {
    assert.equal(getRandomStartIndex(3, 0), 0);
    assert.equal(getRandomStartIndex(3, 0.34), 1);
    assert.equal(getRandomStartIndex(3, 0.99), 2);
});

test('keeps the random index inside the available range', () => {
    assert.equal(getRandomStartIndex(3, -1), 0);
    assert.equal(getRandomStartIndex(3, 1), 2);
    assert.equal(getRandomStartIndex(0, 0.5), 0);
});

test('rotates announcements while preserving their circular order', () => {
    assert.deepEqual(rotateItems(['profile', 'course', 'roadmap'], 1), ['course', 'roadmap', 'profile']);
    assert.deepEqual(rotateItems(['profile', 'course', 'roadmap'], 2), ['roadmap', 'profile', 'course']);
});

test('normalizes out-of-range rotation indexes', () => {
    assert.deepEqual(rotateItems(['a', 'b', 'c'], 4), ['b', 'c', 'a']);
    assert.deepEqual(rotateItems(['a', 'b', 'c'], -1), ['c', 'a', 'b']);
    assert.deepEqual(rotateItems([], 2), []);
});
