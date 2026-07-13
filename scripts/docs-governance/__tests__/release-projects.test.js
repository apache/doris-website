const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '../../..');

const ecosystemProjects = [
  {
    name: 'Doris Flink Connector',
    docId: 'ecosystem/doris-flink-connector/release-1.0.0',
  },
  {
    name: 'Doris Spark Connector',
    docId: 'ecosystem/doris-spark-connector/release-1.0.0',
  },
  {
    name: 'Doris Kafka Connector',
    docId: 'ecosystem/doris-kafka-connector/release-1.0.0',
  },
  {
    name: 'Doris Operator',
    docId: 'ecosystem/doris-operator/release-1.0.0',
  },
  {
    name: 'Doris MCP Server',
    docId: 'ecosystem/doris-mcp-server/release-1.0.0',
  },
  {
    name: 'Doris Skills',
    docId: 'ecosystem/doris-skills/release-1.0.0',
  },
  {
    name: 'Doris CLI',
    docId: 'ecosystem/doris-cli/release-1.0.0',
  },
  {
    name: 'Doris Streamloader',
    docId: 'ecosystem/doris-streamloader/release-1.0.0',
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
  }
});
