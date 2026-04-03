#!/usr/bin/env node

/**
 * sync-deletions.js
 *
 * 输入：被删除的英文文档路径数组（JSON 文件）
 * 职责：
 * 1. 删除对应的日文翻译文件
 * 2. 从对应版本 sidebars JSON 中移除 doc id
 * 3. 清理空目录与空 category
 */

const fs = require('fs');
const path = require('path');

const SOURCE_MAP = {
  docs: {
    pluginDir: 'docusaurus-plugin-content-docs',
    localeVersion: 'current',
    getSidebarFile: () => 'current.json',
  },
  versioned_docs: {
    pluginDir: 'docusaurus-plugin-content-docs',
    getSidebarFile: (version) => `${version}.json`,
  },
  community: {
    pluginDir: 'docusaurus-plugin-content-docs-community',
    localeVersion: 'current',
    getSidebarFile: () => 'current.json',
  },
};

const [, , deletedFilesJsonPath] = process.argv;

if (!deletedFilesJsonPath) {
  console.error('Usage: node sync-deletions.js <deleted-files.json>');
  process.exit(1);
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function parseDeletedSourcePath(filePath) {
  const normalized = normalizePath(filePath);

  if (normalized.startsWith('docs/')) {
    const conf = SOURCE_MAP.docs;
    const filename = normalized.slice('docs/'.length);
    if (!filename || !/\.(md|mdx)$/i.test(filename)) {
      return null;
    }
    const version = conf.localeVersion;
    const docId = filename.replace(/\.(md|mdx)$/i, '');
    const jaPath = path.join('i18n', 'ja', conf.pluginDir, version, filename);
    const sidebarPath = path.join('i18n', 'ja', conf.pluginDir, conf.getSidebarFile(version));
    return { sourceRoot: 'docs', version, docId, jaPath, sidebarPath };
  }

  if (normalized.startsWith('versioned_docs/')) {
    const conf = SOURCE_MAP.versioned_docs;
    const relative = normalized.slice('versioned_docs/'.length);
    const parts = relative.split('/');
    const version = parts.shift();
    const filename = parts.join('/');
    if (!version || !filename || !/\.(md|mdx)$/i.test(filename)) {
      return null;
    }
    const docId = filename.replace(/\.(md|mdx)$/i, '');
    const jaPath = path.join('i18n', 'ja', conf.pluginDir, version, filename);
    const sidebarPath = path.join('i18n', 'ja', conf.pluginDir, conf.getSidebarFile(version));
    return { sourceRoot: 'versioned_docs', version, docId, jaPath, sidebarPath };
  }

  if (normalized.startsWith('community/')) {
    const conf = SOURCE_MAP.community;
    const filename = normalized.slice('community/'.length);
    if (!filename || !/\.(md|mdx)$/i.test(filename)) {
      return null;
    }
    const version = conf.localeVersion;
    const docId = filename.replace(/\.(md|mdx)$/i, '');
    const jaPath = path.join('i18n', 'ja', conf.pluginDir, version, filename);
    const sidebarPath = path.join('i18n', 'ja', conf.pluginDir, conf.getSidebarFile(version));
    return { sourceRoot: 'community', version, docId, jaPath, sidebarPath };
  }

  return null;
}

function removeEmptyDirsUpward(startDir, stopDir) {
  const stopAbs = path.resolve(stopDir);
  let current = path.resolve(startDir);

  while (current.startsWith(stopAbs) && current !== stopAbs) {
    if (!fs.existsSync(current)) {
      break;
    }

    if (fs.readdirSync(current).length > 0) {
      break;
    }

    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function pruneSidebarItems(items, docId) {
  let removed = false;
  const next = [];

  for (const item of items) {
    if (typeof item === 'string') {
      if (item === docId) {
        removed = true;
        continue;
      }
      next.push(item);
      continue;
    }

    if (!item || typeof item !== 'object') {
      next.push(item);
      continue;
    }

    if (item.type === 'doc' && item.id === docId) {
      removed = true;
      continue;
    }

    if (Array.isArray(item.items)) {
      const child = pruneSidebarItems(item.items, docId);
      if (child.removed) {
        removed = true;
      }

      if (item.type === 'category' && child.items.length === 0) {
        removed = true;
        continue;
      }

      next.push({
        ...item,
        items: child.items,
      });
      continue;
    }

    next.push(item);
  }

  return { items: next, removed };
}

function removeDocIdFromSidebar(sidebarPath, docId) {
  if (!fs.existsSync(sidebarPath)) {
    console.warn(`[skip] Sidebar file not found: ${sidebarPath}`);
    return false;
  }

  const sidebar = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
  let changed = false;

  for (const [key, value] of Object.entries(sidebar)) {
    if (!Array.isArray(value)) {
      continue;
    }
    const pruned = pruneSidebarItems(value, docId);
    if (pruned.removed) {
      sidebar[key] = pruned.items;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`, 'utf8');
  }

  return changed;
}

function main() {
  const raw = fs.readFileSync(deletedFilesJsonPath, 'utf8');
  const deletedFiles = JSON.parse(raw);

  if (!Array.isArray(deletedFiles)) {
    throw new Error('deleted-files.json must be a JSON array of file paths');
  }

  const normalizedUnique = Array.from(
    new Set(deletedFiles.map((p) => normalizePath(String(p))).filter(Boolean))
  );

  let jaDeletedCount = 0;
  let sidebarUpdatedCount = 0;

  for (const sourcePath of normalizedUnique) {
    const parsed = parseDeletedSourcePath(sourcePath);
    if (!parsed) {
      console.warn(`[skip] Unsupported deleted source path: ${sourcePath}`);
      continue;
    }

    if (fs.existsSync(parsed.jaPath)) {
      fs.unlinkSync(parsed.jaPath);
      removeEmptyDirsUpward(path.dirname(parsed.jaPath), path.join('i18n', 'ja'));
      jaDeletedCount += 1;
      console.log(`[ja] deleted: ${parsed.jaPath}`);
    } else {
      console.log(`[ja] not found (already absent): ${parsed.jaPath}`);
    }

    if (removeDocIdFromSidebar(parsed.sidebarPath, parsed.docId)) {
      sidebarUpdatedCount += 1;
      console.log(`[sidebar] removed docId "${parsed.docId}" from ${parsed.sidebarPath}`);
    } else {
      console.log(`[sidebar] docId "${parsed.docId}" not present in ${parsed.sidebarPath}`);
    }
  }

  console.log(
    `Done. jaDeletedCount=${jaDeletedCount}, sidebarUpdatedCount=${sidebarUpdatedCount}, deletedSources=${normalizedUnique.length}`
  );
}

main();
