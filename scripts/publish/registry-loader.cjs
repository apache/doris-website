// Docusaurus 3.6.3 generates one quoted-key registry entry per line. Keep its
// opaque chunk IDs as string VALUES, outside object-key code generation: the
// pinned faster toolchain emitted bare `2d9cc600: [...]` in a production SSR
// bundle, which Node could not parse. Routes and import expressions stay native.
function normalizeRegistry(source) {
    const wrapper = source.match(/^\s*export default\s*\{([\s\S]*)\}\s*;\s*$/);
    const changed = () => new Error('Unexpected Docusaurus registry format; revalidate the chunk registry loader after upgrading Docusaurus');
    if (!wrapper) throw changed();
    const entries = [];
    const ids = new Set();
    for (const line of wrapper[1].split(/\r?\n/)) {
        if (!line.trim()) continue;
        const match = line.trim().match(/^("(?:[^"\\]|\\.)*")\s*:\s*(\[.*\])\s*,\s*$/);
        if (!match) throw changed();
        const id = JSON.parse(match[1]);
        if (ids.has(id)) throw new Error(`Duplicate Docusaurus chunk ID: ${id}`);
        ids.add(id);
        entries.push(`  [${match[1]}, ${match[2]}],`);
    }
    return `export default Object.fromEntries([\n${entries.join('\n')}\n]);\n`;
}

module.exports = function registryLoader(source) {
    this.cacheable?.();
    return normalizeRegistry(source);
};
module.exports.normalizeRegistry = normalizeRegistry;
