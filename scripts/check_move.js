#!/usr/bin/env node
/**
 * Used to check whether there are broken links in the modified files in the pipeline
 */


const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const commitHash = process.argv[2];

if (!commitHash) {
  console.error("❌ Please provide the commit hash, such as: node check-dead-links.js <commit-hash>");
  process.exit(1);
}

const linkRegex = /\[.*?\]\((.*?)\)/g;
let hasBrokenLinks = false;

// Get the modified or newly added .md/.mdx files in the commit
function getModifiedMarkdownFiles(commit) {
  const output = execSync(`git show --name-status ${commit}`, { encoding: "utf-8" });
  const lines = output.split("\n");
  console.log('lines',lines);
  
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

// Checks if the link points to an existing local file
function isLocalLink(link) {
  return !link.startsWith("http://") &&
         !link.startsWith("https://") &&
         !link.startsWith("mailto:") &&
         !link.startsWith("#") &&
         !path.isAbsolute(link);
}

function removeCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, ""); // remove ```...``` 
}

// Check links in files
function checkFileLinks(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const dir = path.dirname(filePath);

  const cleanedContent = removeCodeBlocks(content); 
  const matches = [...cleanedContent.matchAll(linkRegex)];

  for (const match of matches) {
    const rawLink = match[1].split("#")[0]; // Remove anchor point
    if (!isLocalLink(rawLink)) continue;

    let fullPath = path.resolve(dir, rawLink);
    if (!fs.existsSync(fullPath)) {
      // Try adding a .md/.mdx suffix and try again
      if (fs.existsSync(fullPath + ".md")) continue;
      if (fs.existsSync(fullPath + ".mdx")) continue;

      console.error(`❌ ${filePath}: Broken link -> ${rawLink}`);
      hasBrokenLinks = true;
    }
  }
}

// Main function
function main() {
  const files = getModifiedMarkdownFiles(commitHash);
  if (files.length === 0) {
    console.log("✅ Unmodified Markdown files");
    return;
  }

  for (const file of files) {
    if (fs.existsSync(file)) {
      checkFileLinks(file);
    }
  }


  if (hasBrokenLinks) {
    console.error("❗ A broken link was detected. Please fix it and submit.");
    process.exit(1);
  } else {
    console.log("✅ All links are OK");
  }
}

main();
