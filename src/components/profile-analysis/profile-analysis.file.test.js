const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
const typescript = require('typescript');

const fileModulePath = path.join(__dirname, 'profile-analysis.file.ts');
const compiledFileModule = typescript.transpileModule(fs.readFileSync(fileModulePath, 'utf8'), {
    compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const fileModule = { exports: {} };
new Function('module', 'exports', 'require', '__filename', '__dirname', compiledFileModule)(
    fileModule,
    fileModule.exports,
    require,
    fileModulePath,
    path.dirname(fileModulePath),
);

const {
    byteLen,
    ensureTxt,
    MAX_RAW_BYTES,
    MAX_UPLOAD_BYTES,
    prepareProfileFile,
    truncateProfile,
} = fileModule.exports;

test('counts profile text in UTF-8 bytes instead of JavaScript characters', () => {
    assert.equal('é中'.length, 2);
    assert.equal(byteLen('é中'), 5);
});

test('ensures prepared profile names have a txt extension', () => {
    assert.equal(ensureTxt('query-profile'), 'query-profile.txt');
    assert.equal(ensureTxt('query-profile.TXT'), 'query-profile.TXT');
});

test('truncates at the first per-instance header after MergedProfile', () => {
    const source = [
        'Summary:',
        'Execution Profile summary text that is not a top-level detail header',
        'Execution Summary:',
        'MergedProfile:',
        '  Fragment 0:',
        '    Pipeline 0:',
        'DetailProfile(query-id-1):',
        '  Instance detail that must not be uploaded',
        'Execution Profile query-id-2',
        '  More instance detail',
    ].join('\n');

    const truncated = truncateProfile(source);

    assert.ok(truncated.startsWith('# [truncated: per-instance execution profiles removed]\n'));
    assert.match(truncated, /Summary:/);
    assert.match(truncated, /Execution Summary:/);
    assert.match(truncated, /MergedProfile:/);
    assert.match(truncated, /Fragment 0:/);
    assert.match(truncated, /Pipeline 0:/);
    assert.doesNotMatch(truncated, /^DetailProfile\b/m);
    assert.doesNotMatch(truncated, /Instance detail/);
});

test('does not claim truncation without a MergedProfile followed by a detail boundary', () => {
    const mergedOnly = 'Summary:\nExecution Summary:\nMergedProfile:\n  Fragment 0:\n    Pipeline 0:';
    const detailOnly = 'Summary:\nDetailProfile(query-id-1):\n  Instance detail';
    assert.equal(truncateProfile(mergedOnly), mergedOnly);
    assert.equal(truncateProfile(detailOnly), detailOnly);
});

test('returns an upload-sized profile file without reading or repackaging it', async () => {
    const file = new File(['Summary:\nMergedProfile:'], 'query-profile.txt', { type: 'text/plain' });
    assert.equal(await prepareProfileFile(file), file);
});

test('rejects a raw profile over 100 MiB without reading it', async () => {
    let textCalls = 0;
    const file = {
        name: 'huge-profile.txt',
        size: MAX_RAW_BYTES + 1,
        async text() {
            textCalls += 1;
            return 'must not be read';
        },
    };

    await assert.rejects(prepareProfileFile(file), /larger than 100 MiB.*merged Profile/);
    assert.equal(textCalls, 0);
});

test('removes per-instance detail from a large profile and returns a plain txt file', async () => {
    const aggregate = 'Summary:\nExecution Summary:\nMergedProfile:\n  Fragment 0:\n    Pipeline 0:';
    const source = `${aggregate}\nDetailProfile(query-id-1):\n${'x'.repeat(MAX_UPLOAD_BYTES)}`;
    const file = {
        name: 'query-profile',
        size: MAX_UPLOAD_BYTES + 1,
        async text() {
            return source;
        },
    };

    const prepared = await prepareProfileFile(file);

    assert.equal(prepared.type, 'text/plain');
    assert.equal(prepared.name, 'query-profile.txt');
    assert.ok(prepared.size <= MAX_UPLOAD_BYTES);
    const preparedText = await prepared.text();
    assert.match(preparedText, /^# \[truncated: per-instance execution profiles removed\]/);
    assert.match(preparedText, /MergedProfile:/);
    assert.doesNotMatch(preparedText, /^DetailProfile\b/m);
});

test('rejects a merged-only profile that remains over the upload limit', async () => {
    const source = `Summary:\nMergedProfile:\n${'x'.repeat(MAX_UPLOAD_BYTES)}`;
    const file = {
        name: 'merged-profile.txt',
        size: MAX_UPLOAD_BYTES + 1,
        async text() {
            return source;
        },
    };

    await assert.rejects(
        prepareProfileFile(file),
        /still larger than 10 MiB.*merged Profile/,
    );
});
