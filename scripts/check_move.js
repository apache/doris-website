#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const commitHash = process.argv[2];

if (!commitHash) {
  console.error("❌ 请提供 commit hash，如：node check-dead-links.js <commit-hash>");
  process.exit(1);
}

const linkRegex = /\[.*?\]\((.*?)\)/g;
let hasBrokenLinks = false;

// 获取提交中修改或新增的 .md/.mdx 文件
function getModifiedMarkdownFiles(commit) {
  const output = execSync(`git show --name-status ${commit}`, { encoding: "utf-8" });
  const lines = output.split("\n");
  const files = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 2) {
      const [status, filePath] = parts;
      if ((status === "A" || status === "M") && (filePath.endsWith(".md") || filePath.endsWith(".mdx"))) {
        files.push(filePath);
      }
    }
  }

  return files;
}

// 检查链接是否指向一个存在的本地文件
function isLocalLink(link) {
  return !link.startsWith("http://") &&
         !link.startsWith("https://") &&
         !link.startsWith("mailto:") &&
         !link.startsWith("#") &&
         !path.isAbsolute(link);
}

// 检查文件中的链接
function checkFileLinks(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const dir = path.dirname(filePath);
  const matches = [...content.matchAll(linkRegex)];

  for (const match of matches) {
    const rawLink = match[1].split("#")[0]; // 去掉锚点
    if (!isLocalLink(rawLink)) continue;

    let fullPath = path.resolve(dir, rawLink);
    if (!fs.existsSync(fullPath)) {
      // 尝试加上 .md/.mdx 后缀重试
      if (fs.existsSync(fullPath + ".md")) continue;
      if (fs.existsSync(fullPath + ".mdx")) continue;

      console.error(`❌ ${filePath}: Broken link -> ${rawLink}`);
      hasBrokenLinks = true;
    }
  }
}

// 主函数
function main() {
  const files = getModifiedMarkdownFiles(commitHash);
  if (files.length === 0) {
    console.log("✅ 没有修改的 Markdown 文件");
    return;
  }

  for (const file of files) {
    if (fs.existsSync(file)) {
      checkFileLinks(file);
    }
  }
  

  if (hasBrokenLinks) {
    console.error("❗ 检测到死链，请修复后提交");
    process.exit(1);
  } else {
    console.log("✅ 所有链接正常");
  }
}

main();
