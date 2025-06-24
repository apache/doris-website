const fs = require('fs');
const path = require('path');

function isMarkdownFile(file) {
  return file.endsWith('.md') || file.endsWith('.mdx');
}

function removeFirstCommentAfterFrontmatter(content, ext) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n*/;
  const frontmatterMatch = content.match(frontmatterRegex);

  if (!frontmatterMatch) return content;

  const frontmatter = frontmatterMatch[0];
  const rest = content.slice(frontmatter.length);

  let commentRegex;
  if (ext === '.mdx') {
    // MDX: JSX-style comment
    commentRegex = /^([\s\n]*?)\{\/\*[\s\S]*?\*\/\}\s*/;
  } else {
    // MD: HTML-style comment
    commentRegex = /^([\s\n]*?)<!--[\s\S]*?-->\s*/;
  }

  const newRest = rest.replace(commentRegex, '');

  return frontmatter + newRest;
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = removeFirstCommentAfterFrontmatter(content, ext);

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭  Skipped (no changes): ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath); // recursive
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      processFile(fullPath);
    }
  }
}

// Usage: node clean-meta-comments.js ./docs
const inputDir = process.argv[2];
if (!inputDir) {
  console.error('❌ Please provide a directory path.\nUsage: node clean-meta-comments.js ./docs');
  process.exit(1);
}

processDirectory(path.resolve(inputDir));
