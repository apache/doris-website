#!/usr/bin/env node

/**
 * prepare.js
 *
 * 目标：
 * 将英文 Markdown 文档转换为「安全可翻译的中间结构」，供 LLM 使用。
 *
 * 输入：
 *  - files.json: 需要翻译的英文 markdown 文件路径数组
 *  - 输出目录
 *  - manifest.json 输出路径
 *
 * 输出：
 *  - 每个 markdown 对应一个 JSON 中间文件
 *  - manifest.json：描述源文件与中间文件、最终输出路径的映射关系
 *
 * 设计原则：
 *  - 只翻译自然语言文本
 *  - 不翻译代码块 / inline code / URL / frontmatter key
 *  - Markdown 结构必须可 100% 还原
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const [, , filesJsonPath, outDir, manifestPath, targetRootArg] = process.argv;
const targetRoot = targetRootArg || 'i18n/ja';

if (!filesJsonPath || !outDir || !manifestPath) {
  console.error('Usage: node prepare.js <files.json> <outDir> <manifest.json> [targetRoot]');
  process.exit(1);
}

const files = JSON.parse(fs.readFileSync(filesJsonPath, 'utf8'));

fs.mkdirSync(outDir, { recursive: true });

const manifest = [];

function normalizeSourcePath(sourcePath) {
  return sourcePath.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function resolveI18nTargetPath(sourcePath, i18nRoot) {
  const normalizedSource = normalizeSourcePath(sourcePath);

  if (normalizedSource.startsWith('docs/')) {
    const relative = normalizedSource.slice('docs/'.length);
    return path.posix.join(i18nRoot, 'docusaurus-plugin-content-docs', 'current', relative);
  }

  if (normalizedSource.startsWith('versioned_docs/')) {
    const relative = normalizedSource.slice('versioned_docs/'.length);
    const firstSlash = relative.indexOf('/');
    if (firstSlash === -1) {
      throw new Error(`Invalid versioned docs path: ${sourcePath}`);
    }
    const versionDir = relative.slice(0, firstSlash);
    const versionRelativePath = relative.slice(firstSlash + 1);
    return path.posix.join(i18nRoot, 'docusaurus-plugin-content-docs', versionDir, versionRelativePath);
  }

  if (normalizedSource.startsWith('community/')) {
    const relative = normalizedSource.slice('community/'.length);
    return path.posix.join(i18nRoot, 'docusaurus-plugin-content-docs-community', 'current', relative);
  }

  throw new Error(`Unsupported source path for translation target: ${sourcePath}`);
}

for (const file of files) {
  const absPath = path.resolve(file);
  const raw = fs.readFileSync(absPath, 'utf8');

  // 1. 解析 front matter
  const parsed = matter(raw);
  const content = parsed.content;

  // 2. 按代码块切分（```）
  const segments = [];
  let buffer = '';
  let inCodeBlock = false;
  let index = 0;

  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      // flush buffer
      if (buffer.trim()) {
        segments.push({
          id: index++,
          type: 'text',
          value: buffer.trim()
        });
        buffer = '';
      }

      segments.push({
        id: index++,
        type: 'code',
        value: line
      });

      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      segments.push({
        id: index++,
        type: 'code',
        value: line
      });
    } else {
      buffer += line + '\n';
    }
  }

  if (buffer.trim()) {
    segments.push({
      id: index++,
      type: 'text',
      value: buffer.trim()
    });
  }

  // 3. 生成中间文件
  // Use repository root (process.cwd()) as base so docs/versioned_docs/community map cleanly
  const relative = path.relative(process.cwd(), absPath);
  const intermediateName = relative.replace(/[\\/]/g, '_').replace(/\.mdx?$/, '.json');
  const intermediatePath = path.join(outDir, intermediateName);

  const intermediate = {
    source: file,
    frontMatter: parsed.data,
    segments,
    target: '',
  };

  // 4. 计算最终 ja 输出路径
  const targetPath = resolveI18nTargetPath(relative, targetRoot);
  intermediate.target = targetPath;

  fs.writeFileSync(intermediatePath, JSON.stringify(intermediate, null, 2));
  console.log(`Wrote intermediate: ${intermediatePath}`);

  manifest.push({
    source: file,
    intermediate: intermediatePath,
    target: targetPath
  });
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Prepared ${manifest.length} files for translation.`);
