#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const targetTokenizeFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "client",
  "client",
  "utils",
  "tokenize.js"
);

const targetBuildIndexFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "server",
  "server",
  "utils",
  "buildIndex.js"
);

const targetSearchBarFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "client",
  "client",
  "theme",
  "SearchBar",
  "SearchBar.jsx"
);

const targetPostBuildFactoryFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "server",
  "server",
  "utils",
  "postBuildFactory.js"
);

const targetSearchPageFile = path.join(
  process.cwd(),
  "node_modules",
  "@yang1666204",
  "docusaurus-search-local",
  "dist",
  "client",
  "client",
  "theme",
  "SearchPage",
  "SearchPage.jsx"
);

function patchTokenizeContent(content) {
  if (content.includes("const hasJapaneseKana = /[\\u3040-\\u30ff]/u.test(text);")) {
    return content;
  }

  const needle =
    '    // Some languages have their own tokenizer.\n' +
    '    if (language.length === 1 && ["ja", "jp", "th"].includes(language[0])) {\n' +
    "        return lunr[language[0]]\n" +
    "            .tokenizer(text)\n" +
    "            .map((token) => token.toString());\n" +
    "    }\n";

  const replacement =
    '    // For Japanese queries (especially kana), use Japanese tokenizer even in multi-language mode.\n' +
    '    // This avoids dropping tokens like "データベース" when language includes "zh".\n' +
    '    const hasJapaneseKana = /[\\u3040-\\u30ff]/u.test(text);\n' +
    '    if (hasJapaneseKana && (language.includes("ja") || language.includes("jp"))) {\n' +
    '        const jaTokenizer = lunr.ja?.tokenizer || lunr.jp?.tokenizer;\n' +
    "        if (typeof jaTokenizer === \"function\") {\n" +
    "            return jaTokenizer(text).map((token) => token.toString());\n" +
    "        }\n" +
    "    }\n" +
    '    // Some languages have their own tokenizer.\n' +
    '    if (language.length === 1 && ["ja", "jp", "th"].includes(language[0])) {\n' +
    "        return lunr[language[0]]\n" +
    "            .tokenizer(text)\n" +
    "            .map((token) => token.toString());\n" +
    "    }\n";

  if (!content.includes(needle)) {
    return null;
  }
  return content.replace(needle, replacement);
}

function patchBuildIndexContent(content) {
  if (content.includes("For zh+ja mixed mode, choose tokenizer by input text.")) {
    return content;
  }

  const needle =
    "            // Override tokenizer when language `zh` is enabled.\n" +
    '            if (language.includes("zh")) {\n' +
    "                this.tokenizer = lunr_1.default.zh.tokenizer;\n" +
    "            }\n";

  const replacement =
    "            // Override tokenizer when language `zh` is enabled.\n" +
    "            // For zh+ja mixed mode, choose tokenizer by input text.\n" +
    '            if (language.includes("zh")) {\n' +
    '                const hasJa = language.includes("ja") || language.includes("jp");\n' +
    "                if (hasJa) {\n" +
    "                    this.tokenizer = function (input, metadata) {\n" +
    '                        if (input == null) return [];\n' +
    "                        const text = input.toString();\n" +
    '                        if (/[\\u3040-\\u30ff]/u.test(text) && lunr_1.default.ja?.tokenizer) {\n' +
    "                            return lunr_1.default.ja.tokenizer(input, metadata);\n" +
    "                        }\n" +
    "                        return lunr_1.default.zh.tokenizer(input, metadata);\n" +
    "                    };\n" +
    "                }\n" +
    "                else {\n" +
    "                    this.tokenizer = lunr_1.default.zh.tokenizer;\n" +
    "                }\n" +
    "            }\n";

  if (!content.includes(needle)) {
    return null;
  }
  return content.replace(needle, replacement);
}

// On non-default-locale routes (e.g. /zh-CN/docs/..., /ja/docs/...) the
// plugin strips only `baseUrl` before matching `searchContextByPaths`, so the
// remaining URI keeps the locale prefix and never matches `docs`.
// Combined with `useAllContextsWithNoSearchContext: true`, this collapses the
// search back to the root index (which contains every version, including the
// retired v4.x). These two patches strip the non-default locale prefix in both
// the runtime SearchBar and the build-time context partitioning so each locale
// gets its own per-context index files and the dropdown stays scoped to the
// active docs tree.
function patchSearchBarContent(content) {
  if (content.includes("PATCH(locale-aware-context)")) {
    return content;
  }

  const needle =
    "        if (location.pathname.startsWith(versionUrl)) {\n" +
    "            const uri = location.pathname.substring(versionUrl.length);\n" +
    "            let matchedPath;\n" +
    "            for (const _path of searchContextByPaths) {\n" +
    "                const path = typeof _path === \"string\" ? _path : _path.path;\n" +
    "                if (uri === path || uri.startsWith(`${path}/`)) {\n" +
    "                    matchedPath = path;\n" +
    "                    break;\n" +
    "                }\n" +
    "            }\n";

  const replacement =
    "        if (location.pathname.startsWith(versionUrl)) {\n" +
    "            const uri = location.pathname.substring(versionUrl.length);\n" +
    "            // PATCH(locale-aware-context): strip non-default locale prefix so\n" +
    "            // /zh-CN/docs/... and /ja/docs/... match the configured contexts.\n" +
    "            const __localePrefix = currentLocale + \"/\";\n" +
    "            const __ctxUri = uri.startsWith(__localePrefix) ? uri.substring(__localePrefix.length) : uri;\n" +
    "            let matchedPath;\n" +
    "            for (const _path of searchContextByPaths) {\n" +
    "                const path = typeof _path === \"string\" ? _path : _path.path;\n" +
    "                if (__ctxUri === path || __ctxUri.startsWith(`${path}/`)) {\n" +
    "                    matchedPath = path;\n" +
    "                    break;\n" +
    "                }\n" +
    "            }\n";

  if (!content.includes(needle)) {
    return null;
  }
  return content.replace(needle, replacement);
}

function patchPostBuildFactoryContent(content) {
  if (content.includes("PATCH(locale-aware-context)")) {
    return content;
  }

  const needle1 =
    "                if (searchContextByPaths) {\n" +
    "                    const { baseUrl } = buildData;\n" +
    "                    const rootAllDocs = [];\n";

  const replacement1 =
    "                if (searchContextByPaths) {\n" +
    "                    const { baseUrl } = buildData;\n" +
    "                    // PATCH(locale-aware-context): strip non-default locale prefix so\n" +
    "                    // /zh-CN/docs/... and /ja/docs/... get assigned to the\n" +
    "                    // configured contexts instead of falling into the root bucket.\n" +
    "                    const __i18n = buildData.i18n;\n" +
    "                    const __localePrefix = __i18n && __i18n.currentLocale && __i18n.currentLocale !== __i18n.defaultLocale\n" +
    "                        ? __i18n.currentLocale + \"/\"\n" +
    "                        : \"\";\n" +
    "                    const rootAllDocs = [];\n";

  const needle2 =
    "                            if (doc.u.startsWith(baseUrl)) {\n" +
    "                                const uri = doc.u.substring(baseUrl.length);\n" +
    "                                const matchedPaths = [];\n" +
    "                                for (const _path of searchContextByPaths) {\n" +
    "                                    const path = typeof _path === \"string\" ? _path : _path.path;\n" +
    "                                    if (uri === path || uri.startsWith(`${path}/`)) {\n" +
    "                                        matchedPaths.push(path);\n" +
    "                                    }\n" +
    "                                }\n";

  const replacement2 =
    "                            if (doc.u.startsWith(baseUrl)) {\n" +
    "                                const uri = doc.u.substring(baseUrl.length);\n" +
    "                                const __ctxUri = __localePrefix && uri.startsWith(__localePrefix)\n" +
    "                                    ? uri.substring(__localePrefix.length)\n" +
    "                                    : uri;\n" +
    "                                const matchedPaths = [];\n" +
    "                                for (const _path of searchContextByPaths) {\n" +
    "                                    const path = typeof _path === \"string\" ? _path : _path.path;\n" +
    "                                    if (__ctxUri === path || __ctxUri.startsWith(`${path}/`)) {\n" +
    "                                        matchedPaths.push(path);\n" +
    "                                    }\n" +
    "                                }\n";

  if (!content.includes(needle1) || !content.includes(needle2)) {
    return null;
  }
  return content.replace(needle1, replacement1).replace(needle2, replacement2);
}

// The search worker fetches `${versionUrl}search-index-*.json`. `versionUrl`
// defaults to `siteConfig.baseUrl` (= "/"), which is locale-agnostic, so on
// /zh-CN/* or /ja/* pages the worker still hits the default-locale index files
// at the site root and never sees the per-locale indexes that Docusaurus emits
// under build/{locale}/. These two patches make `versionUrl` carry the active
// locale prefix in both the SearchBar (live dropdown + `?version=` it writes
// into the "see all" link) and the SearchPage (direct loads of /{locale}/search
// with no explicit `?version=`).
function patchSearchBarVersionUrlContent(content) {
  if (content.includes("PATCH(locale-aware-version-url)")) {
    return content;
  }

  const needle1 =
    "    const { siteConfig: { baseUrl }, i18n: { currentLocale }, } = useDocusaurusContext();\n";

  const replacement1 =
    "    const { siteConfig: { baseUrl }, i18n: { currentLocale, defaultLocale }, } = useDocusaurusContext();\n";

  const needle2 =
    "        }\n" +
    "    }\n" +
    "    const history = useHistory();\n";

  const replacement2 =
    "        }\n" +
    "    }\n" +
    "    // PATCH(locale-aware-version-url): non-default locales serve their own\n" +
    "    // search-index files under /{locale}/. Prepend the locale to versionUrl\n" +
    "    // so the worker fetches /{locale}/search-index-*.json instead of the EN one.\n" +
    "    if (currentLocale && defaultLocale && currentLocale !== defaultLocale) {\n" +
    "        const __localeSegment = currentLocale + \"/\";\n" +
    "        if (!versionUrl.startsWith(baseUrl + __localeSegment)) {\n" +
    "            versionUrl = baseUrl + __localeSegment + versionUrl.substring(baseUrl.length);\n" +
    "        }\n" +
    "    }\n" +
    "    const history = useHistory();\n";

  if (!content.includes(needle1) || !content.includes(needle2)) {
    return null;
  }
  return content.replace(needle1, replacement1).replace(needle2, replacement2);
}

function patchSearchPageVersionUrlContent(content) {
  if (content.includes("PATCH(locale-aware-version-url)")) {
    return content;
  }

  const needle1 =
    "    const { siteConfig: { baseUrl }, i18n: { currentLocale }, } = useDocusaurusContext();\n";

  const replacement1 =
    "    const { siteConfig: { baseUrl }, i18n: { currentLocale, defaultLocale }, } = useDocusaurusContext();\n";

  const needle2 = "    const versionUrl = `${baseUrl}${searchVersion}`;\n";

  const replacement2 =
    "    // PATCH(locale-aware-version-url): when there is no explicit ?version=\n" +
    "    // and the page is rendered under a non-default locale, fall back to that\n" +
    "    // locale's index files instead of the default-locale root.\n" +
    "    const versionUrl = searchVersion\n" +
    "        ? `${baseUrl}${searchVersion}`\n" +
    "        : (currentLocale && defaultLocale && currentLocale !== defaultLocale\n" +
    "            ? `${baseUrl}${currentLocale}/`\n" +
    "            : baseUrl);\n";

  if (!content.includes(needle1) || !content.includes(needle2)) {
    return null;
  }
  return content.replace(needle1, replacement1).replace(needle2, replacement2);
}

function patchOneFile(filePath, patchFn, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-search-tokenize] skip(${label}): file not found: ${filePath}`);
    return;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const patched = patchFn(original);
  if (patched == null) {
    console.warn(
      `[patch-search-tokenize] skip(${label}): target block not found (plugin content may have changed)`
    );
    return;
  }
  if (patched === original) {
    console.log(`[patch-search-tokenize] already patched (${label})`);
    return;
  }

  fs.writeFileSync(filePath, patched, "utf8");
  console.log(`[patch-search-tokenize] patched (${label})`);
}

function main() {
  patchOneFile(targetTokenizeFile, patchTokenizeContent, "client-tokenize");
  patchOneFile(targetBuildIndexFile, patchBuildIndexContent, "server-buildIndex");
  patchOneFile(targetSearchBarFile, patchSearchBarContent, "client-searchBar-locale");
  patchOneFile(
    targetPostBuildFactoryFile,
    patchPostBuildFactoryContent,
    "server-postBuildFactory-locale"
  );
  patchOneFile(
    targetSearchBarFile,
    patchSearchBarVersionUrlContent,
    "client-searchBar-versionUrl"
  );
  patchOneFile(
    targetSearchPageFile,
    patchSearchPageVersionUrlContent,
    "client-searchPage-versionUrl"
  );
}

main();
