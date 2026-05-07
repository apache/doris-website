#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const {
  ensureDirForFile,
  normalizePath,
  parseArgs,
  stripMarkdownExtension,
  walkMarkdownFiles,
} = require('../docs-governance/lib');

const DOCS_DIR = 'docs-next/key-features';
const DOCS_ROUTE_BASE = '/docs-next/dev';
const OUTPUT_FILE = 'src/generated/key-features.ts';
const VALID_SPANS = new Set(['s', 'm', 'l', 't']);

function slugToRoute(slug, fallbackSlug) {
  const raw = typeof slug === 'string' && slug.trim() ? slug.trim() : fallbackSlug;
  const normalized = raw.replace(/^\/+/, '/').replace(/\/+$/, '');
  return normalized === '/' ? '/' : normalized;
}

function resolveHref(frontMatter, docsRelativePath) {
  const fallbackSlug = `/${stripMarkdownExtension(docsRelativePath)}`;
  const routeSlug = slugToRoute(frontMatter.slug, fallbackSlug);
  return `${DOCS_ROUTE_BASE}${routeSlug}`;
}

function normalizeTags(value, sourcePath) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Missing featureCard.tags in ${sourcePath}`);
  }
  return value.map((tag) => {
    if (typeof tag !== 'string' || !tag.trim()) {
      throw new Error(`Invalid featureCard.tags entry in ${sourcePath}`);
    }
    return tag.trim();
  });
}

function normalizeSpan(value) {
  if (value === undefined || value === null || value === '') {
    return 'm';
  }
  if (typeof value !== 'string' || !VALID_SPANS.has(value)) {
    throw new Error(`Invalid featureCard.span value "${value}"`);
  }
  return value;
}

function normalizeOrder(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid featureCard.order value "${value}"`);
  }
  return parsed;
}

function parseFeatureDoc(rootDir, absPath, index) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const featureCard = data.featureCard || {};
  const relativePath = normalizePath(path.relative(rootDir, absPath));
  const docsRelativePath = normalizePath(path.relative(path.join(rootDir, 'docs-next'), absPath));
  const sourcePath = relativePath;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';

  if (!title) {
    throw new Error(`Missing required front matter field "title" in ${sourcePath}`);
  }
  if (!description) {
    throw new Error(`Missing required front matter field "description" in ${sourcePath}`);
  }

  const href = resolveHref(data, docsRelativePath);
  const id = stripMarkdownExtension(docsRelativePath).replace(/\//g, '-');
  return {
    id,
    title,
    description,
    tags: normalizeTags(featureCard.tags, sourcePath),
    span: normalizeSpan(featureCard.span),
    href,
    order: normalizeOrder(featureCard.order, (index + 1) * 10),
    sourcePath,
  };
}

function generate({ rootDir = process.cwd(), output = OUTPUT_FILE } = {}) {
  const absDocsDir = path.join(rootDir, DOCS_DIR);
  if (!fs.existsSync(absDocsDir)) {
    throw new Error(`Missing docs directory: ${DOCS_DIR}`);
  }

  const files = walkMarkdownFiles(rootDir, [DOCS_DIR]);
  const cards = files.map((absPath, index) => parseFeatureDoc(rootDir, absPath, index));
  cards.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title) || a.href.localeCompare(b.href));

  const seenIds = new Set();
  const seenHref = new Set();
  for (const card of cards) {
    if (seenIds.has(card.id)) {
      throw new Error(`Duplicate key-features id: ${card.id}`);
    }
    if (seenHref.has(card.href)) {
      throw new Error(`Duplicate key-features href: ${card.href}`);
    }
    seenIds.add(card.id);
    seenHref.add(card.href);
  }

  const outputPath = path.resolve(rootDir, output);
  ensureDirForFile(outputPath);
  const file = `/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY. */
export type KeyFeatureCard = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  span: 's' | 'm' | 'l' | 't';
  href: string;
  order: number;
};

export const keyFeatureCards: KeyFeatureCard[] = ${JSON.stringify(
    cards.map(({ sourcePath, ...card }) => card),
    null,
    2,
  )};
`;
  fs.writeFileSync(outputPath, `${file}\n`, 'utf8');
  return cards;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(process.cwd(), args.root) : process.cwd();
  const output = args.output || OUTPUT_FILE;
  generate({ rootDir, output });
}

if (require.main === module) {
  runCli();
}

module.exports = {
  generate,
};
