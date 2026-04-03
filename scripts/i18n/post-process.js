#!/usr/bin/env node

/**
 * post-process.js
 *
 * 职责：
 * - 读取 translate-claude.js 输出的中间 JSON
 * - 将 translated segment 还原为合法 Markdown
 * - 写入 Docusaurus i18n 目录结构
 *
 * 设计原则：
 * - 结构 100% 可还原
 * - 翻译失败可回退到英文
 * - 不在此阶段调用任何 LLM
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const INPUT_DIR = process.argv[2];
const TARGET_ROOT = process.argv[3];

if (!INPUT_DIR || !TARGET_ROOT) {
  console.error('Usage: node post-process.js <translatedDir> <i18nRoot>');
  process.exit(1);
}

function normalizeSourcePath(sourcePath) {
  const raw = path.isAbsolute(sourcePath)
    ? path.relative(process.cwd(), sourcePath)
    : sourcePath;
  return raw.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function resolveTargetPath(sourcePath, i18nRoot) {
  const normalizedSource = normalizeSourcePath(sourcePath);

  if (normalizedSource.startsWith('docs/')) {
    const relative = normalizedSource.slice('docs/'.length);
    return path.join(i18nRoot, 'docusaurus-plugin-content-docs', 'current', relative);
  }

  if (normalizedSource.startsWith('versioned_docs/')) {
    const relative = normalizedSource.slice('versioned_docs/'.length);
    const firstSlash = relative.indexOf('/');
    if (firstSlash === -1) {
      throw new Error(`Invalid versioned docs path: ${sourcePath}`);
    }
    const versionDir = relative.slice(0, firstSlash);
    const versionRelativePath = relative.slice(firstSlash + 1);
    return path.join(i18nRoot, 'docusaurus-plugin-content-docs', versionDir, versionRelativePath);
  }

  if (normalizedSource.startsWith('community/')) {
    const relative = normalizedSource.slice('community/'.length);
    return path.join(i18nRoot, 'docusaurus-plugin-content-docs-community', 'current', relative);
  }

  throw new Error(`Unsupported source path for translation output: ${sourcePath}`);
}

/**
 * 确保目录存在
 */
function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/**
 * 将 segments 还原为 markdown 文本
 */
function restoreMarkdown(segments) {
  let output = '';

  for (const seg of segments) {
    if (seg.type === 'text') {
      output += (seg.translated || seg.value) + '\n\n';
    } else if (seg.type === 'code') {
      output += seg.value + '\n';
    }
  }

  return output.trim() + '\n';
}

function main() {
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    const { source, frontMatter = {}, segments } = data;

    // 1. 还原 Markdown body
    const body = restoreMarkdown(segments);

    // 2. 重新注入 front matter
    const finalMarkdown = matter.stringify(body, { ...frontMatter, language: 'ja' }, { language: 'json' });

    // 3. 优先使用 prepare 阶段记录的 target（保持 workflow 输入一致）
    const targetPath = data.target
      ? path.isAbsolute(data.target)
        ? data.target
        : path.join(process.cwd(), data.target)
      : resolveTargetPath(source, TARGET_ROOT);

    ensureDir(targetPath);

    fs.writeFileSync(targetPath, finalMarkdown, 'utf8');

    console.log(`Written: ${targetPath}`);
  }
}

main();
