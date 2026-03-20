// scripts/i18n/collect-files.js
const glob = require("glob");
const fs = require("fs");
const path = require("path");

const [sourcePath, pattern, output] = process.argv.slice(2);

if (!sourcePath || !output) {
  console.error("Usage: node collect-files.js <sourceDir|filePath> <globPattern> <outputJson>");
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Source path does not exist: ${sourcePath}`);
  process.exit(1);
}

const stat = fs.statSync(sourcePath);

let files = [];

if (stat.isFile()) {
  // 传入的是单个文件路径，直接返回该文件
  files = [sourcePath];
} else if (stat.isDirectory()) {
  const globPattern = pattern || "**/*.{md,mdx}";
  // 传入的是目录，按原逻辑基于 glob 收集文件
  files = glob
    .sync(globPattern, {
      cwd: sourcePath,
      absolute: false,
    })
    .map((f) => path.join(sourcePath, f));
} else {
  console.error(`Source path is neither file nor directory: ${sourcePath}`);
  process.exit(1);
}

fs.writeFileSync(output, JSON.stringify(files, null, 2));
console.log(`Collected ${files.length} files`);
