const fs = require('node:fs'),
    path = require('node:path'),
    assert = require('node:assert/strict');
const {execFileSync, spawnSync} = require('node:child_process');
const {createFixture} = require('./__tests__/fixtures/multi-locale.cjs');
const {plan} = require('./ci-plan.cjs');
const {verify} = require('./verify-ci-sample.cjs');
const root = path.resolve(__dirname, '../..');
async function main() {
    const site = path.join(root, '.i18n-build/ci-sampling-fixture');
    fs.rmSync(site, {recursive: true, force: true});
    const {write} = await createFixture(site);
    write(
        'docs/02-rich.mdx',
        '---\ntitle: Rich MDX\n---\n\nimport Widget from "@site/src/components/FixtureRich";\n\n<Widget />\n\n$$ x + 1 $$\n',
    );
    write(
        'src/components/FixtureRich.tsx',
        "import React from 'react'; export default function Widget(){return <p>Rich module compiled</p>;}\n",
    );
    write(
        'docs/zz-unselected.mdx',
        '---\ntitle: Unselected module\n---\n\nimport Missing from "./does-not-exist";\n\n<Missing />\n',
    );
    fs.appendFileSync(
        path.join(site, 'docs/02-rich.mdx'),
        '\n[Known uncompiled route](./zz-unselected.mdx#not-checked)\n',
    );
    const git = (...args) =>
        execFileSync('git', args, {cwd: site, encoding: 'utf8', stdio: 'pipe'}).trim();
    const commit = () => {
        git('add', '.');
        git(
            '-c',
            'user.name=Fixture',
            '-c',
            'user.email=fixture@example.com',
            'commit',
            '-qm',
            'Sample inputs',
        );
    };
    commit();
    const base = git('rev-parse', 'HEAD'),
        report = plan({root: site, base, forceSample: true});
    fs.mkdirSync(path.join(site, '.i18n-build'), {recursive: true});
    const file = path.join(site, '.i18n-build/ci-plan.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    const run = (stdio = 'inherit') =>
        spawnSync(process.execPath, [path.join(root, 'scripts/i18n/build-ci-sample.cjs'), file], {
            cwd: site,
            stdio,
            encoding: 'utf8',
            env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=4096',
                DORIS_OPTIMIZE_PUBLISH: 'false',
            },
        });
    assert.equal(run().status, 0, 'Representative sample build');
    const scopes = report.locales.map(locale =>
        JSON.parse(
            fs.readFileSync(path.join(site, '.i18n-build/ci-sample/scopes', locale + '.json')),
        ),
    );
    for (const scope of scopes) {
        assert(scope.renderedDocs < scope.metadataDocs);
        assert(!scope.selected.some(r => r.docId === 'zz-unselected'));
        assert(scope.compiledMdxModules.client.length > 0);
        assert(!scope.compiledMdxModules.client.includes('docs/zz-unselected.mdx'));
    }
    await verify({root: site, browser: process.argv.includes('--browser')});
    assert(
        scopes.find(s => s.locale === 'en').anchorChecksSkipped > 0,
        'Uncompiled anchors must be disclosed',
    );
    const proof = {
        schemaVersion: 1,
        implementation: gitRootSha(),
        sourceSha: report.sourceSha,
        locales: scopes.map(s => ({
            locale: s.locale,
            metadataDocs: s.metadataDocs,
            renderedDocs: s.renderedDocs,
            skippedAnchors: s.anchorChecksSkipped,
        })),
        excludedBrokenModuleWasNotCompiled: true,
    };
    // A real edit makes that same module mandatory. Its missing import must now
    // fail compilation instead of being silently dropped by the sampler.
    fs.appendFileSync(path.join(site, 'docs/zz-unselected.mdx'), '\nChanged.\n');
    commit();
    const changed = plan({root: site, base, forceSample: true});
    fs.writeFileSync(file, JSON.stringify(changed, null, 2));
    const failed = run('pipe');
    fs.writeFileSync(
        path.join(root, '.i18n-build/ci-sampling-expected-failure.log'),
        failed.stdout + failed.stderr,
    );
    assert.notEqual(failed.status, 0, 'Changed module with a broken import must fail');
    assert.match(
        failed.stdout + failed.stderr,
        /does-not-exist/,
        'The changed document must reach the compiler',
    );
    proof.changedBrokenModuleFailed = true;
    fs.writeFileSync(
        path.join(root, '.i18n-build/ci-sampling-fixture-proof.json'),
        JSON.stringify(proof, null, 2) + '\n',
    );
    console.log(JSON.stringify(proof));
}
function gitRootSha() {
    return execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
}
if (require.main === module)
    main().catch(e => {
        console.error(e);
        process.exitCode = 1;
    });
