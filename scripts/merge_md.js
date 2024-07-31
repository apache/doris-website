// const fs = require('fs');
// const path = require('path');

// const sidebarPath = path.join(__dirname, '../versioned_sidebars/version-2.1-sidebars.json');
// const docsBaseDir = path.join(__dirname, '../i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1');
// const outputPath = path.join(__dirname, '../doc.md');

// // 读取JSON文件
// function readJSON(filePath) {
//     const data = fs.readFileSync(filePath, 'utf-8');
//     return JSON.parse(data);
// }

// // 读取Markdown文件
// function readMarkdownFile(filePath) {
//     return fs.readFileSync(filePath, 'utf-8');
// }

// // 写入Markdown文件
// function writeMarkdownContent(filePath, content) {
//     fs.writeFileSync(filePath, content, 'utf-8');
// }

// // 递归处理items
// function processItems(items, level) {
//     let content = '';
//     items.forEach(item => {
//         if (typeof item === 'string') {
//             const filePath = path.join(docsBaseDir, item + '.md');
//             if (fs.existsSync(filePath)) {
//                 const mdContent = readMarkdownFile(filePath);
//                 content += adjustHeaders(mdContent, level) + '\n\n';
//             }
//         } else if (typeof item === 'object' && item.items) {
//             content += `${'#'.repeat(level)} ${item.label}\n\n`;
//             content += processItems(item.items, level + 1);
//         }
//     });
//     return content;
// }

// // 调整标题级别
// function adjustHeaders(mdContent, level) {
//     const lines = mdContent.split('\n');
//     const adjustedLines = lines.map(line => {
//         if (line.startsWith('#')) {
//             const numHashes = line.match(/^#+/)[0].length;
//             return '#'.repeat(numHashes + level) + line.slice(numHashes);
//         }
//         return line;
//     });
//     return adjustedLines.join('\n');
// }

// // 合并Markdown文件
// function mergeMarkdownFiles() {
//     const sidebarData = readJSON(sidebarPath);
//     let content = '';
//     sidebarData.docs.forEach(category => {
//         content += `# ${category.label}\n\n`;
//         content += processItems(category.items, 2);
//     });
//     writeMarkdownContent(outputPath, content);
// }

// mergeMarkdownFiles();
// console.log(`Markdown文件已合并并保存到 '${outputPath}' 中。`);


// const fs = require('fs');  // 引入Node.js的文件系统模块
// const path = require('path');  // 引入Node.js的路径处理模块

// const sidebarPath = path.join(__dirname, '../versioned_sidebars/version-2.1-sidebars.json');  // 定义侧边栏JSON文件路径
// const docsBaseDir = path.join(__dirname, '../i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1');  // 定义Markdown文件基础目录路径
// const outputPath = path.join(__dirname, '../doc.md');  // 定义输出的Markdown文件路径

// // 读取JSON文件
// function readJSON(filePath) {
//     const data = fs.readFileSync(filePath, 'utf-8');  // 同步读取文件内容为UTF-8编码的字符串
//     return JSON.parse(data);  // 解析JSON字符串为JavaScript对象
// }

// // 读取Markdown文件
// function readMarkdownFile(filePath) {
//     return fs.readFileSync(filePath, 'utf-8');  // 同步读取Markdown文件内容为UTF-8编码的字符串
// }

// // 写入Markdown文件
// function writeMarkdownContent(filePath, content) {
//     fs.writeFileSync(filePath, content, 'utf-8');  // 同步写入Markdown内容到指定路径的文件
// }

// // 递归处理items
// function processItems(items, level) {
//     let content = '';
//     items.forEach(item => {
//         if (typeof item === 'string') {
//             const filePath = path.join(docsBaseDir, item + '.md');  // 构建Markdown文件的完整路径
//             if (fs.existsSync(filePath)) {  // 检查文件是否存在
//                 const mdContent = readMarkdownFile(filePath);  // 读取Markdown文件内容
//                 content += adjustHeaders(mdContent, level) + '\n\n';  // 调整标题级别并拼接内容
//             }
//         } else if (typeof item === 'object' && item.items) {
//             content += `${'#'.repeat(level + 1)} ${item.label}\n\n`;  // 添加当前标题级别和标签文本
//             content += processItems(item.items, level + 1);  // 递归处理子项
//         }
//     });
//     return content;
// }

// // 调整标题级别
// function adjustHeaders(mdContent, level) {
//     // const match = mdContent.match(/{[^}]*}/) // 识别每个md文档中的{}对象
//     // const mainTitle = JSON.parse(match[0].replace(/'/g, '"')).title  // 提取第一个对象中的title作为备用一级标题
//     // const lines = mdContent.split('\n');  // 将Markdown内容按行拆分为数组
//     // const adjustedLines = lines.map(line => {
//     //     if (line.startsWith('#')) {  // 如果行以#开头
//     //         const numHashes = line.match(/^#+/)[0].length;  // 计算当前标题级别的#数量
//     //         return '#'.repeat(numHashes + level) + line.slice(numHashes);  // 调整标题级别
//     //     }
//     //     return line;  // 其他情况不做调整直接返回
//     // });
//     // return adjustedLines.join('\n');  // 将调整后的行数组合并为字符串


//     const match = mdContent.match(/{[^}]*}/); // 识别每个md文档中的{}对象
//     const mainTitle = JSON.parse(match[0].replace(/'/g, '"')).title; // 提取第一个对象中的title作为备用一级标题
//     const lines = mdContent.split('\n'); // 将Markdown内容按行拆分为数组

//     let hasMainTitle = false;
//     let firstSeparatorIndex = -1;
//     let secondSeparatorIndex = -1;

//     for (let i = 0; i < lines.length; i++) {
//         const line = lines[i];
//         if (line.startsWith('# ')) {
//             hasMainTitle = true;
//             break;
//         }
//         if (line.trim() === '---') {
//             if (firstSeparatorIndex === -1) {
//                 firstSeparatorIndex = i;
//             } else {
//                 secondSeparatorIndex = i;
//                 break;
//             }
//         }
//     }

//     const adjustedLines = lines.map(line => {
//         if (line.startsWith('#')) {
//             const numHashes = line.match(/^#+/)[0].length;
//             return '#'.repeat(numHashes + level) + line.slice(numHashes);
//         }
//         return line;
//     });

//     if (!hasMainTitle && secondSeparatorIndex !== -1) {
//         adjustedLines.splice(secondSeparatorIndex + 1, 0, `${'#'.repeat(level + 1)} ${mainTitle}`);
//     }

//     return adjustedLines.join('\n');

// }

// // 合并Markdown文件
// function mergeMarkdownFiles() {
//     const sidebarData = readJSON(sidebarPath);  // 读取侧边栏JSON文件内容
//     let content = '';
//     sidebarData.docs.forEach(category => {  // 遍历每个类别
//         content += `# ${category.label}\n\n`;  // 添加类别标题
//         content += processItems(category.items, 1);  // 处理类别下的所有项
//     });
//     writeMarkdownContent(outputPath, content);  // 将合并后的Markdown内容写入文件
// }

// mergeMarkdownFiles();  // 执行合并操作
// console.log(`Markdown文件已合并并保存到 '${outputPath}' 中。`);  // 输出合并完成的信息


const fs = require('fs');  // 引入Node.js的文件系统模块
const path = require('path');  // 引入Node.js的路径处理模块

const sidebarPath = 'versioned_sidebars/version-2.1-cn-sidebars.json'  // 定义侧边栏JSON文件路径
const docsBaseDir = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-2.1'  // 定义Markdown文件基础目录路径
const outputPath = 'doc.md' // 定义输出的Markdown文件路径

const fileLinkName = {};  // 假设这里有一个映射链接名称的对象

// 读取JSON文件
function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');  // 同步读取文件内容为UTF-8编码的字符串
    return JSON.parse(data);  // 解析JSON字符串为JavaScript对象
}
// 读取Markdown文件
function readMarkdownFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');  // 同步读取Markdown文件内容为UTF-8编码的字符串
}
// 写入Markdown文件
function writeMarkdownContent(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');  // 同步写入Markdown内容到指定路径的文件
}
// 替换链接
function replaceLinkWrap(chapter) {
    const hyperLinkPattern = /\[([^\]]+)\]\(([^#)]+)(#[^)]+)?\)/g;  // 匹配Markdown链接的正则表达式

    function replaceLink(match, linkName, link, frag) {
        if (link.startsWith('http')) {
            return match;  // 如果是HTTP链接，直接返回
        } else if (/\.(png|jpeg|svg|gif|jpg)$/.test(link)) {
            console.log(link,'link')
            const imgLink = link.replace(/images\//, 'static/images/');  // 替换图片路径
            console.log(linkName,'linkName')
            console.log(imgLink,'imgLink')
            return `[${linkName}](${imgLink})`;
        } else {
            // // 处理相对路径的Markdown文件链接
            // if (link.endsWith('.md') || link.includes('.md#')) {
            //     console.log(frag,'frag')
            //     if (!frag) {
            //         link = link.slice(1);  // 去掉开头的斜杠
            //         for (let fpath in fileLinkName) {
            //             if (link === fpath) {
            //                 frag = '#' + fileLinkName[fpath];  // 添加片段
            //             }
            //         }
            //     }
            //     link = path.join(docsBaseDir, link);
            //     return `[${linkName}](${link}${frag ? frag : ''})`;
            // } else {
            //     // 对于其他相对路径的链接，添加docsBaseDir前缀
            //     link = path.join(docsBaseDir, link);
            //     return `[${linkName}](${link})`;
            // }
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
    return chapter.replace(hyperLinkPattern, replaceLink);  // 替换章节中的链接
}

// 把相对路径转成锚点格式
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

// 读取每个文件的title
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

// 递归处理items
function processItems(items, level) {
    let content = '';
    items.forEach(item => {
        if (typeof item === 'string') {
            const filePath = path.join(docsBaseDir, item + '.md');  // 构建Markdown文件的完整路径
            if (fs.existsSync(filePath)) {  // 检查文件是否存在
                let mdContent = readMarkdownFile(filePath);  // 读取Markdown文件内容
                mdContent = replaceLinkWrap(mdContent);  // 替换链接
                content += adjustHeaders(mdContent, level) + '\n\n';  // 调整标题级别并拼接内容
            }
        } else if (typeof item === 'object' && item.items) {
            content += `${'#'.repeat(level + 1)} ${item.label}\n\n`;  // 添加当前标题级别和标签文本
            content += processItems(item.items, level + 1);  // 递归处理子项
        }
    });
    return content;
}

// 调整标题级别
function adjustHeaders(mdContent, level) {
    const match = mdContent.match(/{[^}]*}/); // 识别每个md文档中的{}对象
    const mainTitle = JSON.parse(match[0].replace(/'/g, '"')).title; // 提取第一个对象中的title作为备用一级标题
    const lines = mdContent.split('\n'); // 将Markdown内容按行拆分为数组

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

// 合并Markdown文件
function mergeMarkdownFiles() {
    const sidebarData = readJSON(sidebarPath);  // 读取侧边栏JSON文件内容
    let content = '';
    sidebarData.docs.forEach(category => {  // 遍历每个类别
        content += `# ${category.label}\n\n`;  // 添加类别标题
        content += processItems(category.items, 1);  // 处理类别下的所有项
    });
    writeMarkdownContent(outputPath, content);  // 将合并后的Markdown内容写入文件
}

mergeMarkdownFiles();  // 执行合并操作
console.log(`Markdown文件已合并并保存到 '${outputPath}' 中。`);  // 输出合并完成的信息
