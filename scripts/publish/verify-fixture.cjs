const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {buildLocales} = require('../build-locales.cjs');
const {createServer} = require('./serve.cjs');
const {inventory} = require('./optimize.cjs');

const root = path.resolve(__dirname,'../..');
const fixture = path.join(root,'.i18n-build/publish-fixture');
const locales = ['en','zh-CN','ja','ko','ru'];
const hash = content => createHash('sha256').update(content).digest('hex');
// Status/header probes still need to finish their response body so Undici can
// reuse the connection. Otherwise a long Apache probe can exhaust its workers.
async function probe(url, options) {
    const response = await fetch(url, options);
    await response.arrayBuffer();
    return response;
}

async function main() {
    const verifyOnly = process.argv.includes('--verify-existing');
    const image = Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jivsAAAAASUVORK5CYII=','base64'),Buffer.alloc(65536)]);
    if (!verifyOnly) {
    fs.rmSync(fixture,{recursive:true,force:true});
    const write = (file,content) => {
        fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});
        fs.writeFileSync(path.join(fixture,file),content);
    };
    write('package.json','{"name":"publish-fixture","private":true}');
    fs.symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'));
    for (const name of ['brand-theme-bootstrap','course-rail-bootstrap']) write(`static/js/${name}.js`,
        fs.readFileSync(path.join(root,`static/js/${name}.js`)));
    write('static/.htaccess',fs.readFileSync(path.join(root,'static/.htaccess')));
    write('static/images/shared.png',image);
    write('static/pdf/reference.pdf','%PDF-1.4\nFixture reference document\n');
    write('static/fonts/inter.ttf',fs.readFileSync(path.join(root,'static/fonts/Inter-VariableFont_opsz,wght.ttf')));
    write('static/fixture.css','@font-face {font-family:Fixture;src:url("/fonts/inter.ttf")} main {font-family:Fixture}');
    const document = '# Example\n\nFixtureSQL documents Apache Doris.\n\n![Shared image](/images/shared.png)\n\n[Reference PDF](/pdf/reference.pdf)\n';
    write('docs/intro.md',document);
    for (const locale of locales.slice(1)) write(`i18n/${locale}/docusaurus-plugin-content-docs/current/intro.md`,
        document.replace('documents',`${locale} documents`));
    write('src/pages/index.jsx',`import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {searchByWorker} from '@yang1666204/docusaurus-search-local/dist/client/client/theme/searchByWorker';
export default function Home() {const [value,setValue]=React.useState('');
const {siteConfig:{baseUrl},i18n:{currentLocale}}=useDocusaurusContext();
return <main><button onClick={async()=>setValue((await import('./_lazy')).default)}>Load module</button>
<button onClick={async()=>{const results=await searchByWorker(baseUrl,undefined,'FixtureSQL',10);
setValue(results.length>0&&results.every(r=>r.document.u.startsWith(baseUrl+'docs/'))?'SEARCH_OK_'+currentLocale:'SEARCH_WRONG')}}>Search module</button><p>{value}</p></main>}`);
    write('src/pages/_lazy.js','export default "LAZY_OK";');
    write('docusaurus.config.js',`const shared = require(${JSON.stringify(path.join(root,'scripts/publish/shared-assets.cjs'))});
const {scripts} = require(${JSON.stringify(path.join(root,'scripts/publish/bootstrap.cjs'))});
module.exports = {title:'Publish fixture',url:'https://doris.apache.org',baseUrl:'/',trailingSlash:true,
future:{experimental_faster:${!process.argv.includes('--webpack')}},
i18n:{defaultLocale:'en',locales:${JSON.stringify(locales)}},
...require(${JSON.stringify(path.join(root,'config/ssrTemplate.js'))}),
headTags:shared.enabled()?scripts(__dirname).map(s=>({tagName:'script',attributes:{src:'/'+s.file}})):[],
presets:[['classic',{docs:{path:'docs',sidebarPath:false},blog:false,theme:{customCss:'./static/fixture.css'}}]],
plugins:[${JSON.stringify(path.join(root,'config/custom-docusaurus-plugin.js'))},
['@docusaurus/plugin-client-redirects',{fromExtensions:['html','htm'],redirects:[{from:'/legacy',to:'/docs/intro/'}]}]],
themes:[['@yang1666204/docusaurus-search-local',{hashed:true,language:['en'],docsRouteBasePath:'docs',indexBlog:false}]],
};`);
    }
    let baseline;
    process.env.DORIS_ASSET_ORIGIN = '';
    if (!verifyOnly && process.argv.includes('--compare')) {
        delete process.env.DORIS_OPTIMIZE_PUBLISH;
        await buildLocales({siteDir:fixture,outDir:'baseline'});
        const files = inventory(path.join(fixture,'baseline'));
        baseline = {files:files.length,bytes:files.reduce((n,item) => n+item.size,0)};
    }
    process.env.DORIS_OPTIMIZE_PUBLISH = 'true';
    const report = verifyOnly ? JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/build-result.json'),'utf8'))
        : await buildLocales({siteDir:fixture,outDir:'build'});
    if (verifyOnly && fs.existsSync(path.join(fixture,'baseline'))) {
        const files = inventory(path.join(fixture,'baseline'));
        baseline = {files:files.length,bytes:files.reduce((n,item) => n+item.size,0)};
    }
    const site = path.join(fixture,'build');
    if (verifyOnly) report.optimization.verification = require('./verify.cjs').verify(site);
    const server = createServer(site);
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const previewOrigin = `http://127.0.0.1:${server.address().port}`;
    let apache;
    try {
        if (process.argv.includes('--apache')) apache = await require('./apache.cjs').apache(site);
        for (const origin of [previewOrigin,...(apache ? [apache.origin] : [])]) {
            const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
            for (const [from,to,preserveQuery,status = 301] of manifest.redirects) {
                const response = await probe(origin+from+'?probe=1',{redirect:'manual'});
                assert.equal(response.status,status,`${origin}${from}`);
                const location = new URL(response.headers.get('location'),origin);
                const expected = new URL(to,origin);
                if (preserveQuery) expected.search = '?probe=1';
                assert.equal(location.href,expected.href,from);
            }
            for (const locale of locales) {
                const prefix = locale === 'en' ? '' : `/${locale}`;
                const html = await (await fetch(origin+prefix+'/docs/intro/')).text();
                assert(html.includes(locale === 'en' ? 'FixtureSQL documents' : `FixtureSQL ${locale} documents`));
                const $ = require('cheerio').load(html);
                const urls = $('script[src],link[rel="stylesheet"],img[src]').map((_,node) => $(node).attr('src') ?? $(node).attr('href')).get();
                for (const resource of urls.filter(value => !value.startsWith('data:'))) {
                    const response = await probe(new URL(resource,origin));
                    assert.equal(response.status,200,resource);
                }
                assert.equal((await probe(origin+prefix+'/not-a-page')).status,404);
            }
        }
        let browser;
        if (process.argv.includes('--browser')) {
            const {chromium} = require('playwright');
            browser = await chromium.launch({headless:true});
            try {
                for (const locale of locales) {
                    const page = await browser.newPage();
                    const errors = [];
                    page.on('pageerror',error => errors.push(error.message));
                    page.on('response',response => {if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
                    const prefix = locale === 'en' ? '' : `/${locale}`;
                    await page.goto(previewOrigin+prefix+'/',{waitUntil:'networkidle'});
                    await page.getByRole('button',{name:'Load module'}).click();
                    await page.getByText('LAZY_OK').waitFor();
                    await page.getByRole('button',{name:'Search module'}).click();
                    await page.getByText('SEARCH_OK_'+locale).waitFor();
                    await page.goto((apache?.origin ?? previewOrigin)+prefix+'/docs/intro.html/?probe=1#example',{waitUntil:'networkidle'});
                    assert(page.url().endsWith(prefix+'/docs/intro/?probe=1#example'));
                    const imageUrl = await page.locator('article img').getAttribute('src');
                    assert.equal(hash(Buffer.from(await (await fetch(new URL(imageUrl,previewOrigin))).arrayBuffer())),hash(image));
                    assert.deepEqual(errors,[],locale);
                    await page.close();
                }
            } finally {await browser.close();}
        }
        const result = {baseline,...report.optimization,bundler:process.argv.includes('--webpack') ? 'webpack' : 'rspack',
            apache:!!apache,browser:process.argv.includes('--browser')};
        fs.writeFileSync(path.join(fixture,'report.json'),JSON.stringify(result,null,2)+'\n');
        console.log(JSON.stringify(result,null,2));
    } finally {
        if (apache) await apache.close();
        await new Promise(resolve => server.close(resolve));
    }
}
if (require.main === module) main().catch(error => {console.error(error);process.exitCode=1;});
