// #!/usr/bin/env node

/**
 * 将 Docusaurus sidebars.ts 中的字符串项改为 doc 对象，
 * label 从对应文档正文第一行 "# xxx" 自动提取。
 * 
 * 需要将 sidebars.ts 改为 js 文件再运行脚本
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const matter = require("gray-matter");

async function main() {
  const sidebarRelativePath = process.argv[2];
  if (!sidebarRelativePath) {
    console.error("❌ 请传入 sidebar 配置文件的相对路径");
    process.exit(1);
  }

  const sidebarPath = path.resolve(process.cwd(), sidebarRelativePath);
  if (!fs.existsSync(sidebarPath)) {
    console.error(`❌ 文件不存在: ${sidebarPath}`);
    process.exit(1);
  }

  const ext = path.extname(sidebarPath);
  const docsDir = path.resolve(process.cwd(), "docs");

  let sidebars;

  // ===== 读取 sidebar 配置 =====
  if (ext === ".json") {
    sidebars = JSON.parse(fs.readFileSync(sidebarPath, "utf-8"));
  } else if (ext === ".js" || ext === ".ts") {
    const mod = await import(pathToFileURL(sidebarPath).href);
    sidebars = mod.default || mod.sidebars || mod;
  } else {
    console.error("❌ 仅支持 .js / .ts / .json sidebar 文件");
    process.exit(1);
  }

  // ===== label 提取逻辑 =====
  function getDocLabel(docId) {
    const mdPath = path.join(docsDir, `${docId}.md`);
    const mdxPath = path.join(docsDir, `${docId}.mdx`);
    let filePath = fs.existsSync(mdPath) ? mdPath : fs.existsSync(mdxPath) ? mdxPath : null;

    if (!filePath) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    const frontMatter = matter(content);
    if(frontMatter.data && frontMatter.data.title) {
      return frontMatter.data.title;
    }
    const firstHeading = content.split("\n").find(line => line.trim().startsWith("#"));
    if (!firstHeading) return null;
    return firstHeading.replace(/^#+\s*/, "").trim();
  }

  // ===== sidebar items 转换 =====
  function transformItems(items) {
    return items.map(item => {
      if (typeof item === "string") {
        const label = getDocLabel(item);
        return {
          type: "doc",
          id: item,
          label: label || path.basename(item),
        };
      }

      if (item.type === "category" && Array.isArray(item.items)) {
        return {
          ...item,
          items: transformItems(item.items),
        };
      }

      return item;
    });
  }

  const newSidebars = {};
  for (const [key, value] of Object.entries(sidebars)) {
    newSidebars[key] = Array.isArray(value)
      ? value.map(block =>
        block.type === "category"
          ? { ...block, items: transformItems(block.items) }
          : block
      )
      : value;
  }

  // ===== 输出文件 =====
  const outputPath = sidebarPath.replace(
    ext,
    `.transformed${ext === ".json" ? ".json" : ".js"}`
  );

  let outputContent;
  if (ext === ".json") {
    outputContent = JSON.stringify(newSidebars, null, 2);
  } else {
    outputContent =
      `export const sidebars = ${JSON.stringify(newSidebars, null, 2)};\n\n` +
      `export default sidebars;\n`;
  }

  fs.writeFileSync(outputPath, outputContent, "utf-8");
  console.log(`✅ 转换完成：${outputPath}`);
}

main().catch(err => {
  console.error("❌ 出错:", err);
  process.exit(1);
});