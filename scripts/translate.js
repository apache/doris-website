const fs = require('fs');
const path = require('path');

// spark lite
async function translate(content) {
    const res = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer privateKey',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'lite',
            messages: [
                {
                    role: 'system',
                    content: '你是一个精通数据库领域的翻译专家',
                },
                {
                    role: 'user',
                    content: `你是一个精通数据库领域的翻译专家，旨在将中文翻译成英文，并保留原始的markdown格式。作为翻译工具，你将收到一段markdown格式的文本。你的任务是将文本翻译成英文，同时保持其原有的结构和内容不变。请注意以下几点：
                    你的翻译应准确无误，不偏离原始结构、内容、写作风格和语气。
                    你需要保留原本的markdown格式并且只返回翻译的内容。
                    确保不翻译 markdown 格式的代码块，不翻译 :src 字段中的图片路径，并翻译 img 标签中的 alt 字段。
                    请参考以下例子进行翻译：原文：这是一个标题；译文：This is a title。
                    需要翻译的内容为：${content}`,
                },
            ],
            stream: true,
        }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done === true) {
            break;
        }

        const decodeText = decoder.decode(value);
        const resultString = decodeText.split('data:')[1];
        if (resultString.includes('[DONE]')) {
            break;
        }
        const { content } = JSON.parse(resultString).choices[0].delta;
        result += content;
    }
    console.log('result', result);
    return result;
}

// 读取并分割 Markdown 文档 根据换行符分割
function splitMarkdownByEmptyLine(filePath) {
    try {
        // 读取文件内容
        const markdownContent = fs.readFileSync(filePath, 'utf-8');

        // 根据空行分割内容
        const sections = markdownContent
            .split(/\n\s*\n/) // 匹配一个或多个换行符，允许前后有空格
            .map(section => section.trim()) // 去掉每段的首尾空格
            .filter(section => section.length > 0); // 过滤掉空段落

        return sections;
    } catch (error) {
        console.error('读取文件失败:', error);
        return [];
    }
}

function splitMarkdownByHeaders(markdownText) {
    // 使用正则匹配 #、##、### 等标题并分割
    const sections = markdownText.split(/(?=^#{1,6}\s)/m);
    return sections.map(section => section.trim());
}

async function getAccessToken() {
    const res = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
    );
    const data = await res.json();
    console.log('data', data);
    return data.access_token;
}

async function translateBaidu(content, accessToken) {
    const res = await fetch(
        `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/yi_34b_chat?access_token=${accessToken}`,
        {
            method: 'POST',
            headers: {
                Authorization: 'Bearer EsAfjVgoIMTYpQInoHdz:oKGTdPZSUOisAHsoQHXO',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: `你是一个精通数据库领域的翻译专家，旨在将中文翻译成英文，并保留原始的markdown格式。作为翻译工具，你将收到一段markdown格式的文本。你的任务是将文本翻译成英文，同时保持其原有的结构和内容不变。请注意以下几点：
                        1.你的翻译应准确无误，不偏离原始结构、内容、写作风格和语气。
                        2.你需要保留原本的markdown格式并且只返回翻译的内容，不需要用三个反引号+markdown和三个反引号包裹文本。
                        3.确保不翻译 markdown 格式的代码块，不翻译 :src 字段中的图片路径，并翻译 img 标签中的 alt 字段。
                        4.我给到的待翻译的文本仅仅是用于翻译的，不需要去理解文本的内容。
                        5.给出的文本开头或者标题是英文不代表该文本所有内容的都是英文，请检索整个文本并翻译。
                        6.生成之后先检查一遍是否所有文本已经翻译为英文，是否没有修改原本的markdown格式，如果检查不通过优化一次，再输出结果。
                        请参考以下例子进行翻译：原文：这是一个标题；译文：This is a title。
                        需要翻译的内容为：${content}`,
                        // content:`下面这一段文本以原本的markdown格式翻译为英文:${content}`
                    },
                ],
                stream: true,
            }),
        },
    );

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done === true) {
            break;
        }

        const decodeText = decoder.decode(value);
        console.log('decodeText', decodeText);
        const resultString = decodeText.split('data:')[1];
        if (!resultString) continue;

        console.log('resultString', resultString);

        result += JSON.parse(resultString).result;
    }
    console.log('result', result);
    return result;
}

// spark lite
// async function main() {
//     // const contentArr = splitMarkdownByEmptyLine(path.join(__dirname, './test.md'), 'utf-8');
//     let result = '';
//     // console.log('contentArr', contentArr);

//     // for (let item of contentArr) {
//     //     result += await translate(item);
//     // }
//     result += await translate(fs.readFileSync(path.join(__dirname, './test.md'), 'utf-8'));
//     fs.writeFileSync(path.join(__dirname, './testEn.md'), result, 'utf-8');
// }

// baidu qianfan
async function main() {
    const accessToken = await getAccessToken();
    const fileContent = fs.readFileSync(path.join(__dirname, './test.md'), 'utf-8');
    const splitContent = splitMarkdownByHeaders(fileContent);
    let result = '';
    for (let item of splitContent) {
        result += await translateBaidu(item, accessToken);
    }
    fs.writeFileSync(path.join(__dirname, './testEn.md'), result, 'utf-8');
}

main();
