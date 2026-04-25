#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ensureDirForFile, parseArgs } = require('./lib');

const MARKER = '<!-- docs-ai-review:packet -->';
const DEFAULT_MAX_FINDINGS = 25;
const SEVERITY_ORDER = {
  error: 0,
  warning: 1,
  info: 2,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function shortSha(sha) {
  return sha ? String(sha).slice(0, 12) : 'unknown';
}

function inlineCode(value) {
  const normalized = value === undefined || value === null || value === '' ? 'unknown' : value;
  return `\`${String(normalized).replace(/`/g, '\\`')}\``;
}

function countBySeverity(findings, summary = {}) {
  const fromSummary = summary.by_severity || {};
  return {
    error: fromSummary.error || findings.filter((finding) => finding.severity === 'error').length,
    warning: fromSummary.warning || findings.filter((finding) => finding.severity === 'warning').length,
    info: fromSummary.info || findings.filter((finding) => finding.severity === 'info').length,
  };
}

function sortFindings(findings) {
  return [...findings].sort((left, right) => {
    const severity = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severity !== 0) {
      return severity;
    }
    const pathCompare = String(left.path || '').localeCompare(String(right.path || ''));
    if (pathCompare !== 0) {
      return pathCompare;
    }
    const lineCompare = (left.line || 0) - (right.line || 0);
    if (lineCompare !== 0) {
      return lineCompare;
    }
    return String(left.rule || '').localeCompare(String(right.rule || ''));
  });
}

function suggestActionForFinding(finding) {
  const rule = String(finding.rule || '');

  if (rule.startsWith('sql-function-')) {
    return 'Update the SQL function page so it follows the required function documentation structure, examples, return type, and NULL-handling coverage.';
  }
  if (rule.startsWith('feature-doc-')) {
    return 'Complete the feature page with overview, basic usage, options, realistic examples, caveats, and best practices where applicable.';
  }
  if (rule.startsWith('i18n-sync-')) {
    return 'Update the current, versioned, and localized counterpart pages consistently, or document why this change is intentionally asymmetric.';
  }
  if (rule.startsWith('link-')) {
    return 'Fix the target path, heading anchor, inbound reference, or redirect so readers do not hit broken navigation.';
  }
  if (rule.startsWith('sidebar-')) {
    return 'Update the sidebar/navigation entry so it matches the actual document path and intended information architecture.';
  }
  if (rule.startsWith('frontmatter-')) {
    return 'Correct the Docusaurus front matter metadata so the page renders, routes, and appears in search correctly.';
  }
  if (rule.startsWith('markdown-')) {
    return 'Fix the Markdown structure so headings, code fences, and document hierarchy are unambiguous.';
  }
  if (rule.startsWith('seo-')) {
    return 'Improve the SEO/GEO metadata or search policy so users and AI answer engines get clear page context.';
  }

  return 'Review the finding and update the affected documentation so the reader experience remains complete and unambiguous.';
}

function formatFinding(finding, index) {
  const severity = String(finding.severity || 'warning').toUpperCase();
  const location = finding.line ? `${finding.path}:${finding.line}` : finding.path;
  const lines = [
    `${index}. **${severity}** ${inlineCode(location)} - ${inlineCode(finding.rule)}`,
    `   - Problem: ${finding.message || 'No finding message provided.'}`,
    `   - Fix: ${suggestActionForFinding(finding)}`,
  ];

  if (finding.related_paths && finding.related_paths.length) {
    lines.push(`   - Related: ${finding.related_paths.map(inlineCode).join(', ')}`);
  }
  if (finding.owner) {
    lines.push(`   - Owner: ${finding.owner}`);
  }

  return lines.join('\n');
}

function formatLimitedList(values, limit = 10) {
  const uniqueValues = [...new Set(values.filter(Boolean))];
  const shown = uniqueValues.slice(0, limit);
  const lines = shown.map((value) => `- ${inlineCode(value)}`);
  if (uniqueValues.length > shown.length) {
    lines.push(`- ... ${uniqueValues.length - shown.length} more`);
  }
  return lines;
}

function renderDocsAiReviewComment(options = {}) {
  const packet = options.packet || {};
  const report = options.report || {};
  const findings = sortFindings(Array.isArray(report.findings) ? report.findings : []);
  const maxFindings = Number.isFinite(options.maxFindings) ? options.maxFindings : DEFAULT_MAX_FINDINGS;
  const shownFindings = findings.slice(0, maxFindings);
  const severityCounts = countBySeverity(findings, report.summary);
  const changedFiles = Array.isArray(packet.changed_files) ? packet.changed_files : [];
  const highRisk = packet.high_risk || {};
  const highRiskMatches = Array.isArray(highRisk.matched_paths) ? highRisk.matched_paths : [];
  const reviewAgents = Array.isArray(packet.review_agents) ? packet.review_agents : [];
  const syncGroups = Array.isArray(packet.sync_groups) ? packet.sync_groups : [];

  const lines = [
    MARKER,
    '## Docs AI Review',
    '',
    'Changed-file docs review results for this PR.',
    '',
    '### Summary',
    `- Trigger: ${inlineCode('/review-docs')}`,
    `- Changed files reviewed: ${inlineCode(changedFiles.length)}`,
    `- Findings: ${inlineCode(findings.length)} (${severityCounts.error} error, ${severityCounts.warning} warning, ${severityCounts.info} info)`,
    `- High-risk docs path matched: ${inlineCode(Boolean(highRisk.required))}`,
    `- Review agents in packet: ${inlineCode(reviewAgents.length)}`,
    `- Sync groups in packet: ${inlineCode(syncGroups.length)}`,
    `- Base SHA: ${inlineCode(shortSha(options.baseSha))}`,
    `- Head SHA: ${inlineCode(shortSha(options.headSha))}`,
    '',
    '### Findings to fix',
  ];

  if (shownFindings.length) {
    lines.push(...shownFindings.map((finding, index) => formatFinding(finding, index + 1)));
    if (findings.length > shownFindings.length) {
      lines.push('', `_${findings.length - shownFindings.length} additional findings are not shown. Check the docs governance job output for the full list._`);
    }
  } else {
    lines.push('No changed-file governance findings were produced. Review the high-risk scope and sync groups below before merging.');
  }

  if (highRiskMatches.length) {
    lines.push(
      '',
      '### High-risk scope',
      ...formatLimitedList(highRiskMatches.map((match) => `${match.path} (${match.rule})`)),
    );
  }

  if (syncGroups.length) {
    lines.push(
      '',
      '### Sync groups to verify',
      ...formatLimitedList(syncGroups.map((group) => group.sync_group_id)),
    );
  }

  lines.push(
    '',
    '### Next steps',
    '- Fix the findings above, especially errors and warnings.',
    '- Confirm current, active versioned, and localized docs stay aligned when the same topic is changed.',
    '- Re-run `/review-docs` after updating the PR.',
    '',
    'AI review output is advisory. Deterministic governance CI remains the blocking signal.',
  );

  return `${lines.join('\n')}\n`;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.packet || !args.report) {
    throw new Error('Usage: node scripts/docs-governance/render-ai-review-comment.js --packet <packet.json> --report <report.json> [--output <comment.md>]');
  }

  const packet = readJson(path.resolve(process.cwd(), args.packet));
  const report = readJson(path.resolve(process.cwd(), args.report));
  const maxFindings = args['max-findings'] ? Number(args['max-findings']) : DEFAULT_MAX_FINDINGS;
  const comment = renderDocsAiReviewComment({
    packet,
    report,
    baseSha: args['base-sha'],
    headSha: args['head-sha'],
    maxFindings,
  });

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, comment, 'utf8');
  } else {
    process.stdout.write(comment);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  MARKER,
  renderDocsAiReviewComment,
  suggestActionForFinding,
};
