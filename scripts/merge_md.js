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
const i18nJsonFile = require('../i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2.json');

const sidebarPath = 'versioned_sidebars/version-1.2-sidebars.json';
const docsBaseDir = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-1.2';
const outputPath = 'doc-1.2.md';
const excludes = ['SQL Manual'];

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
            const imgLink = link.replace(/\/images\//, './static/images/');
            return `[${linkName}](${imgLink})`;
        } else {
            if (link.includes('.md#') && frag) {
                return frag.replace(/[\s]+/g, '-').toLowerCase();
            } else {
                let fullPath = path.join(docsBaseDir, customResolve(link));
                if (!link.endsWith('.md')) {
                    fullPath += '.md';
                }
                return `[${linkName}](#${getMainTitleFromFile(fullPath).replace(/[\s]+/g, '-').toLowerCase()})`;
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
                content += adjustHeaders(removeDuplicateTitle(adjustTips(trimCodeFunc(mdContent))), level) + '\n\n';
            }
        } else if (typeof item === 'object' && item.items) {
            content += `${'#'.repeat(level + 1)} ${item.label}\n\n`;
            content += processItems(item.items, level + 1);
        }
    });
    return content;
}

function adjustTips(mdContent) {
    if (!/:::/.test(mdContent)) return mdContent;
    const lines = mdContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        // start :::
        if (lines[i].trim().startsWith(':::')) {
            const firstLine = lines[i].trim().split(' ')?.[1];
            if (firstLine) {
                lines[i] = `> ${firstLine}`;
            } else {
                lines[i] = '';
            }
            for (let j = i + 1; j < lines.length; j++) {
                // end :::
                if (lines[j].trim().startsWith(':::')) {
                    lines[j] = ``;
                    i = j;
                    break;
                } else {
                    lines[j] = `> ${lines[j]}`;
                }
            }
        }
    }
    return lines.join('\n');
}

function trimCodeFunc(mdContent) {
    if (!/```/.test(mdContent)) return mdContent;
    const lines = mdContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        // start ```
        if (lines[i].trim().startsWith('```')) {
            lines[i] = lines[i].trim();
            for (let j = i + 1; j < lines.length; j++) {
                // end ```
                if (lines[j].trim().startsWith('```')) {
                    lines[j] = lines[j].trim();
                    i = j;
                    break;
                }
            }
        }
    }
    return lines.join('\n');
}

/**
 * 
 * @example
 * 
 * ---
 * {
 *   "title": "快速体验",
 *   "language": "zh-CN"
 *  }
 *
 * ---
 *
 * # 快速体验
 * 
 * "# 快速体验" will be parsed as a title, which will cause title duplication, so remove it
 */
function removeDuplicateTitle(mdContent) {
    if (!/#\s/.test(mdContent)) return mdContent;
    const lines = mdContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            lines[i] = '';
            break;
        }
    }
    return lines.join('\n');
}

function translateTitle(mdContent) {
    const map = getI18nMap();
    const lines = mdContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (
            lines[i].startsWith('# ') ||
            lines[i].startsWith('## ') ||
            lines[i].startsWith('### ') ||
            lines[i].startsWith('#### ') ||
            lines[i].startsWith('##### ') ||
            lines[i].startsWith('###### ')
        ) {
            const tempArr = lines[i].split('# ');
            const value = map.get(tempArr[1]);
            if (value) {
                tempArr[1] = value;
                lines[i] = tempArr.join('# ');
            }
        }
    }
    return lines.join('\n');
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
                break;
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

function traverseSidebarTree(node, excludes) {
    if (excludes.includes(node.label)) {
        node.needExclude = true;
        return;
    }
    if (node.items.length) {
        for (let newNode of node.items) {
            if (typeof newNode === 'object') traverseSidebarTree(newNode, excludes);
        }
    }
    for (let i = 0; i < node.items.length; i++) {
        let item = node.items[i];
        if (item.needExclude) {
            node.items.splice(i, 1);
            i--;
        }
    }
}

/**
 *
 * @description Recursively remove one or more categories under the premise that the default label is unique
 */
function filterSidebarTree(sidebar, excludes) {
    for (let node of sidebar.docs) {
        traverseSidebarTree(node, excludes);
    }
    for (let i = 0; i < sidebar.docs.length; i++) {
        let item = sidebar.docs[i];
        if (item.needExclude) {
            sidebar.docs.splice(i, 1);
            i--;
        }
    }
}

function getI18nMap() {
    // const data = i18nJsonFile.
    const map = new Map();
    Object.keys(i18nJsonFile).forEach(originKey => {
        const value = i18nJsonFile[originKey].message;
        const temp = originKey.split('.');
        const key = temp[temp.length - 1];
        map.set(key, value);
    });
    return map;
}

function mergeMarkdownFiles() {
    let sidebarData = readJSON(sidebarPath);
    if (excludes?.length) {
        filterSidebarTree(sidebarData, excludes);
    }
    let content = '';
    sidebarData.docs.forEach(category => {
        content += `# ${category.label}\n\n`;
        content += processItems(category.items, 1);
    });
    writeMarkdownContent(outputPath, translateTitle(content));
}

mergeMarkdownFiles();

console.log('successfully');
