'use strict';

// Generates scripts/last-update/data.json: a { "<repo-relative md path>":
// "<ISO commit date>" } map of every built document's last update time,
// derived from this repo's git history.
//
// docusaurus.config.js reads this map at build time (markdown.parseFrontMatter)
// and injects it as each document's `last_update` front matter, so the regular
// 2-hourly deploy can render "last updated" without a full-history clone or a
// per-file git lookup. Refreshed on demand by the "Refresh Docs Last-Update
// Map" workflow (.github/workflows/refresh-docs-last-update.yml).
//
// Requires full git history to be accurate. In a shallow clone every file
// resolves to the single HEAD commit, so run this only where the history is
// available (locally, or the workflow's fetch-depth: 0 checkout).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.join(__dirname, 'data.json');

// Versions the site actually builds: docs/ (the "current"/Dev version) plus
// the versions listed in versions.json. Other version-* dirs on disk (e.g.
// version-1.2) are not built, so we don't spend map entries on them.
const VERSIONS = require(path.join(REPO_ROOT, 'versions.json'));

// Repo-relative directories whose Markdown we timestamp. These paths match
// what path.relative(siteDir, absFilePath) yields at build time, so the map
// keys line up with parseFrontMatter's lookup. zh-CN translations carry their
// own git history, hence their own (correct) timestamps.
function targetDirs() {
    const dirs = ['docs'];
    for (const v of VERSIONS) dirs.push(`versioned_docs/version-${v}`);
    dirs.push('community');
    dirs.push('i18n/zh-CN/docusaurus-plugin-content-docs/current');
    for (const v of VERSIONS) {
        dirs.push(`i18n/zh-CN/docusaurus-plugin-content-docs/version-${v}`);
    }
    dirs.push('i18n/zh-CN/docusaurus-plugin-content-docs-community/current');
    return dirs.filter((d) => fs.existsSync(path.join(REPO_ROOT, d)));
}

// One pass over history: `git log` is newest-first, so the first date we see
// for a path is its most recent commit. Merges are skipped (Doris lands PRs as
// squashed single commits; --name-only shows nothing for merges anyway).
function buildHistoryMap(dirs) {
    const out = execFileSync(
        'git',
        [
            '-c', 'core.quotePath=false',
            'log', '--no-merges', '--name-only', '--format=__C__%cI',
            '--', ...dirs,
        ],
        { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 },
    );
    const map = new Map();
    let date = null;
    for (const line of out.split('\n')) {
        if (line.startsWith('__C__')) {
            date = line.slice(5);
        } else if (line && date && !map.has(line)) {
            map.set(line, date);
        }
    }
    return map;
}

function walkMarkdown(relDir) {
    const files = [];
    for (const entry of fs.readdirSync(path.join(REPO_ROOT, relDir), { withFileTypes: true })) {
        const relPath = `${relDir}/${entry.name}`;
        if (entry.isDirectory()) {
            files.push(...walkMarkdown(relPath));
        } else if (/\.mdx?$/.test(entry.name)) {
            files.push(relPath);
        }
    }
    return files;
}

// Per-file dates need the full history; a shallow clone collapses every file
// to the single HEAD commit. Fail loud rather than write a misleading map.
function assertFullHistory() {
    let shallow;
    try {
        shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
            cwd: REPO_ROOT, encoding: 'utf8',
        }).trim();
    } catch (e) {
        console.error('last-update: not a git repository, or git is not installed.');
        process.exit(1);
    }
    if (shallow === 'true') {
        console.error(
            'last-update: shallow clone detected — every file would resolve to '
            + 'the latest commit.\nRun `git fetch --unshallow` and retry.',
        );
        process.exit(1);
    }
}

function main() {
    assertFullHistory();

    const dirs = targetDirs();
    const history = buildHistoryMap(dirs);

    const result = {};
    let missing = 0;
    for (const dir of dirs) {
        for (const file of walkMarkdown(dir)) {
            const date = history.get(file);
            if (date) result[file] = date;
            else missing += 1;
        }
    }

    // Sorted keys keep the committed JSON stable so each refresh produces a
    // minimal diff (only the documents whose dates actually changed).
    const sorted = {};
    for (const key of Object.keys(result).sort()) sorted[key] = result[key];

    fs.writeFileSync(OUTPUT, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
    console.log(
        `last-update: wrote ${Object.keys(sorted).length} entries to `
        + `${path.relative(REPO_ROOT, OUTPUT)}`
        + (missing ? ` (${missing} files had no git history, skipped)` : ''),
    );
}

main();
