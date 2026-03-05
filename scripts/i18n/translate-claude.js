#!/usr/bin/env node

/**
 * translate-claude.js
 *
 * 职责：
 * - 读取 prepare.js 生成的中间 JSON 文件
 * - 仅翻译 type === 'text' 的 segment
 * - 调用 Claude API
 * - 输出翻译后的中间结果，结构保持一致
 *
 * 设计目标： 
 * - 翻译层与 Markdown / Docusaurus 完全解耦
 * - 可替换模型、可重跑、可 debug
 */

const fs = require("fs");
const path = require("path");

const INPUT_DIR = process.argv[2];
const OUTPUT_DIR = process.argv[3];

if (!INPUT_DIR || !OUTPUT_DIR) {
  console.error("Usage: node translate-claude.js <inputDir> <outputDir>");
  process.exit(1);
}

const AWS_API_KEY = process.env.AWS_API_KEY;
if (!AWS_API_KEY) {
  console.error("Missing AWS_API_KEY");
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function translateFrontMatterByAI(text) {
  const payload = {
    messages: [
      {
        role: "assistant",
        content: [{
          text: `You are a professional technical documentation translator.
          Translate the following English text into natural, accurate Japanese.
Strict rules:
1. Preserve the exact meaning.
2. Do not add explanations or extra wording.
3. Do not rewrite or expand the sentence.
4. Keep technical terms in English if they are commonly used in Japanese technical documents.
5. Output ONLY the translated text.
`
        }]
      },
      {
        role: "user",
        content: [{
          text: `
Text:
<<<BEGIN>>>
${text}
<<<END>>>`
        }]
      }
    ]
  }
  const url =
    'https://bedrock-runtime.us-east-1.amazonaws.com/model/' +
    'us.anthropic.claude-sonnet-4-20250514-v1:0/converse';

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AWS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Claude API error: ${res.status} ${msg}`);
  }

  const data = await res.json();
  const output = data?.output.message.content[0].text;
  if (!output) {
    throw new Error("Invalid Claude API response");
  }
  return output;
}

/**
 * 调用 Claude API
 */
async function translateText(text) {
  const payload = {
    messages: [
      {
        role: "assistant",
        content: [{
          text: `You are a professional technical documentation translator.

Your task is to translate English technical documentation into natural, accurate Japanese.

Strict rules:
1. Preserve the original meaning exactly. Do not add, remove, or infer information.
2. Do NOT translate code blocks, inline code, file paths, CLI commands, URLs, configuration keys, or product names.
3. Keep all technical terms consistent. If a term is commonly used in English in Japanese technical documents, keep it in English.
4. Do not add explanations, notes, comments, or formatting changes.
5. Output ONLY the translated text. No preface, no markdown wrappers, no quotes.
6. Do not analyze or judge whether the content is meaningful or placeholder text.
7. Always translate exactly what is inside the markers, even if it looks like a template or placeholder.

Tone:
- Professional, neutral, technical documentation style
- Clear and concise Japanese suitable for developer documentation
`}]
        // content:
        //   "You are a professional technical translator. Translate the following English technical documentation into natural, accurate Japanese. Keep formatting, line breaks, markdown symbols, inline code, and URLs unchanged.",
      },
      {
        role: "user",
        content: [{
          text: `Translate the content inside the markers below.

<<<BEGIN>>>
${text}
<<<END>>>
`}],
      },
    ],
  };
  const url =
    'https://bedrock-runtime.us-east-1.amazonaws.com/model/' +
    'us.anthropic.claude-sonnet-4-20250514-v1:0/converse';

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AWS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Claude API error: ${res.status} ${msg}`);
  }

  const data = await res.json();
  const output = data?.output.message.content[0].text;
  if (!output) {
    throw new Error("Invalid Claude API response");
  }
  return output;
}

/**
 * 
 * @param {{ title?: string ,language?: string,description?:string }} frontMatter 
 */
async function translateFrontMatter(frontMatter) {
  const { title, description } = frontMatter;
  const translated = { ...frontMatter };
  if (title) {
    translated.title = await translateFrontMatterByAI(title);
  }
  if (description) {
    translated.description = await translateFrontMatterByAI(description);
  }
  console.log('translated', translated);

  return translated;
}

async function main() {
  const files = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    console.log(`Translating ${file}`);
    console.log("inputPath", inputPath);

    const intermediate = JSON.parse(fs.readFileSync(inputPath, "utf8"));

    const translated = {
      ...intermediate,
      segments: [],
    };

    console.log('start translate....');

    for (const segment of intermediate.segments) {
      if (segment.type !== "text") {
        translated.segments.push(segment);
        continue;
      }
      try {
        const ja = await translateText(segment.value);
        translated.segments.push({
          ...segment,
          translated: ja,
        });
      } catch (err) {
        console.error(`Failed to translate segment ${segment.id} in ${file}`);
        throw err;
      }
    }
    if (translated.frontMatter) {
      console.log('start translate frontmatter....');

      translated.frontMatter = await translateFrontMatter(translated.frontMatter);
    }
    console.log('write in file.....');

    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

// translateText(`# Customer Agreement

// **Effective Date:** November 14, 2025

// This Customer agreement is made between VeloDB Inc. (hereinafter referred to as "VeloDB", "we", "our" or "us") and the users ("user", "your" or "you") of the VeloDB products. VeloDB products refer to the software and services provided by VeloDB, including any updates, error fixes, and documentation. `).catch((err) => {
//   console.error(err);
// });
