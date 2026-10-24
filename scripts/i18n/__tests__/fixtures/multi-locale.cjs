// Real native metadata shared by the offline tests and the small SEO build.
const fs = require('node:fs');
const path = require('node:path');
const {hash} = require('../../state.cjs');
const {structure} = require('../../structure.cjs');
const repoRoot = path.resolve(__dirname, '../../../..');

async function createFixture(root) {
    const write = (file, content) => {
        const target = path.join(root, file);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, content);
    };
    fs.mkdirSync(root, {recursive: true});
    fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(root, 'node_modules'));
    const settings = locale => ({sourceLocale: 'en', sourceOverrides: [],
        languageName: ({ja:'Japanese',ko:'Korean',ru:'Russian'})[locale], scriptPattern: ({ja:'[\\u3040-\\u30ff]',ko:'[\\uac00-\\ud7af]',ru:'[\\u0400-\\u04ff]'})[locale]});
    write('translations/config.json', JSON.stringify({schemaVersion: 1, locales: {ja: settings('ja'), ko: settings('ko'), ru: settings('ru')}}));
    write('versions.json', '["4.x"]');
    write('versioned_sidebars/version-4.x-sidebars.json', '{}');
    const records = {ja: [], ko: [], ru: []};
    for (const [pluginId, version, docIds] of [
        ['default', 'current', ['shared', 'ja-only', 'ko-only', 'ru-only', 'missing', 'hidden', 'draft']],
        ['default', '4.x', ['shared']], ['community', 'current', ['shared']],
    ]) {
        const sourceRoot = pluginId === 'community' ? 'community' : version === 'current' ? 'docs' : `versioned_docs/version-${version}`;
        const plugin = `docusaurus-plugin-content-docs${pluginId === 'default' ? '' : '-community'}`;
        const versionDir = version === 'current' ? 'current' : `version-${version}`;
        for (const docId of docIds) {
            const filename = `01-${docId}.md`;
            const sourcePath = `${sourceRoot}/${filename}`;
            const source = `---\ntitle: English ${docId}\nlast_update:\n  date: 2026-01-01\nslug: /english-${docId}\n${docId === 'hidden' ? 'unlisted: true\n' : docId === 'draft' ? 'draft: true\n' : ''}---\n\n## Usage\n\nUse Doris.\n\n\`\`\`sql\nSELECT 1;\n\`\`\`\n${pluginId === 'default' && version === 'current' ? '\n[ja-only](./01-ja-only.md)\n\n[ko-only](./01-ko-only.md)\n' : ''}`;
            write(sourcePath, source);
            write(`i18n/zh-CN/${plugin}/${versionDir}/${filename}`, source.replace('English', '中文').replace('/english-', '/chinese-'));
            for (const locale of ['ja', 'ko', 'ru']) {
                if (docId === 'missing') continue;
                const targetPath = `i18n/${locale}/${plugin}/${versionDir}/${filename}`;
                const target = source.replace('English', ({ja:'日本語',ko:'한국어',ru:'Русский'})[locale])
                    .replace('## Usage', ({ja:'## 使用方法',ko:'## 사용법',ru:'## Использование'})[locale]).replace('Use Doris.', ({ja:'Doris を使用します。',ko:'Doris를 사용합니다.',ru:'Используйте Doris.'})[locale]);
                write(targetPath, target);
                const stale = docId.endsWith('-only') && docId !== locale + '-only';
                const recordedSource = stale ? source.replace('SELECT 1', 'SELECT 0') : source;
                records[locale].push({pluginId, version, docId, locale, sourceLocale: 'en', sourcePath, targetPath,
                    sourceHash: hash(recordedSource), targetHash: hash(target),
                    sourceTechnicalHash: (await structure(recordedSource, '.md')).technicalHash,
                    sourceCommit: 'a'.repeat(40), reviewStatus: 'machine', ownership: 'machine',
                    translatedAt: '2026-10-18T00:00:00Z', glossaryVersion: '0'});
            }
        }
    }
    write('i18n/zh-CN/docusaurus-plugin-content-docs/current/chinese-only.md', '# Chinese-only source\n');
    for (const locale of ['ja', 'ko', 'ru']) {
        write(`translations/state/${locale}/docs.json`, JSON.stringify({schemaVersion: 1, pages: records[locale]}));
        write(`i18n/${locale}/docusaurus-plugin-content-docs/current/orphan.md`, '# Orphan\n');
    }
    write('src/pages/index.tsx', "import React from 'react'; export default function Home(){return <main>Fixture</main>;}\n");
    for (const file of ['src/utils/translation.ts', 'src/utils/localization.ts', 'src/utils/locale.ts', 'src/theme/SiteMetadata/index.tsx',
        'src/theme/DocItem/Metadata/index.tsx', 'src/theme/DocItem/Content/index.tsx',
        'src/theme/DocItem/Layout/TranslationStatus.tsx', 'src/theme/DocItem/Layout/LocalizedNotice.module.css']) {
        write(file, fs.readFileSync(path.join(repoRoot, file), 'utf8'));
    }
    write('src/theme/DocItem/Layout/index.tsx', `import React from 'react';
import Original from '@theme-original/DocItem/Layout';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {docTranslation} from '@site/src/utils/translation';
import TranslationStatus from './TranslationStatus';
export default function Layout(props) {
 const state = docTranslation(useDoc().metadata);
 return <>{state && <TranslationStatus state={state}/>}<Original {...props}/></>;
}\n`);
    write('docusaurus.config.js', `module.exports = () => ({
 title: 'Multi-locale fixture', url: 'https://doris.apache.org', baseUrl: '/', trailingSlash: true,
 i18n: {defaultLocale: 'en', locales: ['en','zh-CN', ...['ja','ko','ru'].filter(locale => !process.env['FIXTURE_DISABLE_'+locale.toUpperCase()])],
 localeConfigs: {en: {htmlLang:'en-US'}, 'zh-CN': {htmlLang:'zh-Hans-CN'}, ja:{htmlLang:'ja'}, ko:{htmlLang:'ko'}, ru:{htmlLang:'ru'}}},
 customFields: {translatedLocales: ['ja','ko','ru'], defaultLocalePageLocales: ['ja','ko','ru']},
 plugins: [[require(${JSON.stringify(path.join(repoRoot, 'scripts/i18n/docs-plugin.cjs'))}), {
 path:'docs', sidebarPath:false, lastVersion:'4.x', versions:{current:{path:'dev'},'4.x':{path:'4.x'}}}],
 [require(${JSON.stringify(path.join(repoRoot, 'scripts/i18n/docs-plugin.cjs'))}), {id:'community', path:'community', routeBasePath:'community',sidebarPath:false}],
 require(${JSON.stringify(path.join(repoRoot, 'scripts/i18n/status-plugin.cjs'))}),
 function fixtureCache(){return {name:'fixture-cache',configureWebpack:()=>({cache:false})}}],
 presets: [['classic',{docs:false,blog:false}]],
});\n`);
    write('.gitignore', 'node_modules\n.i18n-build/\n.docusaurus/\nbuild/\n');
    const {execFileSync} = require('node:child_process');
    const git = (...args) => execFileSync('git', args, {cwd: root, stdio: 'pipe'});
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'Native fixture source');
    return {root, write};
}
module.exports = {createFixture};
