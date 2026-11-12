const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function activeDocVersions(root = path.resolve(__dirname, '../..')) {
    // Archived source directories remain in Git; versions.json defines which
    // released versions are online. The native current version is additional.
    const released = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));
    assert(Array.isArray(released) && released.every(version => typeof version === 'string' && version.trim()
        && version !== 'current') && new Set(released).size === released.length,
        'versions.json must contain unique released version names, excluding current');
    return ['current', ...released];
}

function assertDocVersionCoverage(pages, locale, versions = activeDocVersions()) {
    const present = new Set(pages.filter(page => page.kind === 'docs' && page.pluginId === 'default').map(page => page.version));
    for (const version of versions) assert(present.has(version), `Missing version: ${locale}/${version}`);
}

module.exports = {activeDocVersions, assertDocVersionCoverage};
