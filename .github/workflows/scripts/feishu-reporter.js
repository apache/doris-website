const fs = require('fs');
const path = require('path');

const WEBHOOK_URL = process.env.FEISHU_WEBHOOK;

const resultsPath = path.join(process.cwd(), 'link_results.json');
if (!fs.existsSync(resultsPath)) {
    console.log('link_results.json not found. This is likely due to a build or copy docs failure in an earlier step. Exiting gracefully.');
    process.exit(0);
}

let data;
try {
    data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
} catch (err) {
    console.error('Error parsing link_results.json:', err.message);
    process.exit(0);
}

const totalChecks = (data.links || []).length;
const uniqueUrls = new Set((data.links || []).map(link => link.url)).size;

function doesTargetDocExist(targetUrl, parentUrl) {
    try {
        const urlObj = new URL(targetUrl, 'http://localhost:3000');
        let pathname = decodeURIComponent(urlObj.pathname).replace(/^\/|\/$/g, '');
        pathname = pathname.replace(/\.html?$/, '');
        
        if (!pathname) return false;
        
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return false;
        
        // Check if first segment is a locale (e.g., 'zh-CN', 'ja')
        let locale = '';
        if (segments[0] === 'zh-CN' || segments[0] === 'ja') {
            locale = segments.shift();
        }
        
        // Now segments should start with 'docs' if it's a documentation route
        if (segments[0] !== 'docs') {
            return false;
        }
        
        segments.shift(); // remove 'docs'
        if (segments.length === 0) return false;
        
        // Check if the next segment is a version number
        let version = '';
        if (segments[0] && (segments[0].match(/^\d/) || segments[0] === 'next')) {
            version = segments.shift();
        }
        
        const docSubPath = segments.join('/');
        if (!docSubPath) return false;
        
        // Build candidate search tails
        const searchTails = [];
        const subSegs = docSubPath.split('/').filter(Boolean);
        for (let len = Math.min(subSegs.length, 4); len >= 2; len--) {
            const tail = subSegs.slice(-len).join('/');
            searchTails.push(tail + '.md');
            searchTails.push(tail + '.mdx');
        }
        searchTails.push(docSubPath + '.md');
        searchTails.push(docSubPath + '.mdx');
        
        // Determine base directories
        const baseDirs = [];
        if (locale) {
            const versionFolder = version ? `version-${version}` : 'current';
            baseDirs.push(path.join('i18n', locale, 'docusaurus-plugin-content-docs', versionFolder));
        } else {
            if (version) {
                baseDirs.push(path.join('versioned_docs', `version-${version}`));
            } else {
                baseDirs.push('docs');
            }
        }
        
        // Read all markdown files in these base directories (cache it globally)
        if (!global.allDocsFiles) {
            global.allDocsFiles = [];
            const walk = (dir) => {
                const fullDir = path.join(process.cwd(), dir);
                if (!fs.existsSync(fullDir)) return;
                const list = fs.readdirSync(fullDir);
                for (const file of list) {
                    const fullPath = path.join(fullDir, file);
                    const relPath = path.relative(process.cwd(), fullPath);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== '.docusaurus') {
                            walk(relPath);
                        }
                    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
                        global.allDocsFiles.push(relPath.replace(/\\/g, '/'));
                    }
                }
            };
            walk('docs');
            walk('versioned_docs');
            walk('i18n');
        }
        
        for (const file of global.allDocsFiles) {
            const matchesDir = baseDirs.length === 0 || baseDirs.some(dir => {
                const normalizedDir = dir.replace(/\\/g, '/');
                return file.startsWith(normalizedDir + '/');
            });
            if (matchesDir) {
                for (const tail of searchTails) {
                    if (file.endsWith('/' + tail) || file === tail) {
                        return true;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error in doesTargetDocExist:', e);
    }
    return false;
}

const brokenLinks = (data.links || []).filter(link => {
    if (link.state !== 'BROKEN' || link.status !== 404) {
        return false;
    }

    const isImage = link.url.match(/\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/i);
    if (isImage) {
        return true;
    }

    if (doesTargetDocExist(link.url, link.parent)) {
        console.log(`Ignoring browser-navigable 404 link (target document exists): ${link.url}`);
        return false;
    }

    return true;
});

// Resolve repo name to determine specific doc mappings
const repoName = process.env.GITHUB_REPOSITORY || 'doris-website';
const commitSha = process.env.GITHUB_SHA || 'master';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const runId = process.env.GITHUB_RUN_ID || '';
const runUrl = runId ? `${serverUrl}/${repoName}/actions/runs/${runId}` : '';
const prNumber = process.env.GITHUB_EVENT_NAME === 'pull_request' ? (process.env.GITHUB_REF_NAME ? process.env.GITHUB_REF_NAME.split('/')[0] : '') : '';
const actor = process.env.GITHUB_ACTOR || 'system';
const eventName = process.env.GITHUB_EVENT_NAME === 'schedule' ? '每日例行巡检' : 'PR 提交';
const branchName = process.env.GITHUB_REF_NAME || 'master';
const linkCheckMode = process.env.LINK_CHECK_MODE || 'online';
const linkCheckTarget = process.env.LINK_CHECK_TARGET || 'https://doris.apache.org';

function resolveSourceFile(cleanParent) {
    if (!cleanParent || cleanParent === 'Unknown' || cleanParent === '/') {
        return {
            file: 'src/pages/index.tsx (首页)',
            link: `${serverUrl}/${repoName}/blob/${commitSha}/src/pages/index.tsx`,
            localPath: 'src/pages/index.tsx'
        };
    }
    
    // 1. Normalize absolute or relative URLs to a pathname without query/hash.
    let decodedPath = decodeURIComponent(new URL(cleanParent, 'http://localhost:3000').pathname.replace(/^\/|\/$/g, ''));

    // Normalize Docusaurus static-build URLs emitted by `serve build`.
    decodedPath = decodedPath
        .replace(/\.html\/index\.html$/, '')
        .replace(/\/index\.html$/, '')
        .replace(/\.html$/, '');
    
    if (decodedPath === '') {
        return {
            file: 'src/pages/index.tsx (首页)',
            link: `${serverUrl}/${repoName}/blob/${commitSha}/src/pages/index.tsx`,
            localPath: 'src/pages/index.tsx'
        };
    }

    // 2. Handle Docusaurus docs version routes.
    //    /docs/dev/foo        -> docs/foo.md(x)
    //    /docs/4.x/foo        -> versioned_docs/version-4.x/foo.md(x)
    //    /zh-CN/docs/4.x/foo  -> i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/foo.md(x)
    const docsMatch = decodedPath.match(/^(?:(zh-CN)\/)?docs\/([^/]+)\/(.+)$/);
    if (docsMatch) {
        const [, locale, version, docPath] = docsMatch;
        const dirPrefix = locale
            ? `i18n/${locale}/docusaurus-plugin-content-docs/${version === 'dev' ? 'current' : `version-${version}`}`
            : version === 'dev'
                ? 'docs'
                : `versioned_docs/version-${version}`;
        const docCandidates = [
            `${dirPrefix}/${docPath}.md`,
            `${dirPrefix}/${docPath}.mdx`,
            `${dirPrefix}/${docPath}/index.md`,
            `${dirPrefix}/${docPath}/index.mdx`,
        ];
        for (const cand of docCandidates) {
            if (fs.existsSync(path.join(process.cwd(), cand))) {
                return {
                    file: cand,
                    link: `${serverUrl}/${repoName}/blob/${commitSha}/${cand}`,
                    localPath: cand
                };
            }
        }
        const fallbackCand = `${dirPrefix}/${docPath}.md`;
        return {
            file: fallbackCand,
            link: `${serverUrl}/${repoName}/blob/${commitSha}/${fallbackCand}`,
            localPath: fallbackCand
        };
    }

    // 3. Candidate files list for local lookup (markdown/docs/pages)
    const candidates = [
        decodedPath + '.md',
        decodedPath + '.mdx',
        decodedPath + '/index.md',
        decodedPath + '/index.mdx',
        'docs/' + decodedPath + '.md',
        'docs/' + decodedPath + '.mdx',
        'docs/' + decodedPath + '/index.md',
        'docs/' + decodedPath + '/index.mdx',
        'src/pages/' + decodedPath + '.tsx',
        'src/pages/' + decodedPath + '/index.tsx',
        'src/pages/' + decodedPath + '.js',
        'src/pages/' + decodedPath + '/index.js',
    ];

    for (const cand of candidates) {
        if (fs.existsSync(path.join(process.cwd(), cand))) {
            return {
                file: cand,
                link: `${serverUrl}/${repoName}/blob/${commitSha}/${cand}`,
                localPath: cand
            };
        }
    }
    
    // 4. Special Docusaurus components mapping / fallbacks
    if (decodedPath.startsWith('blog/detail')) {
        return {
            file: 'src/pages/blog/detail/index.tsx (博客详情页)',
            link: `${serverUrl}/${repoName}/blob/${commitSha}/src/pages/blog/detail/index.tsx`,
            localPath: 'src/pages/blog/detail/index.tsx'
        };
    }
    if (decodedPath === 'blog') {
        return {
            file: 'src/pages/blog/index.tsx (博客列表页)',
            link: `${serverUrl}/${repoName}/blob/${commitSha}/src/pages/blog/index.tsx`,
            localPath: 'src/pages/blog/index.tsx'
        };
    }
    
    // Return decoded path as fallback
    return {
        file: decodedPath,
        link: `${serverUrl}/${repoName}/blob/${commitSha}/${decodedPath}`,
        localPath: decodedPath
    };
}

function findLineNumber(localPath, targetUrl) {
    if (!localPath || !fs.existsSync(localPath)) return 0;
    try {
        const content = fs.readFileSync(localPath, 'utf8');
        const lines = content.split('\n');
        
        // 1. Search for the exact URL string
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(targetUrl)) {
                return i + 1;
            }
        }
        
        // 2. Search for path segment
        const urlObj = new URL(targetUrl, 'http://localhost:3000');
        const searchPath = urlObj.pathname.replace(/^\/|\/$/g, '');
        if (searchPath) {
            const searchDecoded = decodeURIComponent(searchPath);
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(searchPath) || lines[i].includes(searchDecoded)) {
                    return i + 1;
                }
            }
            // Try searching for progressive sub-paths from the end (e.g. 3 segments, then 2, then 1) to avoid false positives on common words
            const segments = searchDecoded.split('/').filter(Boolean);
            for (let len = Math.min(segments.length, 3); len >= 1; len--) {
                const subPath = segments.slice(-len).join('/');
                if (subPath && subPath.length > 3) {
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(subPath)) {
                            return i + 1;
                        }
                    }
                }
            }
        }
    } catch (err) {
        // Silent catch
    }
    return 0;
}

// Helper to get line content from a file
function getLineContent(localPath, lineNum) {
    if (!localPath || lineNum <= 0 || !fs.existsSync(localPath)) return '';
    try {
        const content = fs.readFileSync(localPath, 'utf8');
        const lines = content.split('\n');
        if (lineNum <= lines.length) {
            return lines[lineNum - 1].trim();
        }
    } catch (err) {
        // ignore
    }
    return '';
}

// Helper to escape special characters in markdown table cell
function escapeMarkdownTable(text) {
    return text
        .replace(/\|/g, '\\|')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, ' ');
}

// Process and group broken links by URL
const urlMap = new Map();
let cnt404 = 0;
let cntAnchor = 0;
let cntTimeout = 0;
let cntOther = 0;

for (const link of brokenLinks) {
    const cleanUrl = link.url.replace(/^http:\/\/localhost:\d+/, '');
    const cleanParent = link.parent ? link.parent.replace(/^http:\/\/localhost:\d+/, '') : 'Unknown';
    
    let errorReason = link.status ? `HTTP ${link.status}` : 'Connection Error';
    if (link.status === 200 && link.url.includes('#')) {
        const hashMatch = link.url.match(/#.*/);
        const hash = hashMatch ? hashMatch[0] : '';
        errorReason = `锚点失效: 页面可访问但 ${hash} 锚点不存在 (Anchor Not Found)`;
        cntAnchor++;
    } else if (link.status === 404) {
        errorReason = '404: 页面不存在，请检查链接拼写或目标是否已被删除 (Page Not Found)';
        cnt404++;
    } else if (link.status === 403) {
        errorReason = '403: 服务器拒绝访问，可能是鉴权过期或有防爬虫限制 (Forbidden)';
        cntOther++;
    } else if (link.status === 429) {
        errorReason = '429: 触发线上站点限流/防爬策略，浏览器访问可能正常 (Rate Limited)';
        cntOther++;
    } else if (link.status >= 500) {
        errorReason = `${link.status}: 目标网站服务错误，请确认服务是否正常运行 (Server Error)`;
        cntOther++;
    } else if (!link.status || link.status === 0) {
        errorReason = '网络超时/异常: 连接被拒绝或超时，请确认目标链接能否正常访问 (Timeout/Network)';
        cntTimeout++;
    } else {
        errorReason = `HTTP ${link.status}: 异常状态码，请点击死链地址确认 (Unexpected Status)`;
        cntOther++;
    }


    const { file: resolvedFile, link: fileLink, localPath } = resolveSourceFile(cleanParent);
    const line = findLineNumber(localPath, link.url);
    const finalLink = line ? `${fileLink}#L${line}` : fileLink;
    const displayFile = line ? `${resolvedFile}:${line}` : resolvedFile;

    const fileExists = localPath && fs.existsSync(path.join(process.cwd(), localPath));

    if (!urlMap.has(cleanUrl)) {
        urlMap.set(cleanUrl, {
            url: cleanUrl,
            errorReason,
            references: [],
            seenRefs: new Set()
        });
    }

    const entry = urlMap.get(cleanUrl);
    const refKey = `${resolvedFile}:${line}`;
    if (!entry.seenRefs.has(refKey)) {
        entry.seenRefs.add(refKey);

        let codeSnippet = '';
        if (fileExists && line > 0) {
            codeSnippet = getLineContent(localPath, line);
        }

        entry.references.push({
            file: displayFile,
            link: finalLink,
            fileExists: !!fileExists,
            codeSnippet
        });
    }
}

const uniqueBrokenLinks = [...urlMap.values()];

function writeStepSummary() {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    let markdown = `# 🔍 链路检测排错报告 (Link Checker Report)\n\n`;

    if (brokenLinks.length > 0) {
        markdown += `> [!WARNING]\n`;
        markdown += `> **本次定时巡检共发现 ${brokenLinks.length} 处失效链接！** 共检查了 ${totalChecks} 次链接，包含 ${uniqueUrls} 个独立 URL。请开发人员点击下表【引用源文件】中的链接，直接跳转到对应的 GitHub 源码行进行修复。\n\n`;
    } else {
        markdown += `> [!NOTE]\n`;
        markdown += `> **本次定时巡检未发现失效链接。** 共检查了 ${totalChecks} 次链接，包含 ${uniqueUrls} 个独立 URL。链路状态良好！\n\n`;
    }

    markdown += `| 🔗 失效链接 (Broken Link) | ❌ 错误原因 (Error Reason) | 📌 引用源文件 (Where Referenced) |\n`;
    markdown += `| :--- | :--- | :--- |\n`;

    if (uniqueBrokenLinks.length === 0) {
        markdown += `| - | 无失效链接 | - |\n`;
    } else {
        const limit = 100;
        const displayed = uniqueBrokenLinks.slice(0, limit);
        for (const item of displayed) {
             const validRefs = item.references.filter(r => r.fileExists);
             const refLinks = validRefs.map(ref => {
                 let lineInfo = `[\`${ref.file}\`](${encodeURI(ref.link)})`;
                 if (ref.codeSnippet) {
                     lineInfo += `<br><code>${escapeMarkdownTable(ref.codeSnippet)}</code>`;
                 }
                 return lineInfo;
             }).join('<br>');

             const finalRefCell = refLinks || '*无有效引用源 (可能为 404 页面产生的级联链接)*';

             markdown += `| \`${item.url}\` | \`${item.errorReason}\` | ${finalRefCell} |\n`;
        }
        if (uniqueBrokenLinks.length > limit) {
            markdown += `\n> [!NOTE]\n`;
            markdown += `> 由于失效链接数量较多，GitHub 步骤总结（Step Summary）已做截断，仅显示前 ${limit} 个。其余 ${uniqueBrokenLinks.length - limit} 个失效链接已省略，请通过 Feishu 报警消息或运行日志获取完整列表。\n\n`;
        }
    }

    markdown += `\n---\n`;
    markdown += `**📊 运行元信息：**\n`;
    markdown += `* **扫描模式**: \`${linkCheckMode}\`\n`;
    markdown += `* **扫描目标**: \`${linkCheckTarget}\`\n`;
    markdown += `* **检测总量**: \`${totalChecks}\` (独立 URL: \`${uniqueUrls}\`)\n`;
    markdown += `* **检测分支**: \`${branchName}\`\n`;
    markdown += `* **触发类型**: \`${eventName}\`\n`;
    markdown += `* **检测时间**: \`${new Date().toISOString().replace('T', ' ').substring(0, 19)} (UTC)\`\n`;

    try {
        fs.appendFileSync(summaryFile, markdown);
    } catch (err) {
        console.error('Failed to write GITHUB_STEP_SUMMARY:', err.message);
    }
}

// Write Step Summary
writeStepSummary();

const hasIssues = brokenLinks.length > 0;
const exitCode = hasIssues ? 1 : 0;

let payload;
if (!hasIssues) {
    console.log('No broken links found. Sending success notification to Feishu.');
    payload = {
        msg_type: 'interactive',
        card: {
            header: {
                template: 'green',
                title: {
                    tag: 'plain_text',
                    content: `✅ 链接扫描成功 | ${repoName.split('/')[1] || repoName}`
                }
            },
            elements: [
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**触发场景**: ${eventName}\n**扫描模式**: ${linkCheckMode}\n**扫描目标**: ${linkCheckTarget}\n**检测状态**: 全部通过！\n**总检查量**: 共检查了 **${totalChecks}** 次链接，包含 **${uniqueUrls}** 个独立 URL。`
                    }
                },
                runUrl ? {
                    tag: 'action',
                    actions: [
                        {
                            tag: 'button',
                            text: {
                                tag: 'plain_text',
                                content: '查看详细排错报告'
                            },
                            type: 'primary',
                            url: runUrl
                        }
                    ]
                } : null
            ].filter(Boolean)
        }
    };
} else {
    console.log(`Found ${brokenLinks.length} broken links. Sending Feishu notification...`);
    const limit = 10;
    const displayedBroken = uniqueBrokenLinks.slice(0, limit);
    const brokenListMd = displayedBroken.map((item, idx) => {
        const validRefs = item.references.filter(r => r.fileExists);
        const refsText = validRefs.length > 0
            ? (validRefs.slice(0, 3).map(r => r.file).join(', ') + (validRefs.length > 3 ? '等' : ''))
            : '未知 (可能为404页面产生级联链接)';
        return `${idx + 1}. ❌ **[${item.errorReason}]** ${item.url}\n    🔍 引用源: \`${refsText}\``;
    }).join('\n');

    const totalText = uniqueBrokenLinks.length > limit ? `\n\n...以及其他 ${uniqueBrokenLinks.length - limit} 个失效链接，请点击下方按钮查看完整排错报告。` : '';

    payload = {
        msg_type: 'interactive',
        card: {
            header: {
                template: 'red',
                title: {
                    tag: 'plain_text',
                    content: `⚠️ 链接扫描失败警告 | ${repoName.split('/')[1] || repoName}`
                }
            },
            elements: [
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**触发场景**: ${eventName}\n**扫描模式**: ${linkCheckMode}\n**扫描目标**: ${linkCheckTarget}\n**提交人**: @${actor}${prNumber ? `\n**PR号**: #${prNumber}` : ''}\n**总失效链接数**: **${brokenLinks.length}** 个 (总共检查了 **${totalChecks}** 次链接，包含 **${uniqueUrls}** 个独立 URL)`
                    }
                },
                {
                    tag: 'hr'
                },
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**📊 死链分类统计 (Classification):**\n` +
                                 `• 🔴 **页面未找到 (404)**: **${cnt404}** 个\n` +
                                 `• 🟡 **锚点失效 (Anchor)**: **${cntAnchor}** 个\n` +
                                 `• 🔵 **网络超时/其他**: **${cntTimeout + cntOther}** 个`
                    }
                },
                {
                    tag: 'hr'
                },
                {
                    tag: 'div',
                    text: {
                        tag: 'lark_md',
                        content: `**检测到失效链接列表 (最多展示 ${limit} 个):**\n${brokenListMd}${totalText}`
                    }
                },
                runUrl ? {
                    tag: 'action',
                    actions: [
                        {
                            tag: 'button',
                            text: {
                                tag: 'plain_text',
                                content: '查看详细排错报告'
                            },
                            type: 'primary',
                            url: runUrl
                        }
                    ]
                } : null
            ].filter(Boolean)
        }
    };
}

const payloadStr = JSON.stringify(payload, null, 2);

if (!WEBHOOK_URL) {
    console.error('Error: FEISHU_WEBHOOK environment variable is not set. Step summary has been written.');
    process.exit(exitCode);
}

const urlObj = new URL(WEBHOOK_URL);
const protocol = urlObj.protocol === 'https:' ? require('https') : require('http');

const options = {
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
    }
};

console.log('Sending alert to Feishu...');
const req = protocol.request(options, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        console.log(`Feishu response status: ${res.statusCode}`);
        process.exit(exitCode);
    });
});

req.on('error', (e) => {
    console.error(`Problem sending request to Feishu: ${e.message}`);
    process.exit(exitCode);
});

req.write(payloadStr);
req.end();
