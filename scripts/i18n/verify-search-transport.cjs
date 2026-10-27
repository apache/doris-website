const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync, execFileSync} = require('node:child_process');
const {createFixture} = require('./__tests__/fixtures/multi-locale.cjs');
const {createServer} = require('../publish/serve.cjs');
const root = path.resolve(__dirname, '../..');
const fixture = path.join(root, '.i18n-build/search-transport-fixture');

async function build() {
    fs.rmSync(fixture, {recursive:true, force:true});
    const {write} = await createFixture(fixture, {searchDocument:true});
    for (const directory of ['src/theme/SearchBar','src/theme/SearchPage','src/theme/LoadingRing',
        'src/utils','src/hooks','src/constant','shared']) {
        fs.cpSync(path.join(root,directory),path.join(fixture,directory),{recursive:true});
    }
    write('src/scss/_variables.scss',fs.readFileSync(path.join(root,'src/scss/_variables.scss'),'utf8'));
    write('static/images/search-icon.svg',fs.readFileSync(path.join(root,'static/images/search-icon.svg')));
    write('src/search-fixture.scss','@use "./scss/variables";\n');
    write('src/theme/Root.tsx',`import React, {useEffect} from 'react';
export default function Root({children}){useEffect(()=>{document.documentElement.dataset.hasHydrated='true';},[]);return children;}\n`);
    fs.appendFileSync(path.join(fixture,'docusaurus.config.js'),`
const base = module.exports;
module.exports = () => {const config = base();
 config.future = {experimental_faster:true};
 config.plugins.push('docusaurus-plugin-sass',require(${JSON.stringify(path.join(root,'config/custom-docusaurus-plugin.js'))}));
 config.presets[0][1].theme = {customCss:[require.resolve('./src/search-fixture.scss')]};
 config.themes = [[require(${JSON.stringify(path.join(root,'scripts/i18n/search-plugin.cjs'))}),{
  hashed:true,language:['en','zh'],indexDocs:true,indexBlog:false,indexPages:false,
  docsRouteBasePath:['docs','community'],searchContextByPaths:['docs','community'],
  useAllContextsWithNoSearchContext:false,highlightSearchTermsOnTargetPage:true}]];
 config.themeConfig = {navbar:{title:'Search fixture',items:[{type:'search',position:'right'}]}};
 return config;};\n`);
    execFileSync('git',['add','.'],{cwd:fixture});
    execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Search transport fixture'],{cwd:fixture});
    const result = spawnSync(process.execPath,[path.join(root,'scripts/build-locales.cjs'),'--site-dir',fixture],
        {cwd:root,stdio:'inherit',env:{...process.env,DORIS_ASSET_ORIGIN:'https://cdnd.selectdb.com',
            NODE_OPTIONS:'--max-old-space-size=4096',TERSER_PARALLEL:'false'}});
    assert.equal(result.status,0,'Search transport fixture build');
}

async function verify() {
    const {chromium,request} = require('playwright');
    const site = path.join(fixture,'build'),server = createServer(site);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const localOrigin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({headless:true}),api=await request.newContext();
    const csp=fs.readFileSync(path.join(root,'static/.htaccess'),'utf8').match(/Header set Content-Security-Policy "([^"]+)"/)[1];
    const results=[],errors=[],contexts=new Set();
    async function context(mode={}) {
        const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:900}}),requests=[];
        contexts.add(ctx);
        await ctx.route('**/*',async route=>{
            const url=new URL(route.request().url());
            if(!['doris.apache.org','cdnd.selectdb.com'].includes(url.hostname))return route.abort();
            if(/search-index.*\.json$/.test(url.pathname)) {
                requests.push({url:url.href,origin:url.origin});
                if(mode.failBoth||mode.failCdn&&url.hostname==='cdnd.selectdb.com')
                    return route.fulfill({status:503,body:'Unavailable',headers:{'access-control-allow-origin':'*'}});
                if(mode.delay)await new Promise(resolve=>setTimeout(resolve,mode.delay));
            }
            const response=await api.get(localOrigin+url.pathname+url.search);
            return route.fulfill({response,headers:{...response.headers(),'content-security-policy':csp,
                'access-control-allow-origin':'*'}});
        });
        const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.message));
        return {ctx,page,requests};
    }
    async function close(ctx) {
        await ctx.unrouteAll({behavior:'wait'});
        await ctx.close();contexts.delete(ctx);
    }
    const open=async(page,url)=>{
        assert.equal((await page.goto('https://doris.apache.org'+url,{waitUntil:'domcontentloaded'})).status(),200);
        await page.waitForSelector('html[data-has-hydrated="true"]');
    };
    const input=page=>page.locator('input.navbar__search-input:not([readonly]):visible').first();
    const suggestions=page=>page.locator('[class*="suggestion_"]');
    try {
        for(const locale of ['en','zh-CN','ja','ko','ru']) {
            const {ctx,page,requests}=await context({delay:1000});
            const manifest=JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/content-manifests',locale+'.json')));
            const doc=manifest.pages.find(p=>p.kind==='docs'&&p.pluginId==='default'&&p.version==='current'&&p.docId==='shared');
            assert(doc);await open(page,doc.route);
            await input(page).fill('Doris');
            await suggestions(page).first().waitFor();
            assert.equal(await input(page).inputValue(),'Doris');
            assert(requests.some(r=>r.origin==='https://cdnd.selectdb.com'));
            assert(requests.every(r=>/search-index.*-[a-f0-9]{16}\.json$/.test(new URL(r.url).pathname)));
            const ax=await page.locator('.navbar__search').ariaSnapshot();
            assert.match(ax,/combobox/);
            results.push({locale,earlyQueryPreserved:true,results:await suggestions(page).count(),requests,accessibility:ax});
            await close(ctx);
        }
        {
            const {ctx,page,requests}=await context({failCdn:true});
            await open(page,'/docs/dev/english-shared/');await input(page).fill('Doris');
            await suggestions(page).first().waitFor();
            assert(requests.some(r=>r.origin==='https://cdnd.selectdb.com'));
            assert(requests.some(r=>r.origin==='https://doris.apache.org'));
            results.push({fallbackToOrigin:true,requests});await close(ctx);
        }
        const retryLabels={en:'Retry','zh-CN':'重试',ja:'再試行',ko:'다시 시도',ru:'Повторить'};
        for(const locale of Object.keys(retryLabels)) for(const fullPage of [false,true]) {
            const mode={failBoth:true},{ctx,page,requests}=await context(mode);
            const prefix=locale==='en'?'':'/'+locale;
            const manifest=JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/content-manifests',locale+'.json')));
            const doc=manifest.pages.find(p=>p.kind==='docs'&&p.pluginId==='default'&&p.version==='current'&&p.docId==='shared');
            const searchContext=['ja','ko','ru'].includes(locale)?'docs/dev':'docs';
            await open(page,fullPage?prefix+'/search/?q=Doris&ctx='+encodeURIComponent(searchContext)+'&version=docs/dev/':doc.route);
            if(!fullPage)await input(page).fill('Doris');
            const retryButton=(fullPage?page.locator('.container.margin-vert--lg'):page.locator('.navbar__search'))
                .getByRole('button',{name:retryLabels[locale],exact:true});
            await retryButton.waitFor();
            const themeChecks=[];
            if(!fullPage) {
                await page.setViewportSize({width:390,height:844});
                for(const theme of ['doris','golden','blue','read','yellow-blue','purple','yellow-black','sky']) {
                    await page.evaluate(value=>{document.documentElement.dataset.brandTheme=value;},theme);
                    const status=page.locator('.navbar__search [role="status"]');
                    const box=await status.boundingBox();
                    const style=await status.evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,
                        scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}));
                    assert(box.x>=-1&&box.x+box.width<=391,'Mobile search retry overflows');
                    assert(style.scrollWidth<=style.clientWidth+1);
                    assert.notEqual(style.background,'rgba(0, 0, 0, 0)');
                    themeChecks.push({theme,box,...style});
                }
            }
            const failedRequests=requests.length;mode.failBoth=false;
            await retryButton.click();
            if(fullPage)await page.locator('section article').first().waitFor();
            else {await suggestions(page).first().waitFor();assert.equal(await input(page).inputValue(),'Doris');}
            await retryButton.waitFor({state:'detached'});
            assert(requests.length>failedRequests,'Retry must discard the failed worker cache entry');
            results.push({locale,fullPage,recoversWithoutReload:true,themeChecks,requests});await close(ctx);
        }
        assert.deepEqual(errors,[]);
        return {scope:'Small real five-language Rspack fixture only; not a public deployment',
            implementationSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),results,errors,passed:true};
    } finally {
        for(const ctx of contexts)await close(ctx);
        await browser.close();await api.dispose();server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));
    }
}
async function main() {
    if(!process.argv.includes('--verify-existing'))await build();
    if(process.argv.includes('--browser')) {
        const result=await verify();fs.writeFileSync(path.join(root,'.i18n-build/search-transport-verification.json'),JSON.stringify(result,null,2)+'\n');
        console.log(JSON.stringify({passed:result.passed,cases:result.results.length}));
    }
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
