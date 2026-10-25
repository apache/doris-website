// Disposable, content-addressed data shared by the sequential locale processes.
// The parent owns a fresh directory for one source snapshot; never cache routes,
// translation decisions or successful verification results here.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

function createBuildCache(directory, {maxEntries = 256} = {}) {
    const memory = new Map(), pending = new Map();
    const stats = {computed: 0, memoryHits: 0, diskHits: 0};
    const remember = (key, value) => {
        memory.delete(key);
        memory.set(key, value);
        while (memory.size > maxEntries) memory.delete(memory.keys().next().value);
        return value;
    };
    async function get(namespace, inputs, compute) {
        if (!directory) return compute();
        const key = createHash('sha256').update(JSON.stringify([1, namespace, inputs])).digest('hex');
        if (memory.has(key)) {stats.memoryHits++; return remember(key, memory.get(key));}
        if (pending.has(key)) {stats.memoryHits++; return pending.get(key);}
        const filename = path.join(directory, key.slice(0, 2), key + '.json');
        try {
            const stored = JSON.parse(fs.readFileSync(filename, 'utf8'));
            if (stored.key === key && Object.hasOwn(stored, 'value')) {
                stats.diskHits++;
                return remember(key, stored.value);
            }
        } catch (error) {
            if (!['ENOENT', 'ENOTDIR'].includes(error.code) && !(error instanceof SyntaxError)) throw error;
        }
        const task = Promise.resolve().then(compute).then(value => {
            stats.computed++;
            fs.mkdirSync(path.dirname(filename), {recursive: true});
            const temporary = filename + '.' + process.pid + '.tmp';
            fs.writeFileSync(temporary, JSON.stringify({key, value}));
            fs.renameSync(temporary, filename);
            return remember(key, value);
        }).finally(() => pending.delete(key));
        pending.set(key, task);
        return task;
    }
    return {get, stats, clear: () => memory.clear()};
}

const buildCache = createBuildCache(process.env.DORIS_I18N_STRUCTURE_CACHE);
module.exports = {createBuildCache, buildCache};
