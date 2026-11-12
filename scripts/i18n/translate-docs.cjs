// Manually invoked T07 tool. A plan and an explicit task ID are required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {hash, identity, relative, loadConfig, pipelineLocale, stateFileFor, listShardFiles, collectRecords} = require('./state.cjs');
const {structure} = require('./structure.cjs');
const {protectionSignature} = require('./protection.cjs');
const {checkedTask, safeFile, openAIAdapter, mockAdapter, translateDocument} = require('./translation-engine.cjs');
const {translateManagedDocument} = require('./translate-document.cjs');
const {checkFrontMatter} = require('./document-checks.cjs');

function optionsFrom(argv) {
    const values = {}, tasks = [];
    const known = new Set(['--plan', '--task', '--provider', '--mock-file', '--stage-dir', '--token-budget',
        '--max-document-chars', '--max-chunk-chars', '--model', '--timeout-ms', '--max-output-tokens', '--max-input-tokens']);
    for (let i = 0; i < argv.length; i++) {
        assert(known.has(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--'), `Unknown or incomplete option: ${argv[i]}`);
        if (argv[i] === '--task') tasks.push(argv[++i]);
        else {assert(values[argv[i]] === undefined, `Duplicate option ${argv[i]}`); values[argv[i]] = argv[++i];}
    }
    assert(values['--plan'] && tasks.length && tasks.length <= 20 && new Set(tasks).size === tasks.length,
        'Provide --plan and 1–20 distinct --task IDs');
    return {...values, tasks};
}

function positive(value, fallback, name) {
    const number = value === undefined ? fallback : Number(value);
    assert(Number.isInteger(number) && number > 0, `Invalid ${name}`);
    return number;
}

function readCommitted(root, commit, sourcePath) {
    return execFileSync('git', ['show', `${commit}:${sourcePath}`],
        {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024});
}

// Everything the engine needs to know about the language it translates into.
// `languageName` names it in the model prompt and `scriptPattern` is the script
// a finished translation must contain.
function targetFor(root, locale) {
    const settings = loadConfig(root).locales[locale];
    assert(settings?.scriptPattern, `Missing scriptPattern for ${locale}`);
    return {locale, language: settings.languageName, scriptPattern: settings.scriptPattern};
}

function scopeFile(root, locale) { return path.join(root, `translations/scope/${locale}.json`); }
function glossaryFile(root, locale) { return path.join(root, `translations/glossary/${locale}.json`); }

function readState(root, locale) {
    root = path.resolve(root);
    const file = safeFile(root, `translations/state/${locale}/docs.json`);
    const raw = readOptional(file);
    const legacy = raw === null ? {schemaVersion: 1, pages: []} : JSON.parse(raw);
    const shards = new Map(listShardFiles(root, locale)
        .map(name => [name, fs.readFileSync(safeFile(root, name), 'utf8')]));
    const schemaFile = safeFile(root, `translations/state/${locale}/shards.schema.json`);
    const schemaRaw = readOptional(schemaFile);
    if (schemaRaw !== null) {
        const schema = JSON.parse(schemaRaw);
        assert(schema.schemaVersion === 1 && schema.format === 'page-record-v1', 'Unsupported translation shard schema');
    }
    // Build the effective view from the same bytes we retain for write guards.
    const data = {...legacy, pages: [...require('./source-revisions.cjs').hydrate(root,locale,
        collectRecords(locale, legacy, shards)).values()]};
    return {root, locale, file, raw, legacy, shards, schemaFile, schemaRaw, sharded: schemaRaw !== null, data};
}

function readOptional(file) {
    try {return fs.readFileSync(file, 'utf8');}
    catch (error) {if (error.code === 'ENOENT') return null; throw error;}
}

function statePathForRecord(state, record) {
    assert.equal(record.locale, state.locale, 'Candidate state locale changed');
    const shard = stateFileFor(record);
    return record.pluginId==='blog'||state.sharded || state.shards.has(shard) ? shard : relative(state.root, state.file);
}

// Capture the inputs from the generation snapshot, before awaiting a model.
// A later apply must not overwrite a newer, internally consistent translation.
function stagedBaseline(state, task, previousTarget) {
    const shard = stateFileFor(task);
    const statePath = state.shards.has(shard) ? shard : relative(state.root, state.file);
    const raw = state.shards.has(shard) ? state.shards.get(shard) : state.raw;
    return {targetHash: previousTarget === null ? null : hash(previousTarget), statePath,
        stateHash: raw === null ? null : hash(raw),
        schemaHash: state.schemaRaw === null ? null : hash(state.schemaRaw)};
}

function writeAtomic(file, value) {
    const temp = path.join(path.dirname(file), `.translation-${randomUUID()}.tmp`);
    try {
        fs.writeFileSync(temp, value, {flag: 'wx'});
        fs.renameSync(temp, file);
    } finally {fs.rmSync(temp, {force: true});}
}

async function prepare({root, plan, taskId, scope, state, adapter, glossary, target, maxDocumentChars, maxChunkChars}) {
    const {task, source} = checkedTask(plan, taskId, scope, root);
    let existing = state.data.pages.find(item => identity(item) === identity(task));
    const sourcePolicy=require('./source-revisions.cjs');
    const targetFile = safeFile(root, task.targetPath);
    const previousTarget = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : null;
    if(!existing&&previousTarget!==null){existing=sourcePolicy.resolveRecord(root,{...task,sourceLocale:'en'},undefined);
        if(existing)state.data.pages.push(existing);}
    const sourceControl=sourcePolicy.info(existing);
    assert(sourcePolicy.canGenerate(existing),sourceControl?'Corresponding sources are unchanged; preserve the target':'Human maintained target requires manual review');
    if(sourceControl)assert.deepEqual(sourcePolicy.snapshot(root,existing,plan.sourceCommit),sourceControl.current,
        'English/Chinese sources have uncommitted changes');
    assert(!previousTarget || existing, 'Untracked target needs human review');
    if (existing) {
        assert(existing.sourcePath === task.sourcePath && existing.targetPath === task.targetPath
            && (previousTarget === null ? !!sourceControl : hash(previousTarget) === existing.targetHash),
        'Existing target or identity changed; manual review required');
    }
    const baseline = stagedBaseline(state, task, previousTarget);
    // Course props and report exports contain prose inside code. Translate
    // extracted text values and assemble the original code locally.
    const group = scope.groups.find(group => group.pluginId === task.pluginId && group.version === task.version);
    const wholeDocument = typeof adapter.translateDocument === 'function' && !group.kind && task.pluginId !== 'course';
    let previousSource = null, baselineReason;
    if (existing) {
        try {previousSource = readCommitted(root, existing.sourceCommit, existing.sourcePath);}
        catch (error) {
            if (!wholeDocument) throw error;
            baselineReason = 'previous-source-unavailable';
        }
        if (previousSource !== null) assert(hash(previousSource) === existing.sourceHash, 'Previous source record is invalid');
    }
    const extension = path.extname(task.sourcePath);
    const chineseRefresh=sourceControl?.changed.includes('zh-CN');
    const references=sourcePolicy.referenceSources(root,existing??{...task,sourceLocale:'en'});
    const translationAdapter=Object.create(adapter);
    for(const method of ['translate','translateDocument','translateChanges'])if(typeof adapter[method]==='function')
        translationAdapter[method]=request=>adapter[method]({...request,referenceSources:references});
    const canReuse = existing?.glossaryVersion === glossary.version && !chineseRefresh;
    const generated = wholeDocument ? await translateManagedDocument({source, extension, adapter:translationAdapter, glossary,
        previousSource, previousTarget,
        baselineReason: baselineReason || (chineseRefresh?'chinese-reference-changed':existing && !canReuse ? 'glossary-version-changed' : undefined),
        targetLocale: target.locale, targetScriptPattern: target.scriptPattern, root, targetPath: task.targetPath,
        onAttempt: ({attempt, issues}) => process.stdout.write(`${task.sourcePath}: attempt ${attempt}/3: `
            + (issues.length ? issues.map(item => `${item.check}: ${item.message}`).join('; ') : 'passed') + '\n')})
        : await translateDocument({source, extension, adapter:translationAdapter, glossary,
        previousSource: canReuse ? previousSource : null,
        previousTarget: canReuse ? previousTarget : null,
        targetLocale: target.locale, targetScriptPattern: target.scriptPattern, blog:group.kind==='blog',
        maxDocumentChars: maxDocumentChars ?? (group.kind || task.pluginId === 'course' ? 300000 : 60000), maxChunkChars});
    if (!wholeDocument) checkFrontMatter(source, generated.target, target.locale);
    if (!wholeDocument && adapter.model !== 'fixture') {
        assert(generated.targetChanged,
            `Live candidate contains no ${target.language} text; review manually`);
    }
    const sourceParsed = await structure(source, extension);
    const record = {pluginId: task.pluginId, version: task.version, docId: task.docId, locale: task.locale,
        sourceLocale: 'en', sourcePath: task.sourcePath, targetPath: task.targetPath,
        sourceCommit: plan.sourceCommit, sourceHash: task.sourceHash,
        sourceTechnicalHash: sourceParsed.technicalHash, targetHash: hash(generated.target),
        reviewStatus: 'machine', ownership: 'machine', translatedAt: new Date().toISOString(),
        glossaryVersion: glossary.version,
        ...(generated.generation ? {generation: generated.generation} : {})};
    if(sourcePolicy.enabled(root))record.sourceRevisions=sourcePolicy.snapshot(root,record,plan.sourceCommit);
    return {task, targetFile, previousTarget, baseline, target: generated.target, record,
        units: generated.units, reusedUnits: generated.reusedUnits, requests: generated.requests,
        targetChanged: generated.targetChanged};
}

function applyCandidates(state, candidates) {
    assert.equal(readOptional(state.file), state.raw, 'State changed during generation');
    if (state.schemaFile) assert.equal(readOptional(state.schemaFile), state.schemaRaw, 'State changed during generation');
    assert.equal(new Set(candidates.map(item => identity(item.record))).size, candidates.length, 'Duplicate candidate identity');
    assert.equal(new Set(candidates.map(item => item.targetFile)).size, candidates.length, 'Duplicate candidate target');
    for (const candidate of candidates) {
        const actual = readOptional(candidate.targetFile);
        assert.equal(actual, candidate.previousTarget, `Target changed during generation: ${candidate.task.targetPath}`);
        const existing = state.data.pages.find(item => identity(item) === identity(candidate.record));
        assert(require('./source-revisions.cjs').canGenerate(existing), 'Human maintained target or corresponding sources unchanged; manual review required');
        if(candidate.record.sourceRevisions)assert.deepEqual(
            require('./source-revisions.cjs').currentSnapshot(state.root,candidate.record),candidate.record.sourceRevisions,
            'Corresponding English/Chinese source changed during generation');
    }
    const writes = candidates.map(item => ({file: item.targetFile, before: item.previousTarget, after: item.target}));
    const legacyCandidates = [];
    for (const candidate of candidates) {
        const name = statePathForRecord(state, candidate.record);
        if (name === relative(state.root, state.file)) {
            legacyCandidates.push(candidate);
            // A new shard must not silently supersede the legacy record we read.
            assert.equal(readOptional(safeFile(state.root, stateFileFor(candidate.record))), null,
                'State changed during generation');
            continue;
        }
        const file = safeFile(state.root, name);
        const before = state.shards.get(name) ?? null;
        assert.equal(readOptional(file), before, 'State changed during generation');
        writes.push({file, before, after: JSON.stringify({schemaVersion: 1, page: candidate.record}, null, 2) + '\n'});
    }
    if (legacyCandidates.length) {
        const pages = state.legacy.pages.filter(page => !legacyCandidates.some(item => identity(item.record) === identity(page)));
        pages.push(...legacyCandidates.map(item => item.record));
        pages.sort((a, b) => identity(a).localeCompare(identity(b), 'en'));
        writes.push({file: state.file, before: state.raw, after: JSON.stringify({...state.legacy, pages}, null, 2) + '\n'});
    }
    const written = [];
    try {
        for (const write of writes) {
            fs.mkdirSync(path.dirname(write.file), {recursive: true});
            writeAtomic(write.file, write.after);
            written.push(write);
        }
    } catch (error) {
        for (const write of written.reverse()) {
            if (write.before === null) fs.rmSync(write.file, {force: true});
            else writeAtomic(write.file, write.before);
        }
        throw error;
    }
}

function stageDirectory(root, relative) {
    assert(relative.startsWith('.i18n-build/') && !relative.split('/').some(part => part === '..' || part === '.'),
        'Stage directory must stay under .i18n-build');
    return safeFile(root, relative);
}

async function applyStaged(root, planFile, relativeStage) {
    const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    const locale = pipelineLocale(root);
    const scope = JSON.parse(fs.readFileSync(scopeFile(root, locale), 'utf8'));
    const stage = stageDirectory(root, relativeStage);
    const manifest = JSON.parse(fs.readFileSync(path.join(stage, 'manifest.json'), 'utf8'));
    assert(manifest.schemaVersion === 2 && manifest.provider === 'openai' && manifest.liveCall === true
        && manifest.applied === false && manifest.sourceCommit === plan.sourceCommit
        && Array.isArray(manifest.candidates) && manifest.candidates.length > 0
        && manifest.candidates.length <= scope.maxBatchPages, 'Invalid staged live candidates');
    const state = readState(root, locale);
    const candidates = [];
    for (const item of manifest.candidates) {
        assert(/^T06-(DEV|4X|COMMUNITY)-[0-9]{15}$/.test(item.id ?? ''), 'Invalid staged task ID');
        const {task, source} = checkedTask(plan, item.id, scope, root);
        const record = item.record;
        const fields = ['pluginId', 'version', 'docId', 'locale', 'sourceLocale', 'sourcePath', 'targetPath',
            'sourceCommit', 'sourceHash', 'sourceTechnicalHash', 'targetHash', 'reviewStatus', 'ownership',
            'translatedAt', 'glossaryVersion'];
        if(require('./source-revisions.cjs').enabled(root))fields.push('sourceRevisions');
        assert(record && JSON.stringify(Object.keys(record).sort()) === JSON.stringify(fields.sort())
            && identity(record) === identity(task) && record.sourceLocale === 'en'
            && record.reviewStatus === 'machine' && record.ownership === 'machine'
            && record.glossaryVersion === manifest.glossaryVersion
            && Number.isFinite(Date.parse(record.translatedAt)), 'Invalid staged state record');
        if(record.sourceRevisions)assert.deepEqual(record.sourceRevisions,
            require('./source-revisions.cjs').snapshot(root,record,plan.sourceCommit),'Staged source revisions changed');
        assert(item.sourceHash === task.sourceHash && item.sourcePath === task.sourcePath
            && item.targetPath === task.targetPath && item.record?.sourceHash === task.sourceHash
            && item.record?.sourcePath === task.sourcePath && item.record?.targetPath === task.targetPath
            && item.record?.sourceCommit === plan.sourceCommit && item.targetChanged === true,
        'Staged identity does not match current plan');
        const target = fs.readFileSync(safeFile(stage, `${item.id}/candidate${path.extname(task.targetPath)}`), 'utf8');
        assert(hash(target) === item.targetHash && item.record.targetHash === item.targetHash,
            'Staged candidate was edited after validation');
        const parsed = await structure(source, path.extname(task.sourcePath));
        const translated = await structure(target, path.extname(task.targetPath));
        checkFrontMatter(source, target, locale);
        assert.equal(protectionSignature(translated), protectionSignature(parsed), 'Staged protected content changed');
        assert.equal(item.record.sourceTechnicalHash, parsed.technicalHash, 'Staged source technical hash changed');
        const existing = state.data.pages.find(page => identity(page) === identity(task));
        const targetFile = safeFile(root, task.targetPath);
        const previousTarget = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : null;
        assert.deepEqual(item.baseline, stagedBaseline(state, task, previousTarget),
            'Translation baseline changed since staging; regenerate and review the candidate');
        assert(!previousTarget || existing, 'Untracked target needs human review');
        if (existing) assert(existing.sourcePath === task.sourcePath && existing.targetPath === task.targetPath
            && previousTarget !== null && hash(previousTarget) === existing.targetHash,
        'Managed target changed since staging');
        candidates.push({task, targetFile, previousTarget, target, record: item.record});
    }
    assert.equal(new Set(candidates.map(item => identity(item.record))).size, candidates.length,
        'Duplicate staged identity');
    applyCandidates(state, candidates);
    manifest.applied = true;
    fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    return manifest;
}

async function main() {
    if (process.argv[2] === '--apply-staged') {
        assert(process.argv.length === 6 && process.argv[4] === '--plan',
            'Usage: translate-docs.cjs --apply-staged .i18n-build/<folder> --plan <plan.json>');
        const root = path.resolve(__dirname, '../..');
        process.stdout.write(JSON.stringify(await applyStaged(root, process.argv[5], process.argv[3]), null, 2) + '\n');
        return;
    }
    const options = optionsFrom(process.argv.slice(2));
    const root = path.resolve(__dirname, '../..');
    const plan = JSON.parse(fs.readFileSync(options['--plan'], 'utf8'));
    const locale = pipelineLocale(root);
    const target = targetFor(root, locale);
    const scope = JSON.parse(fs.readFileSync(scopeFile(root, locale), 'utf8'));
    const glossary = JSON.parse(fs.readFileSync(glossaryFile(root, locale), 'utf8'));
    const state = readState(root, locale);
    const provider = options['--provider'] ?? 'openai';
    let adapter;
    if (provider === 'mock') {
        assert(options['--mock-file'], 'Mock mode requires --mock-file');
        adapter = mockAdapter(JSON.parse(fs.readFileSync(options['--mock-file'], 'utf8')));
    } else {
        assert(provider === 'openai', `Unsupported provider: ${provider}`);
        adapter = openAIAdapter({apiKey: process.env.OPENAI_API_KEY, model: options['--model'] ?? process.env.I18N_MODEL,
            language: target.language,
            timeoutMs: positive(options['--timeout-ms'], 120000, 'timeout'),
            maxInputTokens: positive(options['--max-input-tokens'], 30000, 'input context tokens'),
            maxOutputTokens: positive(options['--max-output-tokens'], 6000, 'max output tokens'),
            tokenBudget: positive(options['--token-budget'], 50000, 'token budget')});
    }
    const maxDocumentChars = positive(options['--max-document-chars'], 60000, 'document length');
    const maxChunkChars = positive(options['--max-chunk-chars'], 5000, 'chunk length');
    const candidates = [];
    for (const id of options.tasks) candidates.push(await prepare({root, plan, taskId: id, scope, state,
        adapter, glossary, target, maxDocumentChars, maxChunkChars}));
    const stageRelative = options['--stage-dir'] ?? '.i18n-build/translation-candidates';
    const stage = stageDirectory(root, stageRelative);
    fs.mkdirSync(stage, {recursive: true});
    const manifest = {schemaVersion: 2, sourceCommit: plan.sourceCommit, provider,
        model: adapter.model, glossaryVersion: glossary.version,
        liveCall: provider === 'openai', liveVerified: false,
        applied: false, usedTokens: adapter.usedTokens,
        candidates: candidates.map(({task, record, baseline, units, reusedUnits, requests, targetChanged}) => ({
            id: task.id, kind: task.kind, sourcePath: task.sourcePath, targetPath: task.targetPath,
            sourceHash: record.sourceHash, targetHash: record.targetHash, units, reusedUnits, requests,
            targetChanged, baseline, record,
        }))};
    for (const candidate of candidates) {
        const folder = path.join(stage, candidate.task.id);
        fs.mkdirSync(folder, {recursive: true});
        fs.writeFileSync(path.join(folder, `candidate${path.extname(candidate.task.targetPath)}`), candidate.target);
    }
    fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
}

if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {optionsFrom, prepare, applyCandidates, applyStaged, readState, stagedBaseline, statePathForRecord, targetFor, scopeFile, glossaryFile};
