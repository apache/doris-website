// Pinned Docusaurus compiler adapter. Rspack 1.2's closed native compiler is
// still reachable; only process exit gives this build a reliable memory bound.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {createRequire} = require('node:module');
const {spawn} = require('node:child_process');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function mdxCaches(config) {
    const caches=[];
    function inspect(item){
        if(!item||typeof item!=='object')return;
        if(item.options?.crossCompilerCache instanceof Map)caches.push(item.options);
        for(const key of ['rules','oneOf','use']){
            const value=item[key];if(Array.isArray(value))value.forEach(inspect);else inspect(value);
        }
    }
    (config.module?.rules??[]).forEach(inspect);return caches;
}
async function snapshotMdx(config) {
    const entries=new Map();
    for(const options of mdxCaches(config))for(const [resource,entry]of options.crossCompilerCache){
        const code=await entry.promise;
        if(typeof code!=='string')throw new Error(`Unexpected compiled MDX value: ${resource}`);
        if(entries.has(resource)&&entries.get(resource)!==code)throw new Error(`Conflicting compiled MDX resources: ${resource}`);
        entries.set(resource,code);
    }
    return Buffer.from(JSON.stringify([...entries].sort(([a],[b])=>a.localeCompare(b))));
}
function restoreMdx(config,bytes) {
    const entries=JSON.parse(bytes);
    if(!Array.isArray(entries)||entries.some(row=>!Array.isArray(row)||row.length!==2||row.some(value=>typeof value!=='string')))throw new Error('Invalid isolated MDX snapshot');
    for(const loader of mdxCaches(config)){
        const cache=new Map(entries.map(([resource,code])=>[resource,{promise:Promise.resolve(code)}]));
        cache.get=function(resource){if(!this.has(resource))throw new Error(`Missing isolated client MDX resource: ${resource}`);return Map.prototype.get.call(this,resource);};
        loader.crossCompilerCache=cache;
    }
}
const stateDirectory = (siteDir,locale) => path.join(siteDir,'.i18n-build/compiler-state',locale);
function reportFile(siteDir,locale) {return path.join(siteDir,'.i18n-build/compiler-metrics',locale+'.json');}
function updateReport(siteDir,locale,update) {
    const file=reportFile(siteDir,locale);fs.mkdirSync(path.dirname(file),{recursive:true});
    const value=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{schemaVersion:1,locale,mode:process.env.DORIS_COMPILER_MODE??'isolated',records:[]};
    update(value);fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');return value;
}
function coreModules(fromSite) {
    const requireCore=createRequire(fromSite.resolve('@docusaurus/core/lib/commands/build/buildLocale.js'));
    for(const name of ['@docusaurus/core','@docusaurus/bundler','@docusaurus/mdx-loader']) {
        const version=requireCore(name+'/package.json').version;
        if(version!=='3.6.3')throw new Error(`Revalidate isolated compilation for ${name} ${version}`);
    }
    return requireCore;
}
async function measure({siteDir,locale,name},compile) {
    const startedAtMs=Date.now(),before=process.memoryUsage();let success=false,samples=0,peakRssBytes=before.rss,minimumSystemAvailableKiB=null;
    const sample=()=>{samples++;peakRssBytes=Math.max(peakRssBytes,process.memoryUsage().rss);
        try{const available=Number(fs.readFileSync('/proc/meminfo','utf8').match(/^MemAvailable:\s+(\d+)/m)?.[1]);if(available>0)minimumSystemAvailableKiB=Math.min(minimumSystemAvailableKiB??Infinity,available);}catch{}
    };
    const timer=setInterval(sample,1000);timer.unref();sample();
    try{const result=await compile();success=true;return result;}
    finally{sample();clearInterval(timer);const record={name,pid:process.pid,success,startedAtMs,finishedAtMs:Date.now(),sampleIntervalMs:1000,samples,peakRssBytes,minimumSystemAvailableKiB,before,afterClose:process.memoryUsage()};
        updateReport(siteDir,locale,value=>value.records.push(record));console.log(JSON.stringify({event:'compiler_phase_end',locale,...record}));}
}
async function buildClient({fromSite,siteDir,outDir,locale,samplePlan}) {
    const requireCore=coreModules(fromSite);
    process.env.DOCUSAURUS_CURRENT_LOCALE=locale;
    const {loadSite}=requireCore('@docusaurus/core/lib/server/site.js');
    const {createConfigureWebpackUtils,executePluginsConfigureWebpack}=requireCore('@docusaurus/core/lib/webpack/configure.js');
    const {createBuildClientConfig}=requireCore('@docusaurus/core/lib/webpack/client.js');
    const {props}=await loadSite({siteDir,outDir,locale,localizePath:undefined});
    const utils=await createConfigureWebpackUtils({siteConfig:props.siteConfig});
    const {config:initial,clientManifestPath}=await createBuildClientConfig({props,minify:true,faster:props.siteConfig.future.experimental_faster,configureWebpackUtils:utils,bundleAnalyzer:false});
    const config=executePluginsConfigureWebpack({plugins:props.plugins,config:initial,isServer:false,configureWebpackUtils:utils});
    updateReport(siteDir,locale,value=>{value.bundler=utils.currentBundler.name;value.bundlerVersion='3.6.3';});
    await measure({siteDir,locale,name:'client'},()=>requireCore('@docusaurus/bundler').compile({configs:[config],currentBundler:utils.currentBundler}));
    const bytes=fs.readFileSync(clientManifestPath),directory=stateDirectory(siteDir,locale);fs.mkdirSync(directory,{recursive:true});
    fs.writeFileSync(path.join(directory,'client-manifest.json'),bytes);
    // The pinned MDX loader waits for client promises when compiling the
    // server. Preserve their exact client JSX instead of recompiling in server
    // mode, which would change inline image-loader behavior.
    const mdx=await snapshotMdx(config),entryCount=JSON.parse(mdx).length;
    fs.writeFileSync(path.join(directory,'client-mdx.json'),mdx);
    console.log(JSON.stringify({event:'client_mdx_snapshot',locale,entries:entryCount,bytes:mdx.length}));
    let scopeSha256;
    if(samplePlan){const scope=fs.readFileSync(path.join(siteDir,'.i18n-build/ci-sample/scopes',locale+'.json'));fs.writeFileSync(path.join(directory,'client-scope.json'),scope);scopeSha256=digest(scope);}
    return {clientManifestPath,manifestSha256:digest(bytes),mdxSha256:digest(mdx),mdxEntries:entryCount,bundler:utils.currentBundler.name,scopeSha256};
}
function createServerCompile({compile,restoreManifest,measureServer=callback=>callback()}) {
    return async options=>{
        const names=options.configs.map(config=>config.name);
        if(names.length>2||names[0]!=='client'||names.length===2&&names[1]!=='server')throw new Error(`Revalidate the isolated compiler sequence: ${names.join(',')}`);
        restoreManifest(options);
        // The known hash-router path has no server compiler or SSG bundle.
        if(names.length===1)return;
        return measureServer(()=>compile({...options,configs:[options.configs[1]]}));
    };
}
function install({fromSite,siteDir,locale,clientResult}) {
    const requireCore=coreModules(fromSite),compiler=requireCore('@docusaurus/bundler/lib/compiler.js'),namespace=requireCore('@docusaurus/bundler');
    const original=compiler.compile;
    const wrapped=clientResult?createServerCompile({compile:original,restoreManifest:options=>{
        if(options.currentBundler.name!==clientResult.bundler)throw new Error('Client/server bundler changed between isolated processes');
        const generated=options.configs[0].resolve?.alias?.['@generated'];
        if(typeof generated!=='string'||path.resolve(generated,'client-manifest.json')!==path.resolve(clientResult.clientManifestPath))throw new Error('Client manifest path changed between isolated processes');
        const bytes=fs.readFileSync(path.join(stateDirectory(siteDir,locale),'client-manifest.json'));
        if(digest(bytes)!==clientResult.manifestSha256)throw new Error('Isolated client manifest changed before SSG');
        fs.mkdirSync(path.dirname(clientResult.clientManifestPath),{recursive:true});fs.writeFileSync(clientResult.clientManifestPath,bytes);
        const mdx=fs.readFileSync(path.join(stateDirectory(siteDir,locale),'client-mdx.json'));
        if(digest(mdx)!==clientResult.mdxSha256)throw new Error('Isolated client MDX changed before server compilation');
        restoreMdx(options.configs[1]??options.configs[0],mdx);
    },measureServer:callback=>measure({siteDir,locale,name:'server'},callback)})
        :options=>measure({siteDir,locale,name:options.configs.map(c=>c.name).join('+')},()=>original(options));
    compiler.compile=wrapped;
    if(namespace.compile!==wrapped){compiler.compile=original;throw new Error('Docusaurus compile export no longer references the pinned adapter');}
    return()=>{compiler.compile=original;};
}
async function runClient({siteDir,outDir,locale,samplePlan}) {
    const directory=stateDirectory(siteDir,locale);fs.rmSync(directory,{recursive:true,force:true});
    updateReport(siteDir,locale,value=>{value.mode='isolated';value.records=[];});
    const args=[path.resolve(__dirname,'../build-locale.cjs'),'client',siteDir,outDir,locale,...(samplePlan?[samplePlan]:[])];
    let signal=null;
    await new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,args,{cwd:siteDir,stdio:'inherit',env:process.env});
        console.log(JSON.stringify({event:'client_compiler_start',locale,pid:child.pid}));
        const terminate=()=>{signal='SIGTERM';child.kill(signal);},interrupt=()=>{signal='SIGINT';child.kill(signal);};
        const cleanup=()=>{process.removeListener('SIGTERM',terminate);process.removeListener('SIGINT',interrupt);};
        process.once('SIGTERM',terminate);process.once('SIGINT',interrupt);
        child.once('error',error=>{cleanup();reject(error);});
        child.once('exit',(code,childSignal)=>{cleanup();updateReport(siteDir,locale,value=>{value.clientPid=child.pid;value.clientExitedAtMs=Date.now();value.clientExitCode=code;});
            console.log(JSON.stringify({event:'client_compiler_exit',locale,pid:child.pid,code,signal:childSignal}));
            if(code!==0||signal)reject(new Error(`Isolated client compiler failed (${signal??childSignal??code})`));else resolve();});
    });
    return JSON.parse(fs.readFileSync(path.join(directory,'result.json')));
}
function writeClientResult(siteDir,locale,result) {fs.writeFileSync(path.join(stateDirectory(siteDir,locale),'result.json'),JSON.stringify(result)+'\n');}
function combineSamplingScopes(server,client) {
    const selection=scope=>JSON.stringify((scope.selected??[]).map(({pluginId,version,docId,route})=>[pluginId,version,docId,route]));
    if(server.sourceSha!==client.sourceSha||server.locale!==client.locale||selection(server)!==selection(client))throw new Error('Isolated sample compiler scopes differ');
    if(!Array.isArray(client.compiledMdxModules?.client))throw new Error('Isolated sample client compilation proof is missing');
    return {...server,compiledMdxModules:{...server.compiledMdxModules,client:client.compiledMdxModules.client}};
}
function mergeSamplingScope(siteDir,locale,clientResult) {
    const bytes=fs.readFileSync(path.join(stateDirectory(siteDir,locale),'client-scope.json'));
    if(digest(bytes)!==clientResult.scopeSha256)throw new Error('Isolated sample client proof changed');
    const file=path.join(siteDir,'.i18n-build/ci-sample/scopes',locale+'.json');
    fs.writeFileSync(file,JSON.stringify(combineSamplingScopes(JSON.parse(fs.readFileSync(file)),JSON.parse(bytes)),null,2)+'\n');
}
module.exports={buildClient,createServerCompile,install,runClient,writeClientResult,stateDirectory,mdxCaches,snapshotMdx,restoreMdx,combineSamplingScopes,mergeSamplingScope};
