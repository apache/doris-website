import json
import tempfile
import unittest
from pathlib import Path
from scripts.check_md_links_single import resolve_internal


class JapaneseLinkResolution(unittest.TestCase):
    def test_absolute_doc_routes_use_their_own_version_and_locale(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'static').mkdir()
            paths = {
                '/docs/dev/reference/topic': 'docs/reference/topic.mdx',
                '/docs/4.x/reference/topic': 'versioned_docs/version-4.x/reference/topic.md',
                '/ja/docs/dev/reference/topic': 'i18n/ja/docusaurus-plugin-content-docs/current/reference/topic.md',
                '/ja/docs/4.x/reference/topic': 'i18n/ja/docusaurus-plugin-content-docs/version-4.x/reference/topic.mdx',
                '/zh-CN/docs/dev/reference/topic': 'i18n/zh-CN/docusaurus-plugin-content-docs/current/reference/topic.mdx',
                '/zh-CN/docs/4.x/reference/topic': 'i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/reference/topic.md',
            }
            for file in paths.values():
                target = root / file
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('# Topic\n')
            base = root / 'i18n/ja/docusaurus-plugin-content-docs/current/reference'
            for route, file in paths.items():
                with self.subTest(route=route):
                    self.assertEqual(resolve_internal(str(base), route), str(root / file))
                    self.assertEqual(resolve_internal(str(base), route + '/?view=full#example'), str(root / file))
            for route in ('/docs/3.x/reference/topic', '/ja/docs/3.x/reference/topic',
                          '/docs/dev/reference/missing', '/docs/4.x/reference/missing'):
                with self.subTest(route=route):
                    self.assertIsNone(resolve_internal(str(base), route))

    def test_shared_dev_redirects_require_existing_targets(self):
        redirects_file = Path(__file__).resolve().parents[2] / 'config/redirects-dev.json'
        redirects = json.loads(redirects_file.read_text())
        for entry in redirects:
            with self.subTest(route=entry['from']), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                (root / 'static').mkdir()
                (root / 'config').mkdir()
                (root / 'config/redirects-dev.json').write_text(json.dumps(redirects))
                relative = entry['to'].removeprefix('/')
                if relative.startswith('zh-CN/docs/dev/'):
                    relative = relative.replace('zh-CN/docs/dev/', 'i18n/zh-CN/docusaurus-plugin-content-docs/current/', 1)
                else:
                    relative = relative.replace('docs/dev/', 'docs/', 1)
                target = root / (relative + '.md')
                target.parent.mkdir(parents=True)
                target.write_text('# Flink overview\n')
                self.assertEqual(resolve_internal(str(root), entry['from']), str(target))
                self.assertEqual(resolve_internal(str(root), entry['from'] + '/#compile'), str(target))
                target.unlink()
                self.assertIsNone(resolve_internal(str(root), entry['from']))

    def test_redirect_targets_must_be_pages(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'static').mkdir()
            (root / 'config').mkdir()
            (root / 'docs').mkdir()
            target = root / 'docs/overview.md'
            target.write_text('# Overview\n')
            redirects = [
                {'from': '/docs/4.x/old', 'to': '/docs/4.x/moved'},
                {'from': '/docs/4.x/moved', 'to': '/docs/dev/overview'},
                {'from': '/docs/4.x/cycle-a', 'to': '/docs/4.x/cycle-b'},
                {'from': '/docs/4.x/cycle-b', 'to': '/docs/4.x/cycle-a'},
            ]
            (root / 'config/redirects-4.x.json').write_text(json.dumps(redirects))
            self.assertEqual(resolve_internal(str(root), '/docs/4.x/moved'), str(target))
            self.assertIsNone(resolve_internal(str(root), '/docs/4.x/old'))
            self.assertIsNone(resolve_internal(str(root), '/docs/4.x/cycle-a'))
            self.assertIsNone(resolve_internal(str(root), '/docs/4.x/missing'))

    def test_missing_translation_resolves_to_same_version_source(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'static').mkdir()
            current = root / 'i18n/ja/docusaurus-plugin-content-docs/current/guide'
            current.mkdir(parents=True)
            source = root / 'docs/reference/topic.md'
            source.parent.mkdir(parents=True)
            source.write_text('# Topic\n')
            other = root / 'versioned_docs/version-4.x/reference/topic.md'
            other.parent.mkdir(parents=True)
            other.write_text('# 4.x topic\n')
            versioned = root / 'i18n/ja/docusaurus-plugin-content-docs/version-4.x/guide'
            versioned.mkdir(parents=True)
            self.assertEqual(resolve_internal(str(current), '../reference/topic.md'), str(source))
            self.assertEqual(resolve_internal(str(versioned), '../reference/topic.md'), str(other))
            self.assertEqual(resolve_internal(str(current), '/ja/docs/dev/reference/topic'), str(source))
            self.assertEqual(resolve_internal(str(versioned), '/ja/docs/4.x/reference/topic'), str(other))
            self.assertIsNone(resolve_internal(str(current), '/ja/docs/dev/reference/missing'))

    def test_community_fallback_uses_community_plugin(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'static').mkdir()
            localized = root / 'i18n/ja/docusaurus-plugin-content-docs-community/current/guide'
            localized.mkdir(parents=True)
            source = root / 'community/guide/next.mdx'
            source.parent.mkdir(parents=True)
            source.write_text('# Next\n')
            self.assertEqual(resolve_internal(str(localized), 'next.mdx'), str(source))
            self.assertEqual(resolve_internal(str(localized), '/ja/community/guide/next'), str(source))


if __name__ == '__main__':
    unittest.main()
