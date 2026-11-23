#!/usr/bin/env python3
"""Verify the new website role without publishing or changing bucket settings."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


class ProbeError(RuntimeError):
    pass


def configuration(env):
    expected = {
        'GITHUB_REPOSITORY': 'apache/doris-website',
        'GITHUB_REF': 'refs/heads/master',
        'GITHUB_EVENT_NAME': 'workflow_dispatch',
        'WEBSITE_OSS_BUCKET': 'doris-website-assets-prod-bj',
        'WEBSITE_OSS_REGION': 'cn-beijing',
        'WEBSITE_OSS_ENDPOINT': 'https://oss-cn-beijing.aliyuncs.com',
        'WEBSITE_ASSET_BASE_URL': 'https://assets-cdn.selectdb.com/site',
    }
    for name, value in expected.items():
        if env.get(name) != value:
            raise ProbeError('Unexpected or missing configuration: ' + name)
    if not re.fullmatch(r'[0-9a-f]{40}', env.get('GITHUB_SHA', '')):
        raise ProbeError('Expected an immutable source SHA')
    for name in ['GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT']:
        if not re.fullmatch(r'[1-9][0-9]*', env.get(name, '')):
            raise ProbeError('Invalid run identity: ' + name)
    return {key: env[key] for key in expected}


def access_denied(result):
    # Timeouts, missing objects, wrong endpoints and expired tokens must fail.
    # ossutil 2.x reports "Http Status Code: 403" and "Error Code: AccessDenied".
    message = result.stdout + result.stderr
    return (result.returncode != 0
            and re.search(r'Http Status Code:\s*403\b', message) is not None
            and re.search(r'Error Code:\s*AccessDenied\b', message) is not None)


def request(url, method='GET'):
    try:
        with urlopen(Request(url, method=method), timeout=20) as response:
            return response.status, response.read(), dict(response.headers.items())
    except HTTPError as response:
        return response.code, response.read(), dict(response.headers.items())


def verify_delivery(url, expected, fetch=request, pause=time.sleep):
    for attempt in range(6):
        try:
            status, body, headers = fetch(url)
            headers = {key.lower(): value for key, value in headers.items()}
            if (status == 200 and body == expected
                    and headers.get('access-control-allow-origin') == 'https://doris.apache.org'):
                return
        except (URLError, TimeoutError, OSError):
            pass
        if attempt < 5:
            pause(5)
    raise ProbeError('CDN probe content or CORS verification failed')


class Probe:
    def __init__(self, env, run=subprocess.run):
        self.config = configuration(env)
        self.run = run
        self.bucket = env['WEBSITE_OSS_BUCKET']
        self.suffix = f"github-{env['GITHUB_RUN_ID']}-{env['GITHUB_RUN_ATTEMPT']}-{env['GITHUB_SHA'][:12]}"
        self.key = 'site/rebuild-probes/' + self.suffix + '.txt'
        self.body = (self.suffix + '\n').encode()
        self.results = []

    def oss(self, label, *args, denied=False):
        command = ['ossutil', *args, '--region', self.config['WEBSITE_OSS_REGION'],
                   '--endpoint', self.config['WEBSITE_OSS_ENDPOINT'], '--mode', 'StsToken',
                   '--config-file', os.devnull, '--retry-times', '1', '--read-timeout', '20']
        try:
            result = self.run(command, capture_output=True, text=True, timeout=90, check=False)
        except (OSError, subprocess.TimeoutExpired):
            raise ProbeError(label + ': command did not complete') from None
        if denied:
            if not access_denied(result):
                raise ProbeError(label + ': expected an explicit OSS 403 AccessDenied')
        elif result.returncode:
            # Do not print CLI diagnostics that might include a signed request.
            raise ProbeError(label + ': OSS command failed; no credentials or raw diagnostics logged')
        self.results.append(label)
        print(label + ': PASS', flush=True)
        return result.stdout

    def execute(self):
        self.oss('bucket_location', 'api', 'get-bucket-location', '--bucket', self.bucket)
        with tempfile.TemporaryDirectory(prefix='website-oss-probe-') as directory:
            source = Path(directory) / 'probe.txt'
            source.write_bytes(self.body)
            self.oss('site_write', 'api', 'put-object', '--bucket', self.bucket, '--key', self.key,
                     '--body', 'file://' + str(source), '--content-type', 'text/plain',
                     '--cache-control', 'no-store', '--metadata', 'sha256=' + hashlib.sha256(self.body).hexdigest())
            self.oss('site_list', 'api', 'list-objects-v2', '--bucket', self.bucket,
                     '--prefix', 'site/rebuild-probes/', '--max-keys', '1')
            body = self.oss('site_read', 'cat', f'oss://{self.bucket}/{self.key}', '--quiet')
            if body.encode() != self.body:
                raise ProbeError('Authenticated probe read returned different content')
            for prefix in ['media', 'downloads']:
                # Unexpected permission can create only our non-secret diagnostic.
                key = f'{prefix}/rebuild-probes/{self.suffix}.txt'
                self.oss(prefix + '_write_denied', 'api', 'put-object', '--bucket', self.bucket,
                         '--key', key, '--body', 'file://' + str(source), denied=True)
        self.oss('root_list_denied', 'api', 'list-objects-v2', '--bucket', self.bucket,
                 '--max-keys', '1', denied=True)
        self.oss('media_list_denied', 'api', 'list-objects-v2', '--bucket', self.bucket,
                 '--prefix', 'media/', '--max-keys', '1', denied=True)
        self.oss('private_prefix_read_denied', 'api', 'get-object', '--bucket', self.bucket,
                 '--key', f'private/rebuild-probes/{self.suffix}.txt', denied=True)
        # Use a nonexistent diagnostic key; never delete an existing object.
        self.oss('object_delete_denied', 'api', 'delete-object', '--bucket', self.bucket,
                 '--key', 'site/rebuild-probes/never-created-' + self.suffix, denied=True)
        # Even if permissions are too broad, this keeps our own probe private.
        self.oss('object_acl_change_denied', 'api', 'put-object-acl', '--bucket', self.bucket,
                 '--key', self.key, '--object-acl', 'private', denied=True)
        self.oss('bucket_acl_read_denied', 'api', 'get-bucket-acl', '--bucket', self.bucket, denied=True)
        verify_delivery('https://assets-cdn.selectdb.com/' + self.key, self.body)
        self.results.append('cdn_content_and_cors')
        endpoint = urlsplit(self.config['WEBSITE_OSS_ENDPOINT'])
        url = f'{endpoint.scheme}://{self.bucket}.{endpoint.netloc}/{self.key}'
        status, _, headers = request(url, method='HEAD')
        if status != 403 or {key.lower(): value for key, value in headers.items()}.get('server') != 'AliyunOSS':
            raise ProbeError('Anonymous OSS read must return OSS 403')
        self.results.append('anonymous_oss_read_denied')
        return {'probe_key': self.key, 'checks': self.results, 'published': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-config', action='store_true')
    args = parser.parse_args()
    configuration(os.environ)
    if args.check_config:
        print('Trusted master and website resource configuration: PASS')
        return
    if not all(os.environ.get(name) for name in ['OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_SESSION_TOKEN']):
        raise ProbeError('Missing short-lived STS credentials')
    report = Probe(os.environ).execute()
    print(json.dumps(report, indent=2))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as file:
            file.write('Website OSS OIDC probe passed. No website publication.\n\n')
            file.write('Probe: `' + report['probe_key'] + '`\n\n')
            file.write('\n'.join('- ' + check + ': PASS' for check in report['checks']) + '\n')


if __name__ == '__main__':
    try:
        main()
    except ProbeError as error:
        raise SystemExit(str(error)) from None
