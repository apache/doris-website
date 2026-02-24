const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * 遍历目录，返回所有 md/mdx 文件的路径
 */
function getAllDocs(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getAllDocs(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

/**
 * 将父目录名转成人类可读格式
 * 例如：
 *   "complex-types" → "Complex Types"
 *   "sql_data-type" → "Sql Data Type"
 */
function formatDirName(name) {
  return name
    .split(/[-_]/g)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 提取原始 front matter 类型（判断是否 JSON）
 */
function detectFrontMatterFormat(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fmText = fmMatch[1].trim();
  return fmText.startsWith('{') ? 'json' : 'yaml';
}

/**
 * 主逻辑
 */
function fixDuplicateTitles(baseDir) {
  const files = getAllDocs(baseDir);

  // 1️⃣ 读取所有文档的 title
  const titleMap = new Map(); // title -> [filePaths]
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const { data } = matter(content);
    if (data.title) {
      const title = String(data.title).trim();
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(file);
    }
  }

  // 2️⃣ 找出重复 title
  for (const [title, paths] of titleMap.entries()) {
    if (paths.length > 1) {
      console.log(`\n⚠️ 发现重复标题 "${title}" (${paths.length} 个文件)：`);
      for (const filePath of paths) {
        console.log(`   → ${filePath}`);

        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(content);
        const fmFormat = detectFrontMatterFormat(content);
        const parentDir = path.basename(path.dirname(filePath));
        const formattedParent = formatDirName(parentDir);

        // 更新标题
        parsed.data.title = `${title} | ${formattedParent}`;

        // 保留 JSON 格式 front matter
        let newFrontMatter = '';
        if (fmFormat === 'json') {
          newFrontMatter = `---\n${JSON.stringify(parsed.data, null, 4)}\n---`;
        } else {
          // fallback (YAML)
          newFrontMatter = matter.stringify('', parsed.data).split('\n').slice(0, -1).join('\n');
        }

        // 拼回完整文件
        const body = parsed.content.trimStart();
        const newContent = `${newFrontMatter}\n\n${body}\n`;
        fs.writeFileSync(filePath, newContent);
      }
    }
  }

  console.log('\n✅ 重复标题已修正完成。');
}

// CLI 调用
const baseDir = process.argv[2];
if (!baseDir) {
  console.error('❌ 请提供要遍历的目录，如: node fix-duplicate-titles.js ./docs');
  process.exit(1);
}

fixDuplicateTitles(path.resolve(baseDir));
