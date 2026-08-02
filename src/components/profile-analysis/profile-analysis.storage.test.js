const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const storagePath = path.join(__dirname, 'profile-analysis.storage.ts');
const compiledStorage = typescript.transpileModule(fs.readFileSync(storagePath, 'utf8'), {
    compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const storageModule = new Module(storagePath, module);
storageModule.filename = storagePath;
storageModule.paths = Module._nodeModulePaths(path.dirname(storagePath));
storageModule._compile(compiledStorage, storagePath);

const {
    ACTIVE_ANALYSIS_STORAGE_KEY,
    clearStoredAnalysisJob,
    parseStoredAnalysisJob,
    readStoredAnalysisJob,
    writeStoredAnalysisJob,
} = storageModule.exports;

const now = Date.now();
const validRecord = {
    version: 1,
    clientRequestId: 'ca9ee8aa-3f47-4aab-a151-f3a39c5a6193',
    jobId: '550e8400-e29b-41d4-a716-446655440000',
    createdAt: now,
    fileName: 'query-profile.txt',
    language: 'zh-CN',
};

function memorySessionStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
    };
}

test('accepts strictly validated recovery metadata without profile contents', () => {
    assert.deepEqual(parseStoredAnalysisJob(JSON.stringify(validRecord), now), validRecord);
    assert.equal(parseStoredAnalysisJob('not-json', now), null);
    assert.equal(parseStoredAnalysisJob(JSON.stringify({ ...validRecord, jobId: '../../secret' }), now), null);
    assert.equal(parseStoredAnalysisJob(JSON.stringify({ ...validRecord, language: 'unknown' }), now), null);
    assert.equal(parseStoredAnalysisJob(JSON.stringify({ ...validRecord, profileText: 'secret profile' }), now), null);
    assert.equal(
        parseStoredAnalysisJob(JSON.stringify({ ...validRecord, createdAt: now - 25 * 60 * 60 * 1_000 }), now),
        null,
    );
});

test('writes, reads, and clears only the active recovery record', t => {
    const previousWindow = global.window;
    const sessionStorage = memorySessionStorage();
    global.window = { sessionStorage };
    t.after(() => {
        global.window = previousWindow;
    });

    assert.equal(writeStoredAnalysisJob(validRecord), true);
    assert.equal(sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY).includes('Query Profile text'), false);
    assert.deepEqual(readStoredAnalysisJob(now), { available: true, record: validRecord });
    assert.equal(clearStoredAnalysisJob(), true);
    assert.deepEqual(readStoredAnalysisJob(now), { available: true, record: null });
});

test('degrades safely when session storage is unavailable', t => {
    const previousWindow = global.window;
    global.window = {};
    Object.defineProperty(global.window, 'sessionStorage', {
        get() {
            throw new Error('storage blocked');
        },
    });
    t.after(() => {
        global.window = previousWindow;
    });

    assert.deepEqual(readStoredAnalysisJob(now), { available: false, record: null });
    assert.equal(writeStoredAnalysisJob(validRecord), false);
    assert.equal(clearStoredAnalysisJob(), false);
});
