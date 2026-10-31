#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {availableVersions, normalizeVersion, contentDirectory} = require('../docs-inventory.cjs');
const root = path.resolve(__dirname, '../..');
const help = `Export a local Apache Doris documentation version to PDF.

Usage: yarn docs:pdf --version <version> [options]

  --version <version>       Required: dev (alias: current), an active or archived version
  --locale <locales>        en, zh-CN, or en,zh-CN (default: en,zh-CN)
  --output <directory>      Default: output/pdf/docs/<version>/
  --chrome <executable>     Installed Chrome/Chromium; auto-detected when omitted
  --python <executable>     Python with pypdf (default: repo venv, then python3)
  --limit <count>           Sample export; requires an explicit --output
  --allow-missing-images   Use linked placeholders for unreachable images
  --resume                 Retain PDFs for other locales from the same commit
  --list-versions           List versions available in this checkout
  --help                   Show this help

Outputs: PDF files, manifest.json, and SHA256SUMS. Upload is a separate manual step.
`;
function parseOptions(args, siteDir = root) {
    const {values} = parseArgs({args, options: {
        version: {type: 'string'}, locale: {type: 'string', default: 'en,zh-CN'}, output: {type: 'string'},
        chrome: {type: 'string'}, python: {type: 'string'},
        'allow-missing-images': {type: 'boolean'}, limit: {type: 'string'}, resume: {type: 'boolean'}, 'list-versions': {type: 'boolean'}, help: {type: 'boolean'},
    }});
    if (values.help || values['list-versions']) return values;
    if (!values.version?.trim()) throw new Error('Specify --version. Use --list-versions to see available versions.');
    const version = normalizeVersion(values.version.trim());
    if (!availableVersions(siteDir).includes(version)) throw new Error(`Unknown documentation version: ${values.version}. Use --list-versions.`);
    const locales = values.locale.split(',').map(locale => locale.trim());
    if (new Set(locales).size !== locales.length || locales.some(locale => !['en', 'zh-CN'].includes(locale)))
        throw new Error('--locale must be en, zh-CN, or en,zh-CN.');
    for (const locale of locales) if (!fs.existsSync(contentDirectory(siteDir, version, locale)))
        throw new Error(`Missing ${locale} source for ${version}.`);
    const limit = values.limit === undefined ? 0 : Number(values.limit);
    if (values.limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) throw new Error('--limit must be a positive integer.');
    if (limit && !values.output) throw new Error('Sample exports require an explicit --output directory.');
    const venvPython = path.join(siteDir, 'tmp/pdfs/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    const python = values.python || process.env.DOCS_PDF_PYTHON || (fs.existsSync(venvPython) ? venvPython : 'python3');
    return {version, locales, limit, allowMissingImages: values['allow-missing-images'] ?? false, resume: values.resume ?? false, python,
        chrome: values.chrome || process.env.DOCS_PDF_CHROME || process.env.PUPPETEER_EXECUTABLE_PATH,
        output: values.output ? path.resolve(values.output) : path.join(siteDir, 'output/pdf/docs', version)};
}
async function main() {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) return process.stdout.write(help);
    if (options['list-versions']) return process.stdout.write(availableVersions(root).join('\n') + '\n');
    await require('./generate.cjs').generate(options);
}
if (require.main === module) main().catch(error => {console.error(`PDF export failed: ${error.message}`); process.exitCode = 1;});
module.exports = {parseOptions};
