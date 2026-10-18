const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {hash} = require('./state.cjs');
const {structure, alignHeadings} = require('./structure.cjs');
const {signature} = require('./document-checks.cjs');

const threshold = 0.3;
const verbatimKinds = new Set(['code', 'definition', 'mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression']);

// Git handles long documents without a quadratic in-memory diff table. Zero
// context keeps replacements together and gives exact old/new block indices.
function diffRanges(before, after) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-diff-'));
    try {
        const files = ['before', 'after'].map(name => path.join(dir, name));
        for (const [index, lines] of [before, after].entries())
            fs.writeFileSync(files[index], lines.length ? lines.join('\n') + '\n' : '');
        const result = spawnSync('git', ['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--no-color',
            '--text', '--unified=0', '--inter-hunk-context=0', '--diff-algorithm=myers', '--', ...files],
        {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
        assert(!result.error && [0, 1].includes(result.status), 'Cannot compare translation sources');
        return [...result.stdout.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)].map(match => {
            const oldCount = Number(match[2] ?? 1), newCount = Number(match[4] ?? 1);
            return {oldStart: Number(match[1]) - (oldCount ? 1 : 0), oldCount,
                newStart: Number(match[3]) - (newCount ? 1 : 0), newCount};
        });
    } finally {fs.rmSync(dir, {recursive: true, force: true});}
}

function sourceChange(previousSource, source) {
    const lines = text => text.split(/\r?\n/).filter(line => line.trim());
    const before = lines(previousSource), after = lines(source);
    const ranges = diffRanges(before, after);
    const changedLines = ranges.reduce((sum, item) => sum + Math.max(item.oldCount, item.newCount), 0);
    const totalLines = Math.max(before.length, after.length);
    return {changedLines, totalLines, ratio: totalLines ? Math.min(1, changedLines / totalLines) : 0};
}

function blocksFor(raw, parsed) {
    let end = 0;
    const blocks = parsed.blocks.map(block => {
        const result = {...block, text: raw.slice(block.start, block.end), leading: raw.slice(end, block.start)};
        end = block.end;
        return result;
    });
    return {blocks, tail: raw.slice(end)};
}

async function planIncremental({source, previousSource, previousTarget, extension}) {
    const change = sourceChange(previousSource, source);
    const full = reason => ({mode: 'full', reason, change});
    if (change.ratio > threshold) return full('source-change-exceeds-30-percent');
    let before, translated, after, aligned;
    try {
        [before, translated, after] = await Promise.all([
            structure(previousSource, extension), structure(previousTarget, extension), structure(source, extension),
        ]);
        aligned = await structure(await alignHeadings(before, previousTarget, extension), extension);
    } catch {return full('baseline-cannot-be-parsed-or-aligned');}
    const old = blocksFor(previousSource, before), target = blocksFor(previousTarget, translated);
    const next = blocksFor(source, after);
    // Whole-document translations may split or merge paragraphs. Only reuse a
    // baseline whose section/block structure and protected content still align.
    if (signature(before) !== signature(aligned) || old.blocks.length !== target.blocks.length
        || old.blocks.some((block, index) => block.kind !== target.blocks[index].kind))
        return full('baseline-blocks-do-not-align');

    const keys = blocks => blocks.map(block => hash(`${block.kind}\0${block.text}`));
    const ranges = diffRanges(keys(old.blocks), keys(next.blocks));
    const reused = new Map(), replacements = new Map(), changes = [];
    let oldIndex = 0, newIndex = 0;
    const reuseUntil = end => {
        while (newIndex < end) reused.set(newIndex++, oldIndex++);
    };
    for (const range of ranges) {
        reuseUntil(range.newStart);
        for (let offset = 0; offset < range.newCount; offset++) {
            const index = range.newStart + offset, block = next.blocks[index];
            if (verbatimKinds.has(block.kind)) {
                replacements.set(index, block.text);
                continue;
            }
            const prior = range.oldCount === range.newCount ? range.oldStart + offset : null;
            changes.push({id: `b${index}`, text: block.text,
                previousText: prior === null ? '' : old.blocks[prior].text,
                previousTranslation: prior === null ? '' : target.blocks[prior].text});
        }
        oldIndex = range.oldStart + range.oldCount;
        newIndex = range.newStart + range.newCount;
    }
    reuseUntil(next.blocks.length);

    return {mode: 'incremental', reason: 'source-change-within-30-percent', change, changes,
        reusedBlocks: reused.size, async assemble(answer) {
            assert(Array.isArray(answer?.translations) && answer.translations.length === changes.length,
                'Model returned missing or extra changed blocks');
            const values = new Map(replacements), expected = new Set(changes.map(item => item.id));
            for (const item of answer.translations) {
                assert(expected.delete(item.id) && typeof item.text === 'string' && item.text.trim(),
                    'Invalid or duplicate changed block');
                const index = Number(item.id.slice(1)), block = next.blocks[index];
                const text = item.text.replace(/^```(?:markdown|mdx?)\s*\n([\s\S]*)\n```\s*$/, '$1').trim()
                    + /\s*$/.exec(block.text)[0];
                const parsed = await structure(text, extension);
                assert(parsed.blocks.length === 1 && parsed.blocks[0].kind === block.kind,
                    `Changed block ${item.id} must preserve its Markdown/MDX block structure`);
                values.set(index, text);
            }
            const result = next.blocks.map((block, index) => {
                if (!reused.has(index)) return block.leading + values.get(index);
                const prior = target.blocks[reused.get(index)];
                // When the first block was deleted, its following separator
                // must not become whitespace before the document/front matter.
                return (index === 0 ? block.leading : prior.leading) + prior.text;
            }).join('');
            return result + (reused.has(next.blocks.length - 1) ? target.tail : next.tail);
        }};
}

module.exports = {threshold, sourceChange, planIncremental};
