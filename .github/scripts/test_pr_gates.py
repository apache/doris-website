import os
from pathlib import Path
import re
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[2]


def step_script(workflow, name):
    source = (ROOT / '.github/workflows' / workflow).read_text()
    match = re.search(r'^(\s*)- name: ' + re.escape(name) + r'\s*$', source, re.M)
    assert match, name
    lines = source[match.end():].splitlines()
    for i, line in enumerate(lines):
        if re.match(r'^\s*run: \|\s*$', line):
            indent = len(line) - len(line.lstrip())
            body = []
            for value in lines[i + 1:]:
                if value.strip() and len(value) - len(value.lstrip()) <= indent:
                    break
                body.append(value)
            return textwrap.dedent('\n'.join(body))
    raise AssertionError('Missing run block: ' + name)


class PrGateRegression(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='doris-pr-gates-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q', '--initial-branch=master')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('commit', '--allow-empty', '-qm', 'base')
        self.base = self.git('rev-parse', 'HEAD').strip()
        self.env = {**os.environ, 'RUNNER_TEMP': str(self.root),
                    'GITHUB_OUTPUT': str(self.root / 'outputs'), 'BASE_REF': 'master'}
        self.git('update-ref', 'refs/remotes/origin/master', self.base)

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, text=True)

    def write(self, name, value):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(value if isinstance(value, bytes) else value.encode())

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'change')

    def run_step(self, workflow, name):
        command = step_script(workflow, name).replace('${{ github.event.pull_request.base.sha }}', self.base)
        return subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', command], cwd=self.root,
                              env=self.env, text=True, capture_output=True)

    def test_size_gate_checks_the_101st_file_and_preserves_boundary_and_exception(self):
        for i in range(100):
            self.write(f'a{i:03}.txt', 'small')
        self.write('z large\n中文.bin', b'x' * 1024001)
        self.write('scripts/last-update/data.json', b'x' * 1024001)
        self.commit()
        result = self.run_step('check-pr-file-sizes.yml', 'Get changed files in PR')
        self.assertEqual(result.returncode, 0, result.stderr)
        selected = (self.root / 'pr-size-files').read_bytes().split(b'\0')
        self.assertIn('z large\n中文.bin'.encode(), selected)
        result = self.run_step('check-pr-file-sizes.yml', 'Check file sizes')
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn('z large', result.stdout)
        self.write('z large\n中文.bin', b'x' * 1024000)
        result = self.run_step('check-pr-file-sizes.yml', 'Check file sizes')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_markdown_gate_selects_all_locales_versions_plugins_and_rename_destinations(self):
        self.write('docs/old.md', '# Before')
        self.commit()
        self.base = self.git('rev-parse', 'HEAD').strip()
        self.git('update-ref', 'refs/remotes/origin/master', self.base)
        self.git('mv', 'docs/old.md', 'docs/new name.md')
        paths = ['versioned_docs/version-4.x/topic.md', 'i18n/ru/русский.md',
                 'i18n/ko/한국어.md', 'i18n/ja/日本語.md', 'i18n/zh-CN/中文.md',
                 'community/topic.md', 'course/topic.mdx', 'releasenotes/topic.md',
                 'blog/topic.md', 'docs/new\nline.md']
        for name in paths:
            self.write(name, '# Topic')
        self.commit()
        result = self.run_step('check-md-links.yml', 'Collect added/modified Markdown files')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        selected = {value.decode() for value in (self.root / 'pr-markdown-files').read_bytes().split(b'\0') if value}
        self.assertEqual(selected, set(paths + ['docs/new name.md']))
        self.assertIn('has_files=true', (self.root / 'outputs').read_text())

    def test_node_link_checker_checks_earlier_commits_and_paths_with_spaces(self):
        self.write('versioned_docs/version-4.x/first topic.md', '# Topic\n\n[Broken](missing.md)\n')
        self.commit()
        self.write('later.txt', 'not Markdown')
        self.commit()
        result = subprocess.run(['node', str(ROOT / 'scripts/check_move.js'), '--base', self.base],
                                cwd=self.root, text=True, capture_output=True)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn('missing.md', result.stderr)


if __name__ == '__main__':
    unittest.main()
