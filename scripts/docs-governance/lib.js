const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DOC_SUFFIX_RE = /\.(md|mdx)$/i;

const DEFAULT_ACTIVE_VERSIONS = ['4.x', '3.x', '2.1', 'current'];
const DEFAULT_ARCHIVED_VERSIONS = ['2.0', '1.2'];
const DEFAULT_VERSION = '4.x';
const CURRENT_ROUTE_VERSION = 'dev';

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function toPosixPath(filePath) {
  return normalizePath(filePath.split(path.sep).join('/'));
}

function stripMarkdownExtension(filePath) {
  return filePath.replace(DOC_SUFFIX_RE, '');
}

function isMarkdownFile(filePath) {
  return DOC_SUFFIX_RE.test(filePath);
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readYamlIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || fallback;
}

function loadRules(rootDir) {
  const rules = readYamlIfExists(path.join(rootDir, '.docs-governance', 'rules.yml'), {});
  const versionsJson = path.join(rootDir, 'versions.json');
  const activeVersions = fs.existsSync(versionsJson)
    ? JSON.parse(fs.readFileSync(versionsJson, 'utf8'))
    : rules?.versions?.active || DEFAULT_ACTIVE_VERSIONS;

  return {
    raw: rules,
    activeVersions,
    archivedVersions: rules?.versions?.archived || DEFAULT_ARCHIVED_VERSIONS,
    defaultVersion: rules?.versions?.default_version || DEFAULT_VERSION,
    currentRouteVersion: rules?.versions?.current_route_version || CURRENT_ROUTE_VERSION,
    docTypeRules: rules?.doc_type_detection?.ordered_rules || [],
  };
}

function loadOwners(rootDir) {
  const owners = readYamlIfExists(path.join(rootDir, '.docs-governance', 'owners.yml'), {});
  return {
    defaultOwner: owners.default_owner || '@apache/doris-website-maintainers',
    owners: owners.owners || [],
  };
}

function loadExceptions(rootDir) {
  const exceptions = readYamlIfExists(path.join(rootDir, '.docs-governance', 'exceptions.yml'), {});
  return exceptions.exceptions || [];
}

function walkFiles(rootDir, predicate = () => true) {
  const result = [];

  function visit(current) {
    if (!fs.existsSync(current)) {
      return;
    }
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current).sort()) {
        if (entry === 'node_modules' || entry === '.git' || entry === 'build') {
          continue;
        }
        visit(path.join(current, entry));
      }
      return;
    }
    if (stat.isFile() && predicate(current)) {
      result.push(current);
    }
  }

  visit(rootDir);
  return result;
}

function walkMarkdownFiles(rootDir, roots) {
  const result = [];
  for (const root of roots) {
    const absRoot = path.join(rootDir, root);
    const files = walkFiles(absRoot, (filePath) => isMarkdownFile(filePath));
    result.push(...files);
  }
  return result;
}

function globToRegExp(glob) {
  let source = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    const next = glob[i + 1];
    if (char === '*' && next === '*') {
      source += '.*';
      i += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  source += '$';
  return new RegExp(source);
}

function matchesGlob(filePath, glob) {
  return globToRegExp(glob).test(normalizePath(filePath));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function getChangedFiles(rootDir) {
  const { execSync } = require('child_process');
  if (!process.env.GITHUB_BASE_REF) {
    return execSync('git diff --name-only HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const baseRef = `origin/${process.env.GITHUB_BASE_REF}`;
  try {
    const base = execSync(`git merge-base ${baseRef} HEAD`, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return execSync(`git diff --name-only ${base} HEAD`, {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } catch (err) {
    return execSync('git diff --name-only HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

module.exports = {
  DEFAULT_ACTIVE_VERSIONS,
  DEFAULT_ARCHIVED_VERSIONS,
  DEFAULT_VERSION,
  CURRENT_ROUTE_VERSION,
  DOC_SUFFIX_RE,
  ensureDirForFile,
  fileExists,
  getChangedFiles,
  isMarkdownFile,
  loadExceptions,
  loadOwners,
  loadRules,
  matchesGlob,
  normalizePath,
  parseArgs,
  stripMarkdownExtension,
  toPosixPath,
  walkFiles,
  walkMarkdownFiles,
};
