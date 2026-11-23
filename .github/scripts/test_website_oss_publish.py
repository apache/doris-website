import contextlib
import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('website_oss_publish', Path(__file__).with_name('website_oss_publish.py'))
publish = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publish)


class PublishTests(unittest.TestCase):
    def artifact(self, root):
        source = root / 'build'
        files = {'.publish/redirects.json': '{}', '.htaccess': 'Apache rules', '.asf.yaml': 'ASF config',
                 '.env.production': 'must stay private', '.git/config': 'not public', '.git/index.html': 'not public',
                 'nested/auth.json': 'not public', 'assets/js/entry.123.js': 'console.log(1)',
                 'assets/css/main.123.css': 'body{}', 'ja/search-index-123.json': '[]',
                 'index.html': '<script src="https://assets-cdn.selectdb.com/site/assets/js/entry.123.js"></script>'
                               '<link rel="stylesheet" href="https://assets-cdn.selectdb.com/site/assets/css/main.123.css">'}
        for key, value in files.items():
            file = source / key
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(value)
        return source, files

    def test_public_copy_excludes_private_controls_and_preserves_the_original(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, files = self.artifact(root)
            target = root / 'public'
            manifest = publish.prepare(source, target, '123', '1', 'a' * 40)
            for key, value in files.items():
                self.assertEqual((source / key).read_text(), value)
                self.assertEqual((target / key).exists(), publish.public_path(Path(key).parts))
            self.assertIn('assets/js/entry.123.js', manifest['checks'])
            self.assertEqual(manifest['uploadedFileCount'], len(manifest['files']))
            self.assertNotIn('.asf.yaml', manifest['files'])
            self.assertIn('assets/css/main.123.css', manifest['checks'])
            self.assertIn('ja/search-index-123.json', manifest['checks'])
            self.assertTrue(any(key.startswith('rebuild-probes/publish-123-1-') for key in manifest['checks']))

    def test_partial_or_unoptimized_artifacts_are_refused(self):
        for partial in [True, False]:
            with self.subTest(partial=partial), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                source, _ = self.artifact(root)
                if partial:
                    (source / '.ci-validation.json').write_text('{}')
                else:
                    (source / '.publish/redirects.json').unlink()
                with self.assertRaisesRegex(ValueError, 'complete optimized'):
                    publish.prepare(source, root / 'public', '123', '1', 'a' * 40)

    def test_custom_redirect_pages_do_not_need_docusaurus_client_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, _ = self.artifact(root)
            (source / 'slack').mkdir()
            (source / 'slack/index.html').write_text('<meta http-equiv="refresh" content="0;url=https://example.test/">')
            target = root / 'public'
            manifest = publish.prepare(source, target, '123', '1', 'a' * 40)
            self.assertTrue((target / 'slack/index.html').is_file())
            self.assertIn('slack/index.html', manifest['files'])

    def test_missing_locales_from_the_build_job_cannot_be_published(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, _ = self.artifact(root)
            with self.assertRaisesRegex(ValueError, 'Missing publication locale entry'):
                publish.prepare(source, root / 'public', '123', '1', 'a' * 40, ['en', 'ja'])

    def test_symlinks_never_copy_files_from_outside_the_artifact(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, _ = self.artifact(root)
            (root / 'secret.txt').write_text('private')
            (source / 'leak.txt').symlink_to(root / 'secret.txt')
            with self.assertRaisesRegex(ValueError, 'symlinks'):
                publish.prepare(source, root / 'public', '123', '1', 'a' * 40)

    def test_a_missing_or_unprefixed_entry_asset_blocks_upload(self):
        for path in ['https://assets-cdn.selectdb.com/assets/js/entry.123.js',
                     'https://assets-cdn.selectdb.com/site/assets/js/absent.js']:
            with self.subTest(path=path), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                source, _ = self.artifact(root)
                (source / 'index.html').write_text(f'<script src="{path}"></script>')
                with self.assertRaises(ValueError):
                    publish.prepare(source, root / 'public', '123', '1', 'a' * 40)

    def test_verification_requires_exact_bytes_cors_and_the_configured_destination(self):
        key = 'assets/js/entry.123.js'
        body = b'console.log(1)'
        manifest = {'assetBaseUrl': publish.BASE_URL, 'checks': {
            key: {'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}}}
        class Response:
            def __init__(self, data, url, cors):
                self.status, self.data, self.url = 200, data, url
                self.headers = {'Access-Control-Allow-Origin': cors}
            def read(self): return self.data
            def __enter__(self): return self
            def __exit__(self, *_): pass
        url = publish.BASE_URL + '/' + key
        for data, destination, cors, accepted in [
            (body, url, 'https://doris.apache.org', True),
            (b'wrong bytes', url, 'https://doris.apache.org', False),
            (body, url, '*', False),
            (body, 'https://old.example.test/' + key, 'https://doris.apache.org', False),
        ]:
            with self.subTest(destination=destination, cors=cors):
                fetch = lambda *_args, **_kwargs: Response(data, destination, cors)
                with contextlib.redirect_stdout(io.StringIO()):
                    if accepted:
                        publish.verify(manifest, fetch=fetch, pause=lambda _: None)
                    else:
                        with self.assertRaisesRegex(ValueError, 'verification failed'):
                            publish.verify(manifest, fetch=fetch, pause=lambda _: None)


if __name__ == '__main__':
    unittest.main()
