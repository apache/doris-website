#!/usr/bin/env node
// Local-only export: never uploads files or requires a production build.
const fs = require('node:fs');
const path = require('node:path');
const {execFile, execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const cheerio = require('cheerio');
const GithubSlugger = require('github-slugger');
const puppeteer = require('puppeteer');
const {inventory, filename} = require('./inventory.cjs');
const config = require('../../config/archived-docs.json');

const root = path.resolve(__dirname, '../..');
const output = path.resolve(root, process.env.ARCHIVE_OUTPUT ?? 'output/pdf/archived-docs');
const temporary = path.resolve(root, 'tmp/pdfs/archived-docs');
const python = process.env.ARCHIVE_PYTHON ?? 'python3';
const versions = process.env.ARCHIVE_VERSIONS?.split(',') ?? config.versions;
const locales = process.env.ARCHIVE_LOCALES?.split(',') ?? config.locales;
const limit = Number(process.env.ARCHIVE_LIMIT ?? 0);
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const date = new Date().toISOString().slice(0, 10);
const css = fs.readFileSync(path.join(__dirname, 'print.css'), 'utf8');
fs.mkdirSync(output, {recursive: true});
fs.mkdirSync(temporary, {recursive: true});

function normalize(content) {
    // Transform presentation components outside code fences only. Every tab
    // and collapsed details body is included in the printed document.
    return content.split(/(^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[ \t]*$)/gm)
        .filter(part => part && !/^(`{3,}|~{3,})$/.test(part))
        .map(part => /^[ \t]*(`{3,}|~{3,})/.test(part) ? part : part
            .replace(/^import\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
            .replace(/<Tabs\b[^>]*>|<\/Tabs>|<\/TabItem>/g, '\n\n')
            .replace(/<TabItem\b[\s\S]*?>/g, tag => '\n\n### ' + (tag.match(/label\s*=\s*["']([^"']+)/)?.[1] ?? 'Example') + '\n\n')
            .replace(/^:::(\w+)\s*(.*?)\s*$/gm, (_, kind, title) => `\n<div class="admonition">\n\n**${title || kind.toUpperCase()}**\n`)
            .replace(/^:::\s*$/gm, '\n</div>\n')
            .replace(/<details\b[^>]*>/g, '<div class="details">')
            .replace(/<\/details>/g, '</div>')
            .replace(/<summary>([\s\S]*?)<\/summary>/g, '\n\n**$1**\n\n')
            .replace(/\sstyle=\{\{[\s\S]*?\}\}/g, '')
            .replace(/^ +(?=<\/?(?:div|p|img|table|thead|tbody|tr|th|td|ul|ol|li)\b)/gm, '')
            .replace(/(`+)[^\n]*?\1|<\/?[A-Z][A-Za-z0-9_]*\s*\/?>/g,
                match => match.startsWith('`') ? match : escape(match))
            .replace(/^(#{1,5})\s/gm, '#$1 ')).join('');
}

const imageCache = new Map();
function markdownToHtml(input) {
    return new Promise((resolve, reject) => {
        const child = execFile('pandoc', ['--from=markdown+markdown_in_html_blocks+pipe_tables+raw_html', '--to=html5', '--mathml', '--wrap=none'],
            {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024}, (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve(stdout));
        child.stdin.end(input);
    });
}
async function imageSource(src, doc) {
    const clean = decodeURI(src.split(/[?#]/)[0]);
    let local;
    if (/^https?:/.test(src)) {
        const url = new URL(src);
        local = path.join(root, 'static', url.pathname);
    } else local = clean.startsWith('/') ? path.join(root, 'static', clean) : path.resolve(path.dirname(doc.file), clean);
    if (fs.existsSync(local) && fs.statSync(local).isFile()) return pathToFileURL(local).href;
    // Older Markdown sometimes addresses shared assets through a localized
    // route or several ../ segments. They still live under static/images.
    if ((!/^https?:/.test(src) || new URL(src).hostname === 'doris.apache.org') && clean.includes('/images/')) {
        const shared = path.join(root, 'static', clean.slice(clean.indexOf('/images/')));
        if (fs.existsSync(shared) && fs.statSync(shared).isFile()) return pathToFileURL(shared).href;
    }
    const url = /^https?:/.test(src) ? src : new URL(src, `https://doris.apache.org${doc.route}/`).href;
    if (!imageCache.has(url)) imageCache.set(url, (async () => {
        const target = path.join(temporary, 'images', createHash('sha256').update(url).digest('hex') + (path.extname(clean) || '.png'));
        if (fs.existsSync(target)) return pathToFileURL(target).href;
        try {
            const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
            if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`HTTP ${response.status}`);
            fs.mkdirSync(path.dirname(target), {recursive: true});
            fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
            return pathToFileURL(target).href;
        } catch (error) {return {url, error: error.message};}
    })());
    return imageCache.get(url);
}

async function main() {
    if (limit && !process.env.ARCHIVE_OUTPUT) throw new Error('Sample exports require a separate ARCHIVE_OUTPUT directory.');
    execFileSync(python, ['-c', 'import pypdf'], {stdio: 'pipe'});
    const manifestPath = path.join(output, 'manifest.json');
    const manifest = process.env.ARCHIVE_RESUME === 'true' && fs.existsSync(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        : {generatedAt: new Date().toISOString(), sourceCommit: commit, files: []};
    if (manifest.sourceCommit !== commit) throw new Error('Cannot resume PDFs from a different source commit.');
    const browser = await puppeteer.launch({headless: true, executablePath: process.env.ARCHIVE_CHROME,
        args: ['--allow-file-access-from-files', '--disable-dev-shm-usage']});
    try {
        for (const version of versions) for (const locale of locales) {
            let docs = inventory(root, version, locale);
            if (limit) docs = docs.slice(0, limit);
            docs.forEach((doc, index) => {doc.key = `doc-${index + 1}`;});
            const bySource = new Map(docs.map(doc => [doc.source.replace(/\.mdx?$/, ''), doc]));
            const byRoute = new Map(docs.map(doc => [doc.route.replace(/\/$/, ''), doc]));
            const cn = locale === 'zh-CN';
            const title = `Apache Doris ${version} ${cn ? '中文手册' : 'Documentation (English)'}`;
            const contentsTitle = cn ? '目录' : 'Contents';
            const directory = path.join(temporary, `${version}-${locale}${limit ? '-sample' : ''}`);
            fs.mkdirSync(directory, {recursive: true});
            const batches = [], warnings = [];
            const cover = `<div class="cover"><img src="${pathToFileURL(path.join(root, 'static/images/logo-doris.svg')).href}"><h1>${escape(title)}</h1><p>${cn ? '归档版本文档' : 'Archived documentation'}</p><p>${date} · ${docs.length} ${cn ? '篇文档' : 'documents'}</p><p>Source: ${commit.slice(0, 12)}</p></div>`;
            const toc = `<nav class="toc"><h1>${contentsTitle}</h1><ol>${docs.map(doc => `<li><a href="https://archive.invalid/${doc.key}">${escape(doc.title)}</a></li>`).join('')}</ol></nav>`;
            const page = await browser.newPage();
            try {
                for (let start = 0; start < docs.length; start += 40) {
                    const selected = docs.slice(start, start + 40);
                    const fragments = new Array(selected.length);
                    let next = 0;
                    await Promise.all(Array.from({length: Math.min(4, selected.length)}, async () => {
                        while (next < selected.length) {
                            const index = next++, doc = selected[index];
                            const converted = await markdownToHtml(`# ${escape(doc.title)} {.doc-title}\n\n${normalize(doc.content)}`);
                            // Repair legacy raw HTML in isolation so an unclosed
                            // tag cannot consume the following document.
                            const parsed = cheerio.load(converted);
                            fragments[index] = `<section class="archive-doc" data-key="${doc.key}">${parsed('body').html()}</section>`;
                        }
                    }));
                    const $ = cheerio.load(fragments.join('\n'));
                    for (const doc of selected) {
                        const article = $(`.archive-doc[data-key="${doc.key}"]`);
                        if (!article.length) throw new Error(`Missing rendered document: ${doc.source}`);
                        const slugger = new GithubSlugger();
                        article.find('h1,h2,h3,h4,h5,h6').each((index, heading) => {
                            const headingKey = doc.key + (index ? '#' + slugger.slug($(heading).text()) : '');
                            const inner = $(heading).html();
                            $(heading).attr('id', headingKey).html(`<a href="https://archive.invalid/start/${escape(headingKey)}">${inner}</a>`);
                        });
                        article.find('a[href]').each((_, anchor) => {
                            const href = $(anchor).attr('href');
                            if (href.startsWith('https://archive.invalid/')) return;
                            const [pathname, fragment] = href.split('#');
                            let target;
                            if (!pathname) target = doc;
                            else if (!/^(?:[a-z]+:|\/\/)/i.test(pathname) && !pathname.startsWith('/'))
                                target = bySource.get(path.posix.normalize(path.posix.join(path.posix.dirname(doc.source), decodeURI(pathname))).replace(/\.mdx?$/, ''));
                            else {
                                try {target = byRoute.get(decodeURI(new URL(href, 'https://doris.apache.org').pathname).replace(/\/$/, ''));} catch {}
                            }
                            if (target) $(anchor).attr('href', `https://archive.invalid/${target.key}${fragment ? '#' + fragment : ''}`);
                            else if (!/^(?:[a-z]+:|\/\/)/i.test(href)) $(anchor).attr('href', new URL(href, `https://doris.apache.org${doc.route}`).href);
                        });
                        const images = article.find('img').toArray();
                        for (let offset = 0; offset < images.length; offset += 8) {
                            await Promise.all(images.slice(offset, offset + 8).map(async element => {
                                const img = $(element), src = img.attr('src');
                                if (!src || src.startsWith('data:')) return;
                                const resolved = await imageSource(src, doc);
                                if (typeof resolved === 'string') img.attr('src', resolved).removeAttr('loading').removeAttr('width').removeAttr('height');
                                else {
                                    warnings.push({source: doc.source, ...resolved});
                                    img.replaceWith(`<p class="missing-image">${escape(img.attr('alt') || (cn ? '图片' : 'Image'))}: <a href="${escape(resolved.url)}">${escape(resolved.url)}</a> (${cn ? '源图片不可用' : 'source image unavailable'})</p>`);
                                }
                            }));
                        }
                    }
                    const htmlPath = path.join(directory, `${start}.html`);
                    const pdfPath = path.join(directory, `${start}.pdf`);
                    const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${escape(title)}</title><style>${css}</style></head><body>${start === 0 ? cover + toc : ''}${$('body').html()}</body></html>`;
                    fs.writeFileSync(htmlPath, html);
                    const digest = createHash('sha256').update(html).digest('hex');
                    if (fs.existsSync(pdfPath) && fs.existsSync(pdfPath + '.sha256') && fs.readFileSync(pdfPath + '.sha256', 'utf8') === digest) {
                        batches.push(pdfPath);
                        console.log(`${version} ${locale}: ${Math.min(start + 40, docs.length)}/${docs.length} (cached)`);
                        continue;
                    }
                    await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load', timeout: 120000});
                    await page.evaluate(async () => {await document.fonts.ready; await Promise.race([
                        Promise.all(Array.from(document.images, img => img.decode().catch(() => {}))),
                        new Promise(resolve => setTimeout(resolve, 30000)),
                    ]);});
                    const broken = await page.$$eval('img', images => images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
                    if (broken.length) throw new Error(`Unrendered images: ${broken.join(', ')}`);
                    await page.pdf({path: pdfPath, format: 'A4', preferCSSPageSize: true, printBackground: true, timeout: 0});
                    fs.writeFileSync(pdfPath + '.sha256', digest);
                    batches.push(pdfPath);
                    console.log(`${version} ${locale}: ${Math.min(start + 40, docs.length)}/${docs.length}`);
                }
            } finally {await page.close();}
            const outputPath = path.join(output, filename(version, locale));
            const jobPath = path.join(directory, 'merge.json');
            fs.writeFileSync(jobPath, JSON.stringify({title, contentsTitle, version, locale, commit, docs: docs.map(({key, title}) => ({key, title})), batches, output: outputPath}));
            const stats = JSON.parse(execFileSync(python, [path.join(__dirname, 'merge.py'), jobPath], {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024}));
            const bytes = fs.readFileSync(outputPath);
            manifest.files = manifest.files.filter(file => file.version !== version || file.locale !== locale);
            manifest.files.push({version, locale, filename: path.basename(outputPath),
                downloadUrl: `${config.baseUrl.replace(/\/$/, '')}/${path.basename(outputPath)}`, bytes: bytes.length,
                sha256: createHash('sha256').update(bytes).digest('hex'), ...stats, sourceFiles: docs.map(doc => path.relative(root, doc.file)), imageWarnings: warnings});
            fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
            fs.writeFileSync(path.join(output, 'SHA256SUMS'), manifest.files.map(file => `${file.sha256}  ${file.filename}`).join('\n') + '\n');
            console.log(`Saved ${outputPath} (${stats.pages} pages, ${warnings.length} image warnings)`);
        }
    } finally {await browser.close();}
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {normalize};
