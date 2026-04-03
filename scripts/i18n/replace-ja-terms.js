#!/usr/bin/env node
/**
 * Replace specific English terms in Japanese docs with preferred Japanese terms,
 * while skipping fenced code blocks and inline code.
 *
 * Usage:
 *   node scripts/i18n/replace-ja-terms.js <targetDir>
 */
const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node scripts/i18n/replace-ja-terms.js <targetDir>');
  process.exit(1);
}

function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Glossary mapping sourced from the provided screenshot.
 * Keep keys exact/case-sensitive; we apply word-boundary matching for single words.
 */
const replacements = [
  // Phrases
  { from: 'Constraints and Limitations', to: '制約と制限', kind: 'phrase' },
  { from: 'Log Storage and Analysis', to: 'ログ分析', kind: 'phrase' },
  { from: 'Data Write-back', to: 'データ書き戻し', kind: 'phrase' },
  { from: 'Query Acceleration', to: 'クエリ加速', kind: 'phrase' },
  { from: 'Supported Operations in Hive', to: 'Hiveでサポートされている操作', kind: 'phrase' },
  { from: 'Supported Hive Versions', to: 'サポートされるHiveバージョン', kind: 'phrase' },
  { from: 'Concurrent Writing Mechanism', to: '同時書込みメカニズム', kind: 'phrase' },
  { from: 'Transactional Mechanism', to: 'トランザクション', kind: 'phrase' },
  { from: 'On This Page', to: 'このページで', kind: 'phrase' },
  { from: 'Branch and Tag', to: 'ブランチとタグ', kind: 'phrase' },
  { from: 'Write operations', to: '書き込み操作', kind: 'phrase' },
  { from: 'Schema changes', to: 'スキーマ変更', kind: 'phrase' },
  { from: 'Time zone', to: 'タイムゾーン', kind: 'phrase' },
  { from: 'Default value', to: 'デフォルト値', kind: 'phrase' },
  { from: 'Parameter Name', to: 'パラメータ名', kind: 'phrase' },
  { from: 'Parameter Type', to: 'パラメータ型', kind: 'phrase' },
  { from: 'Format Name', to: 'フォーマット名', kind: 'phrase' },
  { from: 'Filter Predicate Pushdown', to: 'フィルタ述語プッシュダウン', kind: 'phrase' },
  { from: 'Driver Package Security', to: 'ドライバーパッケージセキュリティ', kind: 'phrase' },
  { from: 'Permission Policies', to: '権限ポリシー', kind: 'phrase' },
  { from: 'Data Preparation', to: 'データ準備', kind: 'phrase' },
  { from: 'Data Insertion and Storage', to: 'データの挿入と保存', kind: 'phrase' },

  // Single words
  { from: 'Overview', to: '概要', kind: 'word' },
  { from: 'Troubleshooting', to: 'トラブルシューティング', kind: 'word' },
  { from: 'Configuration', to: '設定', kind: 'word' },
  { from: 'Kubernetes', to: 'Kubernetes', kind: 'word' },
  { from: 'Lakehouse', to: 'レイクハウス', kind: 'word' },
  { from: 'Catalog', to: 'カタログ', kind: 'word' },
  { from: 'Properties', to: 'プロパティ', kind: 'word' },
  { from: 'Appendix', to: '付録', kind: 'word' },
  { from: 'Operations', to: '操作', kind: 'word' },
  { from: 'Description', to: '詳細', kind: 'word' },
  { from: 'Scenario', to: 'シナリオ', kind: 'word' },
  { from: 'Type', to: 'タイプ', kind: 'word' },
  { from: 'Comment', to: 'コメント', kind: 'word' },
  { from: 'Update', to: 'アップデート', kind: 'word' },
  { from: 'Cluster', to: 'クラスター', kind: 'word' },
  { from: 'Integration', to: '統合', kind: 'word' },
  { from: 'Permissions', to: '許可', kind: 'word' },
  { from: 'Authentication', to: '認証', kind: 'word' },
  { from: 'Notes', to: '注', kind: 'word' },
  { from: 'Summary', to: 'まとめ', kind: 'word' },
  { from: 'Sample', to: 'サンプル', kind: 'word' },
  { from: 'Partition', to: 'パーティション', kind: 'word' },
  { from: 'Bucket', to: 'バケット', kind: 'word' },
  { from: 'Server', to: 'サーバー', kind: 'word' },
  { from: 'Agent', to: 'エージェント', kind: 'word' },
  { from: 'Compact', to: 'コンパクション', kind: 'word' },
  { from: 'Strategy', to: 'ストラテジー', kind: 'word' },
  { from: 'Table', to: 'table', kind: 'word' },
];

const compiled = replacements
  .slice()
  .sort((a, b) => b.from.length - a.from.length)
  .map(({ from, to, kind }) => {
    const pattern =
      kind === 'word'
        ? new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g')
        : new RegExp(escapeRegExp(from), 'g');
    return { from, to, pattern };
  });

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md') || filePath.endsWith('.mdx');
}

function replaceOutsideInlineCode(line, replacer) {
  let out = '';
  let i = 0;
  let inCode = false;
  let codeDelimiterLen = 0;

  while (i < line.length) {
    if (line[i] === '`') {
      let j = i;
      while (j < line.length && line[j] === '`') j++;
      const runLen = j - i;

      if (!inCode) {
        inCode = true;
        codeDelimiterLen = runLen;
      } else if (runLen === codeDelimiterLen) {
        inCode = false;
        codeDelimiterLen = 0;
      }

      out += line.slice(i, j);
      i = j;
      continue;
    }

    let j = i;
    while (j < line.length && line[j] !== '`') j++;
    const chunk = line.slice(i, j);
    out += inCode ? chunk : replacer(chunk);
    i = j;
  }

  return out;
}

function replaceOutsideInlineCodeAndTags(line, replacer) {
  let out = '';
  let i = 0;
  let inCode = false;
  let codeDelimiterLen = 0;

  while (i < line.length) {
    const ch = line[i];

    if (ch === '`') {
      let j = i;
      while (j < line.length && line[j] === '`') j++;
      const runLen = j - i;

      if (!inCode) {
        inCode = true;
        codeDelimiterLen = runLen;
      } else if (runLen === codeDelimiterLen) {
        inCode = false;
        codeDelimiterLen = 0;
      }

      out += line.slice(i, j);
      i = j;
      continue;
    }

    if (!inCode && ch === '<') {
      const next = line[i + 1];
      // Treat MDX/HTML tag markup as code-like and skip replacements inside it.
      if (next && /[A-Za-z/!]/.test(next)) {
        let j = i + 1;
        let quote = null;
        while (j < line.length) {
          const c = line[j];
          if (quote) {
            if (c === quote) quote = null;
            j++;
            continue;
          }
          if (c === '"' || c === "'") {
            quote = c;
            j++;
            continue;
          }
          if (c === '>') {
            j++;
            break;
          }
          j++;
        }
        out += line.slice(i, j);
        i = j;
        continue;
      }

      // Not a tag (e.g. comparison operator). Emit as-is to avoid infinite loop.
      out += ch;
      i++;
      continue;
    }

    let j = i;
    if (inCode) {
      while (j < line.length && line[j] !== '`') j++;
    } else {
      while (j < line.length && line[j] !== '`' && line[j] !== '<') j++;
    }
    const chunk = line.slice(i, j);
    out += inCode ? chunk : replacer(chunk);
    i = j;
  }

  return out;
}

function applyReplacements(text) {
  const lines = text.split('\n');
  let inFence = false;
  let fenceChar = null; // ` or ~
  let fenceLen = 0;
  let changed = false;

  const outLines = lines.map((line) => {
    if (!inFence) {
      // CommonMark: opening fence can be indented up to 3 spaces and may include an info string.
      const m = line.match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
      if (m) {
        inFence = true;
        fenceChar = m[2][0];
        fenceLen = m[2].length;
        return line;
      }
    } else {
      // Closing fence: up to 3 spaces, same fence char, length >= opening, and no info string.
      const m = line.match(/^( {0,3})(`{3,}|~{3,})\\s*$/);
      if (m && m[2][0] === fenceChar && m[2].length >= fenceLen) {
        inFence = false;
        fenceChar = null;
        fenceLen = 0;
      }
      return line;
    }

    const replaced = replaceOutsideInlineCodeAndTags(line, (chunk) => {
      let next = chunk;
      for (const { pattern, to } of compiled) next = next.replace(pattern, to);
      return next;
    });

    if (replaced !== line) changed = true;
    return replaced;
  });

  return { text: outLines.join('\n'), changed };
}

function main() {
  const absTarget = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(process.cwd(), targetDir);

  // Walk iteratively to reduce memory footprint, and show progress for large trees.
  const stack = [absTarget];
  let processed = 0;
  let touched = 0;
  let discoveredMarkdown = 0;

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }

      if (!isMarkdownFile(full)) continue;
      discoveredMarkdown++;

      const raw = fs.readFileSync(full, 'utf8');
      const { text, changed } = applyReplacements(raw);
      if (changed) {
        fs.writeFileSync(full, text, 'utf8');
        touched++;
      }

      processed++;
      if (processed % 200 === 0) {
        console.log(`Processed: ${processed} files (changed: ${touched})`);
      }
    }
  }

  console.log(`Updated files: ${touched}/${discoveredMarkdown}`);
}

main();
