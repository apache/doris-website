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

if (brokenLinks.length === 0) {
    console.log('No broken links found. Exiting with success.');
    process.exit(0);
}

console.log(`Found ${brokenLinks.length} broken links.`);

// Gather env variables from GitHub Actions
const repoName = process.env.GITHUB_REPOSITORY || 'doris-website';
const runId = process.env.GITHUB_RUN_ID || '';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const runUrl = runId ? `${serverUrl}/${repoName}/actions/runs/${runId}` : '';
const prNumber = process.env.GITHUB_EVENT_NAME === 'pull_request' ? (process.env.GITHUB_REF_NAME ? process.env.GITHUB_REF_NAME.split('/')[0] : '') : '';
const actor = process.env.GITHUB_ACTOR || 'system';
const eventName = process.env.GITHUB_EVENT_NAME === 'schedule' ? '每日例行巡检' : 'PR 提交';

// Format broken links to Markdown
const limit = 10;
const displayedBroken = brokenLinks.slice(0, limit);
const brokenListMd = displayedBroken.map((link, idx) => {
    // Strip domain prefix for cleaner log
    const cleanUrl = link.url.replace(/^https?:\/\/(www\.)?doris\.apache\.org/, '');
    const cleanParent = link.parent ? link.parent.replace(/^https?:\/\/(www\.)?doris\.apache\.org/, '') : 'Unknown';
    return `${idx + 1}. ❌ **[${link.status || 'Broken'}]** ${cleanUrl}\n    🔍 引用源文件: \`${cleanParent}\``;
}).join('\n');

const totalText = brokenLinks.length > limit ? `\n\n...以及其他 ${brokenLinks.length - limit} 个死链，请点击下方按钮查看完整日志。` : '';

// Construct Feishu Card Payload
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
                            content: '查看 GitHub Actions 完整日志'
                        },
                        type: 'primary',
                        url: runUrl
                    }
                ]
            } : null
        ].filter(Boolean)
    }
};

// Send to Feishu Webhook
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
        // Exit with 1 to indicate step failure to GitHub
        process.exit(1);
    });
});

req.on('error', (e) => {
    console.error(`Problem sending request to Feishu: ${e.message}`);
    // Still exit with 1 to fail the check
    process.exit(1);
});

req.write(payloadStr);
req.end();
