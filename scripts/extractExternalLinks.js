const fs = require('fs');
const path = require('path');

// 遍历目录下所有 md 文件
function getAllMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  }

  return results;
}

// 提取 frontMatter 的 externalLink
function extractExternalLink(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontMatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);

  if (!frontMatterMatch) return null;

  const frontMatter = frontMatterMatch[1];

  // 尝试解析 externalLink
  const linkMatch = frontMatter.match(/['"]externalLink['"]\s*:\s*['"]([^'"]+)['"]/);

  if (!linkMatch) return null;

  return linkMatch[1];
}

// 主逻辑
function main() {
  const blogDir = path.join(__dirname, '../blog');
  const mdFiles = getAllMarkdownFiles(blogDir);

  const result = [];

  for (const file of mdFiles) {
    const externalLink = extractExternalLink(file);
    if (externalLink) {
      const relativePath = '/blog/' + path.basename(file, '.md');
      result.push({ path: relativePath, externalLink });
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
