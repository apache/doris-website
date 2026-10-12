// Only edited translations/state are blocking. Source-only freshness is a report.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {identity, hash, loadRecords} = require('./state.cjs');
const {structure, alignHeadings} = require('./structure.cjs');
const {collect} = require('./inventory.cjs');
const {protectionSignature} = require('./protection.cjs');

async function checkTranslations({root, pages, reports = [], files, records, previousRecords = new Map()}) {
    const changed = new Set(files);
    const selected = pages.filter(page => changed.has(page.targetPath)
        || (changed.has('translations/state/ja/docs.json')
            && JSON.stringify(records.get(identity(page))) !== JSON.stringify(previousRecords.get(identity(page)))));
    const errors = [];
    const exceptionFile = path.join(root,'translations/protection-exceptions/ja.json');
    const exceptions = fs.existsSync(exceptionFile) ? JSON.parse(fs.readFileSync(exceptionFile,'utf8')).pages : [];
    const baselineState = JSON.parse(execFileSync('git',['show','3379cb75733e1d8c453f6aae7b44b1fae5497ae2:translations/state/ja/docs.json'],
        {cwd:root,encoding:'utf8'}));
    const approved = new Map(baselineState.pages.map(record => [identity(record),record]));
    for (const entry of exceptions) {
        const record = approved.get(identity(entry));
        const mergedTarget = record && execFileSync('git',['show',`3379cb75733e1d8c453f6aae7b44b1fae5497ae2:${record.targetPath}`],
            {cwd:root,encoding:'utf8'});
        const repaired = entry.repairedFromTargetHash === record?.targetHash
            && mergedTarget?.includes('(ai/ai-overview.md)')
            && hash(mergedTarget.replace('(ai/ai-overview.md)','(../ai/ai-overview.md)')) === entry.targetHash;
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
            const aligned = await alignHeadings(parsed, target, ext);
            const exception = exceptions.find(entry => identity(entry) === identity(page)
                && entry.sourceHash === page.sourceHash && entry.targetHash === page.targetHash && entry.reason?.trim());
            if (!exception && protectionSignature(await structure(aligned, ext)) !== protectionSignature(parsed)) {
                throw new Error('Protected code, links, numbers, MDX or metadata differ from the source');
            }
            if (record.sourceTechnicalHash !== parsed.technicalHash) throw new Error('sourceTechnicalHash does not match the current source');
            const committed = execFileSync('git', ['show', `${record.sourceCommit}:${page.sourcePath}`],
                {cwd:root, encoding:'utf8', stdio:['ignore','pipe','ignore'], maxBuffer:16*1024*1024});
            if (hash(committed) !== record.sourceHash) throw new Error('sourceCommit/sourcePath does not contain the recorded sourceHash');
        } catch (error) {errors.push({path:page.targetPath, message:error.message});}
    }
    const known = new Set(pages.map(page => page.targetPath));
    for (const file of files.filter(file => /^i18n\/ja\/docusaurus-plugin-content-docs[^/]*\/(current|version-[^/]+)\/.+\.(md|mdx)$/.test(file))) {
        if (fs.existsSync(path.join(root,file)) && !known.has(file)) errors.push({path:file, message:'Target has no registered source in the same plugin/version'});
    }
    if (changed.has('translations/state/ja/docs.json')) for (const [key, record] of records) {
        if (JSON.stringify(record) !== JSON.stringify(previousRecords.get(key)) && !pages.some(page => identity(page) === key)) {
            errors.push({path:record.targetPath, message:'Edited state has no native source identity'});
        }
    }
    return {checked: selected.length, errors, freshness: Object.fromEntries([...new Set(pages.map(page => page.status))]
        .map(status => [status, pages.filter(page => page.status === status).length])), reports};
}
async function main() {
    const root = path.resolve(__dirname,'../..');
    const args = process.argv.slice(2), base = args[args.indexOf('--base')+1];
    if (!args.includes('--base')) throw new Error('Usage: check-translations.cjs --base <PR merge base>');
    const files = execFileSync('git',['diff','--name-only',base,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const records = loadRecords(root,'ja');
    let previousRecords = new Map();
    try {
        const previous = JSON.parse(execFileSync('git',['show',`${base}:translations/state/ja/docs.json`],{cwd:root,encoding:'utf8'}));
        previousRecords = new Map(previous.pages.map(record => [identity(record),record]));
    } catch (error) {if (!String(error.message).includes('does not exist')) throw error;}
    const native = await collect(root);
    const result = await checkTranslations({root,...native,files,records,previousRecords});
    console.log(JSON.stringify(result,null,2));
    if (result.errors.length) process.exitCode = 1;
}
if (require.main === module) main().catch(error => {console.error(error);process.exitCode=1;});
module.exports = {checkTranslations};
