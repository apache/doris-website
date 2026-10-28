// Explicit one-time cutoff. Never silently advance this file during a scan.
const fs = require('node:fs'),
    path = require('node:path'),
    assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { collect } = require('./blog-inventory.cjs');
const { hash } = require('./state.cjs');
async function create(root, sourceCommit) {
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.equal(git('rev-parse', 'HEAD').trim(), sourceCommit, 'Create the cutoff from its exact source checkout');
    const file = path.join(root, 'translations/blog-baseline.json');
    assert(!fs.existsSync(file), 'Blog cutoff already exists; do not advance it');
    const inventory = await collect(root),
        instance = inventory.instances.find(i => i.pluginId === 'default');
    assert(instance, 'Missing default native blog');
    const documents = instance.posts
        .map(post => {
            const source = git('show', `${sourceCommit}:${post.sourcePath}`);
            assert.equal(
                hash(fs.readFileSync(path.join(root, post.sourcePath), 'utf8')),
                hash(source),
                'Uncommitted blog source',
            );
            return {
                docId: post.sourcePath.slice(5),
                sourcePath: post.sourcePath,
                sourceHash: hash(source),
                permalink: post.permalink,
            };
        })
        .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
    const sourceFiles = git('ls-tree', '-r', '--name-only', '-z', sourceCommit, '--', 'blog')
        .split('\0')
        .filter(f => /\.mdx?$/.test(f))
        .sort();
    const historicalPaths = [
        ...new Set(
            git('log', '--format=', '--name-only', '-z', sourceCommit, '--', 'blog')
                .split('\0')
                .filter(f => f.startsWith('blog/') && /\.mdx?$/.test(f)),
        ),
    ].sort();
    const result = {
        schemaVersion: 1,
        sourceCommit,
        pluginId: 'blog',
        version: 'current',
        sourceRoot: 'blog',
        locales: ['ja', 'ko', 'ru'],
        historicalFallbackLocales: ['zh-CN', 'ja', 'ko', 'ru'],
        documents,
        sourceFiles,
        historicalPaths,
    };
    fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
    return result;
}
if (require.main === module) {
    const ref = process.argv[2];
    assert(/^[a-f0-9]{40}$/.test(ref ?? ''), 'Usage: create-blog-baseline.cjs <exact source SHA>');
    create(path.resolve(__dirname, '../..'), ref)
        .then(r =>
            console.log(
                JSON.stringify({
                    sourceCommit: r.sourceCommit,
                    posts: r.documents.length,
                    sourceFiles: r.sourceFiles.length,
                    historicalPaths: r.historicalPaths.length,
                }),
            ),
        )
        .catch(e => {
            console.error(e);
            process.exitCode = 1;
        });
}
module.exports = { create };
