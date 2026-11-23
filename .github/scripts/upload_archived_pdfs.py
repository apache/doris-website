#!/usr/bin/env python3
"""Upload verified full archive PDFs without granting the website role access."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BUCKET = 'doris-website-assets-prod-bj'
PREFIX = 'downloads/archived-docs/'
BASE = 'https://assets-cdn.selectdb.com/' + PREFIX


def digest(file):
    value = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def candidates(directory, source_sha):
    root = Path(directory)
    if root.is_symlink() or not root.is_dir() or not re.fullmatch(r'[a-f0-9]{40}', source_sha):
        raise ValueError('Invalid PDF source directory or commit')
    result = []
    for manifest in sorted(root.glob('*/manifest.json')):
        if manifest.is_symlink() or manifest.parent.is_symlink():
            raise ValueError('PDF manifests must not be symlinks')
        data = json.loads(manifest.read_text())
        if data.get('sourceCommit') != source_sha:
            raise ValueError('PDF source commit differs from the protected build source')
        for entry in data.get('files', []):
            name = entry.get('filename', '')
            match = re.fullmatch(r'apache-doris-(2\.1|2\.0|1\.2)-(en|zh-CN)\.pdf', name)
            if not match:
                raise ValueError('Unexpected archived PDF filename')
            if manifest.parent.name != match[1] or entry.get('version') != match[1] or entry.get('locale') != match[2]:
                raise ValueError('PDF version or language metadata is inconsistent')
            if entry.get('sample') is not False or entry.get('imageWarnings') != []:
                raise ValueError('Sample or incomplete PDFs must not be published')
            if not entry.get('documents') or len(set(entry.get('sourceFiles', []))) != entry['documents']:
                raise ValueError('Incomplete source coverage')
            file = manifest.parent / name
            if file.is_symlink() or not file.is_file():
                raise ValueError('Expected a regular PDF file')
            with file.open('rb') as stream:
                if stream.read(5) != b'%PDF-':
                    raise ValueError('Invalid PDF file signature')
            if file.stat().st_size != entry.get('bytes') or digest(file) != entry.get('sha256'):
                raise ValueError('PDF size or checksum differs from the verified manifest')
            result.append((file, entry))
    if not result or len({file.name for file, _ in result}) != len(result):
        raise ValueError('Missing or duplicate archived PDFs')
    return result


def oss(args):
    command = ['ossutil', *args, '--mode', 'StsToken', '--config-file', os.devnull,
               '--region', 'cn-beijing', '--endpoint', 'https://oss-cn-beijing.aliyuncs.com',
               '--retry-times', '3', '--read-timeout', '120']
    completed = subprocess.run(command, capture_output=True, text=True, timeout=1200, check=False)
    if completed.returncode:
        raise RuntimeError('PDF OSS operation failed; signed diagnostics are not logged')
    if args[:2] == ['api', 'head-object']:
        return json.JSONDecoder().raw_decode(completed.stdout.lstrip())[0]
    return None


def upload(directory, source_sha, run=oss):
    records = []
    for file, entry in candidates(directory, source_sha):
        key = PREFIX + file.name
        run(['cp', str(file), 'oss://' + BUCKET + '/' + key, '--force',
             '--content-type', 'application/pdf', '--cache-control', 'public,max-age=3600',
             '--metadata', 'sha256=' + entry['sha256'], '--metadata', 'source-commit=' + source_sha,
             '--bigfile-threshold', '16777216', '--part-size', '8388608', '--parallel', '4'])
        response = run(['api', 'head-object', '--bucket', BUCKET, '--key', key, '--output-format', 'json'])
        headers = {name.lower(): values[0] if isinstance(values, list) else values
                   for name, values in response['Header'].items()}
        if (int(headers.get('content-length', -1)) != entry['bytes']
                or headers.get('content-type') != 'application/pdf'
                or headers.get('x-oss-meta-sha256') != entry['sha256']
                or headers.get('x-oss-server-side-encryption') != 'AES256'):
            raise RuntimeError('Uploaded PDF metadata or encryption verification failed')
        records.append({'key': key, 'bytes': entry['bytes'], 'sha256': entry['sha256']})
        print('Verified private PDF upload: ' + file.name, flush=True)
    return records


def verify_delivery(records, files):
    for record in records:
        url = BASE + record['key'].removeprefix(PREFIX)
        request = Request(url, method='HEAD',
                          headers={'Origin': 'https://doris.apache.org'})
        with urlopen(request, timeout=30) as response:
            if (response.status != 200 or response.headers.get('Content-Type') != 'application/pdf'
                    or int(response.headers.get('Content-Length', -1)) != record['bytes']
                    or response.headers.get('Access-Control-Allow-Origin') != 'https://doris.apache.org'):
                raise RuntimeError('CDN PDF delivery verification failed')
        with files[record['key']].open('rb') as stream:
            expected = stream.read(1024)
        with urlopen(Request(url, headers={'Range': 'bytes=0-1023'}), timeout=30) as response:
            if response.status != 206 or response.read(1024) != expected:
                raise RuntimeError('CDN PDF range verification failed')
        private = 'https://' + BUCKET + '.oss-cn-beijing.aliyuncs.com/' + record['key']
        try:
            with urlopen(Request(private, method='HEAD'), timeout=30):
                raise RuntimeError('Anonymous OSS PDF read unexpectedly succeeded')
        except HTTPError as error:
            if error.code != 403:
                raise RuntimeError('Expected anonymous OSS PDF access to be denied') from None


def main():
    if os.environ.get('GITHUB_REPOSITORY') != 'apache/doris-website' or os.environ.get('GITHUB_REF') != 'refs/heads/master':
        raise ValueError('PDF uploads must run from the original repository master')
    if not all(os.environ.get(key) for key in ['OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_SESSION_TOKEN']):
        raise ValueError('Missing short-lived PDF credentials')
    records = upload('pdf-output', os.environ['DORIS_COMMIT'])
    files = {PREFIX + file.name: file for file, _ in candidates('pdf-output', os.environ['DORIS_COMMIT'])}
    verify_delivery(records, files)
    print(json.dumps({'sourceSha': os.environ['DORIS_COMMIT'], 'files': records}, indent=2))


if __name__ == '__main__':
    main()
