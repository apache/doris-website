#!/usr/bin/env python3
"""Prepare a public OSS copy and verify CDN content before ASF publication."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

BASE_URL = 'https://assets-cdn.selectdb.com/site'
PRIVATE = {'.git', '.publish', '.htaccess', '.asf.yaml', '.actioninfo', '.dummy',
           '.ci-validation.json', '.ossutilconfig', 'auth.json', 'credentials.json'}


def public_path(parts):
    return not any(part in PRIVATE or part.startswith('.env') for part in parts)


def digest(file):
    value = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


class EntryAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script':
            url = attrs.get('src', '')
        elif tag == 'link' and attrs.get('rel') == 'stylesheet':
            url = attrs.get('href', '')
        else:
            return
        base, source = urlsplit(BASE_URL), urlsplit(url)
        if source.netloc != base.netloc:
            return
        if source.scheme != 'https' or not source.path.startswith('/site/'):
            raise ValueError('Entry asset has an invalid CDN prefix')
        self.files.add(source.path.removeprefix('/site/'))


def prepare(source, destination, run_id, attempt, source_sha, locales=('en',)):
    source, destination = Path(source), Path(destination)
    if source.is_symlink() or not source.is_dir():
        raise ValueError('Expected a real build directory')
    if (source / '.ci-validation.json').exists() or not (source / '.publish/redirects.json').is_file():
        raise ValueError('Only a complete optimized publication artifact may be uploaded')
    if not (source / 'index.html').is_file():
        raise ValueError('Missing website entry page')
    if not locales or 'en' not in locales or any(not re.fullmatch(r'[a-z]{2}(?:-[A-Za-z]+)?', locale) for locale in locales):
        raise ValueError('Invalid publication locales')
    if not re.fullmatch(r'[0-9a-f]{40}', source_sha):
        raise ValueError('Invalid source SHA')
    if not all(re.fullmatch(r'[1-9][0-9]*', value) for value in [run_id, attempt]):
        raise ValueError('Invalid publishing run identity')
    if destination.exists():
        raise ValueError('Public staging directory must be new')
    destination.mkdir(parents=True)
    count = 0
    for directory, subdirs, files in os.walk(source, followlinks=False):
        relative = Path(directory).relative_to(source)
        for name in [*subdirs, *files]:
            if (Path(directory) / name).is_symlink():
                raise ValueError('Publication artifacts must not contain symlinks')
        subdirs[:] = [name for name in subdirs if public_path((*relative.parts, name))]
        for name in files:
            parts = (*relative.parts, name)
            if not public_path(parts):
                continue
            target = destination.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(Path(directory) / name, target)
            count += 1
    checks = set()
    entries = [source / ('index.html' if locale == 'en' else f'{locale}/index.html') for locale in locales]
    for entry in entries:
        if not entry.is_file():
            raise ValueError('Missing publication locale entry: ' + entry.relative_to(source).as_posix())
        parser = EntryAssets()
        parser.feed(entry.read_text())
        if not parser.files:
            raise ValueError('Website entry is missing its CDN assets')
        checks.update(parser.files)
    # Include an index from each language/context in the delivery check.
    indexes = {}
    for file in sorted(destination.rglob('search-index*.json')):
        key = file.relative_to(destination).as_posix()
        indexes.setdefault(file.parent.relative_to(destination).as_posix(), key)
    checks.update(indexes.values())
    probe = f'rebuild-probes/publish-{run_id}-{attempt}-{source_sha[:12]}.txt'
    (destination / probe).parent.mkdir(parents=True, exist_ok=True)
    (destination / probe).write_text(f'{source_sha}\n{run_id}-{attempt}\n')
    checks.add(probe)
    records = {file.relative_to(destination).as_posix(): {'sha256': digest(file), 'bytes': file.stat().st_size}
               for file in sorted(destination.rglob('*')) if file.is_file()}
    for key in sorted(checks):
        parts = Path(key).parts
        if not public_path(parts) or '..' in parts or key.startswith('/'):
            raise ValueError('Invalid public asset path')
        file = destination / key
        if not file.is_file():
            raise ValueError('Referenced entry asset is absent from the public copy: ' + key)
    return {'schemaVersion': 1, 'assetBaseUrl': BASE_URL, 'sourceSha': source_sha, 'locales': list(locales),
            'uploadedFileCount': count + 1, 'files': records,
            'checks': {key: records[key] for key in sorted(checks)}}


def verify(manifest, fetch=urlopen, pause=time.sleep):
    if manifest.get('assetBaseUrl') != BASE_URL or not manifest.get('checks'):
        raise ValueError('Invalid CDN verification manifest')
    for key, expected in manifest['checks'].items():
        if key.startswith('/') or '..' in Path(key).parts or not public_path(Path(key).parts):
            raise ValueError('Invalid verification path')
        for attempt in range(6):
            try:
                with fetch(Request(BASE_URL + '/' + key, headers={'Origin': 'https://doris.apache.org'}), timeout=30) as response:
                    data = response.read()
                    headers = {name.lower(): value for name, value in response.headers.items()}
                    if (response.status == 200 and response.url == BASE_URL + '/' + key
                            and len(data) == expected['bytes']
                            and hashlib.sha256(data).hexdigest() == expected['sha256']
                            and headers.get('access-control-allow-origin') == 'https://doris.apache.org'):
                        break
            except (HTTPError, URLError, TimeoutError, OSError):
                pass
            if attempt == 5:
                raise ValueError('CDN content or CORS verification failed: ' + key)
            pause(5)
        print('Verified CDN asset: ' + key, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['prepare', 'verify'])
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--destination')
    args = parser.parse_args()
    for name, expected in [('GITHUB_REPOSITORY', 'apache/doris-website'), ('GITHUB_REF', 'refs/heads/master'),
                           ('WEBSITE_ASSET_BASE_URL', BASE_URL), ('WEBSITE_OSS_BUCKET', 'doris-website-assets-prod-bj'),
                           ('WEBSITE_OSS_REGION', 'cn-beijing'), ('WEBSITE_OSS_ENDPOINT', 'https://oss-cn-beijing.aliyuncs.com')]:
        if os.environ.get(name) != expected:
            raise ValueError('Invalid publishing configuration: ' + name)
    if args.operation == 'prepare':
        target = Path(args.destination).resolve()
        if target.parent != Path(os.environ['RUNNER_TEMP']).resolve():
            raise ValueError('Public staging must stay in the runner temporary directory')
        manifest = prepare('build', target, os.environ['GITHUB_RUN_ID'], os.environ['GITHUB_RUN_ATTEMPT'],
                           os.environ['DORIS_COMMIT'], os.environ.get('WEBSITE_PUBLISH_LOCALES', '').split(','))
        Path(args.manifest).write_text(json.dumps(manifest, indent=2) + '\n')
        print(f"Prepared {manifest['uploadedFileCount']} public files; original ASF artifact preserved")
    else:
        verify(json.loads(Path(args.manifest).read_text()))


if __name__ == '__main__':
    main()
