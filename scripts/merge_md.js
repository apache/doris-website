const fs = require('fs');
const path = require('path');

const sidebarPath = 'versioned_sidebars/version-2.1-cn-sidebars.json'
const docsBaseDir = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1'
const outputPath = 'doc.md'

const fileLinkName = {};


function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

function readMarkdownFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

function writeMarkdownContent(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

function replaceLinkWrap(chapter) {
    const hyperLinkPattern = /\[([^\]]+)\]\(([^#)]+)(#[^)]+)?\)/g;

    function replaceLink(match, linkName, link, frag) {
        if (link.startsWith('http')) {
            return match;
        } else if (/\.(png|jpeg|svg|gif|jpg)$/.test(link)) {
            console.log(link,'link')
            const imgLink = link.replace(/images\//, 'static/images/');
            console.log(linkName,'linkName')
            console.log(imgLink,'imgLink')
            return `[${linkName}](${imgLink})`;
        } else {
            if (link.includes('.md#') && frag) {
                return frag.replace(/[\s]+/g, '-').toLowerCase()
            } else {
                let fullPath = path.join(docsBaseDir, customResolve(link))
                if (!link.endsWith('.md')) {
                    fullPath += '.md';
                }
                return `[${linkName}](#${getMainTitleFromFile(fullPath).replace(/[\s]+/g, '-').toLowerCase()})`
            }
        }
    }
    return chapter.replace(hyperLinkPattern, replaceLink);
}

function customResolve(relativePath) {
    const parts = relativePath.split('/');
    const resolvedParts = [];
    for (const part of parts) {
        if (part === '..') {
            resolvedParts.pop();
        } else if (part !== '.') {
            resolvedParts.push(part);
        }
    }
    return resolvedParts.join('/');
}

function getMainTitleFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return '';
    }
    const mdContent = fs.readFileSync(filePath, 'utf8');
    const match = mdContent.match(/{[^}]*}/);
    if (match) {
        const mainTitle = JSON.parse(match[0].replace(/'/g, '"')).title;
        return mainTitle;
    }
    return '';
}

function processItems(items, level) {
    let content = '';
    items.forEach(item => {
        if (typeof item === 'string') {
            const filePath = path.join(docsBaseDir, item + '.md');
            if (fs.existsSync(filePath)) {
                let mdContent = readMarkdownFile(filePath);
                mdContent = replaceLinkWrap(mdContent);
                content += adjustHeaders(mdContent, level) + '\n\n';
            }
        } else if (typeof item === 'object' && item.items) {
            content += `${'#'.repeat(level + 1)} ${item.label}\n\n`;
            content += processItems(item.items, level + 1);
        }
    });
    return content;
}

function adjustHeaders(mdContent, level) {
    const match = mdContent.match(/{[^}]*}/);
    const mainTitle = JSON.parse(match[0].replace(/'/g, '"')).title;
    const lines = mdContent.split('\n');

    let hasMainTitle = false;
    let firstSeparatorIndex = -1;
    let secondSeparatorIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('# ')) {
            hasMainTitle = true;
            break;
        }
        if (line.trim() === '---') {
            if (firstSeparatorIndex === -1) {
                firstSeparatorIndex = i;
            } else {
                secondSeparatorIndex = i;
                break
            }
        }
    }

    const adjustedLines = lines.map(line => {
        if (line.startsWith('#')) {
            const numHashes = line.match(/^#+/)[0].length;

            return '#'.repeat(numHashes + level) + line.slice(numHashes);
        }
        return line;
    });

    if (!hasMainTitle && secondSeparatorIndex !== -1) {
        adjustedLines.splice(secondSeparatorIndex + 2, 0, `${'#'.repeat(level + 1)} ${mainTitle}`);
    }

    return adjustedLines.join('\n');
}

function mergeMarkdownFiles() {
    const sidebarData = readJSON(sidebarPath);
    let content = '';
    sidebarData.docs.forEach(category => {
        content += `# ${category.label}\n\n`;
        content += processItems(category.items, 1);
    });
    writeMarkdownContent(outputPath, content);
}

mergeMarkdownFiles();
console.log('successfully');