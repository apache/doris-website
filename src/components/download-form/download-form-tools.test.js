const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const dataPath = path.join(__dirname, '../../constant/download.data.ts');
const compiledData = typescript.transpileModule(fs.readFileSync(dataPath, 'utf8'), {
    compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const dataModule = new Module(dataPath, module);
dataModule.filename = dataPath;
dataModule.paths = Module._nodeModulePaths(path.dirname(dataPath));
dataModule._compile(compiledData, dataPath);

const { TOOL_VERSIONS, ToolsEnum } = dataModule.exports;

const OPERATOR_SOURCE_VERSIONS = [
    '25.8.0',
    '25.7.0',
    '25.6.0',
    '25.5.3',
    '25.5.2',
    '25.5.1',
    '25.5.0',
    '25.4.0',
    '25.3.0',
    '25.2.1',
    '25.2.0',
    '25.1.0',
    '24.2.0',
    '24.1.0',
    '24.0.0',
];

const OPERATOR_BINARY_VERSIONS = [
    '25.8.0',
    '25.7.0',
    '25.6.0',
    '25.5.3',
    '25.5.2',
    '25.5.1',
    '25.5.0',
    '25.4.0',
    '25.3.0',
    '25.2.1',
    '25.2.0',
    '25.1.0',
    '24.2.0',
];

test('Doris Operator exposes every source release and its verification files', () => {
    assert.equal(ToolsEnum.Operator, 'Doris Operator');

    const operator = TOOL_VERSIONS.find(tool => tool.value === ToolsEnum.Operator);
    assert.ok(operator);
    assert.deepEqual(
        operator.children.filter(release => release.Source).map(release => release.value),
        OPERATOR_SOURCE_VERSIONS,
    );

    for (const release of operator.children.filter(release => release.Source)) {
        const source = `https://downloads.apache.org/doris/doris-operator/${release.value}/apache-doris-operator-${release.value}-src.tar.gz`;
        assert.equal(release.Source, source);
        assert.equal(release.gz, source);
        assert.equal(release.asc, `${source}.asc`);
        assert.equal(release.sha512, `${source}.sha512`);
    }
});

test('Doris Operator exposes a docker pull command for every published binary version', () => {
    const operator = TOOL_VERSIONS.find(tool => tool.value === ToolsEnum.Operator);
    assert.ok(operator);
    assert.deepEqual(
        operator.children.filter(release => release.Binary).map(release => release.value),
        OPERATOR_BINARY_VERSIONS,
    );

    for (const release of operator.children.filter(release => release.Binary)) {
        assert.equal(release.Binary, `docker pull apache/doris:operator-${release.value}`);
    }
});

test('the ecosystem form renders Operator binary downloads as a copyable command', () => {
    const formSource = fs.readFileSync(path.join(__dirname, 'download-form-tools.tsx'), 'utf8');
    const pageSource = fs.readFileSync(path.join(__dirname, '../download-form-next/DownloadFormNext.tsx'), 'utf8');

    assert.match(formSource, /const isOperatorBinary\s*=/);
    assert.match(formSource, /\{isOperatorBinary\s*\?\s*\(/);
    assert.match(formSource, /<code/);
    assert.doesNotMatch(formSource, /<input/);
    assert.match(formSource, /aria-label="Copy Docker pull command"/);
    assert.match(formSource, /options\.filter\(option => option\[downloadType\]\)/);
    assert.match(formSource, /bg-black/);
    assert.match(formSource, /text-\[#49D7AA\]/);
    assert.match(formSource, /backgroundColor: '#000000'/);
    assert.match(formSource, /color: '#49D7AA'/);
    assert.match(formSource, /aria-hidden="true"[\s\S]*?>\s*\$\s*<\/span>/);
    assert.doesNotMatch(formSource, /event\.currentTarget\.select\(\)/);
    assert.match(formSource, />\s*Docker command\s*<\/span>/);
    assert.match(formSource, /whitespace-normal/);
    assert.match(formSource, /break-all/);
    assert.doesNotMatch(formSource, /whitespace-nowrap/);
    assert.ok(
        formSource.indexOf('aria-label="Copy Docker pull command"') < formSource.indexOf('<code'),
        'Copy action should not consume space on the command line',
    );
    assert.match(pageSource, /<span>Doris Operator<\/span>/);
});
