const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {buildLocales} = require('../build-locales.cjs');
const {createServer} = require('./serve.cjs');

const root = path.resolve(__dirname,'../..');
const fixture = path.join(root,'.i18n-build/matomo-fixture');
const production = 'https://doris.apache.org';

async function main() {
    fs.rmSync(fixture,{recursive:true,force:true});
    const write = (file,content) => {
        fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});
        fs.writeFileSync(path.join(fixture,file),content);
    };
    write('package.json','{"name":"matomo-fixture","private":true}');
    fs.symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'));
    write('docusaurus.config.js',`module.exports = {title:'Matomo fixture',url:${JSON.stringify(production)},baseUrl:'/',trailingSlash:true,
        future:{experimental_faster:true},i18n:{defaultLocale:'en',locales:['en','zh-CN']},
        presets:[['classic',{docs:{sidebarPath:false},blog:false}]],
        plugins:[${JSON.stringify(path.join(root,'config/matomo-plugin/index.cjs'))}],
        themeConfig:{matomo:{matomoUrl:'https://analytics.apache.org/',siteId:'43'}}};`);
    write('src/pages/index.jsx',`import React from 'react';import Link from '@docusaurus/Link';
        export default function Home(){return <main><h1>Home</h1><Link to="/docs/intro/?from=home">Open docs</Link></main>}`);
    const intro = 'import Link from "@docusaurus/Link";\n\n# Intro\n\n[Next document](/docs/second/?from=intro)\n\n<Link to="pathname:///zh-CN/docs/intro/" target="_self">Chinese document</Link>\n';
    write('docs/intro.md',intro);
    write('docs/second.md','# Second\n\nSecond page.\n');
    write('i18n/zh-CN/docusaurus-plugin-content-docs/current/intro.md',intro.replace('# Intro','# 介绍'));
    write('i18n/zh-CN/docusaurus-plugin-content-docs/current/second.md','# 第二页\n');
    await buildLocales({siteDir:fixture,outDir:'build'});
    const server = createServer(path.join(fixture,'build'));
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const local = `http://127.0.0.1:${server.address().port}`;
    const {chromium} = require('playwright'), browser = await chromium.launch({headless:true});
    const results = [], errors = [];
    // A tracker double observes the generated bootstrap and real route hooks.
    // Every request is fulfilled locally; no production analytics are sent.
    const tracker = `window.__matomoViews=[];var url=location.href,title=document.title;
        function record(c){if(c[0]==='setCustomUrl')url=c[1];if(c[0]==='setDocumentTitle')title=c[1];
        if(c[0]==='trackPageView')window.__matomoViews.push({url:new URL(url,location.origin).href,title});}
        window._paq.forEach(record);window._paq.push=function(){Array.from(arguments).forEach(record);};`;
    async function context(origin, automation = false) {
        const context = await browser.newContext({serviceWorkers:'block'});
        if (!automation) await context.addInitScript(() => Object.defineProperty(navigator,'webdriver',{get:()=>false}));
        let trackerLoads = 0;
        await context.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.href === 'https://analytics.apache.org/matomo.js') {
                trackerLoads++;
                return route.fulfill({contentType:'text/javascript',body:tracker});
            }
            if (url.origin !== origin) return route.abort();
            return route.fulfill({response:await context.request.get(local+url.pathname+url.search)});
        });
        const page = await context.newPage();
        page.on('pageerror',error => errors.push(error.message));
        return {context,page,loads:() => trackerLoads};
    }
    try {
        for (const entry of ['/', '/docs/intro/?campaign=direct']) {
            const {context:session,page,loads} = await context(production);
            const checkpoints = [];
            await page.goto(production+entry,{waitUntil:'networkidle'});
            assert.equal(await page.evaluate(() => window.__matomoViews.length),1,entry);
            assert.equal(loads(),1);
            checkpoints.push({step:'direct',views:1});
            if (entry === '/') {
                await page.getByRole('link',{name:'Open docs',exact:true}).click();
                await page.waitForFunction(() => window.__matomoViews.length === 2);
                checkpoints.push({step:'SPA document',views:2});
            }
            const before = await page.evaluate(() => window.__matomoViews.length);
            await page.evaluate(() => {location.hash = 'intro';});
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve,0))));
            assert.equal(await page.evaluate(() => window.__matomoViews.length),before);
            checkpoints.push({step:'anchor',views:before});
            await page.getByRole('link',{name:'Next document',exact:true}).click();
            await page.waitForFunction(count => window.__matomoViews.length === count,before+1);
            assert.equal(await page.evaluate(() => window.__matomoViews.at(-1).url),production+'/docs/second/?from=intro');
            const trackedTitle = await page.evaluate(() => window.__matomoViews.at(-1).title);
            assert(trackedTitle.includes('Second'),trackedTitle);
            checkpoints.push({step:'SPA next document',views:before+1});
            await page.goBack();
            await page.waitForFunction(count => window.__matomoViews.length === count,before+2);
            checkpoints.push({step:'history back',views:before+2});
            await page.getByRole('link',{name:'Chinese document',exact:true}).click();
            await page.waitForURL(production+'/zh-CN/docs/intro/');
            // Locale switches may reload the document; each new document also
            // has exactly one bootstrap PV and skips its initial route hook.
            await page.waitForLoadState('networkidle');
            assert.equal(await page.evaluate(() => window.__matomoViews.filter(view => new URL(view.url).pathname === '/zh-CN/docs/intro/').length),1);
            checkpoints.push({step:'language full load',views:1});
            results.push({entry,checkpoints,views:await page.evaluate(() => window.__matomoViews)});
            await session.close();
        }
        for (const [origin,automation] of [[local,false],['https://doris.staged.apache.org',false],[production,true]]) {
            const {context:session,page,loads} = await context(origin,automation);
            await page.goto(origin+'/',{waitUntil:'networkidle'});
            await page.getByRole('link',{name:'Open docs',exact:true}).click();
            await page.waitForURL(origin+'/docs/intro/?from=home');
            assert.equal(loads(),0);
            assert.equal(await page.evaluate(() => typeof window._paq),'undefined');
            results.push({origin,automation,trackerLoads:loads()});
            await session.close();
        }
        assert.deepEqual(errors,[]);
        write('report.json',JSON.stringify({passed:true,results},null,2)+'\n');
        console.log(JSON.stringify({passed:true,results},null,2));
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}
if (require.main === module) main().catch(error => {console.error(error);process.exitCode=1;});
