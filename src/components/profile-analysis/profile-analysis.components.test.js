const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const typescript = require('typescript');
const hcaptchaSiteKey = '10000000-ffff-ffff-ffff-000000000001';

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

const { AiAnalysisForm } = require('./AiAnalysisForm.tsx');
const { AnalysisResult } = require('./AnalysisResult.tsx');
const { AnalysisStatus } = require('./AnalysisStatus.tsx');
const {
    ProfileUploader,
    formatProfileFileSize,
    validateProfileFile,
} = require('./ProfileUploader.tsx');
const { MAX_RAW_BYTES } = require('./profile-analysis.file.ts');

require.extensions['.ts'] = previousTypeScriptLoader;
require.extensions['.tsx'] = previousTsxLoader;

test('accepts case-insensitive txt files and rejects other types or oversized files', () => {
    assert.equal(validateProfileFile(new File(['profile'], 'query.PROFILE.TXT')), null);
    assert.match(validateProfileFile(new File(['profile'], 'query.pdf')), /\.txt/);

    const oversizedFile = {
        name: 'query.txt',
        size: MAX_RAW_BYTES + 1,
    };
    assert.match(validateProfileFile(oversizedFile), /100 MiB/);
});

test('formats file sizes for display', () => {
    assert.equal(formatProfileFileSize(800), '800 B');
    assert.equal(formatProfileFileSize(1536), '1.5 KiB');
    assert.equal(formatProfileFileSize(2 * 1024 * 1024), '2.0 MiB');
});

const renderUploader = (props = {}) =>
    renderToStaticMarkup(
        React.createElement(ProfileUploader, {
            file: null,
            disabled: false,
            onFileChange() {},
            ...props,
        }),
    );

const renderAiForm = (props = {}) =>
    renderToStaticMarkup(
        React.createElement(AiAnalysisForm, {
            file: null,
            language: 'en',
            disabled: false,
            hcaptchaSiteKey,
            onLanguageChange() {},
            onAnalyze() {},
            ...props,
        }),
    );

test('explains the raw file limit and large-profile reduction in English', () => {
    const markup = renderUploader();

    assert.match(markup, /UTF-8 \.txt file up to 100 MiB/);
    assert.match(markup, /Files over 10 MiB are reduced to their aggregated Profile sections/);
});

test('states the supported Doris version before a Profile is chosen', () => {
    const markup = renderUploader();

    assert.match(markup, /profile-analysis__version-notice/);
    assert.match(markup, /Apache Doris 4\.1 or later/);
    assert.match(markup, /Profiles from earlier versions may fail to parse/);
    // The notice must precede the drop zone so it is read before a file is picked.
    assert.ok(markup.indexOf('__version-notice') < markup.indexOf('__drop-zone'));

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileAnalysis.scss'), 'utf8');
    assert.match(styles, /&__version-notice[\s\S]*?{[^}]*border-left:\s*4px solid var\(--ifm-color-warning\)/);
});

test('disables both tab actions without a file and keeps visualization available during AI processing', () => {
    const analyzerSource = fs.readFileSync(path.join(__dirname, 'ProfileAnalyzer.tsx'), 'utf8');

    assert.match(analyzerSource, /disabled=\{!analysis\.file \|\| localDag\.isBusy\}/);
    assert.match(analyzerSource, /localDag\.isBusy \? 'Visualizing…' : 'Visualize Execution'/);
    // The AI job never disables the local visualization button.
    assert.doesNotMatch(analyzerSource, /disabled=\{[^}]*isAiBusy[^}]*\}\s*\n\s*onClick=\{handleVisualize\}/);

    assert.match(renderAiForm(), /<button[^>]*disabled=""[^>]*>Analyze with AI<\/button>/);

    const analyzing = renderAiForm({
        file: new File(['profile'], 'query.txt'),
        language: 'zh-CN',
        disabled: true,
    });
    assert.match(analyzing, /<input[^>]*disabled=""/);
    assert.match(analyzing, /<button[^>]*disabled=""[^>]*>Processing…[^<]*<\/button>/);
});

test('states how long the AI analysis is expected to take while it runs', () => {
    const analyzing = renderAiForm({
        file: new File(['profile'], 'query.txt'),
        disabled: true,
    });

    assert.match(analyzing, /Processing… · Estimated 1–2 minutes/);
    // The estimate belongs to the waiting state only.
    assert.doesNotMatch(renderAiForm(), /Estimated 1–2 minutes/);
});

test('keeps local file selection independent from unchecked AI consent and displays the required notice', () => {
    const markup = renderAiForm();

    assert.match(markup, /type="checkbox"/);
    assert.doesNotMatch(markup, /type="checkbox"[^>]*checked/);
    assert.match(markup, /href="https:\/\/github\.com\/apache\/doris-skills"/);
    assert.match(markup, /Powered by <strong>Doris Skills<\/strong>/);
    assert.match(markup, /provided by VeloDB and third-party large language model service providers/);
    assert.match(markup, /not an official Apache Doris project feature/);
    assert.match(markup, /Do not upload passwords, keys, access tokens, personal information/);
    assert.match(markup, /automatically and permanently deleted within one hour/);
    assert.ok(markup.indexOf('Privacy and AI processing notice') < markup.indexOf('Analyze with AI'));
    assert.match(markup, /role="note"/);
    assert.match(markup, /profile-analysis__privacy-notice-icon" aria-hidden="true">!</);
    assert.doesNotMatch(renderUploader(), /type="file"[^>]*disabled=""/);

    const analyzerSource = fs.readFileSync(path.join(__dirname, 'ProfileAnalyzer.tsx'), 'utf8');
    assert.match(analyzerSource.replace(/\s+/g, ' '), /The file is not uploaded for this action\./);
    assert.match(analyzerSource, /button button--primary profile-analysis__action-button/);

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileAnalysis.scss'), 'utf8');
    assert.match(styles, /&__panel-intro\s*{[^}]*color:\s*var\(--ifm-color-emphasis-700\)/s);
    assert.match(styles, /&__action-button\s*{[^}]*width:\s*100%/s);
});

test('uses an English accessible label instead of exposing localized native file-input text', () => {
    assert.match(renderUploader(), /aria-label="Choose an Apache Doris Query Profile file"/);

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileAnalysis.scss'), 'utf8');
    assert.match(styles, /&__file-input\s*{[^}]*clip-path:\s*inset\(50%\)/s);
});

test('renders an English response-language selector with English selected by default', () => {
    const markup = renderAiForm();

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

test('renders the page-refresh recovery state', () => {
    const markup = renderToStaticMarkup(React.createElement(AnalysisStatus, { state: 'restoring', jobsAhead: null }));
    assert.match(markup, /role="status"/);
    assert.match(markup, /Restoring analysis…/);
});

test('renders the connection recovery state without presenting a terminal failure', () => {
    const markup = renderToStaticMarkup(React.createElement(AnalysisStatus, { state: 'recovering', jobsAhead: null }));
    assert.match(markup, /role="status"/);
    assert.match(markup, /Connection interrupted · recovering analysis…/);
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
                    '![remote](https://evil.example/pixel.png)',
                    '[insecure](http://evil.example/path)',
                    '[unapproved](https://evil.example/path)',
                    '[safe](https://doris.apache.org/docs/)',
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
    assert.doesNotMatch(markup, /<img/);
    assert.doesNotMatch(markup, /href="http:\/\/evil/);
    assert.doesNotMatch(markup, /href="https:\/\/evil/);
    assert.match(markup, /href="https:\/\/doris.apache.org\/docs\/"/);
    assert.match(markup, /rel="noopener noreferrer"/);
    assert.match(markup, /AI-generated result:/);
    assert.match(markup, /qualified engineer review/);
    assert.match(markup, /aria-labelledby="profile-analysis-result-title"/);
});

test('the page composes the analyzer inside the Doris Layout without adding navigation changes', () => {
    const pageSource = fs.readFileSync(path.join(__dirname, '../../pages/profile-analysis/index.tsx'), 'utf8');
    assert.match(pageSource, /import Layout from '@theme\/Layout'/);
    assert.match(pageSource, /<ProfileAnalyzer \/>/);
    assert.match(pageSource, /<main className="container margin-vert--lg">/);
});

test('adds English action tabs and configures the execution graph as read-only', () => {
    const analyzerSource = fs.readFileSync(path.join(__dirname, 'ProfileAnalyzer.tsx'), 'utf8');
    const dagSource = fs.readFileSync(path.join(__dirname, 'ProfileDag.tsx'), 'utf8');
    const dagNodeSource = fs.readFileSync(path.join(__dirname, 'ProfileDagNode.tsx'), 'utf8');

    assert.match(analyzerSource, />\s*Visualize Execution\s*</);
    assert.match(analyzerSource, />\s*AI-assisted analysis\s*</);
    assert.match(analyzerSource, /role="tablist"/);
    assert.match(analyzerSource, /role="tabpanel"/);
    // Both panels stay mounted so switching tabs never discards a finished result.
    assert.match(analyzerSource, /hidden=\{activeTab !== 'visualize'\}/);
    assert.match(analyzerSource, /hidden=\{activeTab !== 'ai'\}/);
    assert.doesNotMatch(analyzerSource, /activeTab === '(visualize|ai)' && </);
    assert.match(dagSource, /nodesDraggable=\{false\}/);
    assert.match(dagSource, /nodesConnectable=\{false\}/);
    assert.match(dagSource, /edgesReconnectable=\{false\}/);
    assert.match(dagSource, /edgeTypes=\{edgeTypes\}/);
    assert.match(dagSource, /Execution dependency \(prerequisite → dependent\)/);
    assert.match(dagSource, /deleteKeyCode=\{null\}/);
    assert.match(dagSource, /panOnDrag/);
    assert.match(dagSource, /zoomOnScroll/);
    assert.doesNotMatch(`${analyzerSource}\n${dagSource}\n${dagNodeSource}`, /[\u3400-\u9fff]/);
});

test('overlays the slowest operators on the canvas and centers the one that is clicked', () => {
    const dagSource = fs.readFileSync(path.join(__dirname, 'ProfileDag.tsx'), 'utf8');

    assert.match(dagSource, /<Panel position="top-left" className="profile-dag-hotspots"/);
    assert.match(dagSource, />Slowest operators</);
    assert.match(dagSource, /hotspots\.length > 0 && <HotspotList hotspots=\{hotspots\} onFocus=\{focusNode\} \/>/);
    assert.match(dagSource, /onClick=\{\(\) => onFocus\(hotspot\.id\)\}/);
    // Each entry carries the node id, its name, its location, and the measured duration.
    assert.match(dagSource, /title=\{hotspot\.id\}/);
    assert.match(dagSource, /\{hotspot\.label\}/);
    assert.match(dagSource, /id=\$\{hotspot\.planNodeId\}/);
    assert.match(dagSource, /formatDurationNs\(hotspot\.execMaxNs\)/);
    // Focusing centers the operator and highlights it instead of only scrolling near it.
    assert.match(dagSource, /internalNode\.internals\.positionAbsolute/);
    assert.match(dagSource, /setCenter\(x \+ width \/ 2, y \+ height \/ 2, \{ zoom: FOCUS_ZOOM, duration: 500 \}\)/);
    assert.match(dagSource, /selected: node\.id === nodeId/);

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileDag.scss'), 'utf8');
    assert.match(styles, /\.react-flow__node\.selected \.profile-dag-node\s*{[^}]*outline:\s*3px solid var\(--brand-primary\)/s);
    assert.match(styles, /\.profile-dag-hotspots\s*{[^}]*max-width:\s*min\(310px, 48%\)/s);
});

test('expands the execution graph to every pixel below the navbar in full screen', () => {
    const dagSource = fs.readFileSync(path.join(__dirname, 'ProfileDag.tsx'), 'utf8');

    assert.match(dagSource, /<Panel position="top-right" className="profile-dag-fullscreen"/);
    assert.match(dagSource, /<FullscreenToggle active=\{isFullscreen\} onToggle=\{changeFullscreen\} \/>/);
    assert.match(dagSource, /\{active \? 'Exit full screen' : 'Full screen'\}/);
    assert.match(dagSource, /aria-pressed=\{active\}/);
    // The navbar stays visible, so its measured height offsets the canvas.
    assert.match(dagSource, /const NAVBAR_SELECTOR = '\.navbar-next'/);
    assert.match(dagSource, /navbar\.getBoundingClientRect\(\)\.bottom/);
    assert.match(dagSource, /workspace\.style\.setProperty\(NAVBAR_OFFSET_PROPERTY/);
    // Escape leaves full screen, and the page behind the canvas is restored on exit.
    assert.match(dagSource, /event\.key === 'Escape'/);
    assert.match(dagSource, /document\.body\.style\.overflow = 'hidden'/);
    assert.match(dagSource, /document\.body\.style\.overflow = previousBodyOverflow/);
    // Resizing the canvas refits the graph instead of leaving it off-centre.
    assert.match(dagSource, /hasFitVisibleCanvasRef\.current = false;\s*\n\s*setIsFullscreen\(next\)/);

    const styles = fs.readFileSync(path.join(__dirname, 'ProfileDag.scss'), 'utf8');
    const fullscreenRule = styles.match(/&__workspace--fullscreen\s*{[^}]*}/s)[0];
    assert.match(fullscreenRule, /position:\s*fixed/);
    assert.match(fullscreenRule, /top:\s*var\(--profile-dag-navbar-offset, 64px\)/);
    assert.match(fullscreenRule, /right:\s*0/);
    assert.match(fullscreenRule, /bottom:\s*0/);
    assert.match(fullscreenRule, /left:\s*0/);
    // Below the sticky navbar's z-index (300) so the navigation stays clickable.
    assert.match(fullscreenRule, /z-index:\s*250/);
    assert.match(styles, /&__canvas\s*{[^}]*height:\s*100%/s);
});
