#!/usr/bin/env node

/**
 * Usage:
 * node addDescriptionFromContent_fixed.js /path/to/docs
 *
 * 功能：
 * - 遍历目录下所有 .md/.mdx 文件
 * - 如果文件无 front matter：打印路径（不修改）
 * - 如果文件有 front matter（假设 front matter 内容为 JSON 或近似 JSON）：
 *     - 尝试解析 JSON 并在对象上添加 description 字段（如果不存在）
 *     - description 来源于正文中第一个“真实段落”（跳过标题、列表、引用、代码块）
 *     - 清理 Markdown（[text](link) -> text，去图片、代码标记等）
 *     - description 长度不超过 150 字，若截断会尽量回退到句子终止符处
 */

const fs = require('fs');
const path = require('path');

const [, , inputDir] = process.argv;
if (!inputDir) {
    console.error('❌ 请提供目录路径，例如：node addDescriptionFromContent_fixed.js ./docs');
    process.exit(1);
}

function getAllMarkdownFiles(dir) {
    const result = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            result.push(...getAllMarkdownFiles(fullPath));
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            result.push(fullPath);
        }
    }
    return result;
}

/**
 * 提取整个 front matter（包含分隔符）和 body
 * 返回 { fullMatch, fmContent, body } 或 null
 */
function splitFrontMatter(content) {
    const re = /^(---\s*\n)([\s\S]*?)\n---\s*\n?/;
    const m = content.match(re);
    if (!m) return null;
    return {
        fullMatch: m[0], // 包含前后 --- 的整块
        fmContent: m[2], // 中间的内容（期望为 JSON）
        body: content.slice(m[0].length),
    };
}

/**
 * 清理 Markdown（用于 description）
 * - [text](url) -> text
 * - remove images
 * - inline code `x` -> x
 * - remove emphasis markup (* _ ** __ ~)
 * - collapse whitespace
 */
function cleanMarkdown(text) {
    return (
        text
            // 替换链接 [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // 移除图片语法 ![alt](url)
            .replace(/!\[.*?\]\(.*?\)/g, '')
            // 行内代码 `code`
            .replace(/`([^`]+)`/g, '$1')
            // 去掉强调符号保守处理（* _ ** __ ~~）
            .replace(/(\*\*|\*|__|_|~~)/g, '')
            // 去掉 blockquote 前缀 >
            .replace(/^>\s?/gm, '')
            // 将多个空格与换行压缩成单个空格（段内）
            .replace(/\s+/g, ' ')
            .trim()
    );
}

/**
 * 从 body 中提取第一个“真实正文段落”
 * 策略：
 * - 跳过开头连续的标题（以 # 开头）、空行、引用行、表格行、列表行、代码块
 * - 识别并跳过代码块（``` 开始到 ``` 结束）
 * - 返回第一个连续的非控制行段落（直到空行结束）
 */
function extractFirstRealParagraph(body, type) {
    const lines = body.split(/\r?\n/);
    let inCodeBlock = false;
    let paragraphLines = [];
    let inCustomContainer = false;
    let inHtmlComment = false;
    let collecting = false;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.replace(/\r$/, '');

        // 检查是否进入或退出自定义容器
        if (/^\s*:::\s*(\w+)?/.test(line)) {
            // 如果遇到 ::: 开头，切换容器状态
            if (!inCustomContainer) {
                inCustomContainer = true;
                // 如果正在收集，则结束段落
                if (collecting) break;
                continue;
            } else {
                // 如果已经在容器中，遇到 ::: 表示容器结束
                inCustomContainer = false;
                continue;
            }
        }

        // 如果当前在自定义容器中，跳过该行
        if (inCustomContainer) continue;

        // 检查是否进入或退出HTML注释
        if (!inCodeBlock) {
            // 检查是否开始HTML注释
            if (/<!--/.test(line) && !/-->/.test(line)) {
                inHtmlComment = true;
                // 如果正在收集，则结束段落
                if (collecting) break;
                continue;
            }

            // 检查是否在HTML注释中结束
            if (inHtmlComment && /-->/.test(line)) {
                inHtmlComment = false;
                continue;
            }

            // 如果当前行完全在HTML注释中
            if (/^\s*<!--.*-->\s*$/.test(line)) {
                // 如果正在收集，则结束段落
                if (collecting) break;
                else continue;
            }
        }

        // 如果当前在HTML注释中，跳过该行
        if (inHtmlComment) continue;

        // 代码块切换
        if (/^```/.test(line)) {
            inCodeBlock = !inCodeBlock;
            // 不将代码块内容作为段落
            collecting = false;
            paragraphLines = [];
            continue;
        }
        if (inCodeBlock) continue;

        // 跳过空行（如果正在收集则结束段落）
        if (/^\s*$/.test(line)) {
            if (collecting) break;
            else continue;
        }

        // 跳过标题/列表/表格/引用/水平线等 markdown 结构
        if (
            /^\s{0,}#{1,6}\s+/.test(line) || // # title
            /^\s{0,}[-*+]\s+/.test(line) || // - item 或 * item
            /^\s{0,}\d+\.\s+/.test(line) || // 1. item
            /^\s*\|.*\|/.test(line) || // 表格行
            /^\s*>/.test(line) || // 引用行
            /^\s*[-*_]{3,}\s*$/.test(line) || // hr
            (/^\s*import\s+/.test(line) && type === 'mdx') ||
            /^[\s`]*`[^`\n]*`[\s`]*$/.test(line) // 代码行 `xxxx` (以反引号包裹的行内代码)
        ) {
            // 如果之前已经开始收集，则遇到这些结构视为段落边界并结束
            if (collecting) break;
            else continue; // 否则继续寻找真实段落
        }

        // 否则认为是正文行，开始或继续收集
        collecting = true;
        paragraphLines.push(line);
    }

    if (!paragraphLines.length) return '';
    return paragraphLines.join(' ').trim();
}

/**
 * 智能截断到 limit 字符以内，优先在句子标点处截断，其次在完整单词处截断
 */
function truncateSmart(text, limit = 150) {
    if (!text) return text;
    if (text.length <= limit) return text;

    // 在限制范围内查找最后一个标点符号
    const truncatedToLimit = text.slice(0, limit);

    // 优先查找标点符号（中英文句号、感叹号、问号）
    const lastPunct = Math.max(
        truncatedToLimit.lastIndexOf('。'),
        truncatedToLimit.lastIndexOf('.'),
        truncatedToLimit.lastIndexOf('!'),
        truncatedToLimit.lastIndexOf('?'),
        truncatedToLimit.lastIndexOf('，'),
        truncatedToLimit.lastIndexOf(','),
        truncatedToLimit.lastIndexOf('；'),
        truncatedToLimit.lastIndexOf(';'),
    );

    // 如果找到标点且在合理位置，直接在该标点处截断
    if (lastPunct > Math.floor(limit / 3)) {
        return text.slice(0, lastPunct + 1);
    }

    // 如果没有找到合适的标点，则在完整单词处截断
    // 从limit位置向前查找第一个空格或标点
    let cutIndex = limit;

    // 先向前查找空格或标点
    while (cutIndex > Math.floor(limit / 2)) {
        const char = text.charAt(cutIndex - 1);
        if (
            char === ' ' ||
            char === ',' ||
            char === '.' ||
            char === ';' ||
            char === ':' ||
            char === '。' ||
            char === '，' ||
            char === '；'
        ) {
            // 找到合适的截断点
            return text.slice(0, cutIndex);
        }
        cutIndex--;
    }

    // 如果没找到合适的截断点，在limit处直接截断（这是最坏情况）
    return text.slice(0, limit);
}

/**
 * 将 description 插入到 front matter JSON 中：
 * - 尝试解析为 JSON（去掉注释和尾随逗号的简单处理）
 * - 如果解析成功：在对象上添加 description 并 stringify (4-space)
 * - 如果解析失败：通过正则在最后一个 '}' 前插入 "description": "..."（保守做法）
 */
function insertDescriptionIntoFm(fmContent, description) {
    const trimmed = fmContent.trim();

    // 尝试解析 JSON：先去掉可能的注释（非严格），去掉尾随逗号等
    try {
        // 为了更强健，先尝试直接 JSON.parse
        const obj = JSON.parse(trimmed);
        if (typeof obj === 'object' && obj !== null) {
            if (Object.prototype.hasOwnProperty.call(obj, 'description')) {
                return {
                    fmText: JSON.stringify(obj, null, 4), // 保持原样（仅返回 formatted JSON）
                    changed: false,
                };
            }
            obj.description = description;
            const fmText = JSON.stringify(obj, null, 4);
            return { fmText, changed: true };
        }
    } catch (err) {
        // 如果直接解析失败，尝试宽松替换：
        // 1) 移除行注释 // ... 和 /* ... */（保守）
        // 2) 尝试修复简单的尾随逗号问题
        const relaxed = trimmed
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // remove trailing commas before closing brace: ,\s*}
            .replace(/,\s*}/g, '\n}');

        try {
            const obj2 = JSON.parse(relaxed);
            if (typeof obj2 === 'object' && obj2 !== null) {
                if (Object.prototype.hasOwnProperty.call(obj2, 'description')) {
                    return {
                        fmText: JSON.stringify(obj2, null, 4),
                        changed: false,
                    };
                }
                obj2.description = description;
                return { fmText: JSON.stringify(obj2, null, 4), changed: true };
            }
        } catch (err2) {
            // 最后兜底：在原始 fmContent 的最后一个 '}' 前插入 description 字段（保守插入）
            const lastBrace = trimmed.lastIndexOf('}');
            if (lastBrace !== -1) {
                // 检查前面是否有逗号，如果没有则先添加逗号
                const beforeBrace = trimmed.slice(0, lastBrace).trimEnd();
                const needsComma = !/,\s*$/.test(beforeBrace);
                const insertion = `${needsComma ? ',' : ''}\n  "description": "${description.replace(/"/g, '\\"')}"\n`;
                const newFm = beforeBrace + insertion + '\n}';
                return { fmText: newFm, changed: true };
            }
        }
    }

    // 若都失败则返回原始（未修改）
    return { fmText: fmContent, changed: false };
}

/**
 * 处理单个文件逻辑
 */
function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const split = splitFrontMatter(content);

    if (!split) {
        console.log(`⚠️ 无 front matter: ${filePath}`);
        return;
    }

    const fmContent = split.fmContent;
    const body = split.body;

    // 检查是否已有 description 字段（简单文本匹配）
    if (/"description"\s*:\s*"/.test(fmContent)) {
        console.log(`ℹ️ 已有 description: ${filePath}`);
        return;
    }
    const type = filePath.endsWith('.mdx') ? 'mdx' : filePath.endsWith('.md') ? 'md' : '';
    // 提取正文第一个真实段落
    const firstParaRaw = extractFirstRealParagraph(body, type);
    const cleaned = cleanMarkdown(firstParaRaw);
    const descriptionCandidate = truncateSmart(cleaned, 150);

    if (!descriptionCandidate) {
        console.log(`⚠️ 未找到可用正文段落以生成 description: ${filePath}`);
        return;
    }

    // 插入 description 到 front matter
    const { fmText, changed } = insertDescriptionIntoFm(fmContent, descriptionCandidate);

    if (!changed) {
        // 如果函数返回 changed=false，说明要么已有 description，要么解析/插入失败
        if (/"description"\s*:\s*"/.test(fmText)) {
            console.log(`ℹ️ front matter 已包含 description（已跳过）: ${filePath}`);
            return;
        } else {
            // 解析/插入失败，保守不改写文件，打印警告
            console.warn(`⚠️ 无法安全地往 front matter 插入 description（跳过）: ${filePath}`);
            return;
        }
    }

    // 组装新的文件内容（我们使用格式化后的 JSON fmText）
    const newContent = `---\n${fmText}\n---\n\n${body}`;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ 已添加 description: ${filePath}`);
}

/** 主流程 */
const files = getAllMarkdownFiles(inputDir);
for (const f of files) {
    try {
        processFile(f);
    } catch (err) {
        console.error(`❌ 处理失败: ${f}`, err);
    }
}
console.log('\n🎉 完成');
