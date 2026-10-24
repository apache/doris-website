const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createFixture} = require('./multi-locale.cjs');
const {digestFiles} = require('../../manual-state.cjs');
const repo = path.resolve(__dirname, '../../../..');
async function createContentFixture(root) {
    const fixture = await createFixture(root);
    const {write} = fixture;
    const registry = [{id: 'home', kind: 'page', sourcePath: 'src/pages/index.tsx'},
        {id: 'slack', kind: 'utility', sourcePath: 'src/pages/slack.tsx'}];
    write('src/pages/slack.tsx', "import React from 'react'; export default function Slack(){return <main>Slack utility</main>;}\n");
    const states = {pages: [], blog: []};
    const counts = {'zh-CN': 0, ja: 1, ko: 2, ru: 3};
    for (let i = 0; i < 3; i++) {
        const file = `src/pages/sample-${i}.tsx`;
        registry.push({id: `sample-${i}`, kind: 'page', sourcePath: file});
        write(file, `import React from 'react'; import Translate from '@docusaurus/Translate';
export default function Page(){return <main><Translate id="fixture.${i}">English sample ${i}</Translate></main>;}\n`);
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
    // Source drift preserves the published manual target; docs drift above falls back.
    fs.appendFileSync(path.join(root, 'blog/2026-01-01-sample.md'), '\nSource update.\n');
    write('translations/pages/registry.json', JSON.stringify({schemaVersion: 1, pages: registry}));
    for (const kind of ['pages', 'blog']) write(`translations/${kind}/state.json`, JSON.stringify({schemaVersion: 1, pages: states[kind]}));
    write('i18n/ja/docusaurus-plugin-content-blog/2026-01-10-orphan.md', '---\ntitle: Orphan\n---\n\nOrphan.\n');
    let config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8');
    config = config.replace(" presets: [['classic',{docs:false,blog:false}]],", ` presets: [['classic',{docs:false,blog:false,pages:false}]],`)
        .replace(" plugins: [", ` plugins: [[require(${JSON.stringify(path.join(repo, 'scripts/i18n/manual-plugins.cjs'))}).pages, {}],
 [require(${JSON.stringify(path.join(repo, 'scripts/i18n/manual-plugins.cjs'))}).blog, {onUntruncatedBlogPosts:'ignore', onInlineAuthors:'ignore'}],`);
    write('docusaurus.config.js', config);
    execFileSync('git', ['add', '.'], {cwd: root});
    execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'Five-language content source'], {cwd: root});
    return fixture;
}
module.exports = {createContentFixture};
