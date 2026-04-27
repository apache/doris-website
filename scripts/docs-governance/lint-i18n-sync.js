#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');
const {
  ensureDirForFile,
  getChangedFiles,
  loadExceptions,
  normalizePath,
  parseArgs,
} = require('./lib');

const STRONG_SYNC_VERSIONS = new Set(['current', '4.x']);
const CANDIDATE_VERSION = '3.x';
const SUPPORTED_SYNC_VERSIONS = new Set(['current', '4.x', CANDIDATE_VERSION]);
const SUPPORTED_SYNC_LOCALES = new Set(['en', 'zh-CN', 'ja']);

function makeFinding(entry, severity, rule, message, relatedPaths = []) {
  return {
    severity,
    rule,
    path: entry.source_path,
    line: 1,
    message,
    owner: entry.owner || '@apache/doris-website-maintainers',
    related_paths: relatedPaths,
  };
}

function groupEntries(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (entry.plugin !== 'main_docs' || !entry.sync_group_id || !entry.version) {
      continue;
    }
    if (!groups.has(entry.sync_group_id)) {
      groups.set(entry.sync_group_id, []);
    }
    groups.get(entry.sync_group_id).push(entry);
  }
  return groups;
}

function findCounterpart(groupEntriesForDoc, locale, version) {
  return groupEntriesForDoc.find((entry) => entry.locale === locale && entry.version === version) || null;
}

function sourceExtension(entry) {
  const ext = path.posix.extname(entry.source_path);
  return ext || '.md';
}

function expectedCounterpartPath(entry, locale, version) {
  const docPath = `${entry.doc_id}${sourceExtension(entry)}`;
  if (locale === 'en' && version === 'current') {
    return `docs/${docPath}`;
  }
  if (locale === 'en') {
    return `versioned_docs/version-${version}/${docPath}`;
  }
  if (locale === 'zh-CN' && version === 'current') {
    return `i18n/zh-CN/docusaurus-plugin-content-docs/current/${docPath}`;
  }
  if (locale === 'zh-CN') {
    return `i18n/zh-CN/docusaurus-plugin-content-docs/version-${version}/${docPath}`;
  }
  if (locale === 'ja' && version === 'current') {
    return `ja-source/docusaurus-plugin-content-docs/${docPath}`;
  }
  if (locale === 'ja') {
    return `ja-source/docusaurus-plugin-content-docs/version-${version}/${docPath}`;
  }
  return docPath;
}

function hasChangedFilter(changedFiles) {
  return Array.isArray(changedFiles);
}

function changedSetFrom(changedFiles) {
  if (!Array.isArray(changedFiles)) {
    return null;
  }
  return new Set(changedFiles.map((filePath) => normalizePath(filePath)).filter(Boolean));
}

function isChanged(entry, changedSet) {
  return changedSet ? changedSet.has(normalizePath(entry.source_path)) : false;
}

function isSupportedSyncEntry(entry) {
  return SUPPORTED_SYNC_LOCALES.has(entry.locale) && SUPPORTED_SYNC_VERSIONS.has(String(entry.version));
}

function isExpired(exception) {
  if (!exception.expires) {
    return false;
  }
  const expires = new Date(exception.expires);
  if (Number.isNaN(expires.getTime())) {
    return false;
  }
  return expires.getTime() < Date.now();
}

function scopeMatchesEntry(scope, entry) {
  if (!scope || !entry) {
    return true;
  }
  if (scope.sync_group_id && scope.sync_group_id !== entry.sync_group_id) return false;
  if (scope.doc_id && scope.doc_id !== entry.doc_id) return false;
  if (scope.path && normalizePath(scope.path) !== normalizePath(entry.source_path)) return false;
  if (scope.locale && scope.locale !== entry.locale) return false;
  if (scope.version && String(scope.version) !== String(entry.version)) return false;
  return true;
}

function exceptionApplies(exception, entry, counterpart, rule) {
  if (isExpired(exception)) {
    return false;
  }
  const allowedTypes = new Set([
    'i18n_sync',
    'missing_locale',
    'version_difference',
    'locale_difference',
    rule,
  ]);
  if (exception.type && !allowedTypes.has(exception.type)) {
    return false;
  }
  const scope = exception.scope || {};
  return scopeMatchesEntry(scope, entry) || scopeMatchesEntry(scope, counterpart);
}

function hasException(entry, counterpart, rule, exceptions) {
  return exceptions.some((exception) => exceptionApplies(exception, entry, counterpart, rule));
}

function addFinding(findings, entry, counterpart, rule, severity, message, exceptions) {
  if (hasException(entry, counterpart, rule, exceptions)) {
    return;
  }
  const relatedPaths = counterpart ? [counterpart.source_path] : [];
  findings.push(makeFinding(entry, severity, rule, message, relatedPaths));
}

function addMissingLocaleFinding(findings, entry, locale, version, exceptions) {
  const expectedPath = expectedCounterpartPath(entry, locale, version);
  const counterpart = {
    doc_id: entry.doc_id,
    source_path: expectedPath,
    locale,
    version,
    sync_group_id: entry.sync_group_id,
  };
  const rule = 'i18n-sync-locale-missing';
  if (hasException(entry, counterpart, rule, exceptions)) {
    return;
  }
  findings.push(
    makeFinding(
      entry,
      'info',
      rule,
      `${locale} ${version} counterpart is missing for this English doc. Create a companion translation PR or explain the exception in the PR description.`,
      [expectedPath],
    ),
  );
}

function addMissingVersionFinding(findings, entry, version, exceptions) {
  const expectedPath = expectedCounterpartPath(entry, 'en', version);
  const counterpart = {
    doc_id: entry.doc_id,
    source_path: expectedPath,
    locale: 'en',
    version,
    sync_group_id: entry.sync_group_id,
  };
  const rule = 'i18n-sync-version-missing';
  if (hasException(entry, counterpart, rule, exceptions)) {
    return;
  }
  findings.push(
    makeFinding(
      entry,
      'warning',
      rule,
      `English ${entry.version} and ${version} docs are strongly synchronized, but the ${version} counterpart is missing. Add it or explain the version-specific exception in the PR description.`,
      [expectedPath],
    ),
  );
}

function addJapaneseCandidate(findings, entry, groupEntriesForDoc, changedSet, exceptions) {
  const counterpart = findCounterpart(groupEntriesForDoc, 'ja', entry.version);
  if (counterpart && isChanged(counterpart, changedSet)) {
    return;
  }
  const rule = 'i18n-sync-locale-candidate';
  if (hasException(entry, counterpart, rule, exceptions)) {
    return;
  }
  const relatedPaths = counterpart
    ? [counterpart.source_path]
    : [expectedCounterpartPath(entry, 'ja', entry.version)];
  findings.push(
    makeFinding(
      entry,
      'info',
      rule,
      'Japanese docs are report-only. Generate a candidate translation from the changed files and merge it only after human review.',
      relatedPaths,
    ),
  );
}

function checkEnglishEntry({ entry, groupEntriesForDoc, changedSet, changedOnly, exceptions, findings }) {
  if (!STRONG_SYNC_VERSIONS.has(entry.version)) {
    if (changedOnly && entry.version === CANDIDATE_VERSION) {
      const current = findCounterpart(groupEntriesForDoc, 'en', 'current');
      if (current && !isChanged(current, changedSet)) {
        addFinding(
          findings,
          entry,
          current,
          'i18n-sync-version-candidate',
          'info',
          '3.x docs are non-blocking candidates. Confirm whether this change should also be reflected in current docs.',
          exceptions,
        );
      }
      const zhEntry = findCounterpart(groupEntriesForDoc, 'zh-CN', entry.version);
      if (zhEntry && !isChanged(zhEntry, changedSet)) {
        addFinding(
          findings,
          entry,
          zhEntry,
          'i18n-sync-locale-counterpart',
          'info',
          'Chinese 3.x counterpart exists. Confirm whether the change is supported in 3.x before leaving it unsynced.',
          exceptions,
        );
      } else if (!zhEntry) {
        addMissingLocaleFinding(findings, entry, 'zh-CN', entry.version, exceptions);
      }
      addJapaneseCandidate(findings, entry, groupEntriesForDoc, changedSet, exceptions);
    }
    return;
  }

  const pairedVersion = entry.version === 'current' ? '4.x' : 'current';
  const pairedEntry = findCounterpart(groupEntriesForDoc, 'en', pairedVersion);
  if (changedOnly) {
    if (pairedEntry && !isChanged(pairedEntry, changedSet)) {
      addFinding(
        findings,
        entry,
        pairedEntry,
        'i18n-sync-version-counterpart',
        'warning',
        `English ${entry.version} and ${pairedVersion} docs are strongly synchronized. Update the counterpart or explain the version-specific exception in the PR description.`,
        exceptions,
      );
    } else if (!pairedEntry) {
      addMissingVersionFinding(findings, entry, pairedVersion, exceptions);
    }
  }

  const zhEntry = findCounterpart(groupEntriesForDoc, 'zh-CN', entry.version);
  if (zhEntry) {
    if (changedOnly && !isChanged(zhEntry, changedSet)) {
      addFinding(
        findings,
        entry,
        zhEntry,
        'i18n-sync-locale-counterpart',
        'warning',
        `Chinese ${entry.version} counterpart exists but is not part of this change. Update it or explain why a companion translation PR is needed.`,
        exceptions,
      );
    }
  } else {
    addMissingLocaleFinding(findings, entry, 'zh-CN', entry.version, exceptions);
  }

  const candidate3x = findCounterpart(groupEntriesForDoc, 'en', CANDIDATE_VERSION);
  if (changedOnly && candidate3x && candidate3x.source_path !== entry.source_path && !isChanged(candidate3x, changedSet)) {
    addFinding(
      findings,
      entry,
      candidate3x,
      'i18n-sync-version-candidate',
      'info',
      'A 3.x counterpart exists. Confirm whether the change is supported in 3.x before leaving it unsynced.',
      exceptions,
    );
  }

  if (changedOnly) {
    addJapaneseCandidate(findings, entry, groupEntriesForDoc, changedSet, exceptions);
  }
}

function checkLocalizedEntry({ entry, groupEntriesForDoc, changedSet, changedOnly, exceptions, findings }) {
  if (!changedOnly) {
    return;
  }

  if (entry.locale === 'ja') {
    const source = findCounterpart(groupEntriesForDoc, 'en', 'current');
    if (source && !isChanged(source, changedSet)) {
      addFinding(
        findings,
        entry,
        source,
        'i18n-sync-source-counterpart',
        'info',
        'Japanese docs are report-only. Confirm the English source remains accurate before merging translation changes.',
        exceptions,
      );
    }
    return;
  }

  if (entry.locale !== 'zh-CN') {
    return;
  }

  const source = findCounterpart(groupEntriesForDoc, 'en', entry.version)
    || findCounterpart(groupEntriesForDoc, 'en', 'current');
  if (!source || isChanged(source, changedSet)) {
    return;
  }

  addFinding(
    findings,
    entry,
    source,
    'i18n-sync-source-counterpart',
    entry.version === CANDIDATE_VERSION ? 'info' : 'warning',
    'Chinese docs changed without the English source counterpart. Confirm whether the English source also needs to be updated, or explain the locale-only reason in the PR description.',
    exceptions,
  );
}

function selectedEntriesForLint(entries, changedFiles) {
  if (!hasChangedFilter(changedFiles)) {
    return entries;
  }
  const changedSet = changedSetFrom(changedFiles);
  return entries.filter((entry) => changedSet.has(normalizePath(entry.source_path)));
}

function lintI18nSync(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const changedFiles = options.changedFiles || null;
  const changedOnly = hasChangedFilter(changedFiles);
  const changedSet = changedSetFrom(changedFiles);
  const exceptions = options.exceptions || loadExceptions(rootDir);
  const entries = manifest.entries.filter(
    (entry) => entry.plugin === 'main_docs' && entry.version && !entry.is_archived && isSupportedSyncEntry(entry),
  );
  const groups = groupEntries(entries);
  const selectedEntries = selectedEntriesForLint(entries, changedFiles);
  const findings = [];

  for (const entry of selectedEntries) {
    const groupEntriesForDoc = groups.get(entry.sync_group_id) || [];
    if (entry.locale === 'en') {
      checkEnglishEntry({
        entry,
        groupEntriesForDoc,
        changedSet,
        changedOnly,
        exceptions,
        findings,
      });
    } else {
      checkLocalizedEntry({
        entry,
        groupEntriesForDoc,
        changedSet,
        changedOnly,
        exceptions,
        findings,
      });
    }
  }

  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir });
  const findings = lintI18nSync({ rootDir, manifest, changedFiles });
  const output = JSON.stringify({ schema_version: 1, findings }, null, 2);

  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  } else {
    process.stdout.write(`${output}\n`);
  }

  if (args['fail-on-findings'] && findings.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  expectedCounterpartPath,
  lintI18nSync,
};
