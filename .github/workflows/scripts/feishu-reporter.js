const fs = require('fs');
const path = require('path');

const WEBHOOK_URL = process.env.FEISHU_WEBHOOK;
if (!WEBHOOK_URL) {
    console.error('Error: FEISHU_WEBHOOK environment variable is not set.');
    process.exit(1);
}

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

const brokenLinks = (data.links || []).filter(link => !link.success);

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

function resolveSourceFile(cleanParent) {
    if (!cleanParent || cleanParent === 'Unknown' || cleanParent === '/') {
        return { file: 'Unknown', link: '' };
    }
    const relativePath = decodeURIComponent(cleanParent.replace(/^\/|\/$/g, ''));

    // Default: look up in the current repository
    const candidates = [
        relativePath + '.md',
        relativePath + '.mdx',
        relativePath + '/index.md',
        relativePath + '/index.mdx',
        'docs/' + relativePath + '.md',
        'docs/' + relativePath + '.mdx',
        'docs/' + relativePath + '/index.md',
        'docs/' + relativePath + '/index.mdx',
    ];

    for (const cand of candidates) {
        if (fs.existsSync(path.join(process.cwd(), cand))) {
            return {
                file: cand,
                link: `${serverUrl}/${repoName}/blob/${commitSha}/${cand}`
            };
        }
    }
    
    return {
        file: relativePath,
        link: `${serverUrl}/${repoName}/blob/${commitSha}/${relativePath}`
    };
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
        errorReason = `200 (锚点 ${hash} 未找到)`;
        cntAnchor++;
    } else if (link.status === 404) {
        cnt404++;
    } else if (!link.status || link.status === 0) {
        errorReason = 'Timeout / Network Error';
        cntTimeout++;
    } else {
        cntOther++;
    }

    const { file: resolvedFile, link: fileLink } = resolveSourceFile(cleanParent);

    if (!urlMap.has(cleanUrl)) {
        urlMap.set(cleanUrl, {
            url: cleanUrl,
            errorReason,
            references: []
        });
    }
    urlMap.get(cleanUrl).references.push({
        file: resolvedFile,
        link: fileLink
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
        for (const item of uniqueBrokenLinks) {
            const refLinks = item.references.map(ref => {
                if (ref.link) {
                    return `[\`${ref.file}\`](${ref.link})`;
                }
                return `\`${ref.file}\``;
            }).join('<br>');

            markdown += `| \`${item.url}\` | \`${item.errorReason}\` | ${refLinks} |\n`;
        }
    }

    markdown += `\n---\n`;
    markdown += `**📊 运行元信息：**\n`;
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
                    content: `**触发场景**: ${eventName}\n**提交人**: @${actor}${prNumber ? `\n**PR号**: #${prNumber}` : ''}\n**总失效链接数**: **${brokenLinks.length}** 个`
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
