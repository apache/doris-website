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
  const output = execSync(
    `git show --name-status --diff-filter=AM ${commit} -- '*.md' '*.mdx'`,
    { encoding: "utf-8", maxBuffer: 100 * 1024 * 1024 }
  );
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
         !path.isAbsolute(link)&&
         !/.*@.*\..*/.test(link);
}

// Strip Markdown code regions so the link scanner ignores their contents.
//
// The previous implementation used `/```[\s\S]*?```/g` followed by `` /`[^`]*`/g ``,
// which mishandles docs whose inline code itself contains triple backticks
// (e.g. a table cell that reads "` ```shell `"). In that case the global
// triple-backtick regex paired ``` across rows and across real fenced blocks,
// shifting the open/close boundaries and leaving real code regions visible
// to the link scanner — which then reported their contents as broken links.
//
// Correct rules (a subset of CommonMark sufficient for our docs):
//   1. A fenced code block opens with 3+ backticks at the start of a line
//      (up to 3 leading spaces). It closes with another run of >= that many
//      backticks at the start of a line. Anything else (e.g. ``` inside a
//      table cell) is NOT a fence.
//   2. An inline code span opens with N backticks and closes with the next
//      run of EXACTLY N backticks. The content may contain shorter runs.
function removeCodeBlocks(content) {
  const lines = content.split("\n");
  const stripped = [];
  let openFenceLen = 0;
  for (const line of lines) {
    if (openFenceLen === 0) {
      const m = line.match(/^ {0,3}(`{3,})/);
      if (m) {
        openFenceLen = m[1].length;
        stripped.push("");
        continue;
      }
      stripped.push(line);
    } else {
      const m = line.match(/^ {0,3}(`{3,})\s*$/);
      if (m && m[1].length >= openFenceLen) {
        openFenceLen = 0;
      }
      stripped.push("");
    }
  }

  let result = stripped.join("\n");
  result = result.replace(/(`+)(?:(?!\1)[\s\S])*?\1/g, "");
  return result;
}

function findEsmStatementEnd(content, start) {
  let depth = 0;
  let quote = null;
  let escaping = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (quote) {
      if (escaping) {
        escaping = false;
      } else if (ch === "\\") {
        escaping = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === "\"" || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{" || ch === "[" || ch === "(") {
      depth++;
      continue;
    }

    if (ch === "}" || ch === "]" || ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === ";" && depth === 0) {
      return i + 1;
    }
  }

  return content.length;
}

function removeMdxEsmBlocks(content) {
  const esmStartRegex = /^[ \t]*(?:import(?:\s|["'{*])|export\s+(?:const|let|var|function|class|default|\{|\*))/;
  let result = "";
  let cursor = 0;
  let index = 0;

  while (index < content.length) {
    const lineEnd = content.indexOf("\n", index);
    const end = lineEnd === -1 ? content.length : lineEnd;
    const line = content.slice(index, end);

    if (esmStartRegex.test(line)) {
      const statementEnd = findEsmStatementEnd(content, index);
      result += content.slice(cursor, index);
      result += content.slice(index, statementEnd).replace(/[^\n]/g, "");
      cursor = statementEnd;
      index = statementEnd;
      continue;
    }

    index = lineEnd === -1 ? content.length : lineEnd + 1;
  }

  return result + content.slice(cursor);
}

// Check links in files
function checkFileLinks(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const dir = path.dirname(filePath);

  const cleanedContent = removeMdxEsmBlocks(removeCodeBlocks(content));
  const matches = [...cleanedContent.matchAll(linkRegex)];
  for (const match of matches) {
    const rawLink = match[1].split("#")[0]; // Remove anchor point
    if (!isLocalLink(rawLink)) continue;
    console.log('rawLink',rawLink);
    
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
