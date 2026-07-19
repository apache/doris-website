const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { normalizePath } = require('./lib');

function makeFinding(entry, severity, rule, line, message) {
  return {
    severity,
    rule,
    path: entry.source_path,
    line,
    message,
    owner: entry.owner || '@apache/doris-website-maintainers',
  };
}

function isLegacyVersion(version) {
  if (!version || version === 'current') {
    return false;
  }
  const match = String(version).match(/^(\d+)(?:\.(\d+))?/);
  if (!match) {
    return false;
  }
  const major = Number(match[1]);
  const minor = Number(match[2] || 0);
  return major < 2 || (major === 2 && minor <= 1);
}

function severityForEntry(entry) {
  if (isLegacyVersion(entry.version) || entry.blocking_level === 'report_only') {
    return 'info';
  }
  return 'warning';
}

function normalizeHeading(text) {
  return String(text || '')
    .replace(/\s*\{#[^}]+}\s*$/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[：:]+$/g, '')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseMarkdownSections(content) {
  const lines = String(content || '').split(/\r?\n/);
  const headings = [];
  let inFence = false;
  let fenceMarker = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1];
      } else if (fence[1] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }
    if (inFence) {
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!heading) {
      continue;
    }
    headings.push({
      level: heading[1].length,
      title: heading[2].trim(),
      normalizedTitle: normalizeHeading(heading[2]),
      line: index + 1,
      lineIndex: index,
    });
  }

  return headings.map((heading, index) => {
    const nextHeading = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level);
    const endLineIndex = nextHeading ? nextHeading.lineIndex : lines.length;
    return {
      ...heading,
      content: lines.slice(heading.lineIndex + 1, endLineIndex).join('\n'),
    };
  });
}

function findSection(sections, aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeHeading));
  return sections.find((section) => normalizedAliases.has(section.normalizedTitle)) || null;
}

function extractFencedCodeBlocks(content) {
  const lines = String(content || '').split(/\r?\n/);
  const blocks = [];
  let open = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!open) {
      const start = line.match(/^\s*```([^\s`]*)?.*$/);
      if (start) {
        open = {
          lang: (start[1] || '').trim().toLowerCase(),
          startLine: index + 1,
          contentLines: [],
        };
      }
      continue;
    }

    if (/^\s*```\s*$/.test(line)) {
      blocks.push({
        lang: open.lang,
        startLine: open.startLine,
        content: open.contentLines.join('\n'),
      });
      open = null;
      continue;
    }

    open.contentLines.push(line);
  }

  return blocks;
}

function textOutsideFencedCode(content) {
  const lines = String(content || '').split(/\r?\n/);
  const kept = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) {
      kept.push(line);
    }
  }

  return kept.join('\n');
}

function normalizeTableCell(cell) {
  return String(cell || '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .trim()
    .toLowerCase();
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(normalizeTableCell);
}

function isTableSeparator(line) {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function hasMarkdownTableWithColumns(content, columnAliasGroups) {
  const lines = textOutsideFencedCode(content).split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].includes('|') || !lines[index + 1].includes('|') || !isTableSeparator(lines[index + 1])) {
      continue;
    }
    const headers = new Set(tableCells(lines[index]).filter(Boolean));
    const hasColumns = columnAliasGroups.every((aliases) =>
      aliases.map(normalizeTableCell).some((alias) => headers.has(alias)),
    );
    if (hasColumns) {
      return true;
    }
  }
  return false;
}

function filterFindings(findings, changedFiles) {
  if (!changedFiles || changedFiles.length === 0) {
    return findings;
  }
  const changed = new Set(changedFiles.map((filePath) => normalizePath(filePath)));
  return findings.filter((finding) => {
    const findingPath = normalizePath(finding.path || '');
    const related = finding.related_paths || [];
    return (
      changed.has(findingPath) ||
      changed.has(findingPath.replace(/^\.\//, '')) ||
      related.some((relatedPath) => changed.has(normalizePath(relatedPath)))
    );
  });
}

function readMarkdownEntry(rootDir, entry) {
  const absPath = path.join(rootDir, entry.source_path);
  if (!fs.existsSync(absPath)) {
    return null;
  }
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = matter(raw);
  return {
    raw,
    data: parsed.data || {},
    content: parsed.content || '',
  };
}

module.exports = {
  extractFencedCodeBlocks,
  filterFindings,
  findSection,
  hasMarkdownTableWithColumns,
  isLegacyVersion,
  makeFinding,
  normalizeHeading,
  parseMarkdownSections,
  readMarkdownEntry,
  severityForEntry,
  textOutsideFencedCode,
};
