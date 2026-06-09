const fs = require('fs');
const path = require('path');

const WEBHOOK_URL = process.env.FEISHU_WEBHOOK;
if (!WEBHOOK_URL) {
    console.error('Error: FEISHU_WEBHOOK environment variable is not set.');
    process.exit(1);
}

const resultsPath = path.join(process.cwd(), 'link_results.json');
if (!fs.existsSync(resultsPath)) {
    console.error('Error: link_results.json not found.');
    process.exit(1);
}

let data;
try {
    data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
} catch (err) {
    console.error('Error parsing link_results.json:', err.message);
    process.exit(1);
}

const brokenLinks = (data.links || []).filter(link => !link.success);

function resolveSourceFile(cleanParent) {
    if (!cleanParent || cleanParent === 'Unknown' || cleanParent === '/') {
        return 'Unknown';
    }
    const relativePath = cleanParent.replace(/^\/|\/$/g, '');
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
            return cand;
        }
    }
    return relativePath;
}

function writeStepSummary(brokenLinks) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    const repoName = process.env.GITHUB_REPOSITORY || 'doris-website';
    const commitSha = process.env.GITHUB_SHA || 'master';
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const eventName = process.env.GITHUB_EVENT_NAME === 'schedule' ? 'Schedule (凌晨例行巡检)' : (process.env.GITHUB_EVENT_NAME || 'manual');
    const branchName = process.env.GITHUB_REF_NAME || 'master';

    let markdown = `# 🔍 链路检测排错报告 (Link Checker Report)\n\n`;

    if (brokenLinks.length > 0) {
        markdown += `> [!WARNING]\n`;
        markdown += `> **本次检测共发现 ${brokenLinks.length} 处失效链接！** 请开发人员点击下表中【引用源文件】中的蓝色链接，直接跳转到 GitHub 代码行进行修复。\n\n`;
    } else {
        markdown += `> [!NOTE]\n`;
        markdown += `> **本次检测未发现失效链接。** 链路状态良好！\n\n`;
    }

    markdown += `| 📌 引用源文件 (Where Referenced) | 🔗 失效链接 (Broken Link) | ❌ 错误原因 (Error Reason) |\n`;
    markdown += `| :--- | :--- | :--- |\n`;

    if (brokenLinks.length === 0) {
        markdown += `| - | 无失效链接 | - |\n`;
    } else {
        for (const link of brokenLinks) {
            const cleanUrl = link.url.replace(/^http:\/\/localhost:\d+/, '');
            const cleanParent = link.parent ? link.parent.replace(/^http:\/\/localhost:\d+/, '') : 'Unknown';
            const resolvedFile = resolveSourceFile(cleanParent);
            const fileLink = resolvedFile !== 'Unknown' ? `${serverUrl}/${repoName}/blob/${commitSha}/${resolvedFile}` : '';
            const fileDisplay = resolvedFile !== 'Unknown' ? resolvedFile : 'Unknown';
            
            const fileCol = fileLink ? `[\`${fileDisplay}\`](${fileLink})` : `\`${fileDisplay}\``;
            markdown += `| ${fileCol} | \`${cleanUrl}\` | \`${link.status || 'Broken'}\` |\n`;
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

// Write Step Summary in all cases
writeStepSummary(brokenLinks);

if (brokenLinks.length === 0) {
    console.log('No broken links found. Exiting with success.');
    process.exit(0);
}

console.log(`Found ${brokenLinks.length} broken links.`);

const repoName = process.env.GITHUB_REPOSITORY || 'doris-website';
const runId = process.env.GITHUB_RUN_ID || '';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const runUrl = runId ? `${serverUrl}/${repoName}/actions/runs/${runId}` : '';
const prNumber = process.env.GITHUB_EVENT_NAME === 'pull_request' ? (process.env.GITHUB_REF_NAME ? process.env.GITHUB_REF_NAME.split('/')[0] : '') : '';
const actor = process.env.GITHUB_ACTOR || 'system';
const eventName = process.env.GITHUB_EVENT_NAME === 'schedule' ? '每日例行巡检' : 'PR 提交';

const limit = 10;
const displayedBroken = brokenLinks.slice(0, limit);
const brokenListMd = displayedBroken.map((link, idx) => {
    const cleanUrl = link.url.replace(/^http:\/\/localhost:\d+/, '');
    const cleanParent = link.parent ? link.parent.replace(/^http:\/\/localhost:\d+/, '') : 'Unknown';
    const resolvedFile = resolveSourceFile(cleanParent);
    return `${idx + 1}. ❌ **[${link.status || 'Broken'}]** ${cleanUrl}\n    🔍 引用源文件: \`${resolvedFile}\``;
}).join('\n');

const totalText = brokenLinks.length > limit ? `\n\n...以及其他 ${brokenLinks.length - limit} 个死链，请点击下方按钮查看完整排错报告。` : '';

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
                    content: `**触发场景**: ${eventName}\n**提交人**: @${actor}${prNumber ? `\n**PR号**: #${prNumber}` : ''}\n**总死链数**: **${brokenLinks.length}** 个`
                }
            },
            {
                tag: 'hr'
            },
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**检测到死链列表 (最多展示 ${limit} 条):**\n${brokenListMd}${totalText}`
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
if (process.env.DEBUG === 'true') {
    console.log('--- Generated Feishu Card Payload ---');
    console.log(payloadStr);
    console.log('------------------------------------');
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
        console.log(`Feishu response body: ${body}`);
        process.exit(1);
    });
});

req.on('error', (e) => {
    console.error(`Problem sending request to Feishu: ${e.message}`);
    process.exit(1);
});

req.write(payloadStr);
req.end();
