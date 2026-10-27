// Exercise the real five-language content fixture after its sequential builds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createServer} = require('../publish/serve.cjs');
const {sourceSha} = require('./content-manifest.cjs');
const root = path.resolve(__dirname, '../..');

async function main() {
    const {chromium} = require('playwright');
    const browser = await chromium.launch({headless: true});
    const errors = [], results = [];
    const fixtures = [
        {name:'enabled',directory:'content-fixture'},
        {name:'ru-disabled',directory:'content-disabled-fixture'},
    ];
    try {
        for (const fixture of fixtures) {
            const site = path.join(root, '.i18n-build', fixture.directory, 'build');
            assert(fs.existsSync(path.join(site, 'index.html')), 'Run verify-content-fixture.cjs first');
            const server = createServer(site);
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            const origin = `http://127.0.0.1:${server.address().port}`;
            try {
                const cases = fixture.name === 'enabled' ? [
                    {name:'English browser before Russia',languages:['en-US','ru'],zone:'Europe/Moscow',locale:'en'},
                    {name:'Russian browser before Japan',languages:['fr-FR','ru-RU','ja'],zone:'Asia/Tokyo',locale:'ru'},
                    {name:'Japanese browser before Russia',languages:['ja-JP'],zone:'Europe/Moscow',locale:'ja'},
                    {name:'Chinese script variant',languages:['zh-Hant-TW'],zone:'Europe/Paris',locale:'zh-CN'},
                    {name:'Korean browser variant',languages:['ko-KP'],zone:'Europe/Paris',locale:'ko'},
                    ...[
                        ['Russia','Europe/Moscow','ru'],['Belarus','Europe/Minsk','ru'],
                        ['Kazakhstan','Asia/Almaty','ru'],['Kostanay','Asia/Qostanay','ru'],
                        ['Kyrgyzstan','Asia/Bishkek','ru'],['Tajikistan','Asia/Dushanbe','ru'],
                        ['Turkmenistan','Asia/Ashgabat','ru'],['Uzbekistan','Asia/Tashkent','ru'],
                        ['Mainland China','Asia/Shanghai','zh-CN'],['Urumqi','Asia/Urumqi','zh-CN'],
                        ['Japan','Asia/Tokyo','ja'],['South Korea','Asia/Seoul','ko'],['North Korea','Asia/Pyongyang','ko'],
                        ['France','Europe/Paris','en'],['Hong Kong','Asia/Hong_Kong','en'],
                        ['Taiwan','Asia/Taipei','en'],['Singapore','Asia/Singapore','en'],['Ukraine','Europe/Kyiv','en'],
                    ].map(([name,zone,locale]) => ({name,languages:['fr-FR','de-DE'],zone,locale})),
                    {name:'saved English before browser and region',languages:['ru'],zone:'Europe/Moscow',locale:'en',saved:'en'},
                    {name:'explicit Russian URL before saved English',languages:['ja'],zone:'Asia/Tokyo',locale:'ru',saved:'en',route:'/ru/'},
                    {name:'English deep URL before saved Russian',languages:['ru'],zone:'Europe/Moscow',locale:'en',saved:'ru',route:'/sample-0/'},
                    {name:'root manual English without storage',languages:['ja'],zone:'Asia/Tokyo',locale:'en',blocked:true,route:'/?lang=en&q=one#usage'},
                    {name:'unmatched browser with blocked storage',languages:['fr-FR'],zone:'Europe/Moscow',locale:'ru',blocked:true},
                    {name:'automatic query and hash',languages:['ja'],zone:'Europe/Paris',locale:'ja',route:'/?q=one#usage'},
                ] : [
                    {name:'disabled Russian browser and region',languages:['ru-RU'],zone:'Europe/Moscow',locale:'en'},
                    {name:'next enabled browser language',languages:['ru-RU','ko-KR'],zone:'Europe/Moscow',locale:'ko'},
                ];
                for (const sample of cases) {
                    const context = await browser.newContext({locale:'fr-FR',timezoneId:sample.zone,viewport:{width:1440,height:1000}});
                    await context.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
                    await context.addInitScript(({languages,saved,blocked}) => {
                        Object.defineProperty(navigator,'languages',{get:()=>languages});
                        if (saved) localStorage.setItem('doris.localePreference',JSON.stringify({version:1,locale:saved,updatedAt:Date.now()}));
                        if (blocked) for (const key of ['localStorage','sessionStorage']) Object.defineProperty(window,key,{get(){throw new Error('Fixture storage unavailable');}});
                    }, {languages:sample.languages,saved:sample.saved,blocked:sample.blocked});
                    const page = await context.newPage();
                    const documents = [];
                    page.on('request', request => {if(request.resourceType()==='document')documents.push(request.url());});
                    page.on('pageerror', error => errors.push({case:sample.name,message:error.message}));
                    page.on('console', message => {if(message.type()==='error' && /hydration|did not match|Minified React error/i.test(message.text()))errors.push({case:sample.name,message:message.text()});});
                    await page.goto(origin + (sample.route ?? '/'),{waitUntil:'commit'});
                    const pathname = sample.route === '/sample-0/' ? '/sample-0/' : sample.locale === 'en' ? '/' : `/${sample.locale}/`;
                    await page.waitForURL(url=>url.pathname===pathname&&!url.searchParams.has('__doris_locale_entry'),{waitUntil:'networkidle'});
                    assert.equal(await page.locator('.language-menu > summary').getAttribute('lang'),sample.locale,sample.name);
                    const url = new URL(page.url());
                    if (sample.route?.includes('q=one')) {assert.equal(url.searchParams.get('q'),'one');assert.equal(url.hash,'#usage');}
                    assert(documents.length<=2, 'No repeated root/locale navigation');
                    const timing = await page.evaluate(()=>({domContentLoaded:performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
                        resources:performance.getEntriesByType('resource').length}));
                    results.push({fixture:fixture.name,...sample,url:url.pathname+url.search+url.hash,documentRequests:documents.length,timing});
                    await context.close();
                }
                if (fixture.name === 'enabled') {
                    const context = await browser.newContext({locale:'ru-RU',timezoneId:'Asia/Tokyo'});
                    await context.addInitScript(()=>{if(!sessionStorage.getItem('fixture-preference-seeded')){
                        localStorage.setItem('doris.localePreference',JSON.stringify({version:1,locale:'en',updatedAt:Date.now()}));
                        sessionStorage.setItem('fixture-preference-seeded','1');}});
                    const page = await context.newPage();
                    page.on('pageerror',error=>errors.push({case:'reset language',message:error.message}));
                    await page.goto(origin+'/',{waitUntil:'networkidle'});
                    await page.locator('.language-menu > summary').click();
                    await page.locator('.language-menu__reset').click();
                    await page.waitForFunction(()=>document.querySelector('.language-menu__status')?.textContent.includes('cleared'));
                    assert.equal(await page.evaluate(()=>localStorage.getItem('doris.localePreference')),null);
                    await page.goto(origin+'/',{waitUntil:'commit'});
                    await page.waitForURL(url=>url.pathname==='/ru/'&&!url.searchParams.has('__doris_locale_entry'),{waitUntil:'networkidle'});
                    results.push({fixture:fixture.name,name:'reset saved English resumes browser preference',url:new URL(page.url()).pathname});
                    await context.close();

                    const blocked = await browser.newContext({locale:'ja-JP',timezoneId:'Asia/Tokyo'});
                    await blocked.addInitScript(()=>{for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw new Error('Fixture storage unavailable');}});});
                    const blockedPage = await blocked.newPage();
                    await blockedPage.goto(origin+'/ja/',{waitUntil:'networkidle'});
                    await blockedPage.locator('.language-menu > summary').click();
                    await blockedPage.locator('.language-menu__links a[lang="en-US"]').click();
                    await blockedPage.waitForURL(url=>url.pathname==='/'&&!url.searchParams.has('lang'),{waitUntil:'networkidle'});
                    assert.equal(await blockedPage.locator('.language-menu > summary').getAttribute('lang'),'en');
                    results.push({fixture:fixture.name,name:'actual manual English click works without storage',url:new URL(blockedPage.url()).pathname});
                    await blocked.close();

                    const nojs = await browser.newContext({javaScriptEnabled:false,locale:'ja-JP',timezoneId:'Asia/Tokyo'});
                    const nojsPage = await nojs.newPage();
                    await nojsPage.goto(origin+'/',{waitUntil:'networkidle'});
                    assert.equal(new URL(nojsPage.url()).pathname,'/');
                    assert((await nojsPage.locator('main').innerText()).includes('English home body'));
                    assert.equal(await nojsPage.locator('.language-menu__links a').count(),5);
                    results.push({fixture:fixture.name,name:'no JavaScript keeps English SSR and five language links'});
                    await nojs.close();
                }
            } finally {await new Promise(resolve=>server.close(resolve));}
        }
        assert.deepEqual(errors,[]);
        const result = {success:true,sourceSha:sourceSha(root),scope:'local sequential five-language/disabled-locale fixture; not public deployment',results,errors};
        fs.writeFileSync(path.join(root,'.i18n-build/locale-entry-fixture-verification.json'),JSON.stringify(result,null,2)+'\n');
        console.log(JSON.stringify({success:true,cases:results.length,errors}));
        return result;
    } finally {await browser.close();}
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={main};
