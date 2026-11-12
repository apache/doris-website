const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {createBuildCache} = require('../build-cache.cjs');

function directory(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-parse-cache-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    return root;
}
test('locale processes reuse successful content results; changed inputs and failures are recomputed', async t => {
    const root = directory(t), first = createBuildCache(root);
    let calls = 0;
    const compute = async () => {calls++; return {heading: 'one'};};
    await Promise.all([first.get('parse', ['one'], compute), first.get('parse', ['one'], compute)]);
    assert.equal(calls, 1);
    const next = createBuildCache(root);
    assert.deepEqual(await next.get('parse', ['one'], () => assert.fail('disk reuse')), {heading: 'one'});
    assert.equal(next.stats.diskHits, 1);
    await next.get('parse', ['changed'], compute);
    assert.equal(calls, 2);
    await assert.rejects(next.get('parse', ['bad'], () => {throw new Error('bad Markdown');}), /bad Markdown/);
    await next.get('parse', ['bad'], compute);
    assert.equal(calls, 3);
});
test('real cached parsing and heading alignment match fresh processes across heading/format changes', t => {
    const root = directory(t), modulePath = path.resolve(__dirname, '../structure.cjs');
    const inputs = [
        ['# One\n\nSQL `x`', '## Uno', '.md', false],
        ['# One {#stable}\n', '# Uno\n', '.md', false],
        ['# Two {#changed}\n', '# Uno\n', '.md', true],
        ['# Markdown\n', '# Markdown\n', '.mdx', false],
    ];
    const script = `const {structure,alignHeadings}=require(${JSON.stringify(modulePath)});
        (async()=>{const results=[];for(const [source,target,ext,keep] of ${JSON.stringify(inputs)}) {
            const parsed=await structure(source,ext,keep);
            try{results.push([parsed,await alignHeadings(parsed,target,ext,keep)])}
            catch(e){results.push([parsed,e.message])}
        }console.log(JSON.stringify(results))})().catch(e=>{console.error(e);process.exitCode=1});`;
    const run = cache => execFileSync(process.execPath, ['-e', script], {encoding: 'utf8',
        env: {...process.env, DORIS_I18N_STRUCTURE_CACHE: cache}}).trim();
    const fresh = run('');
    assert.equal(run(root), fresh);
    assert.equal(run(root), fresh);
});
