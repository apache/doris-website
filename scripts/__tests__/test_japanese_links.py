import os
import tempfile
import unittest
from pathlib import Path
from scripts.check_md_links_single import resolve_internal


class JapaneseLinkResolution(unittest.TestCase):
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
