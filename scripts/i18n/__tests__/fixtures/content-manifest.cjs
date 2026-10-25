const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createFixture} = require('./multi-locale.cjs');
const {digestFiles} = require('../../manual-state.cjs');
const repo = path.resolve(__dirname, '../../../..');
async function createContentFixture(root) {
    const fixture = await createFixture(root, {searchDocument: true});
    const {write} = fixture;
    const registry = [{id: 'home', kind: 'page', sourcePath: 'src/pages/index.tsx'},
        {id: 'slack', kind: 'utility', sourcePath: 'src/pages/slack.tsx'}];
    write('src/pages/slack.tsx', "import React from 'react'; export default function Slack(){return <main>Slack utility</main>;}\n");
    const states = {pages: [], blog: []};
    const counts = {'zh-CN': 0, ja: 1, ko: 2, ru: 3};
    for (let i = 0; i < 3; i++) {
        const file = `src/pages/sample-${i}.tsx`;
        registry.push({id: `sample-${i}`, kind: 'page', sourcePath: file});
        write(file, `import React from 'react'; import Translate from '@docusaurus/Translate'; import {LayoutNext} from '@site/src/components/home-next/LayoutNext';
export default function Page(){return <LayoutNext title="Sample ${i}"><h1><Translate id="fixture.${i}">English sample ${i}</Translate></h1><a href="/sample-2/">Next</a><a href="/blog/native-0/">Blog</a></LayoutNext>;}\n`);
        write(`blog/2026-01-0${i + 1}-sample.md`, `---\ntitle: English article ${i}\nslug: /native-${i}\n---\n\nEnglish article ${i}.\n`);
    }
    for (const [locale, count] of Object.entries(counts)) {
        const messages = Object.fromEntries(Array.from({length: count}, (_, i) => [`fixture.${i}`, {message: `${locale} translated sample ${i}`} ]));
        write(`i18n/${locale}/code.json`, JSON.stringify(messages));
        for (let i = 0; i < count; i++) {
            const sourceFiles = [`src/pages/sample-${i}.tsx`];
            const targetFiles = [`i18n/${locale}/code.json`];
            states.pages.push({contentId: `page:sample-${i}`, locale, state: 'ready', messageNamespaces: [`fixture.${i}`], sourceFiles, targetFiles,
                sourceHash: digestFiles(root, sourceFiles), targetHash: digestFiles(root, targetFiles), reviewStatus: 'unverified'});
            const blogFile = `2026-01-0${i + 1}-sample.md`;
            const target = `i18n/${locale}/docusaurus-plugin-content-blog/${blogFile}`;
            write(target, fs.readFileSync(path.join(root, 'blog', blogFile), 'utf8').replaceAll('English article', `${locale} translated article`));
            states.blog.push({contentId: `blog:${blogFile}`, locale, state: 'ready', sourceFiles: [`blog/${blogFile}`], targetFiles: [target],
                sourceHash: digestFiles(root, [`blog/${blogFile}`]), targetHash: digestFiles(root, [target]), reviewStatus: 'unverified'});
        }
    }
    // A complete target dictionary must still produce English when blocked.
    registry.push({id: 'blocked', kind: 'page', sourcePath: 'src/pages/blocked.tsx'});
    write('src/pages/blocked.tsx', `import React from 'react'; import {translate} from '@docusaurus/Translate'; import {LayoutNext} from '@site/src/components/home-next/LayoutNext';
const title = translate({id:'fixture.blocked',message:'English blocked body'});
export default function Page(){return <LayoutNext title={title}><h1>{title}</h1></LayoutNext>;}\n`);
    for (const locale of Object.keys(counts)) {
        const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`)));
        dictionary['fixture.blocked'] = {message: `${locale} blocked target`};
        dictionary['fixture.shell'] = {message: `${locale} navigation`};
        write(`i18n/${locale}/code.json`, JSON.stringify(dictionary));
        // Rebind the fixture's published targets after the shell messages are added.
        for (const record of states.pages.filter(record => record.locale === locale)) record.targetHash = digestFiles(root, record.targetFiles);
        states.pages.push({contentId: 'page:blocked', locale, state: 'blocked', sourceFiles: ['src/pages/blocked.tsx'], targetFiles: []});
    }
    for (const file of ['src/utils/useLocalizedRoute.ts', 'src/utils/useLanguageItems.ts', 'src/utils/localePreference.ts', 'src/utils/languageMessages.ts',
        'src/components/home-next/LocalizedLink.tsx', 'src/components/home-next/PageContent.tsx', 'src/components/home-next/PageContent.scss',
        'src/components/home-next/PageLanguageSwitcher.tsx', 'src/components/home-next/PageLanguageSwitcher.scss',
        'src/components/brand-theme/BrandThemeSwitcher.tsx', 'src/components/brand-theme/BrandThemeSwitcher.scss',
        'src/components/brand-theme/BrandThemeProvider.tsx',
        'src/components/home-next/LanguageMenu.tsx', 'src/components/home-next/LanguageMenu.scss', 'src/components/home-next/LayoutNext.tsx'])
        write(file, fs.readFileSync(path.join(repo, file), 'utf8'));
    write('src/components/home-next/NavbarNext.tsx', `import React from 'react'; import Translate from '@docusaurus/Translate';
import {LanguageMenu} from './LanguageMenu'; import Link from './LocalizedLink';
export function NavbarNext(){return <nav><Translate id="fixture.shell">English navigation</Translate><LanguageMenu/>
<Link to="/">Home</Link><Link to="/sample-2/">Ordinary</Link><Link to="/blog/native-0/">Blog</Link><Link to="/docs/4.x/english-shared/">Docs</Link><Link to="/files/manual.txt">Download fixture</Link></nav>;}\n`);
    write('static/files/manual.txt', 'Fixture download');
    write('src/pages/index.tsx', `import React from 'react'; import {LayoutNext} from '@site/src/components/home-next/LayoutNext';
export default function Home(){return <LayoutNext title="Home"><h1>English home body</h1></LayoutNext>;}\n`);
    write('src/theme/Navbar/index.tsx', `export {NavbarNext as default} from '@site/src/components/home-next/NavbarNext';\n`);
    write('src/theme/Layout/index.tsx', `import React from 'react'; import Original from '@theme-original/Layout'; import {PageContent,PageFallbackNotice} from '@site/src/components/home-next/PageContent';
export default function Layout({children,...props}){return <Original {...props}><PageFallbackNotice/><PageContent>{children}</PageContent></Original>;}\n`);
    fs.appendFileSync(path.join(root, 'src/pages/sample-0.tsx'), '\n// Source changed after manual publication.\n');
    // Source drift preserves the published manual target; docs drift above falls back.
    fs.appendFileSync(path.join(root, 'blog/2026-01-01-sample.md'), '\nSource update.\n');
    write('translations/pages/registry.json', JSON.stringify({schemaVersion: 1, englishFallbackLocales: ['zh-CN'], pages: registry}));
    for (const kind of ['pages', 'blog']) write(`translations/${kind}/state.json`, JSON.stringify({schemaVersion: 1, pages: states[kind]}));
    write('i18n/ja/docusaurus-plugin-content-blog/2026-01-10-orphan.md', '---\ntitle: Orphan\n---\n\nOrphan.\n');
    write('i18n/ja/docusaurus-plugin-content-pages/orphan.tsx', "import React from 'react'; export default function Page(){return <main>Orphan target</main>;}\n");
    let config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8');
    config = config.replace(" presets: [['classic',{docs:false,blog:false}]],", ` presets: [['classic',{docs:false,blog:false,pages:false}]],`)
        .replace(" plugins: [", ` plugins: ['docusaurus-plugin-sass', [require(${JSON.stringify(path.join(repo, 'scripts/i18n/manual-plugins.cjs'))}).pages, {}],
 [require(${JSON.stringify(path.join(repo, 'scripts/i18n/manual-plugins.cjs'))}).blog, {onUntruncatedBlogPosts:'ignore', onInlineAuthors:'ignore'}],`);
    write('docusaurus.config.js', config);
    execFileSync('git', ['add', '.'], {cwd: root});
    execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'Five-language content source'], {cwd: root});
    return fixture;
}
module.exports = {createContentFixture};
