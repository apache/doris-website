#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

// React 18.3.1 flushes unused UTF-8 buffer bytes when a multi-byte character
// crosses the 2048-byte boundary. Those NUL bytes corrupt rendered IDs/URLs.
// Backport only the written-length fix from React PR #26228; remove this
// patch when upgrading to React 19, where the upstream fix is included.
// https://github.com/react/react/issues/31134
// https://github.com/react/react/pull/26228
function patchReactSsr(root) {
    const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (Number(version.split('.')[0]) >= 19) return;
    if (version !== '18.3.1') throw new Error(`SSR patch needs review for react-dom ${version}`);
    const patches = [
        ['react-dom-server.node.production.min.js',
            'd<b.length&&(t(a,k),', 'd<b.length&&(t(a,k.subarray(0,l)),'],
        ['react-dom-server.node.development.js',
            'if (read < stringChunk.length) {\n    writeToDestination(destination, currentView);',
            'if (read < stringChunk.length) {\n    writeToDestination(destination, currentView.subarray(0, writtenBytes));'],
    ];
    // Validate both pinned files before writing either one. Repeated installs
    // must preserve an already applied patch, never silently miss its target.
    const files = patches.map(([name, before, after]) => {
        const file = path.join(root, 'cjs', name);
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes(after) && !content.includes(before)) return { file, content };
        if (content.split(before).length !== 2) throw new Error(`Unexpected React SSR patch target: ${file}`);
        return { file, content: content.replace(before, after), changed: true };
    });
    for (const { file, content, changed } of files) if (changed) fs.writeFileSync(file, content);
    console.log(`React ${version} SSR UTF-8 boundary fix applied`);
}

if (require.main === module) {
    patchReactSsr(process.argv[2]
        ? path.resolve(process.argv[2])
        : path.dirname(require.resolve('react-dom/package.json')));
}
module.exports = { patchReactSsr };
