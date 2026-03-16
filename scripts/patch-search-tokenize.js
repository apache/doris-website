#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const targetTokenizeFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "client",
  "client",
  "utils",
  "tokenize.js"
);

const targetBuildIndexFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "server",
  "server",
  "utils",
  "buildIndex.js"
);

function patchTokenizeContent(content) {
  if (content.includes("const hasJapaneseKana = /[\\u3040-\\u30ff]/u.test(text);")) {
    return content;
  }

  const needle =
    '    // Some languages have their own tokenizer.\n' +
    '    if (language.length === 1 && ["ja", "jp", "th"].includes(language[0])) {\n' +
    "        return lunr[language[0]]\n" +
    "            .tokenizer(text)\n" +
    "            .map((token) => token.toString());\n" +
    "    }\n";

  const replacement =
    '    // For Japanese queries (especially kana), use Japanese tokenizer even in multi-language mode.\n' +
    '    // This avoids dropping tokens like "データベース" when language includes "zh".\n' +
    '    const hasJapaneseKana = /[\\u3040-\\u30ff]/u.test(text);\n' +
    '    if (hasJapaneseKana && (language.includes("ja") || language.includes("jp"))) {\n' +
    '        const jaTokenizer = lunr.ja?.tokenizer || lunr.jp?.tokenizer;\n' +
    "        if (typeof jaTokenizer === \"function\") {\n" +
    "            return jaTokenizer(text).map((token) => token.toString());\n" +
    "        }\n" +
    "    }\n" +
    '    // Some languages have their own tokenizer.\n' +
    '    if (language.length === 1 && ["ja", "jp", "th"].includes(language[0])) {\n' +
    "        return lunr[language[0]]\n" +
    "            .tokenizer(text)\n" +
    "            .map((token) => token.toString());\n" +
    "    }\n";

  if (!content.includes(needle)) {
    return null;
  }
  return content.replace(needle, replacement);
}

function patchBuildIndexContent(content) {
  if (content.includes("For zh+ja mixed mode, choose tokenizer by input text.")) {
    return content;
  }

  const needle =
    "            // Override tokenizer when language `zh` is enabled.\n" +
    '            if (language.includes("zh")) {\n' +
    "                this.tokenizer = lunr_1.default.zh.tokenizer;\n" +
    "            }\n";

  const replacement =
    "            // Override tokenizer when language `zh` is enabled.\n" +
    "            // For zh+ja mixed mode, choose tokenizer by input text.\n" +
    '            if (language.includes("zh")) {\n' +
    '                const hasJa = language.includes("ja") || language.includes("jp");\n' +
    "                if (hasJa) {\n" +
    "                    this.tokenizer = function (input, metadata) {\n" +
    '                        if (input == null) return [];\n' +
    "                        const text = input.toString();\n" +
    '                        if (/[\\u3040-\\u30ff]/u.test(text) && lunr_1.default.ja?.tokenizer) {\n' +
    "                            return lunr_1.default.ja.tokenizer(input, metadata);\n" +
    "                        }\n" +
    "                        return lunr_1.default.zh.tokenizer(input, metadata);\n" +
    "                    };\n" +
    "                }\n" +
    "                else {\n" +
    "                    this.tokenizer = lunr_1.default.zh.tokenizer;\n" +
    "                }\n" +
    "            }\n";

  if (!content.includes(needle)) {
    return null;
  }
  return content.replace(needle, replacement);
}

function patchOneFile(filePath, patchFn, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-search-tokenize] skip(${label}): file not found: ${filePath}`);
    return;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const patched = patchFn(original);
  if (patched == null) {
    console.warn(
      `[patch-search-tokenize] skip(${label}): target block not found (plugin content may have changed)`
    );
    return;
  }
  if (patched === original) {
    console.log(`[patch-search-tokenize] already patched (${label})`);
    return;
  }

  fs.writeFileSync(filePath, patched, "utf8");
  console.log(`[patch-search-tokenize] patched (${label})`);
}

function main() {
  patchOneFile(targetTokenizeFile, patchTokenizeContent, "client-tokenize");
  patchOneFile(targetBuildIndexFile, patchBuildIndexContent, "server-buildIndex");
}

main();
