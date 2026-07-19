#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./lib');

const REQUIRED_FIELDS = [
  'severity',
  'path',
  'line',
  'issue',
  'evidence',
  'suggested_fix',
  'blocking_recommendation',
  'needs_human_verification',
];

const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error']);
const UNVERIFIED_EVIDENCE_RE = /(unverified|not verified|cannot verify|could not verify|needs verification|no evidence|without evidence|not found|cannot find|未验证|无法验证|找不到证据|无证据)/i;
const DORIS_FACT_RE = /(apache doris|doris|sql|function|returns?|return value|supports?|unsupported|behavior|syntax|parameter|default|null|load|stream load|routine load|catalog|table|partition|index|query|storage|replica|transaction|导入|查询|函数|返回|参数|语法|默认|分区|表|索引)/i;

function normalizeFindings(input) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.findings)) {
    return parsed.findings;
  }
  throw new Error('AI review output must be a JSON array or an object with findings array.');
}

function hasUnverifiedEvidence(finding) {
  const evidence = String(finding.evidence || '').trim();
  return !evidence || UNVERIFIED_EVIDENCE_RE.test(evidence);
}

function looksLikeDorisFact(finding) {
  const text = [finding.issue, finding.suggested_fix].filter(Boolean).join(' ');
  return DORIS_FACT_RE.test(text);
}

function validateFinding(finding, index) {
  if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
    throw new Error(`finding[${index}] must be an object.`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(finding, field)) {
      throw new Error(`finding[${index}] is missing required field "${field}".`);
    }
  }

  if (!ALLOWED_SEVERITIES.has(finding.severity)) {
    throw new Error(`finding[${index}].severity must be one of info|warning|error.`);
  }

  if (typeof finding.path !== 'string' || finding.path.trim() === '') {
    throw new Error(`finding[${index}].path must be a non-empty string.`);
  }

  if (finding.line !== null && (!Number.isInteger(finding.line) || finding.line < 1)) {
    throw new Error(`finding[${index}].line must be a positive integer or null.`);
  }

  for (const field of ['issue', 'evidence', 'suggested_fix']) {
    if (typeof finding[field] !== 'string') {
      throw new Error(`finding[${index}].${field} must be a string.`);
    }
  }

  if (typeof finding.blocking_recommendation !== 'boolean') {
    throw new Error(`finding[${index}].blocking_recommendation must be boolean.`);
  }

  if (typeof finding.needs_human_verification !== 'boolean') {
    throw new Error(`finding[${index}].needs_human_verification must be boolean.`);
  }

  if (
    looksLikeDorisFact(finding) &&
    hasUnverifiedEvidence(finding) &&
    finding.needs_human_verification !== true
  ) {
    throw new Error(
      `finding[${index}] asserts or recommends a Doris behavior fact without verified evidence; needs_human_verification must be true.`,
    );
  }
}

function validateAiReviewOutput(input) {
  const findings = normalizeFindings(input);
  findings.forEach(validateFinding);
  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error('Usage: node scripts/docs-governance/validate-ai-review-output.js --input <findings.json>');
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  validateAiReviewOutput(fs.readFileSync(inputPath, 'utf8'));
  process.stdout.write('AI review output schema validation passed.\n');
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
  REQUIRED_FIELDS,
  normalizeFindings,
  validateAiReviewOutput,
};
