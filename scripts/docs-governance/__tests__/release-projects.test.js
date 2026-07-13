const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '../../..');

const ecosystemProjects = [
  {
    name: 'Doris Flink Connector',
    docId: 'ecosystem/doris-flink-connector',
    versions: ['26.1.1', '26.1.0', '26.0.0', '25.1.0', '25.0.0'],
  },
  {
    name: 'Doris Spark Connector',
    docId: 'ecosystem/doris-spark-connector',
    versions: ['26.0.0', '25.2.0', '25.1.0', '25.0.1', '25.0.0'],
  },
  {
    name: 'Doris Kafka Connector',
    docId: 'ecosystem/doris-kafka-connector',
    versions: ['26.0.0', '25.0.0'],
  },
  {
    name: 'Doris Operator',
    docId: 'ecosystem/doris-operator',
    versions: ['25.8.0', '25.4.0', '25.3.0', '25.2.0'],
  },
  {
    name: 'Doris MCP Server',
    docId: 'ecosystem/doris-mcp-server',
    versions: [],
  },
  {
    name: 'Doris Skills',
    docId: 'ecosystem/doris-skills',
    versions: [],
  },
  {
    name: 'Doris CLI',
    docId: 'ecosystem/doris-cli',
    versions: [],
  },
  {
    name: 'Doris Streamloader',
    docId: 'ecosystem/doris-streamloader',
    versions: ['1.0.3'],
  },
];

function collectSidebarDocIds(items, result = new Set()) {
  for (const item of items) {
    if (typeof item === 'string') {
      result.add(item);
    } else if (item && Array.isArray(item.items)) {
      collectSidebarDocIds(item.items, result);
    }
  }
  return result;
}

function findSidebarCategory(items, label) {
  for (const item of items) {
    if (item && typeof item === 'object') {
      if (item.label === label) {
        return item;
      }
      if (Array.isArray(item.items)) {
        const nested = findSidebarCategory(item.items, label);
        if (nested) {
          return nested;
        }
      }
    }
  }
  return null;
}

test('all release page includes Doris ecosystem release-note projects', () => {
  const sidebar = JSON.parse(fs.readFileSync(path.join(rootDir, 'sidebarsReleases.json'), 'utf8'));
  const sidebarDocIds = collectSidebarDocIds(sidebar.releases);
  const englishIndex = fs.readFileSync(path.join(rootDir, 'releasenotes/all-release.md'), 'utf8');
  const chineseIndex = fs.readFileSync(
    path.join(rootDir, 'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md'),
    'utf8',
  );

  assert.match(englishIndex, /Doris Core/);
  assert.match(chineseIndex, /Doris Core/);
  assert.ok(fs.existsSync(path.join(rootDir, 'releasenotes/core.md')), 'Doris Core English index should exist');
  assert.ok(
    fs.existsSync(path.join(rootDir, 'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md')),
    'Doris Core Chinese index should exist',
  );

  const coreCategory = findSidebarCategory(sidebar.releases, 'Doris Core');
  assert.equal(coreCategory?.link?.type, 'doc');
  assert.equal(coreCategory?.link?.id, 'core');

  for (const project of ecosystemProjects) {
    const englishPath = path.join(rootDir, 'releasenotes', `${project.docId}.md`);
    const chinesePath = path.join(
      rootDir,
      'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current',
      `${project.docId}.md`,
    );

    assert.ok(fs.existsSync(englishPath), `${project.name} English release note should exist`);
    assert.ok(fs.existsSync(chinesePath), `${project.name} Chinese release note should exist`);
    assert.ok(sidebarDocIds.has(project.docId), `${project.name} should be included in release sidebar`);
    assert.ok(englishIndex.includes(project.name), `${project.name} should be linked from English all-release`);
    assert.ok(chineseIndex.includes(project.name), `${project.name} should be linked from Chinese all-release`);

    const englishContent = fs.readFileSync(englishPath, 'utf8');
    const chineseContent = fs.readFileSync(chinesePath, 'utf8');

    for (const version of project.versions) {
      assert.ok(englishContent.includes(`## ${version}`), `${project.name} English page should include ${version}`);
      assert.ok(chineseContent.includes(`## ${version}`), `${project.name} Chinese page should include ${version}`);
    }
  }
});
