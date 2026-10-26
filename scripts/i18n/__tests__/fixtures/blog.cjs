const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createContentFixture} = require('./content-manifest.cjs');
const {digestFiles,loadManual,blogStateFileFor} = require('../../manual-state.cjs');
const {hash}=require('../../state.cjs');
const {structure}=require('../../structure.cjs');
const repo = path.resolve(__dirname, '../../../..');
function writeBlogStates(root,write,pages){
    fs.rmSync(path.join(root,'translations/blog/pages'),{recursive:true,force:true});
    for(const page of pages)write(blogStateFileFor(page),JSON.stringify({schemaVersion:1,page}));
}
async function createBlogFixture(root) {
    const fixture = await createContentFixture(root), {write} = fixture;
    for (const directory of ['src/theme/BlogListPage', 'src/theme/BlogListItem', 'src/theme/BlogFooter', 'src/theme/BlogLayout',
        'src/theme/BlogPostItem/Container', 'src/theme/BlogPostItem/Header/Title', 'src/theme/BlogPostPage/Metadata',
        'src/theme/BlogPostPage/StructuredData', 'src/theme/BlogTagsListPage', 'src/theme/BlogTagsPostsPage', 'src/components/PageHeader',
        'src/components/VersionsDoc'])
        fs.cpSync(path.join(repo, directory), path.join(root, directory), {recursive: true});
    for (const file of ['src/components/blogs/BlogLanguageNote.tsx', 'src/components/blogs/components/head-blogs.tsx',
        'src/utils/blogLocale.ts', 'src/hooks/use-format-date.ts', 'src/theme/BlogPostItem/styles.scss', 'src/scss/_variables.scss', 'src/theme/MDXComponents.js'])
        write(file, fs.readFileSync(path.join(repo, file), 'utf8'));
    write('static/sample.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="green"/></svg>');
    write('blog/_parts/sample.svg', fs.readFileSync(path.join(root, 'static/sample.svg'), 'utf8'));
    write('blog/_parts/Label.jsx', "import React from 'react'; export default function Label(){return <code>SELECT 1;</code>;}\n");
    write('blog/authors.yml', 'fixture:\n  name: Fixture Author\n  page: true\n');
    const states = {pages:loadManual(root,'blog')};
    for (let i = 0; i < 3; i++) {
        const old = `2026-01-0${i + 1}-sample.md`, file = i === 2 ? old + 'x' : old;
        const source = `---\ntitle: English article ${i}\nslug: /native-${i}\nauthors: [fixture]\ntags: [${i === 2 ? 'Glossary' : 'Tech Sharing'}]\nimage: /sample.svg\n${i === 0 ? 'order: 1\n' : ''}---\n\nimport Label from '@site/blog/_parts/Label';\n\nEnglish article ${i}.\n\n## Usage {#usage}\n\n<Label/>\n\n![Shared diagram](./_parts/sample.svg)\n\n[Another post](./2026-01-01-sample.md#usage)\n\n[Fallback peer](./2026-01-03-sample.mdx#usage)\n\n[Same-origin link](https://doris.apache.org/blog/native-0/#usage)\n`;
        if (file !== old) fs.unlinkSync(path.join(root, 'blog', old));
        write('blog/' + file, source);
        for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
            const record = states.pages.find(r => r.contentId === 'blog:' + old && r.locale === locale);
            if (!record) continue;
            const target = `i18n/${locale}/docusaurus-plugin-content-blog/${file}`;
            if (file !== old) fs.unlinkSync(path.join(root, record.targetFiles[0]));
            write(target, source.replaceAll('English article', `${locale} translated article`)
                .replace('./_parts/sample.svg', '@site/blog/_parts/sample.svg'));
            Object.assign(record, {contentId: 'blog:' + file, sourceFiles: ['blog/' + file, 'blog/_parts/Label.jsx', 'blog/_parts/sample.svg'],
                targetFiles: [target]});
            record.sourceHash = digestFiles(root, record.sourceFiles); record.targetHash = digestFiles(root, record.targetFiles);
        }
    }
    write('blog/2026-01-04-unlisted.md', '---\ntitle: Unlisted\nslug: /unlisted\nunlisted: true\ntags: [Secret]\n---\n\nUnlisted body.\n');
    write('blog/2026-01-05-draft.md', '---\ntitle: Draft\nslug: /draft\ndraft: true\n---\n\nDraft body.\n');
    writeBlogStates(root,write,states.pages);
    write('versions.json','["4.x","3.x","2.1"]');
    for(const version of ['3.x','2.1']) {
        const sourcePath=`versioned_docs/version-${version}/01-shared.md`;
        const source='---\ntitle: English old-version document\nslug: /english-shared\n---\n\nEnglish historical prose.\n\n```sql\nSELECT 1;\n```\n';
        write(sourcePath,source);write(`versioned_sidebars/version-${version}-sidebars.json`,'{}');
        write(`i18n/zh-CN/docusaurus-plugin-content-docs/version-${version}/01-shared.md`,source.replace('English historical prose.','中文历史正文。'));
        for(const locale of ['ja','ko','ru']) {
            const targetPath=`i18n/${locale}/docusaurus-plugin-content-docs/version-${version}/01-shared.md`;
            const target=source.replace('English historical prose.',`${locale} historical target that policy must ignore.`);
            write(targetPath,target);
            const file=`translations/state/${locale}/docs.json`,state=JSON.parse(fs.readFileSync(path.join(root,file)));
            state.pages.push({pluginId:'default',version,docId:'shared',locale,sourceLocale:'en',sourcePath,targetPath,
                sourceHash:hash(source),targetHash:hash(target),sourceTechnicalHash:(await structure(source,'.md')).technicalHash,
                sourceCommit:'a'.repeat(40),reviewStatus:'machine',ownership:'machine',translatedAt:'2026-10-26T00:00:00Z',glossaryVersion:'0'});
            write(file,JSON.stringify(state));
        }
    }
    for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
        const file = `i18n/${locale}/code.json`, dictionary = JSON.parse(fs.readFileSync(path.join(root, file)));
        const production = JSON.parse(fs.readFileSync(path.join(repo, file)));
        for (const [id, value] of Object.entries(production)) if (id.startsWith('blog.')) dictionary[id] = value;
        write(file, JSON.stringify(dictionary));
    }
    // Page-state digests also bind the fixture's dictionaries.
    const pages = JSON.parse(fs.readFileSync(path.join(root, 'translations/pages/state.json')));
    for (const page of pages.pages) if (page.targetHash) page.targetHash = digestFiles(root, page.targetFiles);
    write('translations/pages/state.json', JSON.stringify(pages));
    write('tailwind.config.js',fs.readFileSync(path.join(repo,'tailwind.config.js'),'utf8'));
    write('fixture.scss', "@use './src/scss/variables';\n@tailwind utilities;\n");
    let config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8');
    config = config.replace("blog:false,pages:false}", "blog:false,pages:false,theme:{customCss:require.resolve('./fixture.scss')}}");
    config = config.replace("{onUntruncatedBlogPosts:","{postsPerPage:'ALL',onUntruncatedBlogPosts:");
    config = config.replace(" title: 'Multi-locale fixture'", " onBrokenMarkdownLinks:'throw', title: 'Multi-locale fixture'");
    config = config.replace(' plugins: [', ` plugins: [function fixtureTailwind(){return {name:'fixture-tailwind',configurePostCss(options){
        options.plugins.push(require('tailwindcss')({...require('./tailwind.config.js'),content:[__dirname+'/src/**/*.{js,jsx,ts,tsx}']}));return options;}}},`);
    write('docusaurus.config.js', config);
    execFileSync('git', ['add', '.'], {cwd: root});
    execFileSync('git', ['-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm','Blog partial-coverage fixture'], {cwd: root});
    return fixture;
}
async function createPilotFixture(root) {
    const fixture=await createBlogFixture(root),{write}=fixture;
    const state={pages:loadManual(repo,'blog')};
    for(const locale of ['zh-CN','ja','ko','ru']) {
        const dir=path.join(root,`i18n/${locale}/docusaurus-plugin-content-blog`);
        fs.rmSync(dir,{recursive:true,force:true});
        write(`i18n/${locale}/code.json`,fs.readFileSync(path.join(repo,`i18n/${locale}/code.json`),'utf8'));
    }
    // Retain one untranslated headline to exercise mixed coverage. The four
    // actual pilot articles and their complete dependencies are copied verbatim.
    for(const file of ['2026-01-02-sample.md','2026-01-03-sample.mdx']) fs.unlinkSync(path.join(root,'blog',file));
    const headline=path.join(root,'blog/2026-01-01-sample.md');
    fs.writeFileSync(headline,fs.readFileSync(headline,'utf8').replace('./2026-01-03-sample.mdx#usage','./2026-01-01-sample.md#usage'));
    for(let i=1;i<=10;i++) write(`blog/2025-12-${String(i).padStart(2,'0')}-pagination.md`,
        `---\ntitle: English pagination article ${i}\nsummary: English pagination summary\ntags: [Tech Sharing]\nimage: /sample.svg\n---\n\nEnglish pagination body ${i}.\n`);
    for(const directory of ['src/theme/BlogPostPage','src/theme/BlogPostItem','src/components/recent-blogs','src/components/link-arrow'])
        fs.cpSync(path.join(repo,directory),path.join(root,directory),{recursive:true});
    const files=new Set(state.pages.flatMap(record=>[...record.sourceFiles,...record.targetFiles]));
    for(const record of state.pages) {
        const file=record.sourceFiles.find(file=>file.startsWith('blog/'));
        const {data}=require('gray-matter')(fs.readFileSync(path.join(repo,file),'utf8'));
        if(data.image?.startsWith('/')) files.add('static'+data.image);
    }
    files.add('src/components/blogs/components/blog-link.css');
    files.add('src/components/Icons/external-link-icon.tsx');
    for(const file of files) write(file,fs.readFileSync(path.join(repo,file)));
    writeBlogStates(root,write,state.pages);
    const pages=JSON.parse(fs.readFileSync(path.join(root,'translations/pages/state.json')));
    // The synthetic ordinary pages have no dictionary translations in this
    // variant; retain their explicit fallback instead of declaring them ready.
    for(const record of pages.pages) {record.state='blocked';record.targetFiles=[];delete record.targetHash;}
    write('translations/pages/state.json',JSON.stringify(pages));
    // Real pilot articles link to docs outside this tiny site. Report those
    // omitted routes; blog/media checks remain explicit in the verifier.
    const config=path.join(root,'docusaurus.config.js');
    fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace(" onBrokenMarkdownLinks:'throw',"," onBrokenLinks:'warn', onBrokenMarkdownLinks:'throw',"));
    execFileSync('git',['add','.'],{cwd:root});
    execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm','Actual four-article pilot fixture'],{cwd:root});
    return fixture;
}
module.exports = {createBlogFixture,createPilotFixture};
