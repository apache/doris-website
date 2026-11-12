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

// Narrow a configured plan to the locales a change can actually affect. The
// configured order is preserved, so a selection that contains the default
// locale still builds it first and keeps the root controls.
function selectLocales(plan, requested) {
    if (!plan.locales.length || plan.locales[0].locale !== plan.defaultLocale
        || new Set(plan.locales.map(item => item.locale)).size !== plan.locales.length) throw new Error('Default locale must be first in a unique locale plan');
    if (requested === undefined) return plan.locales;
    if (!requested.length || new Set(requested).size !== requested.length) throw new Error('Requested locales must be a non-empty list of unique locales');
    const configured = new Set(plan.locales.map(item => item.locale));
    for (const locale of requested) if (!configured.has(locale)) throw new Error(`Requested locale is not configured: ${locale}`);
    const wanted = new Set(requested);
    return plan.locales.filter(item => wanted.has(item.locale));
}

async function buildLocales({siteDir = process.cwd(), outDir = 'build', locales: requestedLocales, samplePlan, run, stamp = sourceStamp}) {
    siteDir = path.resolve(siteDir);
    outDir = path.resolve(siteDir, outDir);
    if (samplePlan) {
        if (!outDir.startsWith(path.join(siteDir,'.i18n-build','ci-sample')+path.sep)) throw new Error('Sample output must stay under .i18n-build/ci-sample');
        if (require('./publish/shared-assets.cjs').enabled()) throw new Error('Sample validation cannot produce optimized publication artifacts');
    }
    if (outDir === siteDir || siteDir.startsWith(outDir + path.sep)) throw new Error('Build output must not contain the source checkout');
    fs.mkdirSync(path.dirname(outDir), {recursive:true});
    const stage = fs.mkdtempSync(path.join(path.dirname(outDir), '.doris-build-'));
    const initialStamp = stamp(siteDir);
    const verifyStamp = () => {
        if (JSON.stringify(stamp(siteDir)) !== JSON.stringify(initialStamp)) throw new Error('Source changed between locale builds; refusing mixed artifacts');
    };
    const report = {schemaVersion:1, source:initialStamp, mode:'separate-processes',
        requested:requestedLocales ?? null, locales:[]};
    if(samplePlan)report.validation={mode:'sample',publicationAllowed:false};
    const reportDir = path.join(siteDir, '.i18n-build');
    fs.mkdirSync(reportDir, {recursive:true});
    fs.rmSync(path.join(reportDir,'compiler-metrics'),{recursive:true,force:true});
    const reportPath = path.join(reportDir, 'build-result.json');
    const execute = run ?? ((args) => new Promise((resolve, reject) => {
        const child = spawn(process.execPath,[path.join(__dirname,'build-locale.cjs'), ...args],{
            cwd:siteDir,stdio:'inherit',env:{...process.env,
                ...((samplePlan || process.env.DORIS_COMPILER_MODE !== 'parallel') && {DORIS_I18N_STRUCTURE_CACHE:path.join(stage,'structure-cache')})},
        });
        console.log(JSON.stringify({event:'locale_process_start', mode:args[0], locale:args[0] === 'plan' ? null : args[3], pid:child.pid}));
        const stop = signal => child.kill(signal);
        const term = () => stop('SIGTERM');
        const interrupt = () => stop('SIGINT');
        const memory = process.env.DORIS_BUILD_METRICS === 'true' && process.platform === 'linux'
            ? {sampleIntervalMs:1000,samples:0,peakRssKiB:0,minimumSystemAvailableKiB:null} : null;
        const sample = () => {
            try {
                const rss = Number(fs.readFileSync(`/proc/${child.pid}/status`,'utf8').match(/^VmRSS:\s+(\d+)/m)?.[1]);
                const available = Number(fs.readFileSync('/proc/meminfo','utf8').match(/^MemAvailable:\s+(\d+)/m)?.[1]);
                if (rss > 0 && available > 0) {
                    memory.samples++;
                    memory.peakRssKiB = Math.max(memory.peakRssKiB,rss);
                    memory.minimumSystemAvailableKiB = Math.min(memory.minimumSystemAvailableKiB ?? Infinity,available);
                }
            } catch {} // A child can exit between the timer and /proc read.
        };
        const sampler = memory ? setInterval(sample,1000) : null;
        const cleanup = () => {
            if (sampler) clearInterval(sampler);
            process.removeListener('SIGTERM',term);
            process.removeListener('SIGINT',interrupt);
        };
        process.once('SIGTERM', term);
        process.once('SIGINT', interrupt);
        child.once('error', error => {cleanup();reject(error);});
        child.once('exit', (code, signal) => {
            cleanup();
            console.log(JSON.stringify({event:'locale_process_end', mode:args[0], locale:args[0] === 'plan' ? null : args[3], pid:child.pid, code, signal}));
            if (code !== 0) reject(new Error(`Locale ${args[3]} failed (${signal ?? code}); output was not published`));
            else {
                const compilerFile=path.join(reportDir,'compiler-metrics',args[3]+'.json');
                if(memory && fs.existsSync(compilerFile))for(const record of JSON.parse(fs.readFileSync(compilerFile)).records??[]){
                    memory.peakRssKiB=Math.max(memory.peakRssKiB,Math.ceil(record.peakRssBytes/1024));
                    if(record.minimumSystemAvailableKiB)memory.minimumSystemAvailableKiB=Math.min(memory.minimumSystemAvailableKiB??Infinity,record.minimumSystemAvailableKiB);
                }
                if(memory)memory.scope='Maximum sampled individual process RSS across locale and isolated client; system availability includes all processes';
                resolve({pid:child.pid,...(memory && {memory})});
            }
        });
    }));
    try {
        const planFile = path.join(stage, 'plan.json');
        await execute(['plan',siteDir,path.join(stage,'plan-site'),planFile]);
        const plan = JSON.parse(fs.readFileSync(planFile,'utf8'));
        const selected = selectLocales(plan, requestedLocales);
        for (const item of selected) {
            if (!/^[a-zA-Z0-9-]+$/.test(item.locale) || item.directory !== (item.locale === plan.defaultLocale ? '.' : item.locale)) {
                throw new Error('Unsafe locale output directory');
            }
            verifyStamp();
            const localeOutput = path.join(stage, item.locale, 'site');
            const started = Date.now();
            const processInfo = await execute([samplePlan?'sample':'build',siteDir,localeOutput,item.locale,...(samplePlan?[path.resolve(samplePlan)]:[])]);
            const resultDir = path.join(localeOutput,item.directory);
            if (!fs.existsSync(path.join(resultDir,'index.html'))) throw new Error(`Missing locale homepage: ${item.locale}`);
            report.locales.push({...item, ...processInfo, elapsedMs:Date.now()-started, resultDir});
        }
        verifyStamp();
        // The default locale owns the root, so its output becomes the base. A
        // subset without it is locale-only: every built locale keeps its own
        // prefix under an otherwise empty root.
        const assembled = path.join(stage,'assembled');
        const includesDefault = report.locales[0].directory === '.';
        if (includesDefault) fs.renameSync(report.locales[0].resultDir, assembled);
        else fs.mkdirSync(assembled, {recursive:true});
        for (const item of report.locales) {
            if (item.directory === '.') continue;
            const destination = path.join(assembled,item.directory);
            fs.rmSync(destination,{recursive:true,force:true});
            fs.renameSync(item.resultDir,destination);
        }
        if(samplePlan)fs.writeFileSync(path.join(assembled,'.ci-validation.json'),JSON.stringify({schemaVersion:1,mode:'sample',publicationAllowed:false,source:initialStamp})+'\n');
        if (require('./publish/shared-assets.cjs').enabled()) {
            report.optimization = require('./publish/optimize.cjs').optimize({site:assembled, locales:report.locales});
            report.optimization.verification = require('./publish/verify.cjs').verify(assembled);
            fs.writeFileSync(path.join(reportDir,'publish-result.json'),JSON.stringify(report.optimization,null,2)+'\n');
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
        fs.rmSync(stage,{recursive:true,force:true,maxRetries:8,retryDelay:250});
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
    const localeList = option('--locales');
    buildLocales({siteDir:option('--site-dir',process.cwd()), outDir:option('--out-dir','build'),
        locales:localeList === undefined ? undefined : localeList.split(',').map(locale => locale.trim()).filter(Boolean)})
        .catch(error => {console.error(error);process.exitCode = 1;});
}
module.exports = {buildLocales, selectLocales, sourceStamp};
