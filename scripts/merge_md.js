//  Licensed to the Apache Software Foundation (ASF) under one
//  or more contributor license agreements.  See the NOTICE file
//  distributed with this work for additional information
//  regarding copyright ownership.  The ASF licenses this file
//  to you under the Apache License, Version 2.0 (the
//  "License"); you may not use this file except in compliance
//  with the License.  You may obtain a copy of the License at

//    http://www.apache.org/licenses/LICENSE-2.0

//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an
//  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  KIND, either express or implied.  See the License for the
//  specific language governing permissions and limitations
//  under the License.

const fs = require('fs');
const path = require('path');

const sidebarPath = 'versioned_sidebars/version-2.1-sidebars.json'
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
            const imgLink = link.replace(/images\//, 'static/images/');
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
            console.log('Processing filePath');
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
    console.log(`Processing ${match[0]}`);
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
    try {
        // console.log(sidebarPath);
        const sidebarData = readJSON(sidebarPath);
        let content = '';
        sidebarData.docs.forEach(category => {
            // console.log(category);
            content += `# ${category.label}\n\n`;
            content += processItems(category.items, 1);
        });
        // console.log(content);
        writeMarkdownContent(outputPath, content);
    } catch(e) {
        console.log(e);
        console.log('sidebarPath', sidebarPath);
    }
    
}

mergeMarkdownFiles();
console.log('successfully');