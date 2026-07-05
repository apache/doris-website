const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const scriptPath = path.join(__dirname, 'check_move.js');

function createRepo(files) {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-move-'));
  execFileSync('git', ['init'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repoDir });

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(repoDir, filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }

  execFileSync('git', ['add', '.'], { cwd: repoDir });
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: repoDir, stdio: 'ignore' });
  return repoDir;
}

test('ignores markdown-like PR titles inside MDX ESM exports', () => {
  const repoDir = createRepo({
    'src/pages/community-report/_reports/2026-06-29.mdx': `
export const report = {
  "prs": [
    {
      "title": "[feature](be) Add file scanner v2 readers",
      "url": "https://github.com/apache/doris/pull/65046"
    }
  ]
};
`,
  });

  const result = spawnSync(process.execPath, [scriptPath, 'HEAD'], {
    cwd: repoDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /All links are OK/);
});

test('reports broken local links in markdown prose', () => {
  const repoDir = createRepo({
    'docs/example.mdx': 'See [missing page](missing-page).\n',
  });

  const result = spawnSync(process.execPath, [scriptPath, 'HEAD'], {
    cwd: repoDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /Broken link -> missing-page/);
});
