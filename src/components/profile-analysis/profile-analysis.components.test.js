const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
const previousTsxLoader = require.extensions['.tsx'];
const compileTypeScript = (module, filename) => {
    const output = typescript.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: {
            esModuleInterop: true,
            jsx: typescript.JsxEmit.React,
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText;
    module._compile(output, filename);
};
require.extensions['.ts'] = compileTypeScript;
require.extensions['.tsx'] = compileTypeScript;

const { AnalysisResult } = require('./AnalysisResult.tsx');
const { AnalysisStatus } = require('./AnalysisStatus.tsx');
const {
    MAX_PROFILE_FILE_SIZE_BYTES,
    ProfileUploader,
    formatProfileFileSize,
    validateProfileFile,
} = require('./ProfileUploader.tsx');

require.extensions['.ts'] = previousTypeScriptLoader;
require.extensions['.tsx'] = previousTsxLoader;

test('accepts case-insensitive txt files and rejects other types or oversized files', () => {
    assert.equal(validateProfileFile(new File(['profile'], 'query.PROFILE.TXT')), null);
    assert.match(validateProfileFile(new File(['profile'], 'query.pdf')), /\.txt/);

    const oversizedFile = {
        name: 'query.txt',
        size: MAX_PROFILE_FILE_SIZE_BYTES + 1,
    };
    assert.match(validateProfileFile(oversizedFile), /10 MiB/);
});

test('formats file sizes for display', () => {
    assert.equal(formatProfileFileSize(800), '800 B');
    assert.equal(formatProfileFileSize(1536), '1.5 KiB');
    assert.equal(formatProfileFileSize(2 * 1024 * 1024), '2.0 MiB');
});

test('disables Analyze until a file exists and while analysis is running', () => {
    const withoutFile = renderToStaticMarkup(
        React.createElement(ProfileUploader, {
            file: null,
            language: 'en',
            disabled: false,
            onFileChange() {},
            onLanguageChange() {},
            onAnalyze() {},
        }),
    );
    assert.match(withoutFile, /<button[^>]*disabled=""[^>]*>Analyze Profile<\/button>/);

    const analyzing = renderToStaticMarkup(
        React.createElement(ProfileUploader, {
            file: new File(['profile'], 'query.txt'),
            language: 'zh-CN',
            disabled: true,
            onFileChange() {},
            onLanguageChange() {},
            onAnalyze() {},
        }),
    );
    assert.match(analyzing, /<input[^>]*disabled=""/);
    assert.match(analyzing, /<button[^>]*disabled=""[^>]*>Processing…<\/button>/);
});

test('uses an English accessible label instead of exposing localized native file-input text', () => {
    const markup = renderToStaticMarkup(
        React.createElement(ProfileUploader, {
            file: null,
            language: 'en',
            disabled: false,
            onFileChange() {},
            onLanguageChange() {},
            onAnalyze() {},
        }),
    );

    assert.match(markup, /aria-label="Choose an Apache Doris Query Profile file"/);

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileAnalysis.scss'), 'utf8');
    assert.match(styles, /&__file-input\s*{[^}]*clip-path:\s*inset\(50%\)/s);
});

test('renders an English response-language selector with English selected by default', () => {
    const markup = renderToStaticMarkup(
        React.createElement(ProfileUploader, {
            file: null,
            language: 'en',
            disabled: false,
            onFileChange() {},
            onLanguageChange() {},
            onAnalyze() {},
        }),
    );

    assert.match(markup, /<legend>Response language<\/legend>/);
    assert.match(markup, /<input[^>]*checked=""[^>]*value="en"/);
    assert.match(markup, />English<\/label>/);
    assert.match(markup, />Simplified Chinese<\/label>/);
});

test('exposes the waiting state to assistive technology', () => {
    const markup = renderToStaticMarkup(React.createElement(AnalysisStatus, { state: 'queued', jobsAhead: 3 }));
    assert.match(markup, /role="status"/);
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, /Queued · 3 jobs ahead/);
});

test('renders runtime Markdown while discarding raw HTML and unsafe links', () => {
    const markup = renderToStaticMarkup(
        React.createElement(AnalysisResult, {
            result: {
                id: 'item_26',
                type: 'agent_message',
                text: [
                    '## Conclusion',
                    '',
                    'Latency is dominated by **FE planning**.',
                    '',
                    '- Plan Time: `452 ms`',
                    '',
                    '| Metric | Value |',
                    '| --- | ---: |',
                    '| Plan Time | 452 ms |',
                    '',
                    '~~unverified~~',
                    '',
                    '<script>alert("profile")</script>',
                    '[unsafe](javascript:alert("profile"))',
                ].join('\n'),
            },
        }),
    );
    assert.match(markup, /<h3>Conclusion<\/h3>/);
    assert.match(markup, /<strong>FE planning<\/strong>/);
    assert.match(markup, /<li>Plan Time: <code>452 ms<\/code><\/li>/);
    assert.match(markup, /<table>/);
    assert.match(markup, /<th>Metric<\/th>/);
    assert.match(markup, /<del>unverified<\/del>/);
    assert.doesNotMatch(markup, /<script>/);
    assert.doesNotMatch(markup, /alert\(&quot;profile&quot;\)/);
    assert.doesNotMatch(markup, /href="javascript:/);
    assert.match(markup, /aria-labelledby="profile-analysis-result-title"/);
});

test('the page composes the analyzer inside the Doris Layout without adding navigation changes', () => {
    const pageSource = fs.readFileSync(path.join(__dirname, '../../pages/profile-analysis/index.tsx'), 'utf8');
    assert.match(pageSource, /import Layout from '@theme\/Layout'/);
    assert.match(pageSource, /<ProfileAnalyzer \/>/);
    assert.match(pageSource, /<main className="container margin-vert--lg">/);
});
