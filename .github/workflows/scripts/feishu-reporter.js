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

const brokenLinks = (data.links || []).filter(link => link.state === 'BROKEN' && link.status === 404);

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
            // Try searching for the last segment of the path
            const segments = searchDecoded.split('/');
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && lastSegment.length > 3) {
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(lastSegment)) {
                        return i + 1;
                    }
                }
            }
        }
    } catch (err) {
        // Silent catch
    }
    return 0;
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

    if (!urlMap.has(cleanUrl)) {
        urlMap.set(cleanUrl, {
            url: cleanUrl,
            errorReason,
            references: []
        });
    }
    urlMap.get(cleanUrl).references.push({
        file: displayFile,
        link: finalLink
    });
}

const uniqueBrokenLinks = [...urlMap.values()];

function writeStepSummary() {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    let markdown = `# 🔍 链路检测排错报告 (Link Checker Report)\n\n`;

    if (brokenLinks.length > 0) {
        markdown += `> [!WARNING]\n`;
        markdown += `> **本次定时巡检共发现 ${brokenLinks.length} 处失效链接！** 请开发人员点击下表【引用源文件】中的链接，直接跳转到对应的 GitHub 源码行进行修复。\n\n`;
    } else {
        markdown += `> [!NOTE]\n`;
        markdown += `> **本次定时巡检未发现失效链接。** 链路状态良好！\n\n`;
    }

    markdown += `| 🔗 失效链接 (Broken Link) | ❌ 错误原因 (Error Reason) | 📌 引用源文件 (Where Referenced) |\n`;
    markdown += `| :--- | :--- | :--- |\n`;

    if (uniqueBrokenLinks.length === 0) {
        markdown += `| - | 无失效链接 | - |\n`;
    } else {
        const limit = 100;
        const displayed = uniqueBrokenLinks.slice(0, limit);
        for (const item of displayed) {
             const refLinks = item.references.map(ref => {
                if (ref.link) {
                    return `[\`${ref.file}\`](${encodeURI(ref.link)})`;
                }
                return `\`${ref.file}\``;
            }).join('<br>');

            markdown += `| \`${item.url}\` | \`${item.errorReason}\` | ${refLinks} |\n`;
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

if (brokenLinks.length === 0) {
    console.log('No broken links found. Exiting with success.');
    process.exit(0);
}

console.log(`Found ${brokenLinks.length} broken links. Sending Feishu notification...`);

// Format broken links summary for Feishu
const limit = 10;
const displayedBroken = uniqueBrokenLinks.slice(0, limit);
const brokenListMd = displayedBroken.map((item, idx) => {
    const refsText = item.references.slice(0, 3).map(r => r.file).join(', ') + (item.references.length > 3 ? '等' : '');
    return `${idx + 1}. ❌ **[${item.errorReason}]** ${item.url}\n    🔍 引用源: \`${refsText}\``;
}).join('\n');

const totalText = uniqueBrokenLinks.length > limit ? `\n\n...以及其他 ${uniqueBrokenLinks.length - limit} 个失效链接，请点击下方按钮查看完整排错报告。` : '';

const payload = {
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
                    content: `**触发场景**: ${eventName}\n**扫描模式**: ${linkCheckMode}\n**扫描目标**: ${linkCheckTarget}\n**提交人**: @${actor}${prNumber ? `\n**PR号**: #${prNumber}` : ''}\n**总失效链接数**: **${brokenLinks.length}** 个`
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

const payloadStr = JSON.stringify(payload, null, 2);

if (!WEBHOOK_URL) {
    console.error('Error: FEISHU_WEBHOOK environment variable is not set. Step summary has been written.');
    process.exit(1);
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
        process.exit(1);
    });
});

req.on('error', (e) => {
    console.error(`Problem sending request to Feishu: ${e.message}`);
    process.exit(1);
});

req.write(payloadStr);
req.end();
