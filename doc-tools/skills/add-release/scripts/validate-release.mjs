#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHITECTURES = ['x64', 'x64-noavx2', 'arm64'];
// Position is now a property of the branch, not of a hand-maintained enum:
// ACTIVE_CORE_BRANCHES is ordered newest-first, so its first entry is Latest
// and its last entry is Stable. 'prev' is kept as an alias for 'stable'.
const POSITIONS = ['latest', 'stable', 'prev', 'maintained', 'historical'];
const SIDECAR_SUFFIXES = ['', '.asc', '.sha512'];

class ReleaseValidationError extends Error {
    constructor(failures, checks) {
        super('Release validation failed:\n- ' + failures.join('\n- '));
        this.name = 'ReleaseValidationError';
        this.failures = failures;
        this.checks = checks;
    }
}

function addResult(condition, label, failure, checks, failures) {
    if (condition) {
        checks.push(label);
    } else {
        failures.push(failure || label);
    }
}

function readRequired(repoRoot, relativePath, failures) {
    try {
        return readFileSync(path.join(repoRoot, relativePath), 'utf8');
    } catch (error) {
        failures.push(relativePath + ' could not be read: ' + error.message);
        return '';
    }
}

function parseFrontmatter(markdown, relativePath, failures) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) {
        failures.push(relativePath + ' is missing JSON frontmatter inside --- delimiters');
        return { data: null, body: markdown };
    }

    try {
        return {
            data: JSON.parse(match[1]),
            body: markdown.slice(match[0].length),
        };
    } catch (error) {
        failures.push(relativePath + ' has invalid JSON frontmatter: ' + error.message);
        return { data: null, body: markdown.slice(match[0].length) };
    }
}

function extractAssignedArray(source, variableName) {
    // Anchor on the declaration itself. Matching the bare identifier would also
    // hit a doc comment that merely names the constant, and then silently
    // extract the wrong array.
    const declaration = new RegExp(
        '(?:export\\s+)?const\\s+' + escapeRegExp(variableName) + '\\b[^=\\n]*=',
    ).exec(source);
    if (!declaration) {
        throw new Error(variableName + ' declaration was not found');
    }

    const start = source.indexOf('[', declaration.index + declaration[0].length);
    if (start === -1) {
        throw new Error(variableName + ' array assignment was not found');
    }

    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let index = start; index < source.length; index += 1) {
        const character = source[index];
        const next = source[index + 1];

        if (lineComment) {
            if (character === '\n') {
                lineComment = false;
            }
            continue;
        }

        if (blockComment) {
            if (character === '*' && next === '/') {
                blockComment = false;
                index += 1;
            }
            continue;
        }

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (character === '\\') {
                escaped = true;
            } else if (character === quote) {
                quote = null;
            }
            continue;
        }

        if (character === '/' && next === '/') {
            lineComment = true;
            index += 1;
            continue;
        }
        if (character === '/' && next === '*') {
            blockComment = true;
            index += 1;
            continue;
        }
        if (character === "'" || character === '"' || character.charCodeAt(0) === 96) {
            quote = character;
            continue;
        }
        if (character === '[') {
            depth += 1;
        } else if (character === ']') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, index + 1);
            }
        }
    }

    throw new Error(variableName + ' array is not balanced');
}

function parseStringArray(arraySource) {
    return Array.from(arraySource.matchAll(/['"]([^'"]+)['"]/g)).map(match => match[1]);
}

function extractBranchValues(arraySource) {
    const branches = [];
    for (const match of arraySource.matchAll(/\bvalue\s*:\s*['"]([^'"]+)['"]/g)) {
        const value = match[1];
        if ((/^\d+\.\d+$/.test(value) || value === '0.x') && !branches.includes(value)) {
            branches.push(value);
        }
    }
    return branches;
}

function extractPatchVersions(arraySource, series) {
    const versions = [];
    const seen = new Set();
    const expression = /label\s*:\s*['"](\d+\.\d+\.\d+)['"]/g;

    for (const match of arraySource.matchAll(expression)) {
        const version = match[1];
        if (version.startsWith(series + '.') && !seen.has(version)) {
            versions.push(version);
            seen.add(version);
        }
    }

    return versions;
}

function compareVersions(left, right) {
    const leftParts = left.split('.').map(Number);
    const rightParts = right.split('.').map(Number);
    for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
        const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

function isNewestFirst(versions) {
    return versions.every(
        (version, index) => index === 0 || compareVersions(versions[index - 1], version) >= 0,
    );
}

function countMatches(source, expression) {
    return Array.from(source.matchAll(expression)).length;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');
}

function findCategory(node, label) {
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findCategory(child, label);
            if (found) {
                return found;
            }
        }
        return null;
    }

    if (!node || typeof node !== 'object') {
        return null;
    }
    if (node.label === label && Array.isArray(node.items)) {
        return node;
    }

    for (const value of Object.values(node)) {
        const found = findCategory(value, label);
        if (found) {
            return found;
        }
    }
    return null;
}

function extractIssueReferences(markdown) {
    return Array.from(markdown.matchAll(/#\d+/g), match => match[0]);
}

function extractHeadingLevels(markdown) {
    return Array.from(markdown.matchAll(/^(#{1,6})\s+\S/gm), match => match[1].length);
}

function countBullets(markdown) {
    return countMatches(markdown, /^\s*[-*]\s+\S/gm);
}

function arraysEqual(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateReleaseNote(markdown, relativePath, language, version, checks, failures) {
    if (!markdown) {
        return { body: '' };
    }

    addResult(
        !/[ \t]+$/m.test(markdown),
        relativePath + ' has no trailing whitespace',
        relativePath + ' contains trailing whitespace',
        checks,
        failures,
    );

    const parsed = parseFrontmatter(markdown, relativePath, failures);
    if (parsed.data) {
        addResult(
            typeof parsed.data.title === 'string' && parsed.data.title.includes(version),
            relativePath + ' frontmatter title includes ' + version,
            relativePath + ' frontmatter title must include ' + version,
            checks,
            failures,
        );
        addResult(
            parsed.data.language === language,
            relativePath + ' frontmatter language is ' + language,
            relativePath + ' frontmatter language must be ' + language,
            checks,
            failures,
        );
        addResult(
            typeof parsed.data.description === 'string' &&
                parsed.data.description.includes(version),
            relativePath + ' frontmatter description includes ' + version,
            relativePath + ' frontmatter description must include ' + version,
            checks,
            failures,
        );
    }

    addResult(
        extractHeadingLevels(parsed.body).length > 0,
        relativePath + ' contains release-note headings',
        relativePath + ' contains no release-note headings',
        checks,
        failures,
    );

    return parsed;
}

function validateCoreIndex(markdown, relativePath, version, series, releaseDate, checks, failures) {
    if (!markdown) {
        return;
    }

    const releasePath = './v' + series + '/release-' + version + '.md';
    addResult(
        markdown.includes(version),
        relativePath + ' includes version ' + version,
        relativePath + ' does not mention version ' + version,
        checks,
        failures,
    );
    addResult(
        markdown.includes(releasePath),
        relativePath + ' links to ' + releasePath,
        relativePath + ' does not link to ' + releasePath,
        checks,
        failures,
    );
    addResult(
        markdown.includes(releaseDate),
        relativePath + ' includes release date ' + releaseDate,
        relativePath + ' does not include release date ' + releaseDate,
        checks,
        failures,
    );

    const dates = Array.from(
        markdown.matchAll(/^\s*-\s+\[(\d{4}-\d{2}-\d{2}),/gm),
        match => match[1],
    );
    addResult(
        dates.length > 0 && dates.includes(releaseDate),
        relativePath + ' contains dated release entries',
        relativePath + ' has no dated entry for ' + releaseDate,
        checks,
        failures,
    );
    addResult(
        dates.every((date, index) => index === 0 || dates[index - 1] >= date),
        relativePath + ' release entries are reverse chronological',
        relativePath + ' release entries are not reverse chronological',
        checks,
        failures,
    );
}

function validateProjectIndex(markdown, relativePath, version, checks, failures) {
    if (!markdown) {
        return;
    }

    addResult(
        markdown.includes('./core.md'),
        relativePath + ' routes Doris Core to core.md',
        relativePath + ' must link Doris Core to ./core.md',
        checks,
        failures,
    );
    addResult(
        !markdown.includes('/release-' + version + '.md'),
        relativePath + ' remains a project index',
        relativePath + ' must not contain a per-version core release entry',
        checks,
        failures,
    );
}

function validateGitRouting(repoRoot, projectIndexPaths, checks, failures) {
    const result = spawnSync('git', ['status', '--porcelain', '--', ...projectIndexPaths], {
        cwd: repoRoot,
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        failures.push('Could not inspect all-release.md routing with git: ' + result.stderr.trim());
        return;
    }

    addResult(
        result.stdout.trim() === '',
        'Core release leaves both all-release.md project indexes untouched',
        'Core release must not modify all-release.md project indexes:\n' + result.stdout.trim(),
        checks,
        failures,
    );
}

async function checkUrl(url) {
    const request = async (method, headers = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(url, {
                method,
                headers,
                redirect: 'follow',
                signal: controller.signal,
            });
            if (response.body) {
                await response.body.cancel().catch(() => {});
            }
            return { ok: response.status === 200 || response.status === 206, status: response.status };
        } finally {
            clearTimeout(timeout);
        }
    };

    try {
        const head = await request('HEAD');
        if (head.ok) {
            return head;
        }
        return await request('GET', { Range: 'bytes=0-0' });
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

async function validateLinks(urls, checks, failures) {
    const results = await Promise.all(
        urls.map(async url => ({ url, result: await checkUrl(url) })),
    );

    for (const { url, result } of results) {
        addResult(
            result.ok,
            'Artifact is reachable: ' + url,
            'Artifact is not reachable: ' +
                url +
                ' (' +
                (result.status ? 'HTTP ' + result.status : result.error) +
                ')',
            checks,
            failures,
        );
    }
}

export async function validateCoreRelease(options) {
    const repoRoot = path.resolve(options.repoRoot || process.cwd());
    const version = options.version;
    const series = options.series;
    const sourceVersion = options.sourceVersion || version;
    const releaseDate = options.releaseDate;
    const position = (options.position || 'historical').toLowerCase();
    const sourceDir =
        options.sourceDir ||
        'https://dist.apache.org/repos/dist/release/doris/' + series + '/' + version + '/';
    const binaryOrigin = options.binaryOrigin || 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/';
    const checkLinks = options.checkLinks !== false;
    const checkGitRouting = options.checkGitRouting !== false;
    const checks = [];
    const failures = [];

    if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
        throw new Error('version must use x.y.z format');
    }
    if (!/^\d+\.\d+$/.test(series || '')) {
        throw new Error('series must use x.y format');
    }
    if (version.split('.').slice(0, 2).join('.') !== series) {
        throw new Error('series ' + series + ' does not match version ' + version);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate || '')) {
        throw new Error('releaseDate must use YYYY-MM-DD format');
    }
    if (!POSITIONS.includes(position)) {
        throw new Error('position must be ' + POSITIONS.join(', '));
    }

    const releasePath = 'releasenotes/v' + series + '/release-' + version + '.md';
    const zhReleasePath =
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v' +
        series +
        '/release-' +
        version +
        '.md';
    const corePath = 'releasenotes/core.md';
    const zhCorePath =
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md';
    const projectIndexPaths = [
        'releasenotes/all-release.md',
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md',
    ];

    const english = readRequired(repoRoot, releasePath, failures);
    const chinese = readRequired(repoRoot, zhReleasePath, failures);
    const englishParsed = validateReleaseNote(
        english,
        releasePath,
        'en',
        version,
        checks,
        failures,
    );
    const chineseParsed = validateReleaseNote(
        chinese,
        zhReleasePath,
        'zh-CN',
        version,
        checks,
        failures,
    );

    if (english && chinese) {
        const englishHeadings = extractHeadingLevels(englishParsed.body);
        const chineseHeadings = extractHeadingLevels(chineseParsed.body);
        addResult(
            arraysEqual(englishHeadings, chineseHeadings),
            'English and zh-CN heading-level sequences match',
            'English and zh-CN heading-level sequences differ',
            checks,
            failures,
        );

        addResult(
            countBullets(englishParsed.body) === countBullets(chineseParsed.body),
            'English and zh-CN release-note bullet counts match',
            'English and zh-CN release-note bullet counts differ',
            checks,
            failures,
        );

        const englishIssues = extractIssueReferences(englishParsed.body);
        const chineseIssues = extractIssueReferences(chineseParsed.body);
        addResult(
            arraysEqual(englishIssues, chineseIssues),
            'English and zh-CN issue reference sequences match',
            'Issue reference sequence differs between English and zh-CN release notes',
            checks,
            failures,
        );
    }

    const core = readRequired(repoRoot, corePath, failures);
    const zhCore = readRequired(repoRoot, zhCorePath, failures);
    validateCoreIndex(core, corePath, version, series, releaseDate, checks, failures);
    validateCoreIndex(zhCore, zhCorePath, version, series, releaseDate, checks, failures);

    for (const projectIndexPath of projectIndexPaths) {
        const projectIndex = readRequired(repoRoot, projectIndexPath, failures);
        validateProjectIndex(projectIndex, projectIndexPath, version, checks, failures);
    }
    if (checkGitRouting) {
        validateGitRouting(repoRoot, projectIndexPaths, checks, failures);
    }

    const sidebarSource = readRequired(repoRoot, 'sidebarsReleases.json', failures);
    if (sidebarSource) {
        try {
            const sidebar = JSON.parse(sidebarSource);
            checks.push('sidebarsReleases.json is valid JSON');
            const coreCategory = findCategory(sidebar, 'Doris Core');
            addResult(
                Boolean(coreCategory),
                'Doris Core sidebar category exists',
                'Doris Core sidebar category was not found',
                checks,
                failures,
            );
            const seriesCategory = coreCategory
                ? coreCategory.items.find(item => item && item.label === 'v' + series)
                : null;
            addResult(
                Boolean(seriesCategory),
                'Doris Core sidebar contains v' + series,
                'Doris Core sidebar category v' + series + ' was not found',
                checks,
                failures,
            );
            if (seriesCategory) {
                const expectedId = 'v' + series + '/release-' + version;
                addResult(
                    seriesCategory.items[0] === expectedId,
                    expectedId + ' is the first sidebar item in its series',
                    expectedId + ' must be the first sidebar item in its series',
                    checks,
                    failures,
                );
            }
        } catch (error) {
            failures.push('sidebarsReleases.json is invalid JSON: ' + error.message);
        }
    }

    const downloadPath = 'src/constant/download.data.ts';
    const downloadSource = readRequired(repoRoot, downloadPath, failures);
    if (downloadSource) {
        let allArray = '';
        let activeBranches = null;
        try {
            allArray = extractAssignedArray(downloadSource, 'ALL_VERSIONS');
            checks.push('ALL_VERSIONS array is readable');
        } catch (error) {
            failures.push(downloadPath + ': ' + error.message);
        }
        try {
            activeBranches = parseStringArray(
                extractAssignedArray(downloadSource, 'ACTIVE_CORE_BRANCHES'),
            );
            checks.push('ACTIVE_CORE_BRANCHES is readable');
        } catch (error) {
            failures.push(downloadPath + ': ' + error.message);
        }

        if (allArray) {
            const allVersions = extractPatchVersions(allArray, series);
            addResult(
                allVersions.includes(version),
                'ALL_VERSIONS includes ' + version,
                version + ' is missing from ALL_VERSIONS',
                checks,
                failures,
            );
            addResult(
                isNewestFirst(allVersions),
                'ALL_VERSIONS ' + series + ' entries are newest-first',
                'ALL_VERSIONS ' + series + ' entries are not newest-first',
                checks,
                failures,
            );

            // ACTIVE_HEADS takes the first child of each maintained branch, and
            // that is what the quick download card offers. A new headline patch
            // that is not first in its series never reaches the top of the page.
            if (position !== 'historical') {
                addResult(
                    allVersions[0] === version,
                    version + ' is the newest patch of ' + series + ', so ACTIVE_HEADS picks it up',
                    version +
                        ' must be the first ' +
                        series +
                        ' entry in ALL_VERSIONS; the quick download card offers the first child of each maintained branch',
                    checks,
                    failures,
                );
            }

            const sourceVersionExpression = new RegExp(
                "version\\s*:\\s*['\"]" + escapeRegExp(sourceVersion) + "['\"]",
                'g',
            );
            const sourceVersionCount = countMatches(allArray, sourceVersionExpression);
            addResult(
                sourceVersionCount === ARCHITECTURES.length,
                'Source filename version ' + sourceVersion + ' is set for all three package rows',
                'Expected source filename version ' +
                    sourceVersion +
                    ' in three package rows, found ' +
                    sourceVersionCount,
                checks,
                failures,
            );

            for (const architecture of ARCHITECTURES) {
                for (const suffix of SIDECAR_SUFFIXES) {
                    const filename =
                        'apache-doris-' + version + '-bin-' + architecture + '.tar.gz' + suffix;
                    addResult(
                        allArray.includes(filename),
                        filename + ' exists in ALL_VERSIONS',
                        filename + ' must exist in ALL_VERSIONS',
                        checks,
                        failures,
                    );
                }
            }

            const normalizedSourceDir = sourceDir.endsWith('/') ? sourceDir : sourceDir + '/';
            const sourceDirCount = allArray.split(normalizedSourceDir).length - 1;
            addResult(
                sourceDirCount === ARCHITECTURES.length,
                'Source directory is set for all three package rows',
                'Expected source directory ' +
                    normalizedSourceDir +
                    ' in three package rows, found ' +
                    sourceDirCount,
                checks,
                failures,
            );
        }

        if (activeBranches) {
            // A branch that is not in this list is archived: it disappears from
            // the maintained sections of /download and moves behind the archive
            // picker. Opening a new branch without adding it here ships a
            // release that never appears on the page.
            const branchIndex = activeBranches.indexOf(series);

            if (position === 'historical') {
                addResult(
                    true,
                    'Historical release: ' +
                        series +
                        ' is ' +
                        (branchIndex === -1 ? 'archived' : 'still maintained') +
                        ', no branch-list change required',
                    '',
                    checks,
                    failures,
                );
            } else {
                addResult(
                    branchIndex !== -1,
                    'ACTIVE_CORE_BRANCHES lists ' + series + ' as maintained',
                    'ACTIVE_CORE_BRANCHES must list ' +
                        series +
                        '; a branch missing from it is treated as archived and is hidden from the maintained download sections',
                    checks,
                    failures,
                );

                if (branchIndex !== -1) {
                    const lastIndex = activeBranches.length - 1;
                    if (position === 'latest') {
                        addResult(
                            branchIndex === 0,
                            series + ' is first in ACTIVE_CORE_BRANCHES, so it renders as Latest',
                            series +
                                ' must be first in ACTIVE_CORE_BRANCHES to render as Latest, found index ' +
                                branchIndex,
                            checks,
                            failures,
                        );
                    } else if (position === 'stable' || position === 'prev') {
                        addResult(
                            branchIndex === lastIndex,
                            series + ' is last in ACTIVE_CORE_BRANCHES, so it renders as Stable',
                            series +
                                ' must be last in ACTIVE_CORE_BRANCHES to render as Stable, found index ' +
                                branchIndex,
                            checks,
                            failures,
                        );
                    } else {
                        addResult(
                            branchIndex > 0 && branchIndex < lastIndex,
                            series + ' sits between Latest and Stable in ACTIVE_CORE_BRANCHES',
                            series +
                                ' must sit between the first and last ACTIVE_CORE_BRANCHES entries to render as Maintained, found index ' +
                                branchIndex,
                            checks,
                            failures,
                        );
                    }
                }
            }

            if (allArray) {
                const branchValues = extractBranchValues(allArray);
                for (const branch of activeBranches) {
                    addResult(
                        branchValues.includes(branch),
                        'Maintained branch ' + branch + ' has data in ALL_VERSIONS',
                        'ACTIVE_CORE_BRANCHES lists ' +
                            branch +
                            ' but ALL_VERSIONS has no such branch, so its download section renders empty',
                        checks,
                        failures,
                    );
                }
            }
        }

        const originMatch = downloadSource.match(
            /\bORIGIN\s*=\s*['"]([^'"]+)['"]/,
        );
        addResult(
            Boolean(originMatch) &&
                originMatch[1].replace(/\/?$/, '/') === binaryOrigin.replace(/\/?$/, '/'),
            'Binary ORIGIN matches ' + binaryOrigin,
            'Binary ORIGIN must match ' + binaryOrigin,
            checks,
            failures,
        );
    }

    if (checkLinks) {
        const normalizedSourceDir = sourceDir.endsWith('/') ? sourceDir : sourceDir + '/';
        const normalizedBinaryOrigin = binaryOrigin.endsWith('/')
            ? binaryOrigin
            : binaryOrigin + '/';
        const urls = [
            ...SIDECAR_SUFFIXES.map(
                suffix =>
                    normalizedSourceDir +
                    'apache-doris-' +
                    sourceVersion +
                    '-src.tar.gz' +
                    suffix,
            ),
            ...ARCHITECTURES.flatMap(architecture =>
                SIDECAR_SUFFIXES.map(
                    suffix =>
                        normalizedBinaryOrigin +
                        'apache-doris-' +
                        version +
                        '-bin-' +
                        architecture +
                        '.tar.gz' +
                        suffix,
                ),
            ),
        ];
        await validateLinks(urls, checks, failures);
    }

    if (failures.length > 0) {
        throw new ReleaseValidationError(failures, checks);
    }

    return { checks };
}

function usage() {
    return [
        'Usage:',
        '  node doc-tools/skills/add-release/scripts/validate-release.mjs \\',
        '    --component doris-core --version 4.1.3 --series 4.1 \\',
        '    --source-version 4.1.3-rc02 --release-date 2026-07-13 \\',
        '    --position latest [--source-dir URL] [--binary-origin URL] \\',
        '    [--repo-root PATH] [--skip-links] [--skip-git-routing]',
    ].join('\n');
}

function parseArguments(argv) {
    const options = {};
    const flags = new Set(['--skip-links', '--skip-git-routing', '--help']);

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (flags.has(argument)) {
            options[argument.slice(2)] = true;
            continue;
        }
        if (!argument.startsWith('--')) {
            throw new Error('Unexpected argument: ' + argument);
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) {
            throw new Error('Missing value for ' + argument);
        }
        options[argument.slice(2)] = value;
        index += 1;
    }

    return options;
}

async function main() {
    let args;
    try {
        args = parseArguments(process.argv.slice(2));
    } catch (error) {
        console.error(error.message);
        console.error(usage());
        process.exitCode = 2;
        return;
    }

    if (args.help) {
        console.log(usage());
        return;
    }
    if (args.component !== 'doris-core') {
        console.error(
            'The bundled validator currently supports --component doris-core only. ' +
                'Use the manual ecosystem checklist in SKILL.md for other components.',
        );
        process.exitCode = 2;
        return;
    }

    const required = ['version', 'series', 'source-version', 'release-date', 'position'];
    const missing = required.filter(name => !args[name]);
    if (missing.length > 0) {
        console.error('Missing required arguments: ' + missing.map(name => '--' + name).join(', '));
        console.error(usage());
        process.exitCode = 2;
        return;
    }

    try {
        const result = await validateCoreRelease({
            repoRoot: args['repo-root'],
            version: args.version,
            series: args.series,
            sourceVersion: args['source-version'],
            releaseDate: args['release-date'],
            position: args.position,
            sourceDir: args['source-dir'],
            binaryOrigin: args['binary-origin'],
            checkLinks: !args['skip-links'],
            checkGitRouting: !args['skip-git-routing'],
        });
        for (const check of result.checks) {
            console.log('PASS ' + check);
        }
        console.log('Validated Doris Core ' + args.version + ': ' + result.checks.length + ' checks passed.');
    } catch (error) {
        if (Array.isArray(error.checks)) {
            for (const check of error.checks) {
                console.log('PASS ' + check);
            }
        }
        console.error(error.message);
        process.exitCode = 1;
    }
}

const isMain =
    process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
    await main();
}
