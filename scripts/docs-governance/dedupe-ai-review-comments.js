#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ensureDirForFile, parseArgs } = require('./lib');
const { normalizeFindings } = require('./validate-ai-review-output');

function stableKey(finding) {
  if (finding.key) {
    return String(finding.key).trim();
  }
  return [
    finding.path || '',
    finding.line === null || typeof finding.line === 'undefined' ? '' : String(finding.line),
    String(finding.issue || '').replace(/\s+/g, ' ').trim(),
  ].join('\u001f');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

function dedupeAiReviewFindings(input) {
  const findings = normalizeFindings(input);
  const seen = new Set();
  const uniqueFindings = [];

  for (const finding of findings) {
    const key = stableKey(finding);
    const dedupeKey = hashKey(key);
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    uniqueFindings.push({
      ...finding,
      dedupe_key: dedupeKey,
    });
  }

  return uniqueFindings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error('Usage: node scripts/docs-governance/dedupe-ai-review-comments.js --input <findings.json> --output <deduped.json>');
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  const deduped = dedupeAiReviewFindings(fs.readFileSync(inputPath, 'utf8'));
  const output = JSON.stringify(deduped, null, 2);

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  } else {
    process.stdout.write(`${output}\n`);
  }
}

if (require.main === module) {
  try {
    runCli();
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  dedupeAiReviewFindings,
  hashKey,
  stableKey,
};
