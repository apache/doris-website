const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const plugin = require('../../../config/matomo-plugin/index.cjs');
const {trackRouteUpdate} = require('../../../config/matomo-plugin/tracking.cjs');

const context = {siteConfig:{url:'https://doris.apache.org',themeConfig:{matomo:{
    matomoUrl:'https://analytics.apache.org/',siteId:'43',phpLoader:'matomo.php',jsLoader:'matomo.js',
}}}};

function bootstrap(t,origin = context.siteConfig.url,webdriver = false) {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    t.after(() => {if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;});
    const instance = plugin(context), scripts = [], timers = [];
    const browser = {location:{origin},navigator:{webdriver},document:{title:'Initial page',
        createElement:() => ({}),getElementsByTagName:() => [{parentNode:{insertBefore:script => scripts.push(script)}}]},
        requestAnimationFrame:callback => timers.push(callback),setTimeout:callback => timers.push(callback)};
    const code = instance.injectHtmlTags().headTags.find(tag => tag.tagName === 'script').innerHTML;
    vm.runInNewContext(code,{window:browser,document:browser.document});
    return {browser,scripts,instance,flush:() => {while (timers.length) timers.shift()();}};
}

const location = (pathname,search = '',hash = '') => ({pathname,search,hash});
const views = browser => (browser._paq || []).filter(command => command[0] === 'trackPageView').length;

test('a production full load counts once, followed by one PV per SPA page/query change', t => {
    const {browser,scripts,instance,flush} = bootstrap(t);
    assert.equal(scripts.length,1);
    assert.equal(scripts[0].src,'https://analytics.apache.org/matomo.js');
    assert(instance.getClientModules()[0].endsWith('/config/matomo-plugin/track.js'));
    assert(browser._paq.some(command => command[0] === 'setSiteId' && command[1] === '43'));
    assert(browser._paq.some(command => command[0] === 'enableLinkTracking'));
    assert(browser._paq.some(command => command[0] === 'enableHeartBeatTimer'));
    const first = location('/docs/dev/intro/','?campaign=docs','#intro');
    trackRouteUpdate(browser,{location:first,previousLocation:null}); flush();
    assert.equal(views(browser),1);
    const second = location('/docs/dev/install/','?campaign=docs');
    trackRouteUpdate(browser,{location:second,previousLocation:first});
    browser.document.title = 'Install'; flush();
    assert.equal(views(browser),2);
    assert(browser._paq.some(command => command[0] === 'setCustomUrl' && command[1] === '/docs/dev/install/?campaign=docs'));
    assert(browser._paq.some(command => command[0] === 'setDocumentTitle' && command[1] === 'Install'));
    const search = location('/docs/dev/install/','?campaign=other');
    trackRouteUpdate(browser,{location:search,previousLocation:second}); flush();
    assert.equal(views(browser),3);
    const translated = location('/zh-CN/docs/dev/install/','?campaign=other');
    trackRouteUpdate(browser,{location:translated,previousLocation:search}); flush();
    assert.equal(views(browser),4);
    trackRouteUpdate(browser,{location:search,previousLocation:translated}); flush();
    assert.equal(views(browser),5);
});

test('document anchors and unchanged locations do not count as another page view', t => {
    const {browser,flush} = bootstrap(t);
    const first = location('/docs/dev/intro/','?from=docs');
    for (const hash of ['', '#overview', '#examples']) {
        trackRouteUpdate(browser,{location:{...first,hash},previousLocation:first}); flush();
    }
    assert.equal(views(browser),1);
});

test('local/staging/CDN previews and WebDriver browsers never load or queue the tracker', t => {
    for (const origin of ['http://localhost:3000','http://127.0.0.1:3000','http://[::1]:3000',
        'https://doris.staged.apache.org','https://cdnd.selectdb.com','https://doris.apache.org.example.com']) {
        const {browser,scripts,flush} = bootstrap(t,origin);
        trackRouteUpdate(browser,{location:location('/next/'),previousLocation:location('/')}); flush();
        assert.equal(scripts.length,0,origin);
        assert.equal(views(browser),0,origin);
    }
    const {browser,scripts,flush} = bootstrap(t,context.siteConfig.url,true);
    trackRouteUpdate(browser,{location:location('/next/'),previousLocation:location('/')}); flush();
    assert.equal(scripts.length,0);
    assert.equal(views(browser),0);
});

test('development and SSR do not register tracking modules or inject a tracker', t => {
    const previous = process.env.NODE_ENV;
    t.after(() => {if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;});
    process.env.NODE_ENV = 'development';
    const instance = plugin(context);
    assert.deepEqual(instance.getClientModules(),[]);
    assert.equal(instance.injectHtmlTags().headTags,undefined);
    assert.doesNotThrow(() => trackRouteUpdate({}, {location:location('/'),previousLocation:null}));
});
