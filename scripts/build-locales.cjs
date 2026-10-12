const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {spawn, execFileSync} = require('node:child_process');

function sourceStamp(siteDir) {
    return {
        sha:execFileSync('git',['rev-parse','HEAD'],{cwd:siteDir,encoding:'utf8'}).trim(),
        trackedDiffHash:createHash('sha256').update(execFileSync('git',['diff','HEAD','--binary'],{cwd:siteDir,maxBuffer:16*1024*1024})).digest('hex'),
    };
}

async function buildLocales({siteDir = process.cwd(), outDir = 'build', run, stamp = sourceStamp}) {
    siteDir = path.resolve(siteDir);
    outDir = path.resolve(siteDir, outDir);
    if (outDir === siteDir || siteDir.startsWith(outDir + path.sep)) throw new Error('Build output must not contain the source checkout');
    fs.mkdirSync(path.dirname(outDir), {recursive:true});
    const stage = fs.mkdtempSync(path.join(path.dirname(outDir), '.doris-build-'));
    const initialStamp = stamp(siteDir);
    const verifyStamp = () => {
        if (JSON.stringify(stamp(siteDir)) !== JSON.stringify(initialStamp)) throw new Error('Source changed between locale builds; refusing mixed artifacts');
    };
    const report = {schemaVersion:1, source:initialStamp, mode:'separate-processes', locales:[]};
    const reportDir = path.join(siteDir, '.i18n-build');
    fs.mkdirSync(reportDir, {recursive:true});
    const reportPath = path.join(reportDir, 'build-result.json');
    const execute = run ?? ((args) => new Promise((resolve, reject) => {
        const child = spawn(process.execPath,[path.join(__dirname,'build-locale.cjs'), ...args],{cwd:siteDir,stdio:'inherit'});
        console.log(JSON.stringify({event:'locale_process_start', mode:args[0], locale:args[0] === 'build' ? args[3] : null, pid:child.pid}));
        const stop = signal => child.kill(signal);
        const term = () => stop('SIGTERM');
        const interrupt = () => stop('SIGINT');
        process.once('SIGTERM', term);
        process.once('SIGINT', interrupt);
        child.once('error', reject);
        child.once('exit', (code, signal) => {
            process.removeListener('SIGTERM', term);
            process.removeListener('SIGINT', interrupt);
            console.log(JSON.stringify({event:'locale_process_end', mode:args[0], locale:args[0] === 'build' ? args[3] : null, pid:child.pid, code, signal}));
            if (code !== 0) reject(new Error(`Locale ${args[3]} failed (${signal ?? code}); output was not published`));
            else resolve({pid:child.pid});
        });
    }));
    try {
        const planFile = path.join(stage, 'plan.json');
        await execute(['plan',siteDir,path.join(stage,'plan-site'),planFile]);
        const plan = JSON.parse(fs.readFileSync(planFile,'utf8'));
        if (!plan.locales.length || plan.locales[0].locale !== plan.defaultLocale
            || new Set(plan.locales.map(item => item.locale)).size !== plan.locales.length) throw new Error('Default locale must be first in a unique locale plan');
        for (const item of plan.locales) {
            if (!/^[a-zA-Z0-9-]+$/.test(item.locale) || item.directory !== (item.locale === plan.defaultLocale ? '.' : item.locale)) {
                throw new Error('Unsafe locale output directory');
            }
            verifyStamp();
            const localeOutput = path.join(stage, item.locale, 'site');
            const started = Date.now();
            const processInfo = await execute(['build',siteDir,localeOutput,item.locale]);
            const resultDir = path.join(localeOutput,item.directory);
            if (!fs.existsSync(path.join(resultDir,'index.html'))) throw new Error(`Missing locale homepage: ${item.locale}`);
            report.locales.push({...item, ...processInfo, elapsedMs:Date.now()-started, resultDir});
        }
        verifyStamp();
        const assembled = path.join(stage,'assembled');
        fs.renameSync(report.locales[0].resultDir, assembled);
        for (const item of report.locales.slice(1)) {
            const destination = path.join(assembled,item.directory);
            fs.rmSync(destination,{recursive:true,force:true});
            fs.renameSync(item.resultDir,destination);
        }
        verifyStamp();
        // Prepare every locale before touching the old complete artifact. Root
        // controls come from the default locale; localized files stay beneath
        // their own prefix. A failed locale cannot leave a half-built output.
        const backup = path.join(stage,'previous-output');
        const hadOutput = fs.existsSync(outDir);
        if (hadOutput) fs.renameSync(outDir,backup);
        try { fs.renameSync(assembled,outDir); }
        catch (error) {
            if (hadOutput) fs.renameSync(backup,outDir);
            throw error;
        }
        report.success = true;
        report.output = outDir;
        for (const item of report.locales) item.output = path.join(outDir,item.directory);
        return report;
    } catch (error) {
        report.success = false;
        report.error = error.message;
        throw error;
    } finally {
        fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
        fs.rmSync(stage,{recursive:true,force:true});
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
    buildLocales({siteDir:option('--site-dir',process.cwd()), outDir:option('--out-dir','build')})
        .catch(error => {console.error(error);process.exitCode = 1;});
}
module.exports = {buildLocales};
