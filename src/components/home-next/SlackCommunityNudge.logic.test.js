const assert = require('node:assert/strict');
const test = require('node:test');

const {
    computeMascotPupilOffset,
    getSlackNudgeBenefits,
    shouldOpenSlackNudge,
} = require('./SlackCommunityNudge.logic');

test('opens after the visitor has stayed on the page for at least five seconds', () => {
    assert.equal(
        shouldOpenSlackNudge({
            dismissed: false,
            opened: false,
            elapsedMs: 5000,
            ecosystemVisible: false,
        }),
        true,
    );
});

test('opens when the ecosystem section becomes visible before five seconds', () => {
    assert.equal(
        shouldOpenSlackNudge({
            dismissed: false,
            opened: false,
            elapsedMs: 1200,
            ecosystemVisible: true,
        }),
        true,
    );
});

test('stays closed after the visitor dismisses or has already seen it', () => {
    assert.equal(
        shouldOpenSlackNudge({
            dismissed: true,
            opened: false,
            elapsedMs: 7000,
            ecosystemVisible: true,
        }),
        false,
    );

    assert.equal(
        shouldOpenSlackNudge({
            dismissed: false,
            opened: true,
            elapsedMs: 7000,
            ecosystemVisible: true,
        }),
        false,
    );
});

test('keeps mascot pupils centered when the pointer is at the eye center', () => {
    assert.deepEqual(
        computeMascotPupilOffset({
            eyeX: 100,
            eyeY: 100,
            mouseX: 100,
            mouseY: 100,
            eyeRadiusPx: 10,
            pupilRadiusRatio: 0.5,
            softDistancePx: 80,
        }),
        { x: 0, y: 0 },
    );
});

test('limits mascot pupil movement to the remaining eye radius', () => {
    assert.deepEqual(
        computeMascotPupilOffset({
            eyeX: 100,
            eyeY: 100,
            mouseX: 260,
            mouseY: 100,
            eyeRadiusPx: 10,
            pupilRadiusRatio: 0.5,
            softDistancePx: 80,
        }),
        { x: 5, y: 0 },
    );
});

test('softens mascot pupil movement for nearby pointers', () => {
    assert.deepEqual(
        computeMascotPupilOffset({
            eyeX: 100,
            eyeY: 100,
            mouseX: 140,
            mouseY: 100,
            eyeRadiusPx: 10,
            pupilRadiusRatio: 0.5,
            softDistancePx: 80,
        }),
        { x: 2.5, y: 0 },
    );
});

test('returns the Slack community benefits shown in the nudge', () => {
    assert.deepEqual(getSlackNudgeBenefits(), [
        'Talk with Doris users and developers.',
        'Get the latest Doris community updates, learning resources, and event information.',
        'Join community building, feature discussions, and PR reviews.',
    ]);
});
