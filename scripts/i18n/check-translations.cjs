// Only edited translations/state are blocking. Source-only freshness is a report.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {identity, hash, loadRecords, loadRecordsAt, pipelineLocale} = require('./state.cjs');
const {structure, alignHeadings} = require('./structure.cjs');
const {collect} = require('./inventory.cjs');
const {protectionSignature} = require('./protection.cjs');
const {signature, isDocumentGeneration, acceptedFallback} = require('./document-checks.cjs');

async function checkTranslations({root, locale = pipelineLocale(root), pages, reports = [], files, records, previousRecords = new Map()}) {
    const changed = new Set(files);
    const stateChanged = files.some(file => file === `translations/state/${locale}/docs.json`
        || file.startsWith(`translations/state/${locale}/pages/`));
    const selected = pages.filter(page => changed.has(page.targetPath)
        || (stateChanged
            && JSON.stringify(records.get(identity(page))) !== JSON.stringify(previousRecords.get(identity(page)))));
    const errors = [];
    const warnings = [];
    const exceptionFile = path.join(root,`translations/protection-exceptions/${locale}.json`);
    const exceptionData = fs.existsSync(exceptionFile)
        ? JSON.parse(fs.readFileSync(exceptionFile,'utf8')) : {schemaVersion:1, pages:[]};
    const exceptions = exceptionData.pages;
    // Every exception is bound to the merged bytes at one commit. A locale that
    // declares no exception needs no baseline.
    const baselineCommit = exceptionData.baselineCommit;
    if (exceptions.length) {
        if (!/^[a-f0-9]{40}$/.test(baselineCommit ?? '')) throw new Error('Protection exceptions need a baseline commit');
    }
    const baselineState = exceptions.length
        ? JSON.parse(execFileSync('git',['show',`${baselineCommit}:translations/state/${locale}/docs.json`],
            {cwd:root,encoding:'utf8'}))
        : {pages:[]};
    const approved = new Map(baselineState.pages.map(record => [identity(record),record]));
    for (const entry of exceptions) {
        const record = approved.get(identity(entry));
        const mergedTarget = record && execFileSync('git',['show',`${baselineCommit}:${record.targetPath}`],
            {cwd:root,encoding:'utf8'});
        // An exception may record one exact repair the merged bytes still need.
        const repair = entry.repair;
        const repaired = entry.repairedFromTargetHash === record?.targetHash && repair
            && mergedTarget?.includes(repair.from)
            && hash(mergedTarget.replace(repair.from, repair.to)) === entry.targetHash;
        if (!record || record.sourceHash !== entry.sourceHash ||
            !(record.targetHash === entry.targetHash || repaired) || !entry.reason?.trim())
            errors.push({path:exceptionFile,message:'Protection exception is not bound to the merged T01 PoC bytes'});
    }
    for (const page of selected) {
        const record = records.get(identity(page));
        if (!record && !fs.existsSync(path.join(root, page.targetPath))) continue; // Intentional removal of both.
        try {
            if (page.status !== 'current' || !record) throw new Error(`Translation must match its current source/state (${page.status})`);
            const source = fs.readFileSync(path.join(root,page.sourcePath),'utf8');
            const target = fs.readFileSync(path.join(root,page.targetPath),'utf8');
            const ext = path.extname(page.sourcePath);
            const parsed = await structure(source, ext);
            const fallback = acceptedFallback(record, source, target);
            let aligned = target;
            try {aligned = await alignHeadings(parsed, target, ext);}
            catch (error) {if (!fallback) throw error;}
            const exception = exceptions.find(entry => identity(entry) === identity(page)
                && entry.sourceHash === page.sourceHash && entry.targetHash === page.targetHash && entry.reason?.trim());
            const compare = isDocumentGeneration(record, source, target) ? signature : protectionSignature;
            if (!exception && !fallback && compare(await structure(aligned, ext)) !== compare(parsed)) {
                throw new Error('Protected code, links, numbers, MDX or metadata differ from the source');
            }
            if (fallback) warnings.push({path: page.targetPath, message: 'Third attempt retained for manual review',
                issues: record.generation.warnings});
            if (record.sourceTechnicalHash !== parsed.technicalHash) throw new Error('sourceTechnicalHash does not match the current source');
            const committed = execFileSync('git', ['show', `${record.sourceCommit}:${page.sourcePath}`],
                {cwd:root, encoding:'utf8', stdio:['ignore','pipe','ignore'], maxBuffer:16*1024*1024});
            if (hash(committed) !== record.sourceHash) throw new Error('sourceCommit/sourcePath does not contain the recorded sourceHash');
        } catch (error) {errors.push({path:page.targetPath, message:error.message});}
    }
    const known = new Set(pages.map(page => page.targetPath));
    const targetPattern = new RegExp(`^i18n/${locale}/docusaurus-plugin-content-docs[^/]*/(current|version-[^/]+)/.+\\.(md|mdx)$`);
    for (const file of files.filter(file => targetPattern.test(file))) {
        if (fs.existsSync(path.join(root,file)) && !known.has(file)) errors.push({path:file, message:'Target has no registered source in the same plugin/version'});
    }
    if (stateChanged) for (const [key, record] of records) {
        if (JSON.stringify(record) !== JSON.stringify(previousRecords.get(key)) && !pages.some(page => identity(page) === key)) {
            errors.push({path:record.targetPath, message:'Edited state has no native source identity'});
        }
    }
    return {checked: selected.length, errors, warnings, freshness: Object.fromEntries([...new Set(pages.map(page => page.status))]
        .map(status => [status, pages.filter(page => page.status === status).length])), reports};
}
async function main() {
    const root = path.resolve(__dirname,'../..');
    const args = process.argv.slice(2), base = args[args.indexOf('--base')+1];
    if (!args.includes('--base')) throw new Error('Usage: check-translations.cjs --base <PR merge base>');
    const files = execFileSync('git',['diff','--name-only',base,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const locale = pipelineLocale(root);
    const records = loadRecords(root, locale);
    const previousRecords = loadRecordsAt(root, locale, base);
    const native = await collect(root);
    const result = await checkTranslations({root, locale, ...native, files, records, previousRecords});
    console.log(JSON.stringify(result,null,2));
    if (result.errors.length) process.exitCode = 1;
}
if (require.main === module) main().catch(error => {console.error(error);process.exitCode=1;});
module.exports = {checkTranslations};
