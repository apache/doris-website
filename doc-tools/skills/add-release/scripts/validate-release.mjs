#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHITECTURES = ['x64', 'x64-noavx2', 'arm64'];
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
    const declaration = source.search(new RegExp('\\b' + variableName + '\\b'));
    if (declaration === -1) {
        throw new Error(variableName + ' declaration was not found');
    }

    const equals = source.indexOf('=', declaration);
    const start = source.indexOf('[', equals);
    if (equals === -1 || start === -1) {
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
    const binaryOrigin = options.binaryOrigin || 'https://download.selectdb.com/';
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
    if (!['latest', 'prev', 'earlier', 'historical'].includes(position)) {
        throw new Error('position must be latest, prev, earlier, or historical');
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
        let dorisArray = '';
        let allArray = '';
        try {
            dorisArray = extractAssignedArray(downloadSource, 'DORIS_VERSIONS');
            allArray = extractAssignedArray(downloadSource, 'ALL_VERSIONS');
            checks.push('DORIS_VERSIONS and ALL_VERSIONS arrays are readable');
        } catch (error) {
            failures.push(downloadPath + ': ' + error.message);
        }

        if (dorisArray && allArray) {
            const dorisVersions = extractPatchVersions(dorisArray, series);
            const allVersions = extractPatchVersions(allArray, series);
            addResult(
                dorisVersions.includes(version),
                'DORIS_VERSIONS includes ' + version,
                version + ' is missing from DORIS_VERSIONS',
                checks,
                failures,
            );
            addResult(
                allVersions.includes(version),
                'ALL_VERSIONS includes ' + version,
                version + ' is missing from ALL_VERSIONS',
                checks,
                failures,
            );
            addResult(
                isNewestFirst(dorisVersions),
                'DORIS_VERSIONS ' + series + ' entries are newest-first',
                'DORIS_VERSIONS ' + series + ' entries are not newest-first',
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

            for (const listedVersion of dorisVersions) {
                addResult(
                    allVersions.includes(listedVersion),
                    listedVersion + ' is mirrored in ALL_VERSIONS',
                    listedVersion + ' is missing from ALL_VERSIONS',
                    checks,
                    failures,
                );
            }
            for (const listedVersion of allVersions) {
                addResult(
                    dorisVersions.includes(listedVersion),
                    listedVersion + ' is mirrored in DORIS_VERSIONS',
                    listedVersion + ' is missing from DORIS_VERSIONS',
                    checks,
                    failures,
                );
            }

            const sourceVersionExpression = new RegExp(
                "version\\s*:\\s*['\"]" + escapeRegExp(sourceVersion) + "['\"]",
                'g',
            );
            const sourceVersionCount =
                countMatches(dorisArray, sourceVersionExpression) +
                countMatches(allArray, sourceVersionExpression);
            addResult(
                sourceVersionCount === ARCHITECTURES.length * 2,
                'Source filename version ' + sourceVersion + ' is set for all six package rows',
                'Expected source filename version ' +
                    sourceVersion +
                    ' in six package rows, found ' +
                    sourceVersionCount,
                checks,
                failures,
            );

            for (const architecture of ARCHITECTURES) {
                for (const suffix of SIDECAR_SUFFIXES) {
                    const filename =
                        'apache-doris-' +
                        version +
                        '-bin-' +
                        architecture +
                        '.tar.gz' +
                        suffix;
                    addResult(
                        dorisArray.includes(filename) && allArray.includes(filename),
                        filename + ' exists in both download data arrays',
                        filename + ' must exist in both DORIS_VERSIONS and ALL_VERSIONS',
                        checks,
                        failures,
                    );
                }
            }

            const normalizedSourceDir = sourceDir.endsWith('/') ? sourceDir : sourceDir + '/';
            const sourceDirCount =
                dorisArray.split(normalizedSourceDir).length -
                1 +
                (allArray.split(normalizedSourceDir).length - 1);
            addResult(
                sourceDirCount === ARCHITECTURES.length * 2,
                'Source directory is set for all six package rows',
                'Expected source directory ' +
                    normalizedSourceDir +
                    ' in six package rows, found ' +
                    sourceDirCount,
                checks,
                failures,
            );
        }

        if (position !== 'historical') {
            const enumName = {
                latest: 'Latest',
                prev: 'Prev',
                earlier: 'Earlier',
            }[position];
            const enumExpression = new RegExp(
                "\\b" + enumName + "\\s*=\\s*['\"]" + escapeRegExp(version) + "['\"]",
            );
            addResult(
                enumExpression.test(downloadSource),
                'VersionEnum.' + enumName + ' points to ' + version,
                'VersionEnum.' + enumName + ' must point to ' + version,
                checks,
                failures,
            );
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
