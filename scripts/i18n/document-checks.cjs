// Shared by generation retries and the PR preflight. Link resolution is the
// same Python implementation used by check-md-links.yml.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {hash} = require('./state.cjs');
const {structure, alignHeadings} = require('./structure.cjs');
const {protectionSignature, protectedContent} = require('./protection.cjs');

const policy = 'whole-document-v1';
const signature = parsed => protectionSignature(parsed, {normalizeProseNumbers: true});

function protectionDifference(source, target) {
    const expected = protectedContent(source, {normalizeProseNumbers: true});
    const actual = protectedContent(target, {normalizeProseNumbers: true});
    const details = [];
    const describe = value => (JSON.stringify(value) ?? 'missing').slice(0, 1500);
    for (const [index, label] of [[0, 'technical front matter'], [2, 'numeric values'], [3, 'heading IDs']]) {
        if (JSON.stringify(expected[index]) !== JSON.stringify(actual[index]))
            details.push(`${label}: expected ${describe(expected[index])}; received ${describe(actual[index])}`);
    }
    for (let index = 0; index < Math.max(expected[1].length, actual[1].length) && details.length < 3; index++) {
        if (JSON.stringify(expected[1][index]) !== JSON.stringify(actual[1][index]))
            details.push(`protected node ${index + 1}: expected ${describe(expected[1][index])}; received ${describe(actual[1][index])}`);
    }
    return details.join('\n');
}

function isDocumentGeneration(record, source, target) {
    const review = record.generation;
    return record.ownership === 'machine' && record.reviewStatus === 'machine'
        && review?.policy === policy && Number.isInteger(review.attempts) && review.attempts >= 1 && review.attempts <= 3
        && Array.isArray(review.history) && review.history.length === review.attempts
        && review.history.every((item, index) => item.attempt === index + 1 && Array.isArray(item.issues))
        && Array.isArray(review.warnings)
        && review.acceptedWithWarnings === (review.warnings.length > 0)
        && (review.warnings.length === 0 || review.attempts === 3)
        && JSON.stringify(review.warnings) === JSON.stringify(review.history.at(-1).issues)
        && review.sourceHash === hash(source) && review.targetHash === hash(target);
}

function acceptedFallback(record, source, target) {
    return isDocumentGeneration(record, source, target) && record.generation.attempts === 3
        && record.generation.acceptedWithWarnings === true && record.generation.warnings.length > 0;
}

function checkLinks({root, targetPath, target}) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-link-check-'));
    try {
        const file = path.join(temp, 'candidate.md');
        fs.writeFileSync(file, target);
        const result = spawnSync('python3', [path.join(root, 'scripts/check_md_links_single.py'),
            path.join(root, targetPath), '--no-external', '--content-file', file],
        {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
        if (result.error || result.status !== 0) {
            const detail = (result.stdout || '').split('\n').filter(line => /❌|file not found/.test(line)).join('\n');
            throw new Error(`PR internal link check failed: ${detail || result.stderr || result.error?.message || result.status}`);
        }
    } finally {fs.rmSync(temp, {recursive: true, force: true});}
}

async function checkSyntax(target, extension) {
    const parsed = await structure(target, extension);
    if (parsed.format === 'mdx') {
        const {compile} = await import('@mdx-js/mdx');
        const {escapeMarkdownHeadingIds} = require('@docusaurus/utils');
        // Docusaurus removes front matter before MDX compilation. In particular,
        // a JSON-style YAML header must not be parsed as a JavaScript expression.
        await compile(escapeMarkdownHeadingIds(parsed.content));
    }
}

async function inspectDocument({source, translation, extension, glossary, targetLocale, targetScriptPattern,
    root, targetPath}) {
    let target = translation.replace(/^```(?:markdown|mdx?)\s*\n([\s\S]*)\n```\s*$/, '$1');
    target = target.replace(/[\t ]+$/gm, '').replace(/\n*$/, '\n');
    const issues = [];
    const check = async (name, fn) => {
        try {await fn();} catch (error) {issues.push({check: name, message: error.message});}
    };
    const parsed = await structure(source, extension);
    await check('headings', async () => {target = await alignHeadings(parsed, target, extension);});
    await check('syntax', () => checkSyntax(target, extension));
    await check('protected-content', async () => {
        const translated = await structure(target, extension);
        if (signature(translated) !== signature(parsed))
            throw new Error('Restore protected source content:\n' + protectionDifference(parsed, translated));
    });
    await check('language', () => {
        if (target === source || !new RegExp(targetScriptPattern, 'u').test(target))
            throw new Error(`Translate the complete document into ${targetLocale}`);
    });
    // Word boundaries apply to Latin identifiers, including those next to
    // Japanese text. BEFORE must never count as the product term BE.
    const contains = (text, term) => new RegExp(`(?<![A-Za-z0-9_])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_])`, 'i').test(text);
    for (const term of glossary.keep) {
        if (contains(source, term) && !contains(target, term))
            issues.push({check: 'glossary', message: `Preserve product term: ${term}`});
    }
    for (const term of glossary.terms.filter(item => item.required)) {
        if (contains(source, term.source) && !target.includes(term.target))
            issues.push({check: 'glossary', message: `Use ${term.target} for ${term.source}`});
    }
    if (root && targetPath) await check('internal-links', () => checkLinks({root, targetPath, target}));
    return {target, issues};
}

module.exports = {policy, signature, isDocumentGeneration, acceptedFallback, checkLinks, checkSyntax, inspectDocument};
