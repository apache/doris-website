import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('archived_pdf_upload', Path(__file__).with_name('upload_archived_pdfs.py'))
pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf)
SHA = 'a' * 40


class ArchiveUploadTests(unittest.TestCase):
    def artifact(self, root):
        directory = root / '2.1'
        directory.mkdir()
        file = directory / 'apache-doris-2.1-en.pdf'
        file.write_bytes(b'%PDF-1.7\nUnit-test transport fixture\n%%EOF')
        entry = {'filename': file.name, 'version': '2.1', 'locale': 'en', 'sample': False,
                 'imageWarnings': [], 'documents': 1, 'sourceFiles': ['archived_docs/intro.md'],
                 'bytes': file.stat().st_size, 'sha256': pdf.digest(file)}
        manifest = directory / 'manifest.json'
        manifest.write_text(json.dumps({'sourceCommit': SHA, 'files': [entry]}))
        return file, manifest, entry

    def test_full_export_is_accepted_and_uploaded_only_to_the_pdf_prefix(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            file, _, entry = self.artifact(root)
            commands = []
            def run(args):
                commands.append(args)
                if args[:2] == ['api', 'head-object']:
                    return {'Header': {'Content-Length': [str(entry['bytes'])], 'Content-Type': ['application/pdf'],
                        'X-Oss-Meta-Sha256': [entry['sha256']], 'X-Oss-Server-Side-Encryption': ['AES256']}}
            records = pdf.upload(root, SHA, run=run)
            self.assertEqual(records[0]['key'], 'downloads/archived-docs/' + file.name)
            self.assertEqual(commands[0][2], 'oss://' + pdf.BUCKET + '/' + records[0]['key'])
            self.assertNotIn('--delete', commands[0])
            self.assertNotIn('--object-acl', commands[0])

    def test_incomplete_or_mismatched_exports_are_rejected_before_cloud_operations(self):
        changes = [{'sample': True}, {'imageWarnings': ['unavailable image']}, {'sha256': '0' * 64},
                   {'documents': 2}, {'version': '2.0'}, {'locale': 'zh-CN'}, {'filename': '../secret.pdf'}]
        for change in changes:
            with self.subTest(change=change), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                _, manifest, entry = self.artifact(root)
                manifest.write_text(json.dumps({'sourceCommit': SHA, 'files': [{**entry, **change}]}))
                with self.assertRaises(ValueError):
                    pdf.candidates(root, SHA)

    def test_an_untrusted_source_commit_cannot_be_uploaded(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.artifact(root)
            with self.assertRaisesRegex(ValueError, 'source commit'):
                pdf.candidates(root, 'b' * 40)

    def test_symlinks_cannot_smuggle_another_file_into_the_public_prefix(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            file, _, _ = self.artifact(root)
            outside = root / 'private.pdf'
            file.rename(outside)
            file.symlink_to(outside)
            with self.assertRaisesRegex(ValueError, 'regular PDF'):
                pdf.candidates(root, SHA)

    def test_wrong_server_encryption_blocks_publication(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, _, entry = self.artifact(root)
            def run(args):
                return {'Header': {'Content-Length': [str(entry['bytes'])], 'Content-Type': ['application/pdf'],
                    'X-Oss-Meta-Sha256': [entry['sha256']], 'X-Oss-Server-Side-Encryption': ['None']}}
            with self.assertRaisesRegex(RuntimeError, 'encryption'):
                pdf.upload(root, SHA, run=run)


if __name__ == '__main__':
    unittest.main()
