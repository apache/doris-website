// One disposable Docusaurus process. Pin this adapter to the installed version:
// unlike `build --locale ja`, buildLocale with no single-locale CLI override
// retains the native /ja/ base URL, output path and all language alternatives.
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');

async function main() {
    const [mode, siteDir, outDir, value, samplePlan] = process.argv.slice(2);
    const fromSite = createRequire(path.join(siteDir, 'package.json'));
    const version = fromSite('@docusaurus/core/package.json').version;
    if (version !== '3.6.3') throw new Error(`Revalidate the locale build adapter for Docusaurus ${version}`);
    process.env.NODE_ENV = 'production';
    process.env.BABEL_ENV = 'production';
    delete process.env.DOCUSAURUS_CURRENT_LOCALE;
    if (mode === 'plan') {
        const {loadContext} = fromSite('@docusaurus/core/lib/server/site.js');
        const {localizePath} = fromSite('@docusaurus/utils');
        const context = await loadContext({siteDir, outDir});
        const {i18n, siteConfig} = context;
        const locales = [i18n.defaultLocale, ...i18n.locales.filter(locale => locale !== i18n.defaultLocale)];
        fs.writeFileSync(value, JSON.stringify({version, defaultLocale:i18n.defaultLocale,
            locales:locales.map(locale => ({locale,
                directory:locale === i18n.defaultLocale ? '.' : locale,
                baseUrl:localizePath({path:siteConfig.baseUrl, pathType:'url', i18n:{...i18n,currentLocale:locale}}),
            }))}, null, 2) + '\n');
    } else if (mode === 'build' || mode === 'sample' || mode === 'client') {
        const adapter = require('./i18n/compiler-processes.cjs');
        const {sourceStamp} = require('./build-locales.cjs');
        const stamp = sourceStamp(siteDir);
        const compilerMode = process.env.DORIS_COMPILER_MODE ?? 'isolated';
        if (!['isolated','parallel'].includes(compilerMode)) throw new Error(`Unknown DORIS_COMPILER_MODE: ${compilerMode}`);
        const clientResult = mode !== 'client' && compilerMode === 'isolated'
            ? await adapter.runClient({siteDir,outDir,locale:value,samplePlan:mode === 'sample' ? samplePlan : null}) : null;
        if (clientResult && JSON.stringify(clientResult.source) !== JSON.stringify(sourceStamp(siteDir))) throw new Error('Source changed during isolated client compilation');
        const restore = (mode === 'sample' || mode === 'client' && samplePlan) ? await require('./i18n/ci-sample.cjs').install({root:siteDir,outDir,locale:value,planFile:samplePlan}) : () => {};
        let restoreCompiler = () => {};
        let result;
        try {
            if (mode === 'client') result = await adapter.buildClient({fromSite,siteDir,outDir,locale:value,samplePlan});
            else {
                restoreCompiler = adapter.install({fromSite,siteDir,locale:value,clientResult});
                const {buildLocale} = fromSite('@docusaurus/core/lib/commands/build/buildLocale.js');
                await buildLocale({siteDir, locale:value, cliOptions:{outDir}});
            }
        } finally {try {restoreCompiler();} finally {restore();}}
        if (JSON.stringify(stamp) !== JSON.stringify(sourceStamp(siteDir))) throw new Error('Source changed between compiler phases');
        if (mode === 'client') adapter.writeClientResult(siteDir,value,{...result,source:stamp});
        else {
            if(mode === 'sample' && clientResult)adapter.mergeSamplingScope(siteDir,value,clientResult);
            fs.rmSync(adapter.stateDirectory(siteDir,value),{recursive:true,force:true});
        }
    } else throw new Error(`Unknown locale build mode: ${mode}`);
}
main().catch(error => {console.error(error); process.exitCode = 1;});
