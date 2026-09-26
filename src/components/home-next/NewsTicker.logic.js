function getRandomStartIndex(itemCount, randomValue = Math.random()) {
    if (!Number.isInteger(itemCount) || itemCount <= 0) {
        return 0;
    }

    const normalizedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
    return Math.floor(normalizedRandom * itemCount);
}

function rotateItems(items, startIndex) {
    if (items.length === 0) {
        return [];
    }

    const normalizedStart = ((startIndex % items.length) + items.length) % items.length;
    return [...items.slice(normalizedStart), ...items.slice(0, normalizedStart)];
}

module.exports = {
    getRandomStartIndex,
    rotateItems,
};
