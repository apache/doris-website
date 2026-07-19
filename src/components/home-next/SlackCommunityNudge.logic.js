function shouldOpenSlackNudge({ dismissed, opened, elapsedMs, ecosystemVisible }) {
    if (dismissed || opened) {
        return false;
    }

    return elapsedMs >= 5000 || ecosystemVisible;
}

function computeMascotPupilOffset({
    eyeX,
    eyeY,
    mouseX,
    mouseY,
    eyeRadiusPx,
    pupilRadiusRatio,
    softDistancePx,
}) {
    const dx = mouseX - eyeX;
    const dy = mouseY - eyeY;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
        return { x: 0, y: 0 };
    }

    const pupilRadiusPx = eyeRadiusPx * pupilRadiusRatio;
    const maxOffset = Math.max(eyeRadiusPx - pupilRadiusPx, 0);
    const scale = Math.min(dist / softDistancePx, 1);

    return {
        x: Number(((dx / dist) * maxOffset * scale).toFixed(2)),
        y: Number(((dy / dist) * maxOffset * scale).toFixed(2)),
    };
}

function getSlackNudgeBenefits() {
    return [
        'Talk with Doris users and developers.',
        'Get the latest Doris community updates, learning resources, and event information.',
        'Join community building, feature discussions, and PR reviews.',
    ];
}

function isDocumentationFeedbackPath(pathname) {
    return (
        pathname === '/docs' ||
        pathname.startsWith('/docs/') ||
        pathname === '/community' ||
        pathname.startsWith('/community/')
    );
}

module.exports = {
    computeMascotPupilOffset,
    getSlackNudgeBenefits,
    isDocumentationFeedbackPath,
    shouldOpenSlackNudge,
};
