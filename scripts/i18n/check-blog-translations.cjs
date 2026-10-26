// Manual blog admission: prose may change, executable MDX, code, URLs,
// numbers, author/date/tag identity and media references must remain intact.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const {structure} = require('./structure.cjs');
const {protectionSignature} = require('./protection.cjs');
const {loadManual, decideManual} = require('./manual-state.cjs');
function normalizeImports(raw) {
    return raw.replace(/(from\s+['"])\.\.\/src\//g, '$1@site/src/')
        .replace(/<!--[ \t]+\n/g,'<!--\n');
}
async function checkBlogTranslations(root) {
    const checked = [];
    for (const record of loadManual(root, 'blog')) {
        const decision = decideManual({root, record, sourceFiles: record.sourceFiles});
        if (decision.fallback) continue;
        const sourceFile = record.sourceFiles.find(file => file.startsWith('blog/') && /\.mdx?$/.test(file));
        const targetFile = record.targetFiles.find(file => /docusaurus-plugin-content-blog\//.test(file) && /\.mdx?$/.test(file));
        assert(sourceFile && targetFile, `Blog state lacks article files: ${record.contentId}`);
        assert.equal(record.contentId, 'blog:' + sourceFile.slice('blog/'.length), 'Blog source identity mismatch');
        assert.equal(targetFile, `i18n/${record.locale}/docusaurus-plugin-content-blog/${sourceFile.slice(5)}`, 'Blog target identity mismatch');
        const source = normalizeImports(fs.readFileSync(path.join(root, sourceFile), 'utf8'));
        const target = normalizeImports(fs.readFileSync(path.join(root, targetFile), 'utf8'));
        const a = matter(source).data, b = matter(target).data;
        for (const field of ['title','description','summary']) {
            if (a[field]) assert(typeof b[field] === 'string' && b[field].trim() && b[field] !== a[field],
                `Untranslated blog ${field}: ${record.contentId}/${record.locale}`);
        }
        const original = await structure(source, path.extname(sourceFile));
        const translated = await structure(target, path.extname(targetFile));
        // Blog summary is prose. All other metadata uses the existing protected
        // content contract, including date/author/order/tags and externalLink.
        delete original.technicalMetadata.summary; delete translated.technicalMetadata.summary;
        assert.equal(protectionSignature(translated), protectionSignature(original),
            `Protected blog content changed: ${record.contentId}/${record.locale}`);
        checked.push({contentId:record.contentId,locale:record.locale,state:decision.state,reviewStatus:record.reviewStatus});
    }
    return {schemaVersion:1,checked};
}
if (require.main === module) checkBlogTranslations(path.resolve(__dirname,'../..'))
    .then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={checkBlogTranslations};
