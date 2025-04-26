const fs = require('fs');
const path = require('path');

const { getIndexHash } = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/getIndexHash.js');

function ensureArray(object, key) {
    if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
    }
}

const searchConfig = {
    hashed: true,
    language: ['en', 'zh'],
    highlightSearchTermsOnTargetPage: true,
    docsDir: ['docs', 'versioned_docs', 'i18n'],
    blogDir: 'blog',
    // indexPages: true,
    indexDocs: true,
    // docsRouteBasePath: '/docs',
    indexBlog: false,
    explicitSearchResultPath: true,
    searchBarShortcut: true,
    searchBarShortcutHint: true,
    searchResultLimits: 100,
};
ensureArray(searchConfig, 'docsDir');
ensureArray(searchConfig, 'blogDir');
searchConfig.docsDir = searchConfig.docsDir.map(dir => path.join(__dirname, `../${dir}`));
searchConfig.blogDir = searchConfig.blogDir.map(dir => path.join(__dirname, `../${dir}`));
const searchHash = getIndexHash(searchConfig);
if (searchHash) {
    const workerJSPath = path.join(__dirname, '../src/theme/SearchBar/worker.js');
    const workerJs = fs.readFileSync(workerJSPath, 'utf-8');
    const targetRegex = /const searchIndexUrl = "search-index\{dir\}\.json\?_=[^"]+"/;
    const replacement = `const searchIndexUrl = "search-index{dir}.json?_=${searchHash}"`;
    const newWorkjs = workerJs.replace(targetRegex, replacement);
    fs.writeFileSync(workerJSPath, newWorkjs, 'utf-8');
    console.log('successful,searchHash:',searchHash)
}else{
    console.log('searchHash is null');
}
