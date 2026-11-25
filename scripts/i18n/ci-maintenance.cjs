const {execFileSync} = require('node:child_process');

// Only top-level operator notes are excluded. Markdown used by nested test
// fixtures can affect publishing behavior and must retain its checks.
const isPublishMaintenanceNote = file => /^scripts\/publish\/[^/]+\.md$/.test(file);

function actionSubmodulesOnly(root, base) {
    const git = (args, input) => execFileSync('git', args,
        {cwd: root, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 1024 * 1024});
    function modules(revision) {
        const entry = git(['ls-tree', '-z', revision, '--', '.gitmodules']);
        if (!entry) return new Map();
        const match = entry.match(/^100(?:644|755) blob ([a-f0-9]{40})\t\.gitmodules\0$/);
        if (!match) throw new Error('Expected a regular .gitmodules blob');
        const source = git(['cat-file', 'blob', match[1]]);
        const config = git(['config', '--null', '--no-includes', '--file', '-', '--list'], source);
        const result = new Map();
        for (const record of config.split('\0').filter(Boolean)) {
            const separator = record.indexOf('\n');
            const key = record.slice(0, separator), value = record.slice(separator + 1);
            const field = key.match(/^submodule\.(.+)\.([a-z][a-z0-9-]*)$/);
            if (separator < 0 || !field) throw new Error('Unrecognized .gitmodules configuration');
            if (!result.has(field[1])) result.set(field[1], new Map());
            const attributes = result.get(field[1]);
            if (attributes.has(field[2])) throw new Error('Ambiguous .gitmodules configuration');
            attributes.set(field[2], value);
        }
        const paths = [...result.values()].map(attributes => attributes.get('path'));
        if (new Set(paths).size !== paths.length) throw new Error('Duplicate submodule paths');
        return result;
    }
    const actionPath = value => typeof value === 'string' && value.startsWith('.github/actions/')
        && !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..');
    const equal = (before, after) => before?.size === after?.size
        && [...(before ?? [])].every(([key, value]) => after?.get(key) === value);
    try {
        const before = modules(base), after = modules('HEAD');
        return [...new Set([...before.keys(), ...after.keys()])].every(name => {
            const previous = before.get(name), current = after.get(name);
            if (equal(previous, current)) return true;
            return (!previous || actionPath(previous.get('path')))
                && (!current || actionPath(current.get('path')));
        });
    } catch {
        // Missing history, invalid syntax and unknown configuration remain full CI.
        return false;
    }
}

module.exports = {isPublishMaintenanceNote, actionSubmodulesOnly};
